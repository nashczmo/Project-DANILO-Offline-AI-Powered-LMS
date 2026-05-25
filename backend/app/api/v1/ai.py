from fastapi import APIRouter, Depends, HTTPException, status, Body, File, Form, UploadFile, Response
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import *
from app.schemas import *
from app.main import *
import math

ai_router = APIRouter(prefix='/api', tags=['ai'])

@ai_router.get('/ai/status', tags=['health'])
def ai_status() -> dict:
    """Public endpoint to check AI readiness without authentication."""
    runtime_ok = False
    model_loaded = False
    available_models: list[str] = []
    error_message = ''
    try:
        response = httpx.get(f'{OLLAMA_URL}/api/tags', timeout=4.0)
        if response.status_code == 200:
            runtime_ok = True
            available_models = [m.get('name', '') for m in response.json().get('models') or []]
            expected_models = {OLLAMA_MODEL, f'{OLLAMA_MODEL}:latest'}
            if DANILO_AI_FALLBACK_MODEL:
                expected_models.update({DANILO_AI_FALLBACK_MODEL, f'{DANILO_AI_FALLBACK_MODEL}:latest'})
            if DANILO_AI_OPTIONAL_MODEL:
                expected_models.update({DANILO_AI_OPTIONAL_MODEL, f'{DANILO_AI_OPTIONAL_MODEL}:latest'})
            model_loaded = any((name in expected_models for name in available_models))
    except Exception as exc:
        error_message = str(exc)[:120]
    ram_available_mb: float | None = None
    cpu_percent: float | None = None
    if _psutil:
        try:
            vm = _psutil.virtual_memory()
            ram_available_mb = round(vm.available / 1024 / 1024, 1)
            cpu_percent = _psutil.cpu_percent(interval=0.0)
        except Exception:
            pass
    return {'runtime': DANILO_AI_RUNTIME, 'runtimeOnline': runtime_ok, 'ollamaOnline': runtime_ok, 'modelLoaded': model_loaded, 'modelName': DANILO_AI_ACTIVE_MODEL, 'primaryModel': DANILO_AI_PRIMARY_MODEL, 'fallbackModel': DANILO_AI_FALLBACK_MODEL, 'optionalModel': DANILO_AI_OPTIONAL_MODEL, 'availableModels': available_models, 'modelClass': _AI_MODEL_CLASS, 'quantization': _AI_QUANTIZATION, 'scheduler': _AI_SCHEDULER, 'ramAvailableMb': ram_available_mb, 'cpuPercent': cpu_percent, 'queueSlots': _AI_MAX_CONCURRENT, 'queueDepth': _ai_queue_depth(), 'queueTimeoutSeconds': _AI_QUEUE_TIMEOUT_SECONDS, 'hardwareProfile': _HARDWARE['profile'], 'cpuThreads': _HARDWARE['cpuCount'], 'gpuVramMb': _HARDWARE['gpuVramMb'], 'contextTokens': OLLAMA_NUM_CTX, 'contextChars': OLLAMA_CONTEXT_CHARS, 'inferenceThreads': OLLAMA_NUM_THREADS, 'gpuLayers': OLLAMA_NUM_GPU, 'batchSize': OLLAMA_NUM_BATCH, 'kvCache': OLLAMA_KV_CACHE_TYPE, 'cacheSize': len(_ai_response_cache), 'requests': _AI_TOTAL_REQUESTS, 'timeouts': _AI_TIMEOUTS, 'errors': _AI_ERRORS, 'lastModel': _AI_LAST_MODEL, 'lastLatencyMs': _AI_LAST_LATENCY_MS, 'ragIndexPath': DANILO_AI_INDEX_PATH, 'ragIndexed': os.path.exists(DANILO_AI_INDEX_PATH), 'status': 'ready' if runtime_ok and model_loaded else 'degraded' if runtime_ok else 'offline', 'errorMessage': error_message or None, 'timestamp': datetime.now(timezone.utc).isoformat()}

@ai_router.get('/ai/profile')
def ai_profile(current_user: User=Depends(get_current_user), db: Session=Depends(get_db)) -> dict:
    require_role(current_user, 'student')
    profile = build_student_ai_profile(db, current_user, persist=True)
    db.commit()
    return {'studentId': current_user.id, 'studentName': current_user.full_name, 'profile': profile}

@ai_router.post('/ai/tutor')
async def tutor(payload: TutorRequest, current_user: User=Depends(get_current_user), db: Session=Depends(get_db)) -> dict:
    _check_ai_rate_limit(current_user.id)
    if check_safety(payload.question):
        save_ai_conversation(db, user_id=current_user.id, course_id=None, module_id=None, question=payload.question, answer=SAFETY_REDIRECT)
        return {'answer': SAFETY_REDIRECT, 'mode': 'normal', 'metrics': {}, 'context': {'moduleTitle': None, 'courseTitle': None, 'gradeSignals': []}, 'safety_filtered': True, 'sessionId': None}
    from fastapi.concurrency import run_in_threadpool
    system_prompt, prompt, module, course, grade_lines, mode = await run_in_threadpool(build_tutor_prompt, db, current_user, payload)
    memory = await run_in_threadpool(build_rolling_memory, db, current_user.id, course.id if course else None, ROLLING_MEMORY_LIMIT)
    try:
        answer, metrics = await ask_ollama(system_prompt, prompt, mode, memory=memory)
    except HTTPException:
        raise
    except httpx.TimeoutException:
        _record_ai_result(timeout=True)
        logger.warning('AI runtime timed out while answering tutor request for user_id=%s', current_user.id)
        metrics = {'runtime': DANILO_AI_RUNTIME, 'model': DANILO_AI_ACTIVE_MODEL, 'mode': mode, 'prompt_tokens': estimate_prompt_tokens(prompt)}
        answer = 'DANILO is taking longer than expected on this device. Please try a shorter question, or ask again in a moment.'
    except Exception:
        _record_ai_result(error=True)
        logger.exception('AI runtime failed while answering tutor request for user_id=%s', current_user.id)
        metrics = {'runtime': DANILO_AI_RUNTIME, 'model': DANILO_AI_ACTIVE_MODEL, 'mode': mode, 'prompt_tokens': estimate_prompt_tokens(prompt)}
        answer = 'DANILO Tutor is offline or still getting ready. Please check the local AI runtime, then try again.'
    # Offload blocking DB calls to thread pool
    from fastapi.concurrency import run_in_threadpool
    await run_in_threadpool(save_ai_conversation, db, user_id=current_user.id, course_id=course.id if course else None, module_id=module.id if module else None, question=payload.question, answer=answer)
    chat_session = await run_in_threadpool(_get_or_create_chat_session, db, current_user.id, payload.session_id, payload.question)
    await run_in_threadpool(_save_chat_messages, db, chat_session.id, payload.question, answer, module.id if module else None, mode)
    await run_in_threadpool(db.commit)
    return {'answer': answer, 'mode': mode, 'metrics': metrics, 'sessionId': chat_session.id, 'context': {'moduleTitle': module.title if module else None, 'courseTitle': course.title if course else None, 'gradeSignals': grade_lines}}

@ai_router.post('/ai/tutor/stream')
async def tutor_stream(payload: TutorRequest, current_user: User=Depends(get_current_user), db: Session=Depends(get_db)):
    _check_ai_rate_limit(current_user.id)
    if check_safety(payload.question):
        save_ai_conversation(db, user_id=current_user.id, course_id=None, module_id=None, question=payload.question, answer=SAFETY_REDIRECT)

        async def safe_redirect():
            yield f"data: {json.dumps({'content': SAFETY_REDIRECT, 'token': SAFETY_REDIRECT})}\n\n"
            yield 'data: [DONE]\n\n'
        return StreamingResponse(safe_redirect(), media_type='text/event-stream')
    # Stream endpoint
    from fastapi.concurrency import run_in_threadpool
    system_prompt, prompt, module, course, _, mode = await run_in_threadpool(build_tutor_prompt, db, current_user, payload)
    memory = await run_in_threadpool(build_rolling_memory, db, current_user.id, course.id if course else None, ROLLING_MEMORY_LIMIT)
    user_id = current_user.id
    course_id = course.id if course else None
    module_id = module.id if module else None
    question = payload.question
    chat_session = await run_in_threadpool(_get_or_create_chat_session, db, current_user.id, payload.session_id, question)
    session_id = chat_session.id
    await run_in_threadpool(db.commit)

    async def event_stream():
        answer_parts: list[str] = []
        try:
            async for item in stream_ollama(system_prompt, prompt, mode, memory=memory):
                if item.get('queued'):
                    yield f"data: {json.dumps({'queue_position': item.get('position', 1), 'warming_up': False})}\n\n"
                elif item.get('thinking'):
                    yield f"data: {json.dumps({'thinking': True, 'message': item.get('message', 'Thinking...')})}\n\n"
                elif item.get('done'):
                    answer = ''.join(answer_parts).strip()
                    if answer:
                        stream_db = SessionLocal()
                        try:
                            save_ai_conversation(stream_db, user_id=user_id, course_id=course_id, module_id=module_id, question=question, answer=answer)
                            _save_chat_messages(stream_db, session_id, question, answer, module_id, mode)
                            stream_db.commit()
                        finally:
                            stream_db.close()
                    yield f"data: {json.dumps({'done': True, **item.get('metrics', {}), 'sessionId': session_id, 'session_id': session_id})}\n\n"
                    yield 'data: [DONE]\n\n'
                else:
                    chunk = item.get('content', '')
                    answer_parts.append(chunk)
                    yield f"data: {json.dumps({'content': chunk, 'token': chunk, 'session_id': session_id})}\n\n"
        except HTTPException as exc:
            yield f"event: error\ndata: {json.dumps({'detail': exc.detail})}\n\n"
        except httpx.TimeoutException:
            _record_ai_result(timeout=True)
            logger.warning('AI runtime stream timed out while answering tutor request for user_id=%s', user_id)
            yield 'event: error\ndata: {"detail":"DANILO is taking longer than expected. Try Short mode or ask again."}\n\n'
        except Exception:
            _record_ai_result(error=True)
            logger.exception('AI runtime stream failed while answering tutor request for user_id=%s', user_id)
            yield 'event: error\ndata: {"detail":"DANILO Tutor is offline or still getting ready. Check the local AI runtime, then try again."}\n\n'
    return StreamingResponse(event_stream(), media_type='text/event-stream', headers={'X-Accel-Buffering': 'no', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive'})

@ai_router.get('/ai/sessions')
def list_chat_sessions(current_user: User=Depends(get_current_user), db: Session=Depends(get_db)) -> dict:
    sessions = db.scalars(select(ChatSession).where(ChatSession.user_id == current_user.id, ChatSession.is_active == True).order_by(ChatSession.updated_at.desc()).limit(50)).all()
    return {'sessions': [{'id': s.id, 'title': s.title, 'createdAt': s.created_at.isoformat(), 'updatedAt': s.updated_at.isoformat(), 'messageCount': len(s.messages)} for s in sessions]}

@ai_router.post('/ai/sessions')
def create_chat_session(payload: dict=Body(default={}), current_user: User=Depends(get_current_user), db: Session=Depends(get_db)) -> dict:
    title = clean_text(payload.get('title') or 'New Conversation', max_length=255)
    session = ChatSession(user_id=current_user.id, title=title, is_active=True)
    db.add(session)
    db.commit()
    db.refresh(session)
    return {'id': session.id, 'title': session.title, 'createdAt': session.created_at.isoformat(), 'updatedAt': session.updated_at.isoformat(), 'messageCount': 0}

@ai_router.get('/ai/sessions/{session_id}/messages')
def get_session_messages(session_id: int, offset: int=0, limit: int=60, current_user: User=Depends(get_current_user), db: Session=Depends(get_db)) -> dict:
    session = db.scalar(select(ChatSession).where(ChatSession.id == session_id, ChatSession.user_id == current_user.id))
    if not session:
        raise HTTPException(status_code=404, detail='Session not found')
    total = db.scalar(select(func.count()).where(ChatMessage.session_id == session_id))
    messages = db.scalars(select(ChatMessage).where(ChatMessage.session_id == session_id).order_by(ChatMessage.created_at.asc()).offset(offset).limit(limit)).all()
    return {'sessionId': session_id, 'title': session.title, 'total': total, 'messages': [{'id': m.id, 'role': m.role, 'content': m.content, 'moduleId': m.module_id, 'responseMode': m.response_mode, 'createdAt': m.created_at.isoformat()} for m in messages]}


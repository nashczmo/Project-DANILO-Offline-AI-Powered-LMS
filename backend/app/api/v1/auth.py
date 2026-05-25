from fastapi import APIRouter, Depends, HTTPException, status, Body, File, Form, UploadFile, Response
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import *
from app.schemas import *
from app.main import *
import math

router = APIRouter(prefix='/api')

@router.get('/health', tags=['health'])
def health() -> dict:
    return {'status': 'ok', 'service': 'project-danilo', 'model': DANILO_AI_ACTIVE_MODEL, 'runtime': DANILO_AI_RUNTIME, 'portalDomain': PORTAL_DOMAIN, 'timestamp': datetime.now(timezone.utc).isoformat()}

@router.post('/auth/login', tags=['auth'])
def login(payload: dict=Body(default={}), db: Session=Depends(get_db)) -> dict:
    username = str(payload.get('username') or '').strip()
    password = str(payload.get('password') or '')
    if not username or not password:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Username and password are required')
    logger.info('Login attempt for username=%s', username)
    try:
        lookup = username.lower()
        user = db.scalar(select(User).where(or_(func.lower(User.username) == lookup, func.lower(User.email) == lookup)))
        if not user or not user.is_active or (not verify_password(password, user.password_hash)):
            logger.warning('Login failed for username=%s', username)
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid username or password')
        token = create_access_token({'sub': str(user.id), 'role': user.role}, JWT_SECRET, JWT_EXPIRE_MINUTES)
        logger.info('Login succeeded for user_id=%s username=%s role=%s', user.id, user.username, user.role)
        if user.role == 'admin':
            logger.info('Successful admin login for user_id=%s username=%s', user.id, user.username)
        return {'accessToken': token, 'tokenType': 'Bearer', 'user': serialize_user(user), 'forcePasswordChange': bool(user.force_password_change)}
    except HTTPException:
        raise
    except SQLAlchemyError as exc:
        logger.exception('Database error during login for username=%s', username)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail='Login service is temporarily unavailable') from exc

@router.get('/me', tags=['auth'])
def me(current_user: User=Depends(get_current_user)) -> dict:
    logger.info('/api/me accessed by user_id=%s role=%s', current_user.id, current_user.role)
    return serialize_user(current_user)

@router.post('/auth/change-password', tags=['auth'])
def change_password(payload: dict=Body(default={}), current_user: User=Depends(get_current_user), db: Session=Depends(get_db)) -> dict:
    """Allow any authenticated user to change their own password. Clears force_password_change flag."""
    current_password = str(payload.get('currentPassword') or '')
    new_password = str(payload.get('newPassword') or '')
    if not current_password or not new_password:
        raise HTTPException(status_code=400, detail='currentPassword and newPassword are required')
    if len(new_password) < 8:
        raise HTTPException(status_code=400, detail='New password must be at least 8 characters')
    if not verify_password(current_password, current_user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Current password is incorrect')
    current_user.password_hash = hash_password(new_password)
    current_user.password_salt = ''
    current_user.force_password_change = False
    log_action(db, current_user, 'change_password', 'user', current_user.id)
    db.commit()
    logger.info('Password changed for user_id=%s username=%s', current_user.id, current_user.username)
    return {'ok': True, 'message': 'Password changed successfully'}

@router.get('/dashboard', tags=['dashboard'])
def dashboard(current_user: User=Depends(get_current_user), db: Session=Depends(get_db)) -> dict:
    logger.info('/api/dashboard accessed by user_id=%s role=%s', current_user.id, current_user.role)
    try:
        stream_items = build_stream(db, current_user)
        has_grades = hasattr(current_user, 'role') and current_user.role not in ('admin', 'teacher')
        grade_summary = build_grade_summary(db, current_user.id) if has_grades else []
        ai_profile = build_student_ai_profile(db, current_user, persist=True) if has_grades else None
        course_builder = DASHBOARD_REGISTRY.get(current_user.role, DASHBOARD_REGISTRY['student'])
        courses = course_builder(db, current_user)
        content_items = build_content_tree(db, user=current_user)
        workflow_status = build_content_workflow_status()
        if ai_profile is not None:
            db.commit()
        return {'user': serialize_user(current_user), 'stream': stream_items or [], 'courses': courses or [], 'contentFolders': content_items or [], 'grades': grade_summary or [], 'aiProfile': ai_profile, 'hints': {'hasContent': bool(content_items), 'hasCourses': bool(courses), 'hasGrades': bool(grade_summary), 'hasStream': bool(stream_items)}, 'contentWorkflow': workflow_status, 'network': {'ssid': SSID, 'portal': f'http://{PORTAL_DOMAIN}', 'mode': 'offline-first captive portal'}, 'operationsHighlights': [{'label': 'Portal', 'value': f'http://{PORTAL_DOMAIN}'}, {'label': 'SSID', 'value': SSID}, {'label': 'AI Runtime', 'value': DANILO_AI_RUNTIME}, {'label': 'AI Model', 'value': DANILO_AI_ACTIVE_MODEL}]}
    except SQLAlchemyError as exc:
        logger.exception('Dashboard database error for user_id=%s role=%s', current_user.id, current_user.role)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail='Dashboard data is temporarily unavailable') from exc
    except Exception as exc:
        logger.exception('Dashboard error for user_id=%s role=%s', current_user.id, current_user.role)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail='Dashboard could not be loaded') from exc

@router.get('/stream', tags=['dashboard'])
def stream(current_user: User=Depends(get_current_user), db: Session=Depends(get_db)) -> list[dict]:
    return build_stream(db, current_user)

@router.get('/content', tags=['content'])
def content(query: str | None=None, quarter: str | None=None, subject: str | None=None, current_user: User=Depends(get_current_user), db: Session=Depends(get_db)) -> list[dict]:
    return build_content_tree(db, user=current_user, query=query, quarter=quarter, subject=subject)

@router.get('/content/workflow', tags=['content'])
def content_workflow(current_user: User=Depends(get_current_user)) -> dict:
    _ = current_user
    return build_content_workflow_status()

@router.get('/grades', tags=['grades'])
def grades(current_user: User=Depends(get_current_user), db: Session=Depends(get_db)) -> list[dict]:
    if current_user.role != 'student':
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Grades are only available to student accounts')
    return build_grade_summary(db, current_user.id)

@router.get('/content/{module_id}/pdf')
def content_pdf(module_id: str, current_user: User=Depends(get_current_user), db: Session=Depends(get_db)) -> Response:
    module = db.get(Module, module_id)
    if not module:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Lesson module not found')
    if current_user.role == 'teacher':
        ensure_teacher_course(db, current_user, module.course_id)
    if current_user.role == 'student':
        ensure_student_enrolled(db, current_user, module.course_id)
    lines = [f'MELC: {module.melc_code}', f"Learning Competency: {module.learning_competency or 'Not specified'}", f"Lesson Objectives: {module.lesson_objectives or 'Not specified'}", f"Assessment Type: {module.assessment_type or 'Not specified'}", f'Folder: {module.folder_name}', f'Week {module.week} | Quarter {module.quarter}', f'Summary: {module.summary}', f'Guide Question: {module.essential_question}', 'Prepared for offline classroom delivery through Project DANILO.']
    pdf_bytes = build_pdf_document(module.title, lines)
    headers = {'Content-Disposition': f'''inline; filename="{module.title.lower().replace(' ', '-')}.pdf"'''}
    return Response(content=pdf_bytes, media_type='application/pdf', headers=headers)

@router.put('/ai/sessions/{session_id}')
def update_chat_session(session_id: str, payload: dict=Body(default={}), current_user: User=Depends(get_current_user), db: Session=Depends(get_db)) -> dict:
    session = db.scalar(select(ChatSession).where(ChatSession.id == session_id, ChatSession.user_id == current_user.id))
    if not session:
        raise HTTPException(status_code=404, detail='Session not found')
    if 'title' in payload:
        session.title = clean_text(payload['title'], max_length=255)
    if 'isActive' in payload:
        session.is_active = parse_bool(payload['isActive'], 'Active status')
    db.commit()
    return {'ok': True}

@router.delete('/ai/sessions/{session_id}')
def delete_chat_session(session_id: str, current_user: User=Depends(get_current_user), db: Session=Depends(get_db)) -> dict:
    session = db.scalar(select(ChatSession).where(ChatSession.id == session_id, ChatSession.user_id == current_user.id))
    if not session:
        raise HTTPException(status_code=404, detail='Session not found')
    session.is_active = False
    db.commit()
    return {'ok': True}


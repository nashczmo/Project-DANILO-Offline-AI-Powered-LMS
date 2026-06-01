import csv

import io

import json

import os

import logging

import math

import re

import sqlite3

import time

from contextlib import asynccontextmanager

from datetime import datetime, timezone

import httpx

try:
    import psutil as _psutil
except ImportError:
    _psutil = None


from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address, default_limits=["100/minute"])

from fastapi import APIRouter, Body, Depends, FastAPI, File, Form, HTTPException, Response, UploadFile, status

from fastapi.middleware.cors import CORSMiddleware

from fastapi.responses import StreamingResponse

from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from sqlalchemy import func, inspect, or_, select, text

from sqlalchemy.exc import SQLAlchemyError

from sqlalchemy.orm import Session, joinedload

from .database import Base, SessionLocal, engine, get_db, wait_for_database

from .models import AIConversation, Assignment, AuditLog, ChatMessage, ChatSession, Course, Department, Enrollment, GradeEntry, Module, Quiz, QuizAttempt, QuizQuestion, Section, StreamPost, StudentAIProfile, Submission, User

from .schemas import LoginRequest, TutorRequest

from .seed import seed_defaults

from app.core.security import create_access_token, decode_access_token, hash_password, verify_password

from .student_insights import analyze_student_performance

import asyncio

import hashlib

from collections import Counter, OrderedDict

from logging.handlers import RotatingFileHandler

_LOG_DIR = os.getenv('DANILO_LOG_DIR', '/var/log/danilo')

os.makedirs(_LOG_DIR, exist_ok=True)

def _make_file_handler(name: str, max_bytes: int=10 * 1024 * 1024, backups: int=5) -> RotatingFileHandler:
    path = os.path.join(_LOG_DIR, name)
    handler = RotatingFileHandler(path, maxBytes=max_bytes, backupCount=backups)
    handler.setFormatter(logging.Formatter('%(asctime)s [%(levelname)s] %(name)s: %(message)s', datefmt='%Y-%m-%d %H:%M:%S'))
    return handler

logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(name)s: %(message)s', datefmt='%Y-%m-%d %H:%M:%S')

logger = logging.getLogger('danilo')

logger.addHandler(_make_file_handler('backend.log'))

ai_logger = logging.getLogger('danilo.ai')

ai_logger.addHandler(_make_file_handler('ai.log'))

def _env_int(name: str, default: int, *, minimum: int=0, maximum: int | None=None) -> int:
    raw = os.getenv(name)
    if raw is None or raw.strip().lower() in {'', 'auto'}:
        value = default
    else:
        try:
            value = int(raw)
        except ValueError:
            logger.warning('Invalid integer env %s=%r; using %s', name, raw, default)
            value = default
    value = max(minimum, value)
    if maximum is not None:
        value = min(maximum, value)
    return value

def _env_float(name: str, default: float, *, minimum: float=0.0, maximum: float | None=None) -> float:
    raw = os.getenv(name)
    if raw is None or raw.strip().lower() in {'', 'auto'}:
        value = default
    else:
        try:
            value = float(raw)
        except ValueError:
            logger.warning('Invalid float env %s=%r; using %s', name, raw, default)
            value = default
    value = max(minimum, value)
    if maximum is not None:
        value = min(maximum, value)
    return value

def _detected_hardware() -> dict:
    try:
        cpu_count = len(os.sched_getaffinity(0))
    except AttributeError:
        cpu_count = os.cpu_count() or 2
    ram_mb = 0
    ram_available_mb = None
    if _psutil:
        try:
            vm = _psutil.virtual_memory()
            ram_mb = int(vm.total / 1024 / 1024)
            ram_available_mb = int(vm.available / 1024 / 1024)
        except Exception:
            pass
    ram_mb = _env_int('DANILO_AI_RAM_MB', ram_mb, minimum=0)
    cpu_count = _env_int('DANILO_AI_CPU_COUNT', cpu_count, minimum=1)
    gpu_vram_mb = _env_int('DANILO_AI_GPU_VRAM_MB', 0, minimum=0)
    storage_available_mb = _env_int('DANILO_AI_STORAGE_AVAILABLE_MB', 0, minimum=0)
    cuda = _env_int('DANILO_AI_CUDA', 0, minimum=0, maximum=1)
    rocm = _env_int('DANILO_AI_ROCM', 0, minimum=0, maximum=1)
    avx2 = _env_int('DANILO_AI_AVX2', 0, minimum=0, maximum=1)
    avx512 = _env_int('DANILO_AI_AVX512', 0, minimum=0, maximum=1)
    integrated_gpu = _env_int('DANILO_AI_INTEGRATED_GPU', 0, minimum=0, maximum=1)
    dedicated_gpu = _env_int('DANILO_AI_DEDICATED_GPU', 0, minimum=0, maximum=1)
    vulkan = _env_int('DANILO_AI_VULKAN', 0, minimum=0, maximum=1)
    opencl = _env_int('DANILO_AI_OPENCL', 0, minimum=0, maximum=1)
    profile = os.getenv('DANILO_AI_HARDWARE_PROFILE', 'auto').strip().lower() or 'auto'
    if profile == 'auto':
        ram_high = _env_int('DANILO_RAM_HIGH_THRESHOLD', 65536)
        ram_mid = _env_int('DANILO_RAM_MID_THRESHOLD', 32768)
        if ram_mb >= ram_high and dedicated_gpu:
            profile = 'high'
        elif ram_mb < ram_mid and not dedicated_gpu and not integrated_gpu:
            profile = 'low'
        else:
            profile = 'mid'
    return {'profile': profile, 'cpuModel': os.getenv('DANILO_AI_CPU_MODEL', 'unknown'), 'ramMb': ram_mb, 'ramAvailableMb': ram_available_mb, 'cpuCount': cpu_count, 'gpuName': os.getenv('DANILO_AI_GPU_NAME', 'none'), 'gpuVramMb': gpu_vram_mb, 'integratedGpu': bool(integrated_gpu), 'dedicatedGpu': bool(dedicated_gpu), 'cuda': bool(cuda), 'rocm': bool(rocm), 'avx2': bool(avx2), 'avx512': bool(avx512), 'vulkan': bool(vulkan), 'opencl': bool(opencl), 'storageAvailableMb': storage_available_mb}

_HARDWARE = _detected_hardware()

def _profile_defaults() -> dict:
    profile = _HARDWARE['profile']
    cpu_count = int(_HARDWARE['cpuCount'])
    dedicated_gpu = _HARDWARE['dedicatedGpu']
    defaults = {'model': os.getenv('DANILO_AI_MODEL_LOW', 'phi3:mini'), 'fallback_model': '', 'optional_model': '', 'model_class': 'lightweight', 'quantization': 'q4_0', 'concurrency': 1, 'queue_timeout': 45.0, 'timeout': 180.0, 'ctx': 1024, 'context_chars': 1800, 'threads': max(1, min(cpu_count, 4)), 'gpu_layers': 0, 'batch': 128, 'kv_cache': 'q8_0', 'scheduler': 'low-memory-fair-queue', 'cache_size': 120, 'cooldown': 5.0}
    if profile == 'mid':
        defaults.update({'model': os.getenv('DANILO_AI_MODEL_MID', 'llama3:8b-instruct-q4_K_M'), 'fallback_model': os.getenv('DANILO_AI_MODEL_LOW', 'phi3:mini'), 'model_class': 'mid-cpu', 'quantization': 'q4_K_M', 'timeout': 150.0, 'ctx': 2048, 'context_chars': 3000, 'threads': max(1, min(cpu_count, 6)), 'gpu_layers': 999 if dedicated_gpu else 0, 'batch': 256, 'scheduler': 'fair-queue', 'cache_size': 200, 'cooldown': 4.0})
    elif profile == 'high':
        defaults.update({'model': os.getenv('DANILO_AI_MODEL_HIGH', 'llama3.1:70b'), 'fallback_model': os.getenv('DANILO_AI_MODEL_MID', 'llama3:8b-instruct-q4_K_M'), 'model_class': 'large', 'quantization': 'q5_K_M', 'concurrency': 3, 'timeout': 120.0, 'ctx': 4096, 'context_chars': 5600, 'threads': max(1, min(cpu_count, 8)), 'gpu_layers': 999, 'batch': 512, 'kv_cache': 'f16', 'scheduler': 'gpu-throughput', 'cache_size': 600, 'cooldown': 1.5})
    if not _HARDWARE['avx2'] and (not _HARDWARE['cuda']) and (not _HARDWARE['rocm']):
        defaults.update({'model': os.getenv('DANILO_AI_MODEL_LOW', 'phi3:mini'), 'fallback_model': '', 'optional_model': '', 'model_class': 'lightweight', 'quantization': 'q4_0', 'concurrency': 1, 'ctx': 1024, 'gpu_layers': 0, 'batch': 128, 'scheduler': 'compatibility-cpu'})
    if 0 < int(_HARDWARE['storageAvailableMb']) < 8192:
        defaults.update({'model': os.getenv('DANILO_AI_MODEL_LOW', 'phi3:mini'), 'fallback_model': '', 'optional_model': '', 'model_class': 'lightweight', 'quantization': 'q4_0', 'concurrency': 1, 'ctx': 1024, 'gpu_layers': 0, 'batch': 128})
    return defaults

_PROFILE_DEFAULTS = _profile_defaults()

JWT_SECRET = os.getenv('JWT_SECRET') or os.getenv('SECRET_KEY')

JWT_EXPIRE_MINUTES = int(os.getenv('JWT_EXPIRE_MINUTES', '720'))

DANILO_AI_RUNTIME = 'ollama'

OLLAMA_HOST = os.getenv('OLLAMA_HOST', 'ollama')

OLLAMA_PORT = os.getenv('OLLAMA_PORT', '11434')

OLLAMA_URL = os.getenv('OLLAMA_URL', f'http://{OLLAMA_HOST}:{OLLAMA_PORT}')

_OLLAMA_MODEL_ENV = (os.getenv('OLLAMA_MODEL') or os.getenv('DANILO_OLLAMA_MODEL') or '').strip()

OLLAMA_MODEL = _PROFILE_DEFAULTS['model'] if _OLLAMA_MODEL_ENV.lower() in {'', 'auto'} else _OLLAMA_MODEL_ENV

DANILO_AI_PRIMARY_MODEL = os.getenv('DANILO_AI_PRIMARY_MODEL', '')

DANILO_AI_FALLBACK_MODEL = os.getenv('DANILO_AI_FALLBACK_MODEL', _PROFILE_DEFAULTS['fallback_model'])

DANILO_AI_OPTIONAL_MODEL = os.getenv('DANILO_AI_OPTIONAL_MODEL', _PROFILE_DEFAULTS['optional_model'])

DANILO_AI_ACTIVE_MODEL = os.getenv('DANILO_AI_ACTIVE_MODEL', OLLAMA_MODEL)

_AI_MODEL_CLASS = os.getenv('DANILO_AI_MODEL_CLASS', _PROFILE_DEFAULTS['model_class'])

_AI_QUANTIZATION = os.getenv('DANILO_AI_QUANTIZATION', _PROFILE_DEFAULTS['quantization'])

_AI_SCHEDULER = os.getenv('DANILO_AI_SCHEDULER', _PROFILE_DEFAULTS['scheduler'])

AI_TIMEOUT_SECONDS = _env_float('DANILO_AI_TIMEOUT_SECONDS', _env_float('OLLAMA_TIMEOUT_SECONDS', _PROFILE_DEFAULTS['timeout'], minimum=30.0), minimum=30.0, maximum=600.0)

OLLAMA_TIMEOUT_SECONDS = AI_TIMEOUT_SECONDS

OLLAMA_NUM_CTX = _env_int('OLLAMA_NUM_CTX', _env_int('DANILO_AI_NUM_CTX', _PROFILE_DEFAULTS['ctx'], minimum=512), minimum=512, maximum=8192)

OLLAMA_CONTEXT_CHARS = _env_int('OLLAMA_CONTEXT_CHARS', _PROFILE_DEFAULTS['context_chars'], minimum=800, maximum=12000)

OLLAMA_NUM_THREADS = _env_int('DANILO_AI_THREADS', _PROFILE_DEFAULTS['threads'], minimum=1, maximum=max(1, int(_HARDWARE['cpuCount'])))

OLLAMA_NUM_GPU = _env_int('OLLAMA_NUM_GPU', _env_int('DANILO_AI_GPU_LAYERS', _PROFILE_DEFAULTS['gpu_layers'], minimum=0), minimum=0, maximum=999)

OLLAMA_NUM_BATCH = _env_int('OLLAMA_NUM_BATCH', _PROFILE_DEFAULTS['batch'], minimum=16, maximum=2048)

OLLAMA_KV_CACHE_TYPE = os.getenv('OLLAMA_KV_CACHE_TYPE', _PROFILE_DEFAULTS['kv_cache'])

DANILO_AI_INDEX_PATH = os.getenv('DANILO_AI_INDEX_PATH', '/var/lib/danilo/ai_index.sqlite3')

PORTAL_DOMAIN = os.getenv('PORTAL_DOMAIN', '')

SSID = os.getenv('SSID', '')

ADMIN_USERNAME = os.getenv('ADMIN_USERNAME', 'admin').strip() or 'admin'

ADMIN_PASSWORD = os.getenv('ADMIN_PASSWORD', '')

CORS_ORIGINS = [origin.strip() for origin in os.getenv('CORS_ORIGINS', os.getenv('DANILO_DEFAULT_CORS_DOMAINS', 'http://danilo.local')).split(',') if origin.strip()]

DANILO_ROLES = set((role.strip().lower() for role in os.getenv('DANILO_ROLES', 'admin,teacher,student').split(',') if role.strip()))

if 'admin' not in DANILO_ROLES:
    DANILO_ROLES.add('admin')

ROLE_DISPLAY = {role: role.capitalize() for role in DANILO_ROLES}

ROLE_DISPLAY.update({'student': 'Learner', 'teacher': 'Faculty', 'admin': 'Admin'})

if not JWT_SECRET:
    raise RuntimeError('JWT_SECRET must be set by the installer environment')

if not OLLAMA_URL:
    raise RuntimeError('OLLAMA_URL must be set for the Ollama runtime')

if not PORTAL_DOMAIN:
    raise RuntimeError('PORTAL_DOMAIN must be set by the installer environment')

if not SSID:
    raise RuntimeError('SSID must be set by the installer environment')

_AI_MAX_CONCURRENT = _env_int('DANILO_AI_MAX_CONCURRENT', _PROFILE_DEFAULTS['concurrency'], minimum=1, maximum=8)

_AI_QUEUE_TIMEOUT_SECONDS = _env_float('DANILO_AI_QUEUE_TIMEOUT_SECONDS', _PROFILE_DEFAULTS['queue_timeout'], minimum=5.0, maximum=300.0)

_AI_SEMAPHORE: asyncio.Semaphore | None = None

_AI_USER_LAST_REQUEST: dict[int, float] = {}

_AI_COOLDOWN_SECONDS = _env_float('DANILO_AI_COOLDOWN_SECONDS', _PROFILE_DEFAULTS['cooldown'], minimum=0.0, maximum=60.0)

_AI_TOTAL_REQUESTS = 0

_AI_TIMEOUTS = 0

_AI_ERRORS = 0

_AI_LAST_MODEL = DANILO_AI_ACTIVE_MODEL

_AI_LAST_LATENCY_MS: int | None = None

_AI_CLEANUP_INTERVAL = 300.0

_ai_last_cleanup: float = 0.0

def _cleanup_stale_cooldowns() -> None:
    """Remove cooldown entries older than 10 × cooldown window to cap dict size."""
    global _ai_last_cleanup
    now = time.monotonic()
    if now - _ai_last_cleanup < _AI_CLEANUP_INTERVAL:
        return
    cutoff = now - max(_AI_COOLDOWN_SECONDS * 10, 60.0)
    stale = [uid for uid, ts in _AI_USER_LAST_REQUEST.items() if ts < cutoff]
    for uid in stale:
        _AI_USER_LAST_REQUEST.pop(uid, None)
    _ai_last_cleanup = now

def _ai_queue_depth() -> int:
    """Return an estimate of learners currently occupying or waiting on AI slots."""
    sem = _AI_SEMAPHORE
    if sem is None:
        return 0
    available = getattr(sem, '_value', _AI_MAX_CONCURRENT)
    waiter_count = len([w for w in getattr(sem, '_waiters', []) or [] if not w.done()])
    active = max(0, _AI_MAX_CONCURRENT - available)
    return active + waiter_count

async def _acquire_ai_slot() -> asyncio.Semaphore:
    sem = _AI_SEMAPHORE or asyncio.Semaphore(_AI_MAX_CONCURRENT)
    try:
        await asyncio.wait_for(sem.acquire(), timeout=_AI_QUEUE_TIMEOUT_SECONDS)
    except asyncio.TimeoutError as exc:
        raise HTTPException(status_code=503, detail='DANILO is busy helping other learners. Please try again shortly.') from exc
    return sem

def _record_ai_result(metrics: dict | None=None, *, timeout: bool=False, error: bool=False) -> None:
    global _AI_TIMEOUTS, _AI_ERRORS, _AI_LAST_MODEL, _AI_LAST_LATENCY_MS
    if timeout:
        _AI_TIMEOUTS += 1
    if error:
        _AI_ERRORS += 1
    if metrics:
        _AI_LAST_MODEL = str(metrics.get('model') or _AI_LAST_MODEL)
        if metrics.get('duration_ms') is not None:
            _AI_LAST_LATENCY_MS = int(metrics['duration_ms'])

_AI_CACHE_MAXSIZE = _env_int('DANILO_AI_CACHE_SIZE', _PROFILE_DEFAULTS['cache_size'], minimum=20, maximum=2000)

_ai_response_cache: 'OrderedDict[str, str]' = OrderedDict()

def _cache_key(prompt: str, mode: str) -> str:
    return hashlib.sha256(f'{DANILO_AI_RUNTIME}:{DANILO_AI_ACTIVE_MODEL}:{mode}:{prompt}'.encode()).hexdigest()

def _cache_get(prompt: str, mode: str) -> str | None:
    key = _cache_key(prompt, mode)
    if key in _ai_response_cache:
        _ai_response_cache.move_to_end(key)
        return _ai_response_cache[key]
    return None

def _cache_set(prompt: str, mode: str, response: str) -> None:
    key = _cache_key(prompt, mode)
    _ai_response_cache[key] = response
    _ai_response_cache.move_to_end(key)
    while len(_ai_response_cache) > _AI_CACHE_MAXSIZE:
        _ai_response_cache.popitem(last=False)

security = HTTPBearer()









@asynccontextmanager
async def lifespan(_: FastAPI):
    global _AI_SEMAPHORE
    _AI_SEMAPHORE = asyncio.Semaphore(_AI_MAX_CONCURRENT)
    logger.info('Backend startup: waiting for database')
    wait_for_database()

    logger.info('Backend startup: creating missing tables')
    Base.metadata.create_all(bind=engine)
    logger.info('Backend startup: applying migrations')
    from alembic.config import Config
    from alembic import command
    alembic_cfg = Config("alembic.ini")
    command.upgrade(alembic_cfg, "head")

    db = SessionLocal()
    try:
        logger.info('Backend startup: seeding required defaults')
        seed_defaults(db, admin_username=ADMIN_USERNAME, admin_password=ADMIN_PASSWORD, portal_domain=PORTAL_DOMAIN)
        logger.info('Backend startup: preparing RAG index')
        rebuild_rag_index(db)
    finally:
        db.close()
    logger.info('Backend startup complete')
    yield

app = FastAPI(title='Project DANILO API', version='1.1.0-beta', description='Offline-first DepEd school portal API — authentication, LMS, AI tutor, and system health.', lifespan=lifespan, openapi_tags=[{'name': 'health', 'description': 'Service and AI health checks'}, {'name': 'auth', 'description': 'Authentication and password management'}, {'name': 'dashboard', 'description': 'Role-aware dashboard data'}, {'name': 'content', 'description': 'Lesson modules and content tree'}, {'name': 'grades', 'description': 'Student grade records'}, {'name': 'ai', 'description': 'AI tutor (DANILO) — chat, sessions, streaming'}, {'name': 'admin', 'description': 'School admin — users, courses, sections, system'}, {'name': 'teacher', 'description': 'Faculty — courses, gradebook, insights, quizzes'}, {'name': 'student', 'description': 'Learner — courses, assignments, quiz attempts'}, {'name': 'classes', 'description': 'Shared classroom endpoints (teacher + student)'}])

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

upload_dir = os.path.join(os.getcwd(), 'data', 'uploads')
os.makedirs(upload_dir, exist_ok=True)
from fastapi.staticfiles import StaticFiles
app.mount("/api/uploads", StaticFiles(directory=upload_dir), name="uploads")

app.add_middleware(CORSMiddleware, allow_origins=CORS_ORIGINS, allow_credentials=True, allow_methods=['*'], allow_headers=['*'])

@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    from fastapi.responses import JSONResponse
    logger.warning('HTTP %s on %s: %s', exc.status_code, request.url.path, exc.detail)
    return JSONResponse(status_code=exc.status_code, content={'detail': exc.detail, 'status': exc.status_code})

@app.exception_handler(Exception)
async def unhandled_exception_handler(request, exc):
    from fastapi.responses import JSONResponse
    logger.exception('Unhandled error on %s: %s', request.url.path, str(exc))
    return JSONResponse(status_code=500, content={'detail': 'Internal server error', 'status': 500})

def get_current_user(credentials: HTTPAuthorizationCredentials=Depends(security), db: Session=Depends(get_db)) -> User:
    try:
        payload = decode_access_token(credentials.credentials, JWT_SECRET)
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid token') from exc
    user_id = str(payload.get('sub') or '').strip()
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid token')
    user = db.get(User, user_id)
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Account is inactive')
    return user

def serialize_user(user: User) -> dict:
    return {'id': user.id, 'role': user.role, 'displayRole': ROLE_DISPLAY.get(user.role, user.role.capitalize()), 'username': user.username, 'email': user.email, 'fullName': user.full_name, 'educationLevel': user.education_level, 'gradeLevel': user.grade_level, 'strand': user.strand, 'sectionName': user.section_name, 'departmentId': user.department_id, 'isActive': user.is_active, 'forcePasswordChange': bool(getattr(user, 'force_password_change', False))}


class RoleChecker:
    def __init__(self, allowed_roles: list[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, current_user: User = Depends(get_current_user)):
        if current_user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Operation not permitted"
            )
        return current_user

def require_role(user: User, *roles: str) -> None:
    if user.role not in roles:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='You do not have permission for this action')

def clean_text(value, *, required: bool=True, max_length: int=255) -> str | None:
    if value is None:
        if required:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Missing required field')
        return None
    text_value = ' '.join(str(value).replace('\r', ' ').replace('\n', ' ').split())
    if required and (not text_value):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Required field cannot be blank')
    if len(text_value) > max_length:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f'Field is too long; max {max_length} characters')
    return text_value or None

def parse_int(value, field: str, *, required: bool=True, minimum: int | None=None) -> int | None:
    if value in (None, ''):
        if required:
            raise HTTPException(status_code=400, detail=f'{field} is required')
        return None
    try:
        parsed = int(value)
    except (TypeError, ValueError) as exc:
        raise HTTPException(status_code=400, detail=f'{field} must be a whole number') from exc
    if minimum is not None and parsed < minimum:
        raise HTTPException(status_code=400, detail=f'{field} must be at least {minimum}')
    return parsed

def parse_id(value, field: str, *, required: bool=True) -> str | None:
    if value in (None, ''):
        if required:
            raise HTTPException(status_code=400, detail=f'{field} is required')
        return None
    parsed = str(value).strip()
    if not parsed:
        if required:
            raise HTTPException(status_code=400, detail=f'{field} is required')
        return None
    if len(parsed) > 80 or (not re.fullmatch(r'[A-Za-z0-9][A-Za-z0-9_-]*', parsed)):
        raise HTTPException(status_code=400, detail=f'{field} is invalid')
    return parsed

def parse_float(value, field: str, *, required: bool=True, minimum: float | None=None, maximum: float | None=None) -> float | None:
    if value in (None, ''):
        if required:
            raise HTTPException(status_code=400, detail=f'{field} is required')
        return None
    try:
        parsed = float(value)
    except (TypeError, ValueError) as exc:
        raise HTTPException(status_code=400, detail=f'{field} must be a number') from exc
    if minimum is not None and parsed < minimum:
        raise HTTPException(status_code=400, detail=f'{field} must be at least {minimum}')
    if maximum is not None and parsed > maximum:
        raise HTTPException(status_code=400, detail=f'{field} must be at most {maximum}')
    return parsed

def parse_bool(value, field: str, *, default: bool | None=None) -> bool:
    if value in (None, ''):
        if default is not None:
            return default
        raise HTTPException(status_code=400, detail=f'{field} is required')
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        lowered = value.strip().lower()
        if lowered in {'true', '1', 'yes', 'y'}:
            return True
        if lowered in {'false', '0', 'no', 'n'}:
            return False
    raise HTTPException(status_code=400, detail=f'{field} must be true or false')

EDUCATION_LEVELS = {'Junior High School': [f'Grade {grade}' for grade in range(7, 11)], 'Senior High School': [f'Grade {grade}' for grade in range(11, 13)]}

SHS_STRANDS = {'STEM', 'ABM', 'HUMSS', 'GAS', 'TVL', 'Arts and Design', 'Sports'}

DEPED_SUBJECTS = {'Filipino', 'English', 'Mathematics', 'Science', 'Araling Panlipunan', 'MAPEH', 'TLE', 'ESP', 'Mother Tongue', 'Oral Communication', 'Reading and Writing', 'General Mathematics', 'Statistics and Probability', 'Earth and Life Science', 'Physical Science', 'Biology', 'Chemistry', 'Physics', 'Practical Research', 'Media and Information Literacy', 'Empowerment Technologies', 'Personal Development', 'Contemporary Arts', 'Understanding Culture, Society, and Politics', 'Philosophy'}

ASSESSMENT_TYPES = {'Written Work', 'Performance Task', 'Term Assessment', 'Quiz', 'Assignment', 'Project', 'Recitation', 'Portfolio'}

MATERIAL_EXTENSIONS = {'.pdf', '.ppt', '.pptx', '.docx', '.txt'}

MAX_MATERIAL_BYTES = int(os.getenv('DANILO_MAX_UPLOAD_BYTES', str(12 * 1024 * 1024)))

def normalize_local_account(value: str) -> str:
    return ''.join((ch for ch in value.lower() if ch.isalnum()))

def generated_username_from_name(full_name: str, role: str='student', section_name: str | None=None) -> str:
    parts = full_name.replace('.', ' ').split()
    parts = [p.strip() for p in parts if p.strip()]
    if not parts:
        base = 'user'
    elif len(parts) == 1:
        base = parts[0].lower()
    elif len(parts) == 2:
        base = (parts[0][0] + parts[1]).lower()
    else:
        first_initial = parts[0][0].lower()
        middle_initial = parts[-2][0].lower()
        last_name = parts[-1].lower()
        base = first_initial + middle_initial + last_name
    base = ''.join((c for c in base if c.isalnum()))
    if role == 'student':
        domain = 'student.danilo.edu'
    else:
        domain = 'danilo.edu'
    return f'{base}@{domain}'

def unique_local_username(db: Session, base_username: str, user_id: str | None=None) -> str:
    import string
    if '@' in base_username:
        prefix, domain = base_username.split('@', 1)
        suffix_domain = f'@{domain}'
    else:
        prefix = base_username
        suffix_domain = ''
    for suffix in [''] + list(string.ascii_lowercase) + [str(i) for i in range(1, 100)]:
        attempt = f'{prefix}{suffix}{suffix_domain}'
        stmt = select(User).where(func.lower(User.username) == attempt.lower())
        if user_id:
            stmt = stmt.where(User.id != user_id)
        if not db.scalar(stmt):
            return attempt
    raise HTTPException(status_code=409, detail='Could not generate a unique username — please specify one manually')

def validate_grade_path(education_level: str | None, grade_level: str | None, strand: str | None) -> tuple[str | None, str | None, str | None]:
    if education_level == 'Junior High':
        education_level = 'Junior High School'
    if education_level == 'Senior High':
        education_level = 'Senior High School'
    if not education_level and (not grade_level) and (not strand):
        return (None, None, None)
    if education_level not in EDUCATION_LEVELS:
        raise HTTPException(status_code=400, detail='Education level must be Junior High School or Senior High School')
    if grade_level not in EDUCATION_LEVELS[education_level]:
        raise HTTPException(status_code=400, detail='Grade level does not match education level')
    if education_level == 'Senior High School':
        if strand not in SHS_STRANDS:
            raise HTTPException(status_code=400, detail='Senior High School requires a valid strand')
    elif strand:
        raise HTTPException(status_code=400, detail='Strand is only allowed for Senior High School')
    return (education_level, grade_level, strand)

def validate_safe_text(value: str | None, field: str, *, max_length: int=255) -> str:
    cleaned = clean_text(value, max_length=max_length)
    if re.search(r'[<>`{}]', cleaned):
        raise HTTPException(status_code=400, detail=f'{field} contains invalid characters')
    return cleaned

def validate_deped_subject(subject: str | None) -> str:
    cleaned = validate_safe_text(subject, 'Subject', max_length=120)
    if len(cleaned) < 2:
        raise HTTPException(status_code=400, detail='Subject is required')
    return cleaned

def validate_term(value: str | None) -> str:
    term = clean_text(value or 'Term 1', max_length=10)
    if term not in {'Term 1', 'Term 2', 'Term 3'}:
        raise HTTPException(status_code=400, detail='Term must be Term 1, Term 2, or Term 3')
    return term

def validate_assessment_type(value: str | None) -> str | None:
    assessment_type = clean_text(value, required=False, max_length=120)
    if assessment_type and assessment_type not in ASSESSMENT_TYPES:
        raise HTTPException(status_code=400, detail='Assessment type must be a supported classroom assessment')
    return assessment_type

def get_user_class(db: Session, user: User, course_id: str) -> Course:
    """Return a course if the user is its assigned teacher or an enrolled student.
    Admin accounts use dedicated /admin/courses/* endpoints and are intentionally
    excluded here to enforce strict role separation."""
    course = db.get(Course, course_id)
    if not course or not course.is_active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Class not found')
    if user.role == 'teacher' and course.teacher_id == user.id:
        return course
    if user.role == 'student' and db.scalar(select(Enrollment).where(Enrollment.course_id == course_id, Enrollment.student_id == user.id, Enrollment.status == 'active')):
        return course
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='You do not have access to this class')

def serialize_course(course: Course) -> dict:
    return {'id': course.id, 'code': course.code, 'title': course.title, 'subject': course.subject, 'educationLevel': course.education_level, 'gradeLevel': course.grade_level, 'strand': course.strand, 'term': course.term, 'schoolYear': course.school_year, 'description': course.description, 'teacherId': course.teacher_id, 'teacherName': course.teacher.full_name if course.teacher else 'Unassigned', 'departmentId': course.department_id, 'departmentName': course.department.name if course.department else '', 'isActive': course.is_active}

def summarize_grade_entries(course: Course, rows: list[GradeEntry], student_name: str | None=None) -> list[dict]:
    buckets: dict[str, dict] = {}
    for grade in rows:
        bucket = buckets.setdefault(grade.term, {'courseId': course.id, 'courseCode': course.code, 'courseTitle': course.title, 'subject': course.subject, 'term': grade.term, 'teacher': course.teacher.full_name if course.teacher else '', 'studentName': student_name, 'components': [], 'weightedScore': 0.0, 'weightTotal': 0.0})
        normalized = grade.score / grade.max_score * 100.0 if grade.max_score else 0.0
        bucket['components'].append({'id': grade.id, 'component': grade.component, 'score': grade.score, 'maxScore': grade.max_score, 'weight': grade.weight, 'remarks': grade.remarks or '', 'percentage': round(normalized, 2)})
        bucket['weightedScore'] += normalized * grade.weight
        bucket['weightTotal'] += grade.weight
    summary = []
    for bucket in buckets.values():
        total = bucket['weightedScore'] / bucket['weightTotal'] if bucket['weightTotal'] else 0.0
        bucket['finalGrade'] = round(total, 2)
        bucket.pop('weightedScore')
        bucket.pop('weightTotal')
        summary.append(bucket)
    return sorted(summary, key=lambda item: item['term'])

def log_action(db: Session, actor: User | None, action: str, entity_type: str, entity_id: str | None=None, details: str | None=None) -> None:
    db.add(AuditLog(actor_id=actor.id if actor else None, action=action, entity_type=entity_type, entity_id=entity_id, details=details))

def ensure_teacher_course(db: Session, teacher: User, course_id: str) -> Course:
    course = db.get(Course, course_id)
    if not course or not course.is_active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Class not found')
    if teacher.role != 'teacher' or course.teacher_id != teacher.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='You can only manage assigned classes')
    return course

def ensure_student_enrolled(db: Session, student: User, course_id: str) -> Course:
    course = db.get(Course, course_id)
    enrolled = db.scalar(select(Enrollment).where(Enrollment.course_id == course_id, Enrollment.student_id == student.id, Enrollment.status == 'active'))
    if not course or not course.is_active or (not enrolled):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='You can only view your enrolled classes')
    return course

def build_content_workflow_status() -> dict:
    return {'pdfUploadReady': True, 'aiLessonGenerationReady': True, 'status': 'ready', 'title': 'Teacher Material Upload', 'message': 'Teachers can upload PDF, PPT, PPTX, DOCX, or TXT files and generate editable lesson modules.', 'nextStep': 'Open an assigned class, upload a source file, review the generated lesson, and save or regenerate it.'}

def cleaned_material_text(value: str | None, limit: int=12000) -> str:
    text_value = str(value or '')
    text_value = text_value.replace('\x00', ' ')
    text_value = re.sub('[ \\t\\r\\f\\v]+', ' ', text_value)
    text_value = re.sub('\\n{3,}', '\n\n', text_value)
    text_value = '\n'.join((line.strip() for line in text_value.splitlines()))
    text_value = text_value.strip()
    if len(text_value) > limit:
        text_value = text_value[:limit].rsplit(' ', 1)[0]
    return text_value

def plain_text_from_bytes(data: bytes) -> str:
    for encoding in ('utf-8', 'utf-16', 'latin-1'):
        try:
            return data.decode(encoding)
        except UnicodeDecodeError:
            continue
    return data.decode('utf-8', errors='ignore')

def extract_material_text(filename: str, data: bytes) -> str:
    suffix = os.path.splitext(filename.lower())[1]
    if suffix not in MATERIAL_EXTENSIONS:
        raise HTTPException(status_code=400, detail='Unsupported material type. Upload PDF, PPT, PPTX, DOCX, or TXT.')
    if len(data) > MAX_MATERIAL_BYTES:
        raise HTTPException(status_code=400, detail='Uploaded material is too large for this offline device.')
    try:
        if suffix == '.txt':
            return cleaned_material_text(plain_text_from_bytes(data))
        if suffix == '.pdf':
            from pypdf import PdfReader
            reader = PdfReader(io.BytesIO(data))
            return cleaned_material_text('\n'.join((page.extract_text() or '' for page in reader.pages)))
        if suffix == '.docx':
            from docx import Document
            document = Document(io.BytesIO(data))
            return cleaned_material_text('\n'.join((paragraph.text for paragraph in document.paragraphs)))
        if suffix == '.pptx':
            from pptx import Presentation
            deck = Presentation(io.BytesIO(data))
            lines = []
            for slide in deck.slides:
                for shape in slide.shapes:
                    if hasattr(shape, 'text') and shape.text:
                        lines.append(shape.text)
            return cleaned_material_text('\n'.join(lines))
        if suffix == '.ppt':
            return cleaned_material_text(plain_text_from_bytes(data))
    except Exception as exc:
        logger.exception('Material extraction failed for %s', filename)
        raise HTTPException(status_code=400, detail=f'Could not extract readable text from {suffix.upper()} material') from exc
    raise HTTPException(status_code=400, detail='Unsupported material type')

async def generated_lesson_from_text(course: Course, filename: str, text: str, mode: str) -> dict:
    if len(text.split()) < 20:
        raise HTTPException(status_code=400, detail='Uploaded material does not contain enough readable lesson text')
    title_seed = os.path.splitext(os.path.basename(filename))[0].replace('_', ' ').replace('-', ' ')
    default_title = clean_text(title_seed.title() or f'{course.subject} Lesson', max_length=255)
    prompt = f"""You are an expert curriculum developer. Convert this raw material into a structured textbook-style lesson.\nCourse: {course.grade_level} {course.subject}\nMode: {RESPONSE_MODE_OPTIONS.get(mode, RESPONSE_MODE_OPTIONS['normal']).get('instruction')}\nMaterial Context:\n{trim_text(text, max(1000, OLLAMA_CONTEXT_CHARS - 1500))}\n\nPlease output EXACTLY and ONLY a JSON object (do not wrap it in markdown code blocks) with the following fields:\n"title": A short catchy lesson title\n"summary": A brief 2-sentence summary\n"essential_question": One overarching essential question\n"objectives": An array of 3 learning objectives\n"content": The main lesson text formatted in Markdown, which MUST include the following sections:\n  - An easier-to-understand Explanation\n  - A short Reviewer summary\n  - A 3-question Quiz\n  - A Practice activity\nEnsure the tone matches the requested Mode.\n"""
    try:
        response_text, _ = await ask_ollama(SYSTEM_PROMPT, prompt, mode)
        cleaned_json = response_text.strip()
        if cleaned_json.startswith('```json'):
            cleaned_json = cleaned_json[7:]
        if cleaned_json.startswith('```'):
            cleaned_json = cleaned_json[3:]
        if cleaned_json.endswith('```'):
            cleaned_json = cleaned_json[:-3]
        parsed = json.loads(cleaned_json.strip())
        title = parsed.get('title', default_title)
        summary = parsed.get('summary', trim_text(text, 700))
        essential_question = parsed.get('essential_question', f'How can learners apply the main ideas from {title} in real-life situations?')
        objs = parsed.get('objectives', [])
        objectives = ' '.join(objs) if isinstance(objs, list) else str(objs)
        content = parsed.get('content', text[:3000])
    except Exception as e:
        logger.warning(f'Failed to parse LLM generated lesson as JSON: {e}')
        title = default_title
        summary = trim_text(text, 700)
        essential_question = f'How can learners apply the main ideas from {title} in real-life situations?'
        objectives = 'Identify key ideas from the uploaded material. Explain the main concept. Answer a short practice task.'
        content = f'# {title}\n\n{text[:3000]}'
    return {'melcCode': 'AI-GENERATED', 'learningCompetency': f'DepEd-aligned competency for {course.subject}; teacher should review before class use.', 'lessonObjectives': objectives, 'assessmentType': 'Written Work', 'term': course.term, 'week': 1, 'sequenceOrder': 1, 'folderName': f'{course.code}/AI Generated', 'title': title, 'summary': summary, 'essentialQuestion': essential_question, 'content': content, 'fileUrl': None, 'aiGenerated': True, 'sourceFilename': filename}

def build_grade_summary(db: Session, student_id: str) -> list[dict]:
    rows = db.execute(select(GradeEntry, Course).join(Course, GradeEntry.course_id == Course.id).where(GradeEntry.student_id == student_id).order_by(Course.subject.asc(), GradeEntry.term.asc(), GradeEntry.created_at.asc())).all()
    buckets: dict[tuple[int, str], dict] = {}
    for grade, course in rows:
        key = (course.id, grade.term)
        bucket = buckets.setdefault(key, {'courseId': course.id, 'courseCode': course.code, 'courseTitle': course.title, 'subject': course.subject, 'term': grade.term, 'teacher': course.teacher.full_name if course.teacher else '', 'components': [], 'weightedScore': 0.0, 'weightTotal': 0.0})
        normalized = grade.score / grade.max_score * 100.0 if grade.max_score else 0.0
        bucket['components'].append({'component': grade.component, 'score': grade.score, 'maxScore': grade.max_score, 'weight': grade.weight, 'remarks': grade.remarks or '', 'percentage': round(normalized, 2)})
        bucket['weightedScore'] += normalized * grade.weight
        bucket['weightTotal'] += grade.weight
    summary = []
    for bucket in buckets.values():
        total = bucket['weightedScore'] / bucket['weightTotal'] if bucket['weightTotal'] else 0.0
        bucket['finalGrade'] = round(total, 2)
        bucket.pop('weightedScore')
        bucket.pop('weightTotal')
        summary.append(bucket)
    return sorted(summary, key=lambda item: (item['subject'], item['term']))

def build_content_tree(db: Session, *, user: User | None=None, query: str | None=None, term: str | None=None, subject: str | None=None) -> list[dict]:
    stmt = select(Module, Course).join(Course, Module.course_id == Course.id).order_by(Module.grade_level.asc(), Module.subject.asc(), Module.term.asc(), Module.week.asc(), Module.sequence_order.asc())
    if query:
        like_query = f'%{query.strip()}%'
        stmt = stmt.where(or_(Module.title.ilike(like_query), Module.summary.ilike(like_query), Module.folder_name.ilike(like_query)))
    if term:
        stmt = stmt.where(Module.term == term)
    if subject:
        stmt = stmt.where(Module.subject == subject)
    if user and user.role == 'admin':
        return []
    if user and user.role == 'teacher':
        stmt = stmt.where(Course.teacher_id == user.id)
    if user and user.role == 'student':
        stmt = stmt.join(Enrollment, Enrollment.course_id == Course.id).where(Enrollment.student_id == user.id, Enrollment.status == 'active')
    rows = db.execute(stmt).all()
    items = []
    for module, course in rows:
        items.append({'id': module.id, 'courseId': course.id, 'courseCode': course.code, 'courseTitle': course.title, 'subject': module.subject, 'gradeLevel': module.grade_level, 'term': module.term, 'week': module.week, 'folderName': module.folder_name, 'melcCode': module.melc_code, 'learningCompetency': module.learning_competency or '', 'lessonObjectives': module.lesson_objectives or '', 'assessmentType': module.assessment_type or '', 'title': module.title, 'summary': module.summary, 'essentialQuestion': module.essential_question, 'pdfUrl': f'/api/content/{module.id}/pdf', 'content': module.content or ''})
    return items

def build_stream(db: Session, user: User | None=None) -> list[dict]:
    stmt = select(StreamPost, Course, User).join(Course, StreamPost.course_id == Course.id).join(User, StreamPost.author_id == User.id).order_by(StreamPost.created_at.desc()).limit(24)
    if user and user.role == 'teacher':
        stmt = stmt.where(Course.teacher_id == user.id)
    if user and user.role == 'student':
        stmt = stmt.join(Enrollment, Enrollment.course_id == Course.id).where(Enrollment.student_id == user.id, Enrollment.status == 'active')
    rows = db.execute(stmt).all()
    return [{'id': post.id, 'courseId': course.id, 'title': post.title, 'body': post.body, 'postType': post.post_type, 'createdAt': post.created_at.isoformat() if post.created_at else '', 'courseCode': course.code, 'courseTitle': course.title, 'authorName': author.full_name} for post, course, author in rows]

def build_teacher_course_cards(db: Session, teacher_id: str) -> list[dict]:
    courses = db.scalars(select(Course).options(joinedload(Course.teacher), joinedload(Course.department)).where(Course.teacher_id == teacher_id, Course.is_active == True).order_by(Course.subject.asc())).unique().all()
    course_ids = [c.id for c in courses]
    enrollment_counts = dict(db.execute(select(Enrollment.course_id, func.count(Enrollment.id)).where(Enrollment.course_id.in_(course_ids), Enrollment.status == 'active').group_by(Enrollment.course_id)).all()) if course_ids else {}
    module_counts = dict(db.execute(select(Module.course_id, func.count(Module.id)).where(Module.course_id.in_(course_ids)).group_by(Module.course_id)).all()) if course_ids else {}
    cards = []
    for course in courses:
        cards.append({'id': course.id, 'code': course.code, 'title': course.title, 'subject': course.subject, 'educationLevel': course.education_level, 'term': course.term, 'gradeLevel': course.grade_level, 'strand': course.strand, 'studentTotal': enrollment_counts.get(course.id, 0), 'moduleTotal': module_counts.get(course.id, 0), 'description': course.description})
    return cards

def build_admin_course_cards(db: Session) -> list[dict]:
    courses = db.scalars(select(Course).options(joinedload(Course.teacher), joinedload(Course.department)).where(Course.is_active == True).order_by(Course.subject.asc(), Course.term.asc())).unique().all()
    course_ids = [c.id for c in courses]
    enrollment_counts = dict(db.execute(select(Enrollment.course_id, func.count(Enrollment.id)).where(Enrollment.course_id.in_(course_ids), Enrollment.status == 'active').group_by(Enrollment.course_id)).all()) if course_ids else {}
    module_counts = dict(db.execute(select(Module.course_id, func.count(Module.id)).where(Module.course_id.in_(course_ids)).group_by(Module.course_id)).all()) if course_ids else {}
    cards = []
    for course in courses:
        cards.append({'id': course.id, 'code': course.code, 'title': course.title, 'subject': course.subject, 'educationLevel': course.education_level, 'gradeLevel': course.grade_level, 'strand': course.strand, 'term': course.term, 'studentTotal': enrollment_counts.get(course.id, 0), 'moduleTotal': module_counts.get(course.id, 0), 'teacherName': course.teacher.full_name if course.teacher else 'Unassigned', 'description': course.description})
    return cards

def build_student_course_cards(db: Session, student_id: str) -> list[dict]:
    rows = db.execute(select(Course).join(Enrollment, Enrollment.course_id == Course.id).where(Enrollment.student_id == student_id, Enrollment.status == 'active', Course.is_active == True).order_by(Course.subject.asc())).scalars().all()
    return [{'id': course.id, 'code': course.code, 'title': course.title, 'subject': course.subject, 'educationLevel': course.education_level, 'gradeLevel': course.grade_level, 'strand': course.strand, 'term': course.term, 'description': course.description} for course in rows]

def escape_pdf_text(value: str) -> str:
    return value.replace('\\', '\\\\').replace('(', '\\(').replace(')', '\\)')

def build_pdf_document(title: str, lines: list[str]) -> bytes:
    content = ['BT', '/F1 24 Tf', '72 740 Td', f'({escape_pdf_text(title)}) Tj', '/F1 13 Tf']
    for line in lines:
        content.append('0 -26 Td')
        content.append(f'({escape_pdf_text(line)}) Tj')
    content.append('ET')
    stream = '\n'.join(content).encode('latin-1', 'replace')
    objects = [b'<< /Type /Catalog /Pages 2 0 R >>', b'<< /Type /Pages /Count 1 /Kids [3 0 R] >>', b'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>', b'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>', f'<< /Length {len(stream)} >>\nstream\n'.encode('latin-1') + stream + b'\nendstream']
    pdf = b'%PDF-1.4\n'
    offsets = [0]
    for index, obj in enumerate(objects, start=1):
        offsets.append(len(pdf))
        pdf += f'{index} 0 obj\n'.encode('latin-1') + obj + b'\nendobj\n'
    xref_offset = len(pdf)
    pdf += f'xref\n0 {len(objects) + 1}\n'.encode('latin-1')
    pdf += b'0000000000 65535 f \n'
    for offset in offsets[1:]:
        pdf += f'{offset:010d} 00000 n \n'.encode('latin-1')
    pdf += f'trailer\n<< /Size {len(objects) + 1} /Root 1 0 R >>\nstartxref\n{xref_offset}\n%%EOF\n'.encode('latin-1')
    return pdf


DEFAULT_SYSTEM_PROMPT = '''You are DANILO, an intelligent, offline educational AI tutor for Filipino students.
Your goal is to guide students to answers through Socratic dialogue, not spoon-feed them.
Be clear, short, and step-by-step. Do not act like a robotic textbook.
If the user asks a non-academic question, gently pivot back to their curriculum.
Do not use robotic lists unless explicitly asked.

CRITICAL INSTRUCTIONS:
1. You MUST base your answers ONLY on the provided <curriculum_context>, <student_profile>, and <document_context>.
2. Priority: 1 student database, 2 grades, 3 attendance, 4 uploaded school files, 5 embeddings, 6 AI reasoning.
3. NEVER invent or guess any grades, deadlines, attendance, or announcements.
4. If the requested information is missing, you MUST state exactly: "I couldn't find that in Project DANILO."
5. If you use information from the context, you should cite its source using the provided [Source: ...] tags internally.
'''

SYSTEM_PROMPT = os.getenv('DANILO_SYSTEM_PROMPT', DEFAULT_SYSTEM_PROMPT)

SYSTEM_PROMPT_TEACHER = '''You are DANILO, an intelligent AI Instructional Designer and Teaching Assistant for Filipino teachers.
Your goal is to assist teachers with lesson planning, rubric generation, grading insights, and pedagogical strategies.
Be structured and professional.

CRITICAL INSTRUCTIONS:
1. You MUST base your answers ONLY on the provided <curriculum_context> and <document_context>.
2. Priority: 1 student database, 2 grades, 3 attendance, 4 uploaded school files, 5 embeddings, 6 AI reasoning.
3. NEVER invent or guess any grades, deadlines, attendance, or announcements.
4. If the requested information is missing, you MUST state exactly: "I couldn't find that in Project DANILO."
5. Use the [Source: ...] tags internally to trace where your information came from.'''

SYSTEM_PROMPT_ADMIN = '''You are DANILO, a DevOps and Systems Administration AI for the Project DANILO LMS platform.
Your goal is to assist school administrators with system configuration, network troubleshooting, and server maintenance.
Be concise and data-first.

CRITICAL INSTRUCTIONS:
1. You MUST base your answers ONLY on the provided system context.
2. Priority: 1 student database, 2 grades, 3 attendance, 4 uploaded school files, 5 embeddings, 6 AI reasoning.
3. NEVER invent or guess any server statuses, student records, grades, deadlines, attendance, or announcements.
4. If the requested information is missing, state clearly: "I couldn't find that in Project DANILO."'''

SAFETY_KEYWORDS = {'suicide', 'kill', 'murder', 'bomb', 'weapon', 'drugs', 'porn', 'sex', 'hack', 'exploit', 'violence', 'gore', 'terrorist', 'abuse'}

SAFETY_REDIRECT = "I'm here to help you with your schoolwork! Let's focus on your lessons. What subject would you like help with?"

ROLLING_MEMORY_LIMIT = 6

DEFAULT_RESPONSE_MODE_OPTIONS = {
    'short': {'num_predict': int(os.getenv('DANILO_TOKENS_SHORT', '150')), 'instruction': 'Keep your response brief and direct.'},
    'normal': {'num_predict': int(os.getenv('DANILO_TOKENS_NORMAL', '350')), 'instruction': 'Respond conversationally and naturally.'},
    'detailed': {'num_predict': int(os.getenv('DANILO_TOKENS_DETAILED', '600')), 'instruction': 'Provide a detailed, step-by-step conversational explanation.'},
    'simplify': {'num_predict': 300, 'instruction': 'Explain using very simple language and analogies suitable for a young student.'},
    'step_by_step': {'num_predict': 550, 'instruction': 'Walk through the concept step-by-step in a conversational manner.'},
    'filipino': {'num_predict': 450, 'instruction': 'Converse primarily in Filipino/Taglish. Be warm and encouraging.'},
    'reviewer': {'num_predict': 600, 'instruction': 'Act as a study buddy. Summarize the key points clearly.'},
    'quiz_me': {'num_predict': 400, 'instruction': 'Act as a quizmaster. Ask a thought-provoking question about the topic. Do not reveal the answer yet.'},
    'practice': {'num_predict': 450, 'instruction': 'Give a practice scenario for the student to solve. Wait for their answer.'},
    'real_life': {'num_predict': 450, 'instruction': 'Connect the concept to a real-life situation in the Philippines.'}
}

import json

RESPONSE_MODE_OPTIONS = DEFAULT_RESPONSE_MODE_OPTIONS

if 'DANILO_RESPONSE_MODES_JSON' in os.environ:
    try:
        RESPONSE_MODE_OPTIONS = json.loads(os.environ['DANILO_RESPONSE_MODES_JSON'])
    except Exception as e:
        logger.error(f'Failed to parse DANILO_RESPONSE_MODES_JSON: {e}')

def check_safety(question: str) -> bool:
    words = set(question.lower().split())
    return bool(words & SAFETY_KEYWORDS)

def build_rolling_memory(db: Session, user_id: str, course_id: str | None, limit: int) -> list[dict]:
    stmt = select(ChatMessage).join(ChatSession, ChatMessage.session_id == ChatSession.id).where(ChatSession.user_id == user_id, ChatSession.is_active == True).order_by(ChatMessage.created_at.desc()).limit(limit * 2)
    rows = db.scalars(stmt).all()
    memory = []
    
    # We now use a strict turn-based limit instead of naive character slicing.
    # Preserve full semantic meaning of up to `limit` complete messages.
    for row in rows:
        role = row.role if row.role in ('user', 'assistant') else 'user'
        memory.append({'role': role, 'content': row.content.strip()})
        
    return list(reversed(memory))

def tutor_mode(value: str | None) -> str:
    mode = (value or 'normal').strip().lower()
    return mode if mode in RESPONSE_MODE_OPTIONS else 'normal'

def trim_text(value: str | None, limit: int) -> str:
    text_value = ' '.join(str(value or '').replace('\r', ' ').replace('\n', ' ').split())
    if len(text_value) <= limit:
        return text_value
    return text_value[:limit].rsplit(' ', 1)[0] + ' ...'

def average(values: list[float]) -> float | None:
    return sum(values) / len(values) if values else None

_RAG_STOPWORDS = {'the', 'and', 'for', 'with', 'this', 'that', 'from', 'what', 'when', 'where', 'which', 'how', 'why', 'are', 'was', 'were', 'ang', 'ng', 'mga', 'sa', 'na', 'at', 'ay', 'para'}

def _rag_tokens(value: str) -> list[str]:
    return [t for t in re.findall('[a-zA-Z0-9_]{3,}', value.lower()) if t not in _RAG_STOPWORDS]

def _rag_vector(value: str, dims: int=256) -> dict[str, float]:
    tokens = _rag_tokens(value)
    if not tokens:
        return {}
    counts = Counter((str(hash(token) % dims) for token in tokens))
    norm = math.sqrt(sum((count * count for count in counts.values()))) or 1.0
    return {key: round(count / norm, 6) for key, count in counts.items()}

def _rag_similarity(query_vector: dict[str, float], query_terms: set[str], doc_vector_json: str | None, text_value: str) -> float:
    try:
        doc_vector = json.loads(doc_vector_json or '{}')
    except json.JSONDecodeError:
        doc_vector = {}
    vector_score = sum((query_vector.get(key, 0.0) * float(value) for key, value in doc_vector.items()))
    lexical_bonus = 0.0
    if query_terms:
        lowered = text_value.lower()
        lexical_bonus = sum((0.05 for term in query_terms if term in lowered))
    return vector_score + lexical_bonus

def _rag_chunks(module: Module, chunk_size: int=900, overlap: int=120) -> list[str]:
    source = '\n'.join((part for part in [module.title, module.learning_competency or '', module.summary, module.essential_question, module.content or ''] if part))
    source = cleaned_material_text(source, limit=8000)
    if not source:
        return []
    chunks = []
    index = 0
    while index < len(source):
        chunk = source[index:index + chunk_size].strip()
        if chunk:
            chunks.append(chunk)
        if index + chunk_size >= len(source):
            break
        index += max(1, chunk_size - overlap)
    return chunks[:8]

def init_rag_index() -> None:
    os.makedirs(os.path.dirname(DANILO_AI_INDEX_PATH), exist_ok=True)
    with sqlite3.connect(DANILO_AI_INDEX_PATH) as conn:
        conn.execute('PRAGMA journal_mode=WAL')
        conn.execute('PRAGMA synchronous=NORMAL')
        conn.execute('''
            CREATE TABLE IF NOT EXISTS lesson_chunks (
                module_id INTEGER NOT NULL,
                course_id INTEGER NOT NULL,
                chunk_index INTEGER NOT NULL,
                title TEXT NOT NULL,
                content TEXT NOT NULL,
                vector_json TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                PRIMARY KEY (module_id, chunk_index)
            )
            ''')
        conn.execute('CREATE INDEX IF NOT EXISTS idx_lesson_chunks_course ON lesson_chunks(course_id)')
        
        # New tables for File-Aware AI Tutoring
        conn.execute('''
            CREATE TABLE IF NOT EXISTS user_files (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                filename TEXT NOT NULL,
                file_size INTEGER NOT NULL,
                mime_type TEXT NOT NULL,
                uploaded_at TEXT NOT NULL
            )
            ''')
        conn.execute('CREATE INDEX IF NOT EXISTS idx_user_files_user ON user_files(user_id)')
        
        conn.execute('''
            CREATE TABLE IF NOT EXISTS user_file_chunks (
                file_id INTEGER NOT NULL,
                chunk_index INTEGER NOT NULL,
                content TEXT NOT NULL,
                vector_json TEXT NOT NULL,
                PRIMARY KEY (file_id, chunk_index),
                FOREIGN KEY (file_id) REFERENCES user_files(id) ON DELETE CASCADE
            )
            ''')

def index_module_for_rag(module: Module) -> None:
    init_rag_index()
    now = datetime.now(timezone.utc).isoformat()
    chunks = _rag_chunks(module)
    with sqlite3.connect(DANILO_AI_INDEX_PATH) as conn:
        conn.execute('DELETE FROM lesson_chunks WHERE module_id = ?', (module.id,))
        for idx, chunk in enumerate(chunks):
            conn.execute('INSERT INTO lesson_chunks(module_id, course_id, chunk_index, title, content, vector_json, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)', (module.id, module.course_id, idx, module.title, chunk, json.dumps(_rag_vector(chunk)), now))

def rebuild_rag_index(db: Session) -> None:
    init_rag_index()
    modules = db.scalars(select(Module).order_by(Module.id.asc())).all()
    for module in modules:
        index_module_for_rag(module)
    ai_logger.info('RAG index ready modules=%s path=%s', len(modules), DANILO_AI_INDEX_PATH)

def retrieve_lesson_context(query: str, course_id: str | None, module_id: str | None, limit: int=3) -> list[dict]:
    if not query.strip() or not os.path.exists(DANILO_AI_INDEX_PATH):
        return []
    query_vector = _rag_vector(query)
    params: list[int] = []
    where = []
    if module_id:
        where.append('module_id = ?')
        params.append(module_id)
    elif course_id:
        where.append('course_id = ?')
        params.append(course_id)
    sql = 'SELECT module_id, course_id, title, content, vector_json FROM lesson_chunks'
    if where:
        sql += ' WHERE ' + ' AND '.join(where)
    sql += ' LIMIT 250'
    try:
        with sqlite3.connect(DANILO_AI_INDEX_PATH) as conn:
            rows = conn.execute(sql, params).fetchall()
    except sqlite3.Error:
        logger.exception('RAG retrieval failed')
        return []
    scored = []
    query_terms = set(_rag_tokens(query))
    for module_id_value, course_id_value, title, content, vector_json in rows:
        score = _rag_similarity(query_vector, query_terms, vector_json, content)
        if score > 0:
            scored.append({'moduleId': module_id_value, 'courseId': course_id_value, 'title': title, 'content': trim_text(content, 650), 'score': round(score, 4)})
    scored.sort(key=lambda item: item['score'], reverse=True)
    return scored[:limit]


def retrieve_user_file_context(query: str, user_id: str, limit: int=3) -> list[dict]:
    if not query.strip() or not os.path.exists(DANILO_AI_INDEX_PATH):
        return []
    query_vector = _rag_vector(query)
    
    sql = '''
        SELECT u.filename, c.content, c.vector_json 
        FROM user_file_chunks c
        JOIN user_files u ON c.file_id = u.id
        WHERE u.user_id = ?
        LIMIT 250
    '''
    try:
        with sqlite3.connect(DANILO_AI_INDEX_PATH) as conn:
            rows = conn.execute(sql, (user_id,)).fetchall()
    except sqlite3.Error:
        logger.exception('User file RAG retrieval failed')
        return []
        
    scored = []
    query_terms = set(_rag_tokens(query))
    for filename, text, vector_json in rows:
        score = _rag_similarity(query_vector, query_terms, vector_json, text)
        if score > 0:
            scored.append({
                'filename': filename, 
                'content': trim_text(text, 650), 
                'score': round(score, 4)
            })
            
    scored.sort(key=lambda item: item['score'], reverse=True)
    return scored[:limit]

def estimate_prompt_tokens(prompt: str) -> int:
    return max(1, len(prompt) // 4)

def ollama_chat_payload(system_prompt: str, prompt: str, mode: str, *, stream: bool, memory: list[dict] | None=None, model: str | None=None, gpu_layers: int | None=None) -> dict:
    mode = tutor_mode(mode)
    messages = [{'role': 'system', 'content': system_prompt}]
    if memory:
        messages.extend(memory)
    messages.append({'role': 'user', 'content': prompt})
    return {'model': model or OLLAMA_MODEL, 'stream': stream, 'keep_alive': os.getenv('OLLAMA_KEEP_ALIVE', '10m'), 'messages': messages, 'options': {'temperature': 0.3, 'top_p': 0.9, 'top_k': 40, 'repeat_penalty': 1.1, 'num_ctx': OLLAMA_NUM_CTX, 'num_predict': RESPONSE_MODE_OPTIONS.get(mode, RESPONSE_MODE_OPTIONS['normal'])['num_predict'], 'num_thread': OLLAMA_NUM_THREADS, 'num_batch': OLLAMA_NUM_BATCH, 'num_gpu': OLLAMA_NUM_GPU if gpu_layers is None else gpu_layers}}

def _json_loads(value: str | None, fallback):
    try:
        return json.loads(value or '')
    except Exception:
        return fallback

def build_student_ai_profile(db: Session, student: User, *, persist: bool=True) -> dict:
    if student.role != 'student':
        return {'strengths': [], 'weakConcepts': [], 'learningTrends': [], 'recommendations': [], 'aiInteractionCount': 0}
    profile = db.scalar(select(StudentAIProfile).where(StudentAIProfile.student_id == student.id))
    if not profile and persist:
        profile = StudentAIProfile(student_id=student.id)
        db.add(profile)
        db.flush()
    topic_scores: dict[str, list[float]] = {}
    subject_scores: dict[str, list[float]] = {}
    for grade, course in db.execute(select(GradeEntry, Course).join(Course, GradeEntry.course_id == Course.id).where(GradeEntry.student_id == student.id).order_by(GradeEntry.created_at.asc())).all():
        if grade.max_score:
            pct = grade.score / grade.max_score * 100.0
            topic = trim_text(grade.component or course.subject, 70)
            topic_scores.setdefault(topic, []).append(pct)
            subject_scores.setdefault(course.subject, []).append(pct)
    quiz_scores = []
    for attempt, quiz, course in db.execute(select(QuizAttempt, Quiz, Course).join(Quiz, QuizAttempt.quiz_id == Quiz.id).join(Course, Quiz.course_id == Course.id).where(QuizAttempt.student_id == student.id).order_by(QuizAttempt.submitted_at.asc())).all():
        if attempt.score is not None:
            score = float(attempt.score)
            quiz_scores.append(score)
            topic_scores.setdefault(trim_text(quiz.title or course.subject, 70), []).append(score)
            subject_scores.setdefault(course.subject, []).append(score)
    assignment_count = 0
    assignment_scores = []
    for submission, assignment, course in db.execute(select(Submission, Assignment, Course).join(Assignment, Submission.assignment_id == Assignment.id).join(Course, Assignment.course_id == Course.id).where(Submission.student_id == student.id).order_by(Submission.submitted_at.asc())).all():
        if submission.status in {'submitted', 'completed'}:
            assignment_count += 1
        if submission.score is not None and assignment.points:
            pct = submission.score / assignment.points * 100.0
            assignment_scores.append(pct)
            topic_scores.setdefault(trim_text(assignment.title or course.subject, 70), []).append(pct)
            subject_scores.setdefault(course.subject, []).append(pct)
    strengths = []
    weak_concepts = []
    for topic, scores in topic_scores.items():
        avg = average(scores)
        if avg is None:
            continue
        item = {'topic': topic, 'average': round(avg, 1), 'evidenceCount': len(scores)}
        if avg >= 85:
            strengths.append(item)
        elif avg < 78:
            weak_concepts.append(item)
    strengths = sorted(strengths, key=lambda item: (-item['average'], item['topic']))[:5]
    weak_concepts = sorted(weak_concepts, key=lambda item: (item['average'], -item['evidenceCount'], item['topic']))[:5]
    trends = []
    for subject, scores in subject_scores.items():
        if len(scores) >= 2:
            delta = round(scores[-1] - scores[0], 1)
            direction = 'improved' if delta > 0 else 'declined' if delta < 0 else 'held steady'
            trends.append({'subject': subject, 'delta': delta, 'message': f'Your {subject} accuracy {direction} by {abs(delta):.1f}% across recent work.'})
    trends = sorted(trends, key=lambda item: -abs(item['delta']))[:4]
    recommendations = [f"Review {item['topic']} with a short practice activity." for item in weak_concepts[:3]]
    if not recommendations:
        recommendations.append(f"Try an enrichment challenge in {strengths[0]['topic']}." if strengths else "Start with today's lesson and ask DANILO for one worked example.")
    quiz_summary = {'attempts': len(quiz_scores), 'average': round(average(quiz_scores), 1) if quiz_scores else None, 'latest': round(quiz_scores[-1], 1) if quiz_scores else None}
    assignment_summary = {'submitted': assignment_count, 'scoredAverage': round(average(assignment_scores), 1) if assignment_scores else None}
    ai_count = db.query(AIConversation).filter(AIConversation.student_id == student.id).count()
    last_ai = db.scalar(select(AIConversation).where(AIConversation.student_id == student.id).order_by(AIConversation.created_at.desc()).limit(1))
    if profile and persist:
        profile.strengths_json = json.dumps(strengths, ensure_ascii=True)
        profile.weak_concepts_json = json.dumps(weak_concepts, ensure_ascii=True)
        profile.learning_trends_json = json.dumps(trends, ensure_ascii=True)
        profile.recommendations_json = json.dumps(recommendations, ensure_ascii=True)
        profile.quiz_summary_json = json.dumps(quiz_summary, ensure_ascii=True)
        profile.assignment_summary_json = json.dumps(assignment_summary, ensure_ascii=True)
        profile.ai_interaction_count = ai_count
        profile.last_interaction_at = last_ai.created_at if last_ai else profile.last_interaction_at
        profile.updated_at = datetime.now(timezone.utc)
        db.flush()
    return {'strengths': strengths, 'weakConcepts': weak_concepts, 'learningTrends': trends, 'recommendations': recommendations, 'quizSummary': quiz_summary, 'assignmentSummary': assignment_summary, 'aiInteractionCount': ai_count, 'lastInteractionAt': last_ai.created_at.isoformat() if last_ai and last_ai.created_at else None, 'updatedAt': profile.updated_at.isoformat() if profile and profile.updated_at else None}

def format_student_profile_for_prompt(profile: dict) -> list[str]:
    lines = []
    if profile.get('strengths'):
        lines.append('Strengths: ' + '; '.join((f"{item['topic']} ({item['average']}%)" for item in profile['strengths'][:3])))
    if profile.get('weakConcepts'):
        lines.append('Weak concepts: ' + '; '.join((f"{item['topic']} ({item['average']}%)" for item in profile['weakConcepts'][:3])))
    if profile.get('learningTrends'):
        lines.append('Trends: ' + ' '.join((item.get('message', '') for item in profile['learningTrends'][:2])))
    if profile.get('recommendations'):
        lines.append('Recommended next steps: ' + '; '.join(profile['recommendations'][:2]))
    return lines

def build_tutor_prompt(db: Session, current_user: User, payload: TutorRequest) -> tuple[str, str, Module | None, Course | None, list[str], str]:
    module = db.get(Module, payload.module_id) if payload.module_id else None
    course = db.get(Course, payload.course_id) if payload.course_id else (module.course if module else None)
    mode = tutor_mode(payload.response_mode)

    if course:
        course = get_user_class(db, current_user, course.id)
    if module and course and (module.course_id != course.id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Lesson context is not part of this class')

    # Base System Prompt depending on role
    if current_user.role == 'teacher':
        system_prompt = SYSTEM_PROMPT_TEACHER
    elif current_user.role == 'admin':
        system_prompt = SYSTEM_PROMPT_ADMIN
    else:
        system_prompt = SYSTEM_PROMPT

    # Context Tagging
    context_parts = []
    
    # 1. Profile Context
    if current_user.role == 'student':
        profile = build_student_ai_profile(db, current_user, persist=True)
        profile_lines = format_student_profile_for_prompt(profile)
        student_grades = build_grade_summary(db, current_user.id)[:2]
        grade_lines = [f"[Source: DB Grade Record] {item['courseCode']} {item['term']}: {item['finalGrade']}" for item in student_grades] or []
        
        quiz_lines = []
        if course:
            quiz_query = select(QuizAttempt, Quiz).join(Quiz, QuizAttempt.quiz_id == Quiz.id).where(
                QuizAttempt.student_id == current_user.id, Quiz.course_id == course.id
            ).order_by(QuizAttempt.submitted_at.desc()).limit(2)
            for attempt, quiz in db.execute(quiz_query).all():
                quiz_lines.append(f'[Source: DB Quiz Record] Quiz "{trim_text(quiz.title, 40)}": {attempt.score}%')
                
        if profile_lines or grade_lines or quiz_lines:
            context_parts.append("<student_profile>")
            if current_user.grade_level:
                context_parts.append(f"Grade Level: {current_user.grade_level}")
            if profile_lines:
                context_parts.append(" | ".join(profile_lines))
            if grade_lines:
                context_parts.append("Recent Grades: " + "; ".join(grade_lines))
            if quiz_lines:
                context_parts.append("Recent Quizzes: " + "; ".join(quiz_lines))
            context_parts.append("</student_profile>")
    else:
        grade_lines = []

    # 2. Curriculum Context (Only if available)
    lesson_lines = []
    context_budget = max(400, OLLAMA_CONTEXT_CHARS // 2)
    
    if course:
        lesson_lines.append(f'[Source: {course.subject} Class Context] Class: {course.title} | Subject: {course.subject}')
        
        # Add Recent Assignments
        assignment_query = select(Assignment).where(Assignment.course_id == course.id, Assignment.is_active == True).order_by(Assignment.due_at.desc()).limit(2)
        for assignment in db.scalars(assignment_query).all():
            due_str = assignment.due_at.strftime("%Y-%m-%d %H:%M") if assignment.due_at else "No due date"
            lesson_lines.append(f'[Source: DB Assignment Record] Assignment "{assignment.title}" Due: {due_str}')
            
        # Add Recent Announcements
        post_query = select(StreamPost, User).join(User, StreamPost.author_id == User.id).where(StreamPost.course_id == course.id).order_by(StreamPost.created_at.desc()).limit(2)
        for post, author in db.execute(post_query).all():
            lesson_lines.append(f'[Source: Teacher Announcement from {author.full_name}] Announcement "{post.title}": {trim_text(post.body, 150)}')

    if module:
        content_parts = [f'Lesson: {trim_text(module.title, 80)}', f'Summary: {trim_text(module.summary, 300)}']
        lesson_lines.append(f'[Source: {course.subject if course else "Module"} > {module.title}] ' + ' | '.join(content_parts))
        
    retrieved_chunks = retrieve_lesson_context(payload.question, course.id if course else None, module.id if module else None, limit=2)
    
    if lesson_lines or retrieved_chunks:
        context_parts.append("<curriculum_context>")
        if lesson_lines:
            context_parts.append(" ".join(lesson_lines))
        if retrieved_chunks:
            rag_lines = [f"[Source: Lesson - {item['title']}] {item['content']}" for item in retrieved_chunks]
            context_parts.append("Excerpts: " + trim_text(" || ".join(rag_lines), context_budget))
        context_parts.append("</curriculum_context>")

    # 2.5 Document Context (User Uploaded Files)
    file_chunks = retrieve_user_file_context(payload.question, current_user.id, limit=3)
    if file_chunks:
        context_parts.append("<document_context>")
        file_lines = [f"[Source: Uploaded File - {item['filename']}] {item['content']}" for item in file_chunks]
        context_parts.append("Excerpts: " + trim_text(" || ".join(file_lines), context_budget * 2))
        context_parts.append("</document_context>")

    # 3. Mode Instruction
    if mode != 'normal':
        context_parts.append(f"<instruction>{RESPONSE_MODE_OPTIONS[mode]['instruction']}</instruction>")

    # Finalize System Prompt by appending context
    if context_parts:
        system_prompt += "\n\n" + "\n".join(context_parts)

    user_prompt = payload.question.strip()
    return (system_prompt, user_prompt, module, course, grade_lines, mode)

def save_ai_conversation(db: Session, *, user_id: str, course_id: str | None, module_id: str | None, question: str, answer: str) -> None:
    db.add(AIConversation(student_id=user_id, course_id=course_id, module_id=module_id, prompt=question.strip(), response=answer.strip()))
    db.commit()

def _models_to_try() -> list[str]:
    models = [OLLAMA_MODEL]
    if DANILO_AI_FALLBACK_MODEL and DANILO_AI_FALLBACK_MODEL not in models:
        models.append(DANILO_AI_FALLBACK_MODEL)
    if DANILO_AI_OPTIONAL_MODEL and DANILO_AI_OPTIONAL_MODEL not in models:
        models.append(DANILO_AI_OPTIONAL_MODEL)
    return models

def _inference_attempts() -> list[tuple[str, int, str]]:
    attempts: list[tuple[str, int, str]] = []
    primary_gpu = OLLAMA_NUM_GPU
    for model_name in _models_to_try():
        if primary_gpu > 0 and model_name == OLLAMA_MODEL:
            attempts.append((model_name, primary_gpu, 'gpu'))
            attempts.append((model_name, 0, 'cpu-fallback'))
        else:
            attempts.append((model_name, 0 if model_name != OLLAMA_MODEL else primary_gpu, 'fallback'))
    deduped: list[tuple[str, int, str]] = []
    seen = set()
    for item in attempts:
        key = (item[0], item[1])
        if key not in seen:
            deduped.append(item)
            seen.add(key)
    return deduped

def _runtime_pressure() -> tuple[bool, str | None]:
    if not _psutil:
        return (False, None)
    try:
        vm = _psutil.virtual_memory()
        available_mb = vm.available / 1024 / 1024
        pressure_floor = max(512, min(2048, OLLAMA_NUM_CTX))
        if available_mb < pressure_floor:
            return (True, f'low-memory:{available_mb:.0f}MB')
        cpu_percent = _psutil.cpu_percent(interval=0.0)
        if cpu_percent >= 98 and _ai_queue_depth() >= _AI_MAX_CONCURRENT:
            return (True, f'cpu-saturated:{cpu_percent:.0f}%')
    except Exception:
        return (False, None)
    return (False, None)

async def _post_nonstream_inference(client: httpx.AsyncClient, system_prompt: str, prompt: str, mode: str, memory: list[dict] | None, model_name: str, gpu_layers: int) -> tuple[str, dict]:
    payload = ollama_chat_payload(system_prompt, prompt, mode, stream=False, memory=memory, model=model_name, gpu_layers=gpu_layers)
    response = await client.post(f'{OLLAMA_URL}/api/chat', json=payload)
    response.raise_for_status()
    body = response.json()
    return (body.get('message', {}).get('content', '').strip(), {'model': body.get('model', model_name), 'prompt_tokens': body.get('prompt_eval_count'), 'response_tokens': body.get('eval_count'), 'gpu_layers': gpu_layers})

async def ask_ollama(system_prompt: str, prompt: str, mode: str, memory: list[dict] | None=None) -> tuple[str, dict]:
    global _AI_TOTAL_REQUESTS
    cached = _cache_get(prompt, mode)
    if cached:
        ai_logger.info('AI cache hit runtime=%s mode=%s prompt_len=%s', DANILO_AI_RUNTIME, mode, len(prompt))
        return (cached, {'runtime': DANILO_AI_RUNTIME, 'model': DANILO_AI_ACTIVE_MODEL, 'mode': mode, 'duration_ms': 0, 'cache': True})
    _AI_TOTAL_REQUESTS += 1
    started = time.perf_counter()
    prompt_tokens = estimate_prompt_tokens(prompt)
    timeout = httpx.Timeout(AI_TIMEOUT_SECONDS, connect=5.0)
    pressured, pressure_reason = _runtime_pressure()
    if pressured:
        ai_logger.warning('AI request shed because runtime is under pressure reason=%s', pressure_reason)
        raise HTTPException(status_code=503, detail='DANILO is protecting system memory and CPU right now. Please try again shortly.')
    queue_depth = _ai_queue_depth()
    if queue_depth > 0:
        ai_logger.info('AI queue depth=%s user will wait for semaphore', queue_depth)
    sem = await _acquire_ai_slot()
    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            last_error: Exception | None = None
            result = ''
            raw_metrics = {}
            for model_name, gpu_layers, route in _inference_attempts():
                try:
                    from app.core.circuit_breaker import ollama_circuit_breaker
                    result, raw_metrics = await ollama_circuit_breaker.call(_post_nonstream_inference, client, system_prompt, prompt, mode, memory, model_name, gpu_layers)
                    break
                except Exception as exc:
                    last_error = exc
                    ai_logger.warning('AI model attempt failed runtime=%s model=%s route=%s gpu_layers=%s error=%s', DANILO_AI_RUNTIME, model_name, route, gpu_layers, exc)
            else:
                raise last_error or RuntimeError('No AI model returned a response')
    finally:
        sem.release()
    duration_ms = int((time.perf_counter() - started) * 1000)
    metrics = {'runtime': DANILO_AI_RUNTIME, 'model': raw_metrics.get('model', DANILO_AI_ACTIVE_MODEL), 'mode': tutor_mode(mode), 'duration_ms': duration_ms, 'prompt_tokens': raw_metrics.get('prompt_tokens') or prompt_tokens, 'response_tokens': raw_metrics.get('response_tokens'), 'gpu_layers': raw_metrics.get('gpu_layers', OLLAMA_NUM_GPU), 'scheduler': _AI_SCHEDULER}
    ai_logger.info('AI tutor completed runtime=%s model=%s mode=%s prompt_tokens=%s response_tokens=%s duration_ms=%s', metrics['runtime'], metrics['model'], metrics['mode'], metrics['prompt_tokens'], metrics['response_tokens'], metrics['duration_ms'])
    _record_ai_result(metrics)
    _cache_set(prompt, mode, result)
    return (result, metrics)

def build_student_insights_prompt(analysis: dict) -> str:
    struggling = analysis.get('strugglingStudents', [])[:8]
    weak_topics = analysis.get('classWeakTopics', [])[:6]
    lines = ['You are DANILO, an AI assistant for teachers.', '', 'Analyze the following student performance data.', '', 'Output:', '- List of students who are struggling', '- Weak topics', '- Short explanation', '- Suggested teacher actions', '', 'Keep it short and practical.', '', f"Class: {analysis.get('course', {}).get('title', 'Selected class')}", f"Stats: {json.dumps(analysis.get('stats', {}), ensure_ascii=True)}", 'Students:']
    for student in struggling:
        lines.append(f"- {student['studentName']}: {student['status']}, avg={student['averageScore']}, weak={student.get('weakestTopic')}, missing={student['missingSubmissionCount']}, low_scores={student['lowScoreCount']}, reason={student['explanation']}")
    if not struggling:
        lines.append('- No struggling students detected.')
    lines.append('Weak topics:')
    for topic in weak_topics:
        lines.append(f"- {topic['topic']}: avg={topic.get('averageScore')}, risks={topic.get('riskCount')}")
    return '\n'.join(lines)

def _semantic_stream_chunks(text_value: str) -> tuple[list[str], str]:
    chunks = []
    buffer = text_value
    while buffer:
        match = re.search('(.{30,}?[.!?]\\s+|.{80,}?[,;:]\\s+|.{140,}\\s+)', buffer, flags=re.S)
        if not match:
            break
        chunk = match.group(0)
        chunks.append(chunk)
        buffer = buffer[len(chunk):]
    return (chunks, buffer)

async def stream_ollama(system_prompt: str, prompt: str, mode: str, memory: list[dict] | None=None):
    global _AI_TOTAL_REQUESTS
    cached = _cache_get(prompt, mode)
    if cached:
        ai_logger.info('AI stream cache hit runtime=%s mode=%s prompt_len=%s', DANILO_AI_RUNTIME, mode, len(prompt))
        remainder = cached
        chunks, remainder = _semantic_stream_chunks(remainder)
        for chunk in chunks:
            yield {'content': chunk, 'done': False}
            await asyncio.sleep(0)
        if remainder:
            yield {'content': remainder, 'done': False}
        yield {'content': '', 'done': True, 'metrics': {'runtime': DANILO_AI_RUNTIME, 'model': DANILO_AI_ACTIVE_MODEL, 'mode': tutor_mode(mode), 'duration_ms': 0, 'cache': True}}
        return
    _AI_TOTAL_REQUESTS += 1
    started = time.perf_counter()
    prompt_tokens = estimate_prompt_tokens(prompt)
    timeout = httpx.Timeout(AI_TIMEOUT_SECONDS, connect=5.0)
    pressured, pressure_reason = _runtime_pressure()
    if pressured:
        ai_logger.warning('AI stream shed because runtime is under pressure reason=%s', pressure_reason)
        raise HTTPException(status_code=503, detail='DANILO is protecting system memory and CPU right now. Please try again shortly.')
    queue_depth = _ai_queue_depth()
    if queue_depth > 0:
        yield {'queued': True, 'position': queue_depth, 'done': False}
    else:
        yield {'thinking': True, 'message': 'Building lesson context and learning profile...', 'done': False}
    sem = await _acquire_ai_slot()
    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            last_error: Exception | None = None
            for model_name, gpu_layers, route in _inference_attempts():
                try:
                    full_parts: list[str] = []
                    pending = ''
                    payload = ollama_chat_payload(system_prompt, prompt, mode, stream=True, memory=memory, model=model_name, gpu_layers=gpu_layers)
                    async with client.stream('POST', f'{OLLAMA_URL}/api/chat', json=payload) as response:
                        response.raise_for_status()
                        async for line in response.aiter_lines():
                            if not line:
                                continue
                            try:
                                body = json.loads(line)
                            except json.JSONDecodeError:
                                ai_logger.warning('Ignoring malformed Ollama stream line model=%s line=%r', model_name, line[:160])
                                continue
                            delta = body.get('message', {}).get('content', '')
                            if delta:
                                full_parts.append(delta)
                                pending += delta
                                chunks, pending = _semantic_stream_chunks(pending)
                                for chunk in chunks:
                                    yield {'content': chunk, 'done': False}
                            if body.get('done'):
                                break
                    if pending:
                        yield {'content': pending, 'done': False}
                    duration_ms = int((time.perf_counter() - started) * 1000)
                    metrics = {'runtime': DANILO_AI_RUNTIME, 'model': model_name, 'mode': tutor_mode(mode), 'duration_ms': duration_ms, 'prompt_tokens': prompt_tokens, 'response_tokens': None, 'gpu_layers': gpu_layers, 'scheduler': _AI_SCHEDULER}
                    ai_logger.info('AI tutor streamed runtime=%s model=%s mode=%s prompt_tokens=%s duration_ms=%s', metrics['runtime'], metrics['model'], metrics['mode'], metrics['prompt_tokens'], metrics['duration_ms'])
                    full_response = ''.join(full_parts).strip()
                    if full_response:
                        _cache_set(prompt, mode, full_response)
                    _record_ai_result(metrics)
                    yield {'content': '', 'done': True, 'metrics': metrics}
                    return
                except Exception as exc:
                    last_error = exc
                    ai_logger.warning('AI stream model attempt failed runtime=%s model=%s route=%s gpu_layers=%s error=%s', DANILO_AI_RUNTIME, model_name, route, gpu_layers, exc)
            raise last_error or RuntimeError('No AI model returned a stream')
    finally:
        sem.release()

DASHBOARD_REGISTRY = {'admin': lambda db, u: build_admin_course_cards(db), 'teacher': lambda db, u: build_teacher_course_cards(db, u.id), 'student': lambda db, u: build_student_course_cards(db, u.id)}

import io


from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address, default_limits=["100/minute"])

from fastapi import UploadFile, File, Form

def _get_or_create_chat_session(db: Session, user_id: str, session_id: str | None, question: str) -> 'ChatSession':
    if session_id:
        session = db.scalar(select(ChatSession).where(ChatSession.id == session_id, ChatSession.user_id == user_id))
        if session:
            return session
    title = question[:60].strip() or 'New Conversation'
    session = ChatSession(user_id=user_id, title=title, is_active=True)
    db.add(session)
    db.flush()
    return session

def _save_chat_messages(db: Session, session_id: str, question: str, answer: str, module_id: str | None, response_mode: str) -> None:
    db.add(ChatMessage(session_id=session_id, role='user', content=question, module_id=module_id, response_mode=response_mode))
    db.add(ChatMessage(session_id=session_id, role='assistant', content=answer, module_id=module_id, response_mode=response_mode))
    db.execute(text('UPDATE chat_sessions SET updated_at = NOW() WHERE id = :sid'), {'sid': session_id})

def _check_ai_rate_limit(user_id: str) -> None:
    """Raise 429 if the user sent an AI request too recently. Also evicts stale entries."""
    _cleanup_stale_cooldowns()
    last = _AI_USER_LAST_REQUEST.get(user_id, 0.0)
    elapsed = time.monotonic() - last
    if elapsed < _AI_COOLDOWN_SECONDS:
        wait = round(_AI_COOLDOWN_SECONDS - elapsed, 1)
        raise HTTPException(status_code=429, detail=f'Please wait {wait}s before sending another question.')
    _AI_USER_LAST_REQUEST[user_id] = time.monotonic()

__all__ = [name for name in globals().keys() if not name.startswith('__')]
def _setup_routers(app: FastAPI):
    from app.api.v1.auth import router
    from app.api.v1.admin import admin_router
    from app.api.v1.teacher import teacher_router
    from app.api.v1.student import student_router
    from app.api.v1.ai import ai_router
    from app.api.v1.ai_files import ai_files_router
    from app.api.v1.classes import classes_router

    app.include_router(router)
    app.include_router(admin_router)
    app.include_router(teacher_router)
    app.include_router(student_router)
    app.include_router(ai_router)
    app.include_router(ai_files_router)
    app.include_router(classes_router)

_setup_routers(app)

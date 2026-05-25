import os
import time
import logging
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.exc import OperationalError

logger = logging.getLogger("danilo.db")

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL must be set by the installer-generated environment")

def _env_int(name: str, default: int, minimum: int = 0, maximum: int | None = None) -> int:
    raw = os.getenv(name)
    if raw is None or raw.strip().lower() in {"", "auto"}:
        value = default
    else:
        try:
            value = int(raw)
        except ValueError:
            logger.warning("Invalid integer env %s=%r; using %s", name, raw, default)
            value = default
    value = max(minimum, value)
    if maximum is not None:
        value = min(maximum, value)
    return value


cpu_count = os.cpu_count() or 2
pool_size = _env_int("DANILO_DB_POOL_SIZE", max(3, min(cpu_count, 8)), minimum=1, maximum=20)
max_overflow = _env_int("DANILO_DB_MAX_OVERFLOW", max(4, pool_size), minimum=0, maximum=30)

# PostgreSQL engine with connection pooling and health checks
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_size=pool_size,
    max_overflow=max_overflow,
    pool_timeout=30,
    pool_recycle=1800,
    connect_args={"connect_timeout": 15}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def wait_for_database(max_retries=None, delay=None):
    max_retries = int(os.getenv("DANILO_DB_MAX_RETRIES", str(max_retries or 120)))
    delay = float(os.getenv("DANILO_DB_RETRY_DELAY_SECONDS", str(delay or 3)))
    for attempt in range(1, max_retries + 1):
        try:
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
                logger.info("Database connection established after %d attempts", attempt)
                return True
        except OperationalError as exc:
            if attempt >= max_retries:
                logger.error("Database connection failed after %d attempts", max_retries)
                raise
            wait_seconds = min(delay * attempt, 15)
            logger.warning(
                "Database not ready (attempt %d/%d): %s; retrying in %.1fs",
                attempt,
                max_retries,
                exc,
                wait_seconds,
            )
            time.sleep(wait_seconds)
    return False


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

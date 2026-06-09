FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app
COPY alembic ./alembic
COPY alembic.ini ./alembic.ini

EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=25s --retries=3 --start-period=180s \
  CMD python -c "import os, urllib.request; urllib.request.urlopen('http://127.0.0.1:%s/api/health' % os.getenv('BACKEND_PORT', '8000'), timeout=20)" || exit 1
CMD uvicorn app.main:app --host 0.0.0.0 --port ${BACKEND_PORT:-8000}

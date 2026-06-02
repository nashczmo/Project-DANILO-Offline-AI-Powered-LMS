# Project DANILO installer module: backend.sh

write_backend_files() {
  mkdir -p "${APP_ROOT}" "${CONTENT_ROOT}"
  cp -r "${DANILO_INSTALLER_DIR}/backend" "${APP_ROOT}/"
}

validate_backend_files() {
  local compiler="python3"

  validate_generated_file "${APP_ROOT}/backend/requirements.txt" "backend requirements file"
  validate_generated_file "${APP_ROOT}/backend/Dockerfile" "backend Dockerfile"
  validate_generated_file "${APP_ROOT}/backend/alembic.ini" "Alembic config"
  validate_generated_file "${APP_ROOT}/backend/alembic/env.py" "Alembic env"
  validate_generated_file "${APP_ROOT}/backend/alembic/versions/0001_initial_schema.py" "Alembic initial migration"
  validate_generated_file "${APP_ROOT}/backend/app/__init__.py" "backend package marker"
  validate_generated_file "${APP_ROOT}/backend/app/main.py" "backend main API file"
  validate_generated_file "${APP_ROOT}/backend/app/database.py" "backend database file"
  validate_generated_file "${APP_ROOT}/backend/app/models.py" "backend models file"
  validate_generated_file "${APP_ROOT}/backend/app/core/security.py" "backend security file"
  validate_generated_file "${APP_ROOT}/backend/app/schemas.py" "backend schemas file"
  validate_generated_file "${APP_ROOT}/backend/app/seed.py" "backend seed file"
  validate_generated_file "${APP_ROOT}/backend/app/api/v1/auth.py" "backend auth router"
  validate_generated_file "${APP_ROOT}/backend/app/api/v1/admin.py" "backend admin router"
  validate_generated_file "${APP_ROOT}/backend/app/api/v1/student.py" "backend student router"
  validate_generated_file "${APP_ROOT}/backend/app/api/v1/teacher.py" "backend teacher router"
  validate_generated_file "${APP_ROOT}/backend/app/api/v1/ai.py" "backend ai router"
  validate_generated_file "${APP_ROOT}/backend/app/api/v1/classes.py" "backend classes router"


  if ! command -v "${compiler}" >/dev/null 2>&1 && command -v python3.12 >/dev/null 2>&1; then
    compiler="python3.12"
  fi

  if command -v "${compiler}" >/dev/null 2>&1; then
    run_step_command "Compiling generated backend Python files" "${compiler}" -m py_compile \
      "${APP_ROOT}/backend/app/__init__.py" \
      "${APP_ROOT}/backend/app/database.py" \
      "${APP_ROOT}/backend/app/models.py" \
      "${APP_ROOT}/backend/app/core/security.py" \
      "${APP_ROOT}/backend/app/schemas.py" \
      "${APP_ROOT}/backend/app/seed.py" \
      "${APP_ROOT}/backend/app/main.py"
  else
    skip "Python compiler not available yet; skipping backend syntax validation"
  fi
}

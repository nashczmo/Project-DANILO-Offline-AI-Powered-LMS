# Project DANILO installer module: sync.sh

sync_lessons_content() {
  if [[ ! -d "${LOCAL_LESSONS_DIR}" ]]; then
    note "Local lessons folder not found: ${LOCAL_LESSONS_DIR}"
    note "Skipping lesson sync. The portal will continue with no lesson content."
    mkdir -p "${CONTENT_ROOT}"
    return 0
  fi

  mkdir -p "${CONTENT_ROOT}"
  note "Syncing lesson files into ${CONTENT_ROOT}"

  if command -v rsync >/dev/null 2>&1; then
    rsync -a --delete "${LOCAL_LESSONS_DIR}/" "${CONTENT_ROOT}/"
    return 0
  fi

  note "rsync not available; falling back to a full content refresh"
  find "${CONTENT_ROOT}" -mindepth 1 -maxdepth 1 -exec rm -rf -- {} +
  cp -a "${LOCAL_LESSONS_DIR}/." "${CONTENT_ROOT}/"
}

restart_gateway_container() {
  if [[ ! -f "${APP_ROOT}/docker-compose.yml" ]]; then
    echo "Project DANILO is not installed yet. Expected compose file at ${APP_ROOT}/docker-compose.yml"
    exit 1
  fi

  run_step_command "Ensuring Docker is running for gateway refresh" systemctl enable --now docker
  note "Refreshing the gateway container"
  if ! run_step_command "Restarting DANILO gateway container" docker compose -f "${APP_ROOT}/docker-compose.yml" -p "${STACK_NAME}" restart gateway; then
    run_step_command "Starting DANILO gateway container without rebuilding dependencies" docker compose -f "${APP_ROOT}/docker-compose.yml" -p "${STACK_NAME}" up -d --no-deps gateway
  fi
}

run_sync_mode() {
  printf '\n[SYNC MODE] Updating offline lesson content and refreshing the DANILO gateway\n'
  sync_lessons_content
  restart_gateway_container
  if [[ ! -d "${LOCAL_LESSONS_DIR}" ]]; then
    cat <<EOF

${BOLD}Lesson sync skipped.${RESET}
${BOLD}Reason:${RESET} No local lessons folder was found at ${LOCAL_LESSONS_DIR}
${BOLD}Portal URL:${RESET} http://${PORTAL_DOMAIN}
EOF
    return 0
  fi
  cat <<EOF

${BOLD}Lesson sync complete.${RESET}
${BOLD}Updated source:${RESET} ${LOCAL_LESSONS_DIR}
${BOLD}Deployed to:${RESET} ${CONTENT_ROOT}
${BOLD}Portal URL:${RESET} http://${PORTAL_DOMAIN}
EOF
}


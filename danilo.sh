#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
LIB_DIR="${SCRIPT_DIR}/lib"
export DANILO_INSTALLER_DIR="${SCRIPT_DIR}"

source "${LIB_DIR}/common.sh"
source "${LIB_DIR}/logging.sh"
source "${LIB_DIR}/cleanup.sh"
source "${LIB_DIR}/preflight.sh"
source "${LIB_DIR}/docker.sh"
source "${LIB_DIR}/network.sh"
source "${LIB_DIR}/wifi.sh"
source "${LIB_DIR}/database.sh"
source "${LIB_DIR}/backend.sh"
source "${LIB_DIR}/frontend.sh"
source "${LIB_DIR}/ai.sh"
source "${LIB_DIR}/services.sh"
source "${LIB_DIR}/sync.sh"
source "${LIB_DIR}/verify.sh"

show_help() {
  cat <<EOF
Usage: sudo bash danilo.sh [mode] [--clean-build]

Modes:
  --install            Install or repair Project DANILO. This is the default.
  --clean-install      Reinstall with DANILO data volumes reset and Docker cache bypassed.
  --update             Regenerate app files, rebuild images, and restart the stack without resetting data.
  --rebuild-frontend   Regenerate and rebuild only the frontend/gateway image, then restart gateway.
  --sync               Mirror local lessons into ${CONTENT_ROOT} and restart gateway when available.
  --verify             Run post-install health checks.
  --uninstall          Stop DANILO services and remove generated system/app files. Data volumes are kept unless DANILO_RESET_DATA=1.
  --help               Show this help.

Options:
  --clean-build        Build Docker images without cache. Preserved for compatibility.

Environment:
  DANILO_RESET_DATA=1  Remove compose volumes during clean/uninstall paths.
EOF
}

parse_args() {
  local mode_set=0
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --install)
        INSTALL_MODE="install"
        mode_set=1
        ;;
      --clean-install)
        INSTALL_MODE="clean-install"
        CLEAN_BUILD=1
        RESET_DATA=1
        mode_set=1
        ;;
      --update)
        INSTALL_MODE="update"
        mode_set=1
        ;;
      --rebuild-frontend)
        INSTALL_MODE="rebuild-frontend"
        mode_set=1
        ;;
      --sync)
        INSTALL_MODE="sync"
        SYNC_ONLY=1
        mode_set=1
        ;;
      --verify)
        INSTALL_MODE="verify"
        mode_set=1
        ;;
      --uninstall)
        INSTALL_MODE="uninstall"
        mode_set=1
        ;;
      --clean-build)
        CLEAN_BUILD=1
        ;;
      -h|--help)
        show_help
        exit 0
        ;;
      *)
        echo "Unknown argument: $1"
        show_help
        exit 1
        ;;
    esac
    shift
  done

  if [[ "${mode_set}" -eq 0 ]]; then
    INSTALL_MODE="install"
  fi
}

run_full_install() {
  print_install_intro

  step 1 8 "Pre-flight checks"
  run_logged_function "preflight_checks" preflight_checks
  run_logged_function "prepare_apt" prepare_apt

  step 2 8 "Dependency installation"
  run_logged_function "install_docker" install_docker
  run_logged_function "install_node" install_node
  install_logrotate_config
  run_logged_function "deep_clean" deep_clean
  run_logged_function "clear_port_53_and_restore_upstream_dns" clear_port_53_and_restore_upstream_dns
  run_logged_function "prepare_wifi_hardware" prepare_wifi_hardware

  step 3 8 "Docker setup"
  mkdir -p "${APP_ROOT}"
  note "Docker Compose files will be generated after environment validation"

  step 4 8 "Database setup"
  mkdir -p "${APP_ROOT}" "${CONTENT_ROOT}"
  secure_project_root
  configure_ollama_model
  generate_secrets
  validate_runtime_environment
  write_env_file

  step 5 8 "Admin account setup"
  run_logged_function "write_backend_files" write_backend_files
  validate_backend_files
  run_logged_function "write_project_docs" write_project_docs
  validate_project_docs

  step 6 8 "Frontend build"
  run_logged_function "write_frontend_files" write_frontend_files
  validate_frontend_files
  run_logged_function "clear_frontend_build_cache" clear_frontend_build_cache
  run_logged_function "build_frontend_static" build_frontend_static
  run_logged_function "write_gateway_files" write_gateway_files
  validate_gateway_files
  run_logged_function "write_compose_file" write_compose_file
  run_logged_function "secure_project_root" secure_project_root
  run_logged_function "build_stack" build_stack

  step 7 8 "Backend startup"
  run_logged_function "configure_access_point" configure_access_point
  bring_up_offline_stack

  step 8 8 "Final access summary"
  run_logged_function "finalize_success" finalize_success
}

run_update_mode() {
  print_install_intro
  step 1 5 "Pre-flight checks"
  run_logged_function "preflight_checks" preflight_checks
  run_logged_function "prepare_apt" prepare_apt
  run_logged_function "install_docker" install_docker
  run_logged_function "install_node" install_node

  step 2 5 "Runtime configuration"
  mkdir -p "${APP_ROOT}" "${CONTENT_ROOT}"
  secure_project_root
  configure_ollama_model
  generate_secrets
  validate_runtime_environment
  write_env_file

  step 3 5 "Application files"
  run_logged_function "write_backend_files" write_backend_files
  validate_backend_files
  run_logged_function "write_frontend_files" write_frontend_files
  validate_frontend_files
  run_logged_function "clear_frontend_build_cache" clear_frontend_build_cache
  run_logged_function "build_frontend_static" build_frontend_static
  run_logged_function "write_gateway_files" write_gateway_files
  validate_gateway_files
  run_logged_function "write_compose_file" write_compose_file
  run_logged_function "secure_project_root" secure_project_root

  step 4 5 "Rebuild and restart"
  run_logged_function "build_stack" build_stack
  run_step_command "Restarting DANILO application stack" systemctl restart danilo-stack.service
  run_logged_function "wait_for_stack_readiness" wait_for_stack_readiness

  step 5 5 "Verification"
  run_logged_function "verify_mode" verify_mode
  finalize_success
}

run_rebuild_frontend_mode() {
  print_install_intro
  step 1 4 "Pre-flight checks"
  require_command docker
  require_command curl
  require_command npm

  step 2 4 "Frontend generation"
  mkdir -p "${APP_ROOT}"
  run_logged_function "write_frontend_files" write_frontend_files
  validate_frontend_files
  run_logged_function "clear_frontend_build_cache" clear_frontend_build_cache
  run_logged_function "build_frontend_static" build_frontend_static
  run_logged_function "write_gateway_files" write_gateway_files
  validate_gateway_files
  run_logged_function "write_compose_file" write_compose_file
  run_logged_function "secure_project_root" secure_project_root

  step 3 4 "Frontend rebuild"
  local build_args=()
  if [[ "${CLEAN_BUILD}" -eq 1 ]]; then
    build_args+=(--no-cache)
  fi
  run_step_command "Rebuilding DANILO gateway frontend image" docker compose -f "${APP_ROOT}/docker-compose.yml" -p "${STACK_NAME}" build "${build_args[@]}" gateway
  run_step_command "Restarting DANILO gateway with rebuilt static assets" docker compose -f "${APP_ROOT}/docker-compose.yml" -p "${STACK_NAME}" up -d --force-recreate --no-deps gateway

  step 4 4 "Verification"
  verify_command "Frontend reachable" curl -fsS -H "Host: ${PORTAL_DOMAIN}" "http://127.0.0.1/"
  verify_frontend_dist
  verify_frontend_html "Frontend static bundle reachable" "http://127.0.0.1/"
  verify_frontend_served_build_marker
  if [[ "${VERIFY_FAILED}" -ne 0 ]]; then
    fail "Frontend rebuild completed, but verification failed"
    return 1
  fi
  ok "Frontend rebuild completed"
  INSTALL_SUCCEEDED=1
  trap - ERR
}

run_uninstall_mode() {
  print_install_intro
  step 1 2 "Stopping services"
  run_logged_function "deep_clean" deep_clean

  step 2 2 "Removing generated application files"
  if [[ "${PROJECT_ROOT}" == /opt/danilo ]]; then
    rm -rf "${PROJECT_ROOT}"
    ok "Removed ${PROJECT_ROOT}"
  else
    warn "PROJECT_ROOT is not /opt/danilo; leaving ${PROJECT_ROOT} in place"
  fi
  INSTALL_SUCCEEDED=1
  trap - ERR
  ok "Project DANILO uninstall completed"
}

main() {
  parse_args "$@"
  init_logging
  require_root
  trap 'on_error $? ${LINENO} "$BASH_COMMAND"' ERR
  run_step_command "Validating installer Bash syntax" bash -n "$0"
  for module in "${LIB_DIR}"/*.sh; do
    run_step_command "Validating module Bash syntax: $(basename "${module}")" bash -n "${module}"
  done

  case "${INSTALL_MODE}" in
    install|clean-install)
      run_full_install
      ;;
    update)
      run_update_mode
      ;;
    rebuild-frontend)
      run_rebuild_frontend_mode
      ;;
    sync)
      run_sync_mode
      ;;
    verify)
      verify_mode
      ;;
    uninstall)
      run_uninstall_mode
      ;;
    *)
      echo "Unknown install mode: ${INSTALL_MODE}"
      exit 1
      ;;
  esac
}

main "$@"

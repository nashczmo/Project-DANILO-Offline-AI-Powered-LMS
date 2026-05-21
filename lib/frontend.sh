# Project DANILO installer module: frontend.sh

write_frontend_files() {
  mkdir -p "${APP_ROOT}/frontend" "${APP_ROOT}/frontend/public/fonts"

  note "Installing DANILO frontend source files"

  local src_dir="${SCRIPT_DIR}/frontend"

  if [[ ! -d "${src_dir}" ]]; then
    echo "Frontend source directory not found: ${src_dir}"
    exit 1
  fi

  rm -rf "${APP_ROOT}/frontend/src" "${APP_ROOT}/frontend/public"
  cp -r "${src_dir}/package.json" "${APP_ROOT}/frontend/package.json"
  cp -r "${src_dir}/vite.config.js" "${APP_ROOT}/frontend/vite.config.js"
  cp -r "${src_dir}/postcss.config.js" "${APP_ROOT}/frontend/postcss.config.js"
  cp -r "${src_dir}/tailwind.config.js" "${APP_ROOT}/frontend/tailwind.config.js"
  cp -r "${src_dir}/index.html" "${APP_ROOT}/frontend/index.html"
  cp -r "${src_dir}/src" "${APP_ROOT}/frontend/src"
  cp -r "${src_dir}/public" "${APP_ROOT}/frontend/public"

  local font_dir="${APP_ROOT}/frontend/public/fonts"
  local source_font_dir="${SCRIPT_DIR}/assets/fonts"
  local nunito_files="Nunito-Regular.woff2 Nunito-Medium.woff2 Nunito-SemiBold.woff2 Nunito-Bold.woff2 Nunito-ExtraBold.woff2"
  local missing_fonts=()
  local font_file=""

  for font_file in ${nunito_files}; do
    if [[ -f "${source_font_dir}/${font_file}" ]]; then
      install -m 0644 "${source_font_dir}/${font_file}" "${font_dir}/${font_file}"
    else
      missing_fonts+=("${font_file}")
    fi
  done

  if (( ${#missing_fonts[@]} > 0 )); then
    printf 'Missing bundled Nunito font files: %s\n' "${missing_fonts[*]}"
    printf 'Expected local font directory: %s\n' "${source_font_dir}"
    exit 1
  fi
}

# =============================================================================

validate_frontend_files() {
  validate_generated_file "${APP_ROOT}/frontend/package.json" "frontend package.json"
  validate_generated_file "${APP_ROOT}/frontend/index.html" "frontend index.html"
  validate_generated_file "${APP_ROOT}/frontend/vite.config.js" "frontend Vite config"
  validate_generated_file "${APP_ROOT}/frontend/tailwind.config.js" "frontend Tailwind config"
  validate_generated_file "${APP_ROOT}/frontend/postcss.config.js" "frontend PostCSS config"
  validate_generated_file "${APP_ROOT}/frontend/public/manifest.webmanifest" "frontend web manifest"
  validate_generated_file "${APP_ROOT}/frontend/src/App.jsx" "frontend App.jsx"
  validate_generated_file "${APP_ROOT}/frontend/src/main.jsx" "frontend main.jsx"
  validate_generated_file "${APP_ROOT}/frontend/src/index.css" "frontend design system CSS"
  validate_generated_file "${APP_ROOT}/frontend/src/api.js" "frontend API client"

  # Auth components
  validate_generated_file "${APP_ROOT}/frontend/src/components/auth/LoginView.jsx" "frontend login view"
  validate_generated_file "${APP_ROOT}/frontend/src/components/auth/ProtectedRoute.jsx" "frontend protected route"

  # UI components
  validate_generated_file "${APP_ROOT}/frontend/src/components/ui/index.jsx" "frontend UI package"

  # Admin Portal components
  validate_generated_file "${APP_ROOT}/frontend/src/portals/admin/AdminDashboard.jsx" "frontend admin dashboard"
  validate_generated_file "${APP_ROOT}/frontend/src/portals/admin/AdminDirectory.jsx" "frontend admin directory"
  validate_generated_file "${APP_ROOT}/frontend/src/portals/admin/AdminEnrollments.jsx" "frontend admin enrollments"
  validate_generated_file "${APP_ROOT}/frontend/src/portals/admin/AdminLayout.jsx" "frontend admin layout"
  validate_generated_file "${APP_ROOT}/frontend/src/portals/admin/AdminPortal.jsx" "frontend admin portal"
  validate_generated_file "${APP_ROOT}/frontend/src/portals/admin/AdminReports.jsx" "frontend admin reports"
  validate_generated_file "${APP_ROOT}/frontend/src/portals/admin/AdminSystem.jsx" "frontend admin system"

  # Student Portal components
  validate_generated_file "${APP_ROOT}/frontend/src/portals/student/StudentClasses.jsx" "frontend student classes"
  validate_generated_file "${APP_ROOT}/frontend/src/portals/student/StudentDashboard.jsx" "frontend student dashboard"
  validate_generated_file "${APP_ROOT}/frontend/src/portals/student/StudentGrades.jsx" "frontend student grades"
  validate_generated_file "${APP_ROOT}/frontend/src/portals/student/StudentLayout.jsx" "frontend student layout"
  validate_generated_file "${APP_ROOT}/frontend/src/portals/student/StudentPortal.jsx" "frontend student portal"
  validate_generated_file "${APP_ROOT}/frontend/src/portals/student/StudentTutor.jsx" "frontend student tutor"

  # Teacher Portal components
  validate_generated_file "${APP_ROOT}/frontend/src/portals/teacher/TeacherAnnouncements.jsx" "frontend teacher announcements"
  validate_generated_file "${APP_ROOT}/frontend/src/portals/teacher/TeacherClasses.jsx" "frontend teacher classes"
  validate_generated_file "${APP_ROOT}/frontend/src/portals/teacher/TeacherDashboard.jsx" "frontend teacher dashboard"
  validate_generated_file "${APP_ROOT}/frontend/src/portals/teacher/TeacherGrades.jsx" "frontend teacher grades"
  validate_generated_file "${APP_ROOT}/frontend/src/portals/teacher/TeacherLayout.jsx" "frontend teacher layout"
  validate_generated_file "${APP_ROOT}/frontend/src/portals/teacher/TeacherPortal.jsx" "frontend teacher portal"

  # Common infrastructure
  validate_generated_file "${APP_ROOT}/frontend/src/hooks/usePath.js" "frontend path hook"
  validate_generated_file "${APP_ROOT}/frontend/src/lib/utils.js" "frontend utilities"
  validate_generated_file "${APP_ROOT}/frontend/src/store/useAppStore.js" "frontend app store"
}

validate_frontend_dist() {
  local index_file="${APP_ROOT}/frontend/dist/index.html"
  local build_marker="${APP_ROOT}/frontend/dist/danilo-build.txt"
  local service_worker="${APP_ROOT}/frontend/dist/sw.js"
  local font_file=""
  validate_generated_file "${index_file}" "frontend built index.html"
  validate_generated_file "${build_marker}" "frontend build marker"
  validate_generated_file "${service_worker}" "frontend service worker"
  if [[ ! -d "${APP_ROOT}/frontend/dist/assets" ]]; then
    echo "Frontend build assets folder is missing: ${APP_ROOT}/frontend/dist/assets"
    return 1
  fi
  if ! find "${APP_ROOT}/frontend/dist/assets" -type f | grep -q .; then
    echo "Frontend build assets folder is empty: ${APP_ROOT}/frontend/dist/assets"
    return 1
  fi

  if grep -q '/src/main.jsx' "${index_file}"; then
    echo "Frontend index.html still points at the Vite dev entrypoint instead of built assets."
    return 1
  fi

  if ! grep -Eq 'src="/assets/[^"]+\.js"' "${index_file}"; then
    echo "Frontend index.html does not reference a built JavaScript bundle in /assets."
    return 1
  fi

  if ! grep -Eq 'href="/assets/[^"]+\.css"' "${index_file}"; then
    echo "Frontend index.html does not reference a built CSS bundle in /assets."
    return 1
  fi

  if ! find "${APP_ROOT}/frontend/dist/assets" -type f -name '*.js' | grep -q .; then
    echo "Frontend build assets folder does not contain a JavaScript bundle."
    return 1
  fi

  if ! find "${APP_ROOT}/frontend/dist/assets" -type f -name '*.css' | grep -q .; then
    echo "Frontend build assets folder does not contain a CSS bundle."
    return 1
  fi

  for font_file in Nunito-Regular.woff2 Nunito-Medium.woff2 Nunito-SemiBold.woff2 Nunito-Bold.woff2 Nunito-ExtraBold.woff2; do
    if [[ ! -s "${APP_ROOT}/frontend/dist/fonts/${font_file}" ]]; then
      echo "Frontend dist is missing bundled Nunito font: ${font_file}"
      return 1
    fi
  done

  if ! grep -Fq '"/fonts/Nunito-Regular.woff2"' "${service_worker}"; then
    echo "Frontend service worker does not precache Nunito fonts."
    return 1
  fi

  if ! grep -Fq '["/icons/", "/assets/", "/fonts/"]' "${service_worker}"; then
    echo "Frontend service worker does not serve cached font requests while offline."
    return 1
  fi

  ok "Validated frontend static build assets"
}

build_frontend_static() {
  require_command npm
  validate_frontend_files
  mkdir -p "${APP_ROOT}/frontend/public"
  printf 'danilo-frontend-build=%s\n' "$(date -u +%Y%m%dT%H%M%SZ)" > "${APP_ROOT}/frontend/public/danilo-build.txt"
  run_step_command "Installing DANILO frontend dependencies" npm --prefix "${APP_ROOT}/frontend" install --no-audit --no-fund
  run_step_command "Building DANILO frontend static assets" npm --prefix "${APP_ROOT}/frontend" run build
  run_step_command "Setting readable permissions for gateway-served frontend assets" chmod -R a+rX "${APP_ROOT}/frontend/dist"
  run_step_command "Setting local Nunito font permissions" chmod -R a+rX "${APP_ROOT}/frontend/public/fonts"
  validate_frontend_dist
}

clear_frontend_build_cache() {
  note "Removing old frontend dist, Vite cache, and previously served gateway assets"
  rm -rf "${APP_ROOT}/frontend/dist"
  rm -rf "${APP_ROOT}/frontend/node_modules/.vite"
  rm -rf "${APP_ROOT}/frontend/.vite"
  rm -rf "${APP_ROOT}/gateway/dist"
  ok "Old frontend build artifacts and local cache were removed"
}

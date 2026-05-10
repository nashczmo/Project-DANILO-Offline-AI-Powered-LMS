# Project DANILO installer module: frontend.sh

write_frontend_files() {
  mkdir -p "${APP_ROOT}/frontend/src/components" "${APP_ROOT}/frontend/public/icons" "${APP_ROOT}/frontend/public/fonts"

  note "Installing DANILO frontend source files"

  local src_dir="${SCRIPT_DIR}/frontend"

  if [[ ! -d "${src_dir}" ]]; then
    echo "Frontend source directory not found: ${src_dir}"
    exit 1
  fi

  # Copy all tracked frontend source files
  cp -r "${src_dir}/package.json" "${APP_ROOT}/frontend/package.json"
  cp -r "${src_dir}/vite.config.js" "${APP_ROOT}/frontend/vite.config.js"
  cp -r "${src_dir}/postcss.config.js" "${APP_ROOT}/frontend/postcss.config.js"
  cp -r "${src_dir}/tailwind.config.js" "${APP_ROOT}/frontend/tailwind.config.js"
  cp -r "${src_dir}/index.html" "${APP_ROOT}/frontend/index.html"

  cp -r "${src_dir}/public/manifest.webmanifest" "${APP_ROOT}/frontend/public/manifest.webmanifest"
  cp -r "${src_dir}/public/offline.html" "${APP_ROOT}/frontend/public/offline.html"
  cp -r "${src_dir}/public/sw.js" "${APP_ROOT}/frontend/public/sw.js"

  cp -r "${src_dir}/src/main.jsx" "${APP_ROOT}/frontend/src/main.jsx"
  cp -r "${src_dir}/src/index.css" "${APP_ROOT}/frontend/src/index.css"
  cp -r "${src_dir}/src/api.js" "${APP_ROOT}/frontend/src/api.js"
  cp -r "${src_dir}/src/App.jsx" "${APP_ROOT}/frontend/src/App.jsx"
  cp -r "${src_dir}/src/components/shared.jsx" "${APP_ROOT}/frontend/src/components/shared.jsx"
  cp -r "${src_dir}/src/components/LoginView.jsx" "${APP_ROOT}/frontend/src/components/LoginView.jsx"
  cp -r "${src_dir}/src/components/InstallBanner.jsx" "${APP_ROOT}/frontend/src/components/InstallBanner.jsx"
  cp -r "${src_dir}/src/components/StreamView.jsx" "${APP_ROOT}/frontend/src/components/StreamView.jsx"
  cp -r "${src_dir}/src/components/ContentView.jsx" "${APP_ROOT}/frontend/src/components/ContentView.jsx"
  cp -r "${src_dir}/src/components/GradesView.jsx" "${APP_ROOT}/frontend/src/components/GradesView.jsx"
  cp -r "${src_dir}/src/components/TutorView.jsx" "${APP_ROOT}/frontend/src/components/TutorView.jsx"
  cp -r "${src_dir}/src/components/AdminPages.jsx" "${APP_ROOT}/frontend/src/components/AdminPages.jsx"

  local font_dir="${APP_ROOT}/frontend/public/fonts"
  local source_font_dir="${SCRIPT_DIR}/assets/fonts"
  local inter_files="Inter-Regular.woff2 Inter-Medium.woff2 Inter-SemiBold.woff2 Inter-Bold.woff2"
  local missing_fonts=()
  local font_file=""

  for font_file in ${inter_files}; do
    if [[ -f "${source_font_dir}/${font_file}" ]]; then
      install -m 0644 "${source_font_dir}/${font_file}" "${font_dir}/${font_file}"
    else
      missing_fonts+=("${font_file}")
    fi
  done

  if (( ${#missing_fonts[@]} > 0 )); then
    printf 'Missing bundled Inter font files: %s\n' "${missing_fonts[*]}"
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
  validate_generated_file "${APP_ROOT}/frontend/src/components/shared.jsx" "frontend shared components"
  validate_generated_file "${APP_ROOT}/frontend/src/components/AdminPages.jsx" "frontend admin pages"
  validate_generated_file "${APP_ROOT}/frontend/src/components/LoginView.jsx" "frontend login view"
  validate_generated_file "${APP_ROOT}/frontend/src/components/InstallBanner.jsx" "frontend install banner"
  validate_generated_file "${APP_ROOT}/frontend/src/components/StreamView.jsx" "frontend stream view"
  validate_generated_file "${APP_ROOT}/frontend/src/components/ContentView.jsx" "frontend content view"
  validate_generated_file "${APP_ROOT}/frontend/src/components/GradesView.jsx" "frontend grades view"
  validate_generated_file "${APP_ROOT}/frontend/src/components/TutorView.jsx" "frontend tutor view"
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

  for font_file in Inter-Regular.woff2 Inter-Medium.woff2 Inter-SemiBold.woff2 Inter-Bold.woff2; do
    if [[ ! -s "${APP_ROOT}/frontend/dist/fonts/${font_file}" ]]; then
      echo "Frontend dist is missing bundled Inter font: ${font_file}"
      return 1
    fi
  done

  if ! grep -Fq '"/fonts/Inter-Regular.woff2"' "${service_worker}"; then
    echo "Frontend service worker does not precache Inter fonts."
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
  run_step_command "Setting local Inter font permissions" chmod -R a+rX "${APP_ROOT}/frontend/public/fonts"
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

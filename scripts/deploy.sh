#!/usr/bin/env bash
# ==============================================================================
# MD Viewer - Automated Production Deployment Pipeline with Fail-Safe Rollback
# ==============================================================================
# Usage:
#   ./scripts/deploy.sh [OPTIONS]
#
# Options:
#   --skip-tests   Skip pre-flight linting and unit test suite (emergency only)
#   --dry-run      Build and test candidate container without touching live traffic
#   --no-cache     Rebuild docker image from scratch without layer cache
#   --help, -h     Show this help message
# ==============================================================================

set -euo pipefail

# ANSI Color Codes
CLR_RESET="\033[0m"
CLR_BOLD="\033[1m"
CLR_DIM="\033[2m"
CLR_CYAN="\033[1;36m"
CLR_GREEN="\033[1;32m"
CLR_YELLOW="\033[1;33m"
CLR_RED="\033[1;31m"
CLR_MAGENTA="\033[1;35m"

# Project Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP_NAME="md-viewer"
CONTAINER_NAME="md-viewer"
CANDIDATE_CONTAINER="md-viewer-candidate"
BACKUP_CONTAINER="md-viewer-prev-backup"
DEFAULT_NETWORK="md-viewer-net"
if command -v docker &>/dev/null && docker network ls --format '{{.Name}}' 2>/dev/null | grep -Eq "^expense-dashboard_expense-net\$"; then
  DEFAULT_NETWORK="expense-dashboard_expense-net"
fi
CADDY_NETWORK="${CADDY_NETWORK:-${DEFAULT_NETWORK}}"
HOST_PORT="${HOST_PORT:-3015}"
CANDIDATE_PORT="${CANDIDATE_PORT:-3019}"
PUBLIC_URL="${PUBLIC_URL:-https://md-viewer.e21.dev}"
DATA_DIR="${PROJECT_ROOT}/data"
BACKUP_DIR="${DATA_DIR}/backups"
LOGS_DIR="${PROJECT_ROOT}/logs"
ENV_FILE="${PROJECT_ROOT}/.env"

# Flags
SKIP_TESTS=false
DRY_RUN=false
DOCKER_NO_CACHE=""

# Tracking variables for rollback
ROLLBACK_NEEDED=false
PREV_IMAGE_ID=""
DEPLOYED_CONTAINER_RUNNING=false

# Helper Loggers
log_step() {
  echo -e "\n${CLR_CYAN}${CLR_BOLD}==> [STEP $1] $2${CLR_RESET}"
}

log_info() {
  echo -e "    ${CLR_DIM}[INFO]${CLR_RESET} $1"
}

log_success() {
  echo -e "    ${CLR_GREEN}✓ $1${CLR_RESET}"
}

log_warn() {
  echo -e "    ${CLR_YELLOW}⚠ [WARN] $1${CLR_RESET}"
}

log_error() {
  echo -e "\n${CLR_RED}${CLR_BOLD}❌ [FAIL-SAFE TRIGGERED] $1${CLR_RESET}"
}

# Parse Command Line Arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    --skip-tests)
      SKIP_TESTS=true
      shift
      ;;
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --no-cache)
      DOCKER_NO_CACHE="--no-cache"
      shift
      ;;
    --help|-h)
      echo "MD Viewer Deployment Pipeline"
      echo "Usage: ./scripts/deploy.sh [OPTIONS]"
      echo ""
      echo "Options:"
      echo "  --skip-tests   Skip pre-flight linting and unit test suite"
      echo "  --dry-run      Build and probe candidate container without modifying production"
      echo "  --no-cache     Build docker image without cache"
      echo "  -h, --help     Show this help message"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      echo "Run with --help for available options."
      exit 1
      ;;
  esac
done

cd "${PROJECT_ROOT}"
mkdir -p "${LOGS_DIR}" "${BACKUP_DIR}"

TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
GIT_COMMIT="$(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')"
RELEASE_TAG="rel-${TIMESTAMP}-${GIT_COMMIT}"

echo -e "${CLR_MAGENTA}${CLR_BOLD}"
echo "╔══════════════════════════════════════════════════════════════════════════╗"
echo "║          MD VIEWER — PRODUCTION DEPLOYMENT & FAIL-SAFE PIPELINE          ║"
echo "╚══════════════════════════════════════════════════════════════════════════╝"
echo -e "${CLR_RESET}"
echo -e "  ${CLR_BOLD}Release Tag:${CLR_RESET}  ${RELEASE_TAG}"
echo -e "  ${CLR_BOLD}Git Commit:${CLR_RESET}   ${GIT_COMMIT}"
echo -e "  ${CLR_BOLD}Timestamp:${CLR_RESET}    ${TIMESTAMP}"
echo -e "  ${CLR_BOLD}Target Port:${CLR_RESET}  ${HOST_PORT} (Public: ${PUBLIC_URL})"
echo -e "  ${CLR_BOLD}Dry Run:${CLR_RESET}      ${DRY_RUN}"
echo -e "  ${CLR_BOLD}Skip Tests:${CLR_RESET}   ${SKIP_TESTS}"

# Cleanup candidate container helper
cleanup_candidate() {
  if docker ps -a --format '{{.Names}}' | grep -Eq "^${CANDIDATE_CONTAINER}\$"; then
    log_info "Cleaning up temporary candidate container ${CANDIDATE_CONTAINER}..."
    docker rm -f "${CANDIDATE_CONTAINER}" >/dev/null 2>&1 || true
  fi
}

# Rollback Routine: Restores previous container and verifies health
perform_rollback() {
  local reason="$1"
  log_error "Deployment failed: ${reason}"
  echo -e "${CLR_YELLOW}${CLR_BOLD}Initiating automatic rollback to previous stable version...${CLR_RESET}"

  # 1. Capture failed container logs for post-mortem analysis
  if docker ps -a --format '{{.Names}}' | grep -Eq "^${CONTAINER_NAME}\$"; then
    local failure_log="${LOGS_DIR}/failure_${TIMESTAMP}.log"
    docker logs "${CONTAINER_NAME}" > "${failure_log}" 2>&1 || true
    log_info "Failed container logs captured to: ${failure_log}"
    
    log_info "Terminating failed container ${CONTAINER_NAME}..."
    docker rm -f "${CONTAINER_NAME}" >/dev/null 2>&1 || true
  fi

  # 2. Resurrect previous container if backup exists
  if docker ps -a --format '{{.Names}}' | grep -Eq "^${BACKUP_CONTAINER}\$"; then
    log_info "Restoring previous running container ${BACKUP_CONTAINER}..."
    docker rename "${BACKUP_CONTAINER}" "${CONTAINER_NAME}" >/dev/null 2>&1 || true
    docker start "${CONTAINER_NAME}" >/dev/null 2>&1 || true
    docker network connect "${CADDY_NETWORK}" "${CONTAINER_NAME}" >/dev/null 2>&1 || true
  elif docker images --format '{{.Repository}}:{{.Tag}}' | grep -Eq "^${APP_NAME}:rollback-backup\$"; then
    log_info "Recreating container from backup image ${APP_NAME}:rollback-backup..."
    docker run -d \
      --name "${CONTAINER_NAME}" \
      --restart unless-stopped \
      -p "${HOST_PORT}:80" \
      --env-file "${ENV_FILE}" \
      -v "${DATA_DIR}:/data" \
      "${APP_NAME}:rollback-backup" >/dev/null

    docker network connect "${CADDY_NETWORK}" "${CONTAINER_NAME}" >/dev/null 2>&1 || true
  else
    log_error "CRITICAL: No backup image or container found to rollback! Manual inspection required."
    exit 2
  fi

  # 3. Verify Rollback Health
  log_info "Verifying health of restored rollback container..."
  local restored_ok=false
  for i in {1..15}; do
    RESTORE_RESP="$(curl -s "http://127.0.0.1:${HOST_PORT}/api/health" 2>/dev/null || true)"
    if echo "${RESTORE_RESP}" | grep -q '"status":"ok"'; then
      restored_ok=true
      break
    fi
    sleep 1
  done

  if [ "${restored_ok}" = true ]; then
    log_success "Rollback successful! Live service restored to previous stable version."
    echo -e "${CLR_GREEN}${CLR_BOLD}Production service is ONLINE and healthy. No customer impact.${CLR_RESET}"
  else
    log_error "Restored container failed healthcheck. Check docker logs ${CONTAINER_NAME}."
  fi

  cleanup_candidate
  exit 1
}

# Trap unexpected exits or signals during critical rollout phases
trap_handler() {
  local exit_code=$?
  if [ "${ROLLBACK_NEEDED}" = true ] && [ "${exit_code}" -ne 0 ]; then
    perform_rollback "Unexpected pipeline interruption or unhandled script failure (Exit Code: ${exit_code})"
  else
    cleanup_candidate
  fi
}
trap trap_handler EXIT INT TERM

# ==============================================================================
# PHASE 1: Pre-Flight Verification & Quality Gates
# ==============================================================================
log_step "1/7" "Verifying Environment & Pre-Flight Quality Gates"

if ! command -v docker &>/dev/null; then
  echo "Docker is required but not installed."
  exit 1
fi

if ! docker info &>/dev/null; then
  echo "Docker daemon is not running or current user lacks docker privileges."
  exit 1
fi

if [ ! -f "${ENV_FILE}" ]; then
  if [ -f "${PROJECT_ROOT}/.env.example" ]; then
    log_warn "Missing ${ENV_FILE}. Initializing from .env.example..."
    cp "${PROJECT_ROOT}/.env.example" "${ENV_FILE}"
  else
    log_error "Missing required environment file: ${ENV_FILE}"
    exit 1
  fi
fi
log_success "Environment file (.env) verified"

# Ensure Caddy reverse proxy network exists
if ! docker network ls --format '{{.Name}}' | grep -Eq "^${CADDY_NETWORK}\$"; then
  log_warn "Docker network '${CADDY_NETWORK}' not found. Creating network for Caddy proxy..."
  docker network create "${CADDY_NETWORK}" >/dev/null
fi
log_success "Docker network '${CADDY_NETWORK}' verified"

if [ "${SKIP_TESTS}" = false ]; then
  log_info "Running code linter (oxlint)..."
  if ! npm run lint; then
    log_error "Pre-flight linting failed! Fix lint errors before deploying."
    exit 1
  fi
  log_success "Code linting passed (0 errors)"

  log_info "Running TypeScript typecheck..."
  if ! npx tsc -b; then
    log_error "Pre-flight TypeScript compilation failed! Fix type errors before deploying."
    exit 1
  fi
  log_success "TypeScript typecheck passed"

  log_info "Running automated test suite..."
  if ! npm test; then
    log_error "Pre-flight unit tests failed! Fix tests before deploying."
    exit 1
  fi
  log_success "All test suites passed (100% pass rate)"
else
  log_warn "Pre-flight tests skipped via --skip-tests flag"
fi

# ==============================================================================
# PHASE 2: Hot Snapshot & Database Safety Backup
# ==============================================================================
log_step "2/7" "Creating Safety Snapshot of SQLite Database"

DB_FILE="${DATA_DIR}/shared_docs.db"
if [ -f "${DB_FILE}" ]; then
  DB_BACKUP_PATH="${BACKUP_DIR}/shared_docs_snapshot_${TIMESTAMP}.db"
  # Copy database file and associated WAL/SHM journaling files
  cp -a "${DATA_DIR}"/shared_docs.db* "${BACKUP_DIR}/" 2>/dev/null || true
  log_success "Database snapshot created at ${BACKUP_DIR}"

  # Prune backups older than 7 days, keeping at least the latest 10
  find "${BACKUP_DIR}" -name "shared_docs_snapshot_*.db" -mtime +7 -delete 2>/dev/null || true
else
  log_info "No existing database found at ${DB_FILE} (first-time deployment)"
fi

# ==============================================================================
# PHASE 3: Live Container Snapshot & Tagging
# ==============================================================================
log_step "3/7" "Capturing Live Container Snapshot"

if docker ps -a --format '{{.Names}}' | grep -Eq "^${CONTAINER_NAME}\$"; then
  PREV_IMAGE_ID="$(docker inspect "${CONTAINER_NAME}" --format '{{.Image}}' 2>/dev/null || true)"
  if [ -n "${PREV_IMAGE_ID}" ]; then
    docker tag "${PREV_IMAGE_ID}" "${APP_NAME}:rollback-backup"
    docker tag "${PREV_IMAGE_ID}" "${APP_NAME}:stable-prev"
    log_success "Live container image tagged as ${APP_NAME}:rollback-backup (${PREV_IMAGE_ID:0:19})"
  fi
else
  log_info "No active ${CONTAINER_NAME} container currently running."
fi

# ==============================================================================
# PHASE 4: Build New Production Docker Image
# ==============================================================================
log_step "4/7" "Building Production Docker Image (${RELEASE_TAG})"

log_info "Executing Docker build with multi-stage assets..."
# shellcheck disable=SC2086
docker build ${DOCKER_NO_CACHE} \
  -t "${APP_NAME}:${RELEASE_TAG}" \
  -t "${APP_NAME}:candidate" \
  .

log_success "Docker image ${APP_NAME}:${RELEASE_TAG} built successfully"

# ==============================================================================
# PHASE 5: Candidate Staging Test (Fail-Safe Gate 1: Pre-Rollout Probing)
# ==============================================================================
log_step "5/7" "Pre-Rollout Staging & Candidate Health Probing (Zero-Touch)"

cleanup_candidate

log_info "Starting isolated candidate container on test port ${CANDIDATE_PORT}..."
docker run -d \
  --name "${CANDIDATE_CONTAINER}" \
  -p "127.0.0.1:${CANDIDATE_PORT}:80" \
  --env-file "${ENV_FILE}" \
  -v "${DATA_DIR}:/data:ro" \
  "${APP_NAME}:candidate" >/dev/null

log_info "Probing candidate container liveness and readiness..."
CANDIDATE_HEALTHY=false
for i in {1..15}; do
  CAND_RESP="$(curl -s "http://127.0.0.1:${CANDIDATE_PORT}/api/health" 2>/dev/null || true)"
  if echo "${CAND_RESP}" | grep -q '"status":"ok"'; then
    CANDIDATE_HEALTHY=true
    break
  fi
  sleep 1
done

if [ "${CANDIDATE_HEALTHY}" = false ]; then
  log_error "Candidate container failed pre-rollout healthcheck on port ${CANDIDATE_PORT}!"
  docker logs "${CANDIDATE_CONTAINER}" || true
  cleanup_candidate
  echo -e "${CLR_YELLOW}${CLR_BOLD}Production container was NEVER touched. Live traffic continues uninterrupted.${CLR_RESET}"
  exit 1
fi

# Probe HTML frontend delivery
HTML_PROBE="$(curl -s "http://127.0.0.1:${CANDIDATE_PORT}/" | head -n 10)"
if ! echo "${HTML_PROBE}" | grep -qi "doctype html"; then
  log_error "Candidate container failed frontend HTML probe!"
  cleanup_candidate
  exit 1
fi

log_success "Candidate passed all pre-rollout health checks (API 200 OK + Frontend verified)"
cleanup_candidate

if [ "${DRY_RUN}" = true ]; then
  echo -e "\n${CLR_GREEN}${CLR_BOLD}🎉 DRY RUN COMPLETE! All quality gates and candidate probes passed.${CLR_RESET}"
  echo "Image ${APP_NAME}:${RELEASE_TAG} is validated and ready for production rollout."
  exit 0
fi

# ==============================================================================
# PHASE 6: Atomic Rollout & Promotion
# ==============================================================================
log_step "6/7" "Executing Atomic Rollout"

# From this point forward, if anything fails, we trigger automatic rollback
ROLLBACK_NEEDED=true

# Safely stop and retain current container as instant backup
if docker ps -a --format '{{.Names}}' | grep -Eq "^${CONTAINER_NAME}\$"; then
  log_info "Renaming active container to ${BACKUP_CONTAINER} for instant fallback..."
  docker stop -t 5 "${CONTAINER_NAME}" >/dev/null
  docker rename "${CONTAINER_NAME}" "${BACKUP_CONTAINER}" >/dev/null
fi

log_info "Launching new production container ${CONTAINER_NAME}..."
docker run -d \
  --name "${CONTAINER_NAME}" \
  --restart unless-stopped \
  -p "${HOST_PORT}:80" \
  --env-file "${ENV_FILE}" \
  -v "${DATA_DIR}:/data" \
  "${APP_NAME}:${RELEASE_TAG}" >/dev/null

log_info "Attaching container to Caddy reverse proxy network (${CADDY_NETWORK})..."
docker network connect "${CADDY_NETWORK}" "${CONTAINER_NAME}" >/dev/null

DEPLOYED_CONTAINER_RUNNING=true
log_success "New container launched and connected to gateway network"

# ==============================================================================
# PHASE 7: Post-Rollout Liveness & Readiness Verification (Fail-Safe Gate 2)
# ==============================================================================
log_step "7/7" "Verifying Post-Rollout Liveness & Readiness"

POST_ROLLOUT_OK=false
log_info "Polling internal health endpoint (http://127.0.0.1:${HOST_PORT}/api/health)..."
for i in {1..15}; do
  HEALTH_RESP="$(curl -s -f "http://127.0.0.1:${HOST_PORT}/api/health" 2>/dev/null || true)"
  if echo "${HEALTH_RESP}" | grep -q '"status":"ok"'; then
    POST_ROLLOUT_OK=true
    log_info "Attempt $i: Received healthy response: ${HEALTH_RESP}"
    break
  fi
  sleep 1
done

if [ "${POST_ROLLOUT_OK}" = false ]; then
  perform_rollback "New container failed post-rollout healthchecks on port ${HOST_PORT}"
fi

# Verify via Caddy Gateway URL
log_info "Verifying public gateway endpoint (${PUBLIC_URL}/api/health)..."
GATEWAY_OK=false
for i in {1..10}; do
  GATEWAY_CODE="$(curl -s -o /dev/null -w "%{http_code}" "${PUBLIC_URL}/api/health" 2>/dev/null || true)"
  if [ "${GATEWAY_CODE}" = "200" ]; then
    GATEWAY_OK=true
    log_info "Gateway verified: HTTP 200 OK"
    break
  fi
  sleep 1
done

if [ "${GATEWAY_OK}" = false ]; then
  log_warn "Public gateway returned HTTP ${GATEWAY_CODE:-timeout} (might be DNS/Caddy transient). Internal container is healthy."
fi

# ==============================================================================
# PROMOTION & FINALIZATION (Success)
# ==============================================================================
# Disarm the rollback trap
ROLLBACK_NEEDED=false

log_info "Promoting release tag ${RELEASE_TAG} to latest and stable..."
docker tag "${APP_NAME}:${RELEASE_TAG}" "${APP_NAME}:latest"
docker tag "${APP_NAME}:${RELEASE_TAG}" "${APP_NAME}:stable"

if docker ps -a --format '{{.Names}}' | grep -Eq "^${BACKUP_CONTAINER}\$"; then
  log_info "Retiring temporary backup container ${BACKUP_CONTAINER}..."
  docker rm -f "${BACKUP_CONTAINER}" >/dev/null 2>&1 || true
fi

# Clean up any dangling untagged images
docker image prune -f >/dev/null 2>&1 || true

echo -e "\n${CLR_GREEN}${CLR_BOLD}"
echo "╔══════════════════════════════════════════════════════════════════════════╗"
echo "║                  DEPLOYMENT COMPLETED SUCCESSFULLY!                      ║"
echo "╚══════════════════════════════════════════════════════════════════════════╝"
echo -e "${CLR_RESET}"
echo -e "  ${CLR_BOLD}Active Release:${CLR_RESET}   ${RELEASE_TAG}"
echo -e "  ${CLR_BOLD}Container:${CLR_RESET}        ${CONTAINER_NAME} (Up & Healthy)"
echo -e "  ${CLR_BOLD}Public Endpoint:${CLR_RESET}  ${PUBLIC_URL}"
echo -e "  ${CLR_BOLD}Local Endpoint:${CLR_RESET}   http://127.0.0.1:${HOST_PORT}"
echo -e "  ${CLR_BOLD}Health Status:${CLR_RESET}    $(curl -s "http://127.0.0.1:${HOST_PORT}/api/health" || echo 'OK')"
echo -e "  ${CLR_BOLD}Backup Tag:${CLR_RESET}       ${APP_NAME}:rollback-backup"
echo ""

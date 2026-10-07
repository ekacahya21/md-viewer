#!/usr/bin/env bash
# ==============================================================================
# MD Viewer - Instant Manual Rollback Script
# ==============================================================================
# Restores the previous stable release container and verifies service health.
# ==============================================================================

set -euo pipefail

CLR_RESET="\033[0m"
CLR_BOLD="\033[1m"
CLR_GREEN="\033[1;32m"
CLR_YELLOW="\033[1;33m"
CLR_RED="\033[1;31m"
CLR_CYAN="\033[1;36m"

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP_NAME="md-viewer"
CONTAINER_NAME="md-viewer"
DEFAULT_NETWORK="md-viewer-net"
if command -v docker &>/dev/null && docker network ls --format '{{.Name}}' 2>/dev/null | grep -Eq "^expense-dashboard_expense-net\$"; then
  DEFAULT_NETWORK="expense-dashboard_expense-net"
fi
CADDY_NETWORK="${CADDY_NETWORK:-${DEFAULT_NETWORK}}"
HOST_PORT="${HOST_PORT:-3015}"
DATA_DIR="${PROJECT_ROOT}/data"
ENV_FILE="${PROJECT_ROOT}/.env"

echo -e "${CLR_YELLOW}${CLR_BOLD}"
echo "╔══════════════════════════════════════════════════════════════════════════╗"
echo "║             MD VIEWER — MANUAL ROLLBACK CONTROLLER                       ║"
echo "╚══════════════════════════════════════════════════════════════════════════╝"
echo -e "${CLR_RESET}"

# Determine which rollback image is available
ROLLBACK_IMAGE=""
if docker images --format '{{.Repository}}:{{.Tag}}' | grep -Eq "^${APP_NAME}:rollback-backup\$"; then
  ROLLBACK_IMAGE="${APP_NAME}:rollback-backup"
elif docker images --format '{{.Repository}}:{{.Tag}}' | grep -Eq "^${APP_NAME}:stable-prev\$"; then
  ROLLBACK_IMAGE="${APP_NAME}:stable-prev"
elif docker images --format '{{.Repository}}:{{.Tag}}' | grep -Eq "^${APP_NAME}:stable\$"; then
  ROLLBACK_IMAGE="${APP_NAME}:stable"
fi

if [ -z "${ROLLBACK_IMAGE}" ]; then
  echo -e "${CLR_RED}❌ No valid rollback image found (${APP_NAME}:rollback-backup or ${APP_NAME}:stable).${CLR_RESET}"
  echo "Available images:"
  docker images "${APP_NAME}"
  exit 1
fi

echo -e "Target rollback image: ${CLR_CYAN}${ROLLBACK_IMAGE}${CLR_RESET}"

# Capture current container logs before terminating
if docker ps -a --format '{{.Names}}' | grep -Eq "^${CONTAINER_NAME}\$"; then
  LOG_FILE="${PROJECT_ROOT}/logs/pre_rollback_$(date +%Y%m%d_%H%M%S).log"
  mkdir -p "${PROJECT_ROOT}/logs"
  echo "Backing up current container logs to ${LOG_FILE}..."
  docker logs "${CONTAINER_NAME}" > "${LOG_FILE}" 2>&1 || true
  
  echo "Stopping and removing current container ${CONTAINER_NAME}..."
  docker rm -f "${CONTAINER_NAME}" >/dev/null
fi

echo "Launching rollback container from ${ROLLBACK_IMAGE}..."
docker run -d \
  --name "${CONTAINER_NAME}" \
  --restart unless-stopped \
  -p "${HOST_PORT}:80" \
  --env-file "${ENV_FILE}" \
  -v "${DATA_DIR}:/data" \
  "${ROLLBACK_IMAGE}" >/dev/null

echo "Reconnecting to Caddy gateway network (${CADDY_NETWORK})..."
docker network connect "${CADDY_NETWORK}" "${CONTAINER_NAME}" >/dev/null

echo "Waiting for healthcheck..."
ROLLBACK_OK=false
for i in {1..15}; do
  RB_RESP="$(curl -s "http://127.0.0.1:${HOST_PORT}/api/health" 2>/dev/null || true)"
  if echo "${RB_RESP}" | grep -q '"status":"ok"'; then
    ROLLBACK_OK=true
    break
  fi
  sleep 1
done

if [ "${ROLLBACK_OK}" = true ]; then
  echo -e "\n${CLR_GREEN}${CLR_BOLD}✓ ROLLBACK COMPLETED SUCCESSFULLY!${CLR_RESET}"
  echo -e "Health: $(curl -s "http://127.0.0.1:${HOST_PORT}/api/health")"
  echo -e "Public URL: https://md-viewer.e21.dev"
else
  echo -e "\n${CLR_RED}${CLR_BOLD}❌ Rollback container started but failed healthcheck.${CLR_RESET}"
  docker logs "${CONTAINER_NAME}" || true
  exit 1
fi

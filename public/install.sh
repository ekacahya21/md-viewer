#!/usr/bin/env bash
# ==============================================================================
# mdv Installer
# One-liner installer for md-viewer CLI (mdv)
# Usage: curl -fsSL https://md-viewer.e21.dev/install.sh | bash
# ==============================================================================

set -eo pipefail

BOLD=$'\033[1m'
GREEN=$'\033[32m'
CYAN=$'\033[36m'
AMBER=$'\033[33m'
RED=$'\033[31m'
DIM=$'\033[2m'
RESET=$'\033[0m'

echo -e "${BOLD}${CYAN}==> Installing mdv (Markdown Viewer CLI)...${RESET}"

# Determine target directory
if [ -w "/usr/local/bin" ] || [ "$EUID" -eq 0 ]; then
  INSTALL_DIR="/usr/local/bin"
  USE_SUDO=0
else
  # Check if sudo without password is available, else use ~/.local/bin
  if command -v sudo >/dev/null 2>&1 && sudo -n true 2>/dev/null; then
    INSTALL_DIR="/usr/local/bin"
    USE_SUDO=1
  else
    INSTALL_DIR="${HOME}/.local/bin"
    USE_SUDO=0
    mkdir -p "${INSTALL_DIR}"
  fi
fi

TARGET="${INSTALL_DIR}/mdv"
TARGET_MCP="${INSTALL_DIR}/mcp-server.mjs"
SOURCE_URL="https://md-viewer.e21.dev/bin/mdv"
SOURCE_MCP_URL="https://md-viewer.e21.dev/bin/mcp-server.mjs"
FALLBACK_URL="https://raw.githubusercontent.com/ekacahya21/md-viewer/main/bin/mdv"
FALLBACK_MCP_URL="https://raw.githubusercontent.com/ekacahya21/md-viewer/main/bin/mcp-server.mjs"

echo -e "  ${DIM}Downloading from ${SOURCE_URL}...${RESET}"

TMP_FILE=$(mktemp)
TMP_MCP=$(mktemp)
trap 'rm -f "$TMP_FILE" "$TMP_MCP"' EXIT

if ! curl -fsSL "${SOURCE_URL}" -o "${TMP_FILE}" 2>/dev/null; then
  echo -e "  ${AMBER}Primary source unavailable, trying fallback GitHub source...${RESET}"
  if ! curl -fsSL "${FALLBACK_URL}" -o "${TMP_FILE}"; then
    echo -e "${RED}Error: Failed to download mdv script.${RESET}" >&2
    exit 1
  fi
fi

# Attempt to download mcp-server.mjs (optional helper for MCP AI agents)
curl -fsSL "${SOURCE_MCP_URL}" -o "${TMP_MCP}" 2>/dev/null || \
curl -fsSL "${FALLBACK_MCP_URL}" -o "${TMP_MCP}" 2>/dev/null || true

# Ensure executable permissions
chmod +x "${TMP_FILE}"
[ -s "${TMP_MCP}" ] && chmod +x "${TMP_MCP}"

# Move to target location
if [ "$USE_SUDO" -eq 1 ]; then
  sudo mv "${TMP_FILE}" "${TARGET}"
  sudo chmod +x "${TARGET}"
  if [ -s "${TMP_MCP}" ]; then
    sudo mv "${TMP_MCP}" "${TARGET_MCP}"
    sudo chmod +x "${TARGET_MCP}"
  fi
else
  mv "${TMP_FILE}" "${TARGET}"
  chmod +x "${TARGET}"
  if [ -s "${TMP_MCP}" ]; then
    mv "${TMP_MCP}" "${TARGET_MCP}"
    chmod +x "${TARGET_MCP}"
  fi
fi

echo -e "${GREEN}${BOLD}✓ mdv successfully installed to ${TARGET}${RESET}"

# Check PATH if installed to ~/.local/bin
if [[ ":$PATH:" != *":${INSTALL_DIR}:"* ]]; then
  echo -e "\n${AMBER}${BOLD}Notice:${RESET} ${INSTALL_DIR} is not in your current PATH."
  echo -e "To use 'mdv' anywhere, add this to your ${BOLD}~/.bashrc${RESET} or ${BOLD}~/.zshrc${RESET}:"
  echo -e "  ${CYAN}export PATH=\"${INSTALL_DIR}:\$PATH\"${RESET}\n"
fi

# Show quick usage
echo -e "${BOLD}Quick Usage:${RESET}"
echo -e "  ${CYAN}mdv README.md${RESET}           # Publish markdown file and copy short URL"
echo -e "  ${CYAN}cat draft.md | mdv${RESET}      # Pipe markdown from stdin"
echo -e "  ${CYAN}mdv mcp config${RESET}          # Setup MCP server for Claude, Cursor, Cline"
echo -e "  ${CYAN}mdv --help${RESET}              # View all options and flags"
echo

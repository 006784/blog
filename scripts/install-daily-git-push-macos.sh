#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
HOUR="${1:-23}"
MINUTE="${2:-30}"

if ! [[ "$HOUR" =~ ^[0-9]+$ ]] || ! [[ "$MINUTE" =~ ^[0-9]+$ ]]; then
  echo "Usage: bash scripts/install-daily-git-push-macos.sh [hour] [minute]"
  echo "Example: bash scripts/install-daily-git-push-macos.sh 23 30"
  exit 1
fi

if (( HOUR < 0 || HOUR > 23 || MINUTE < 0 || MINUTE > 59 )); then
  echo "Hour must be 0-23 and minute must be 0-59"
  exit 1
fi

LABEL="com.blog1.daily-git-push"
PLIST_DIR="$HOME/Library/LaunchAgents"
PLIST_PATH="$PLIST_DIR/${LABEL}.plist"
LOG_FILE="$ROOT_DIR/logs/daily-git-push.log"

mkdir -p "$PLIST_DIR"
mkdir -p "$ROOT_DIR/logs"

cat > "$PLIST_PATH" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>${LABEL}</string>

  <key>ProgramArguments</key>
  <array>
    <string>/bin/zsh</string>
    <string>-lc</string>
    <string>cd "${ROOT_DIR}" &amp;&amp; "${ROOT_DIR}/scripts/auto-push.sh" &gt;&gt; "${LOG_FILE}" 2&gt;&amp;1</string>
  </array>

  <key>StartCalendarInterval</key>
  <dict>
    <key>Hour</key>
    <integer>${HOUR}</integer>
    <key>Minute</key>
    <integer>${MINUTE}</integer>
  </dict>

  <key>RunAtLoad</key>
  <false/>
  <key>StandardOutPath</key>
  <string>${LOG_FILE}</string>
  <key>StandardErrorPath</key>
  <string>${LOG_FILE}</string>
</dict>
</plist>
EOF

launchctl bootout "gui/$(id -u)" "$PLIST_PATH" >/dev/null 2>&1 || true
launchctl bootstrap "gui/$(id -u)" "$PLIST_PATH"
launchctl enable "gui/$(id -u)/${LABEL}"
launchctl kickstart -k "gui/$(id -u)/${LABEL}" >/dev/null 2>&1 || true

echo "Installed daily auto-push:"
echo "  label:   ${LABEL}"
echo "  time:    $(printf "%02d:%02d" "$HOUR" "$MINUTE")"
echo "  plist:   ${PLIST_PATH}"
echo "  log:     ${LOG_FILE}"
echo
echo "Check status:"
echo "  launchctl print gui/$(id -u)/${LABEL}"
echo
echo "Manual run once:"
echo "  launchctl kickstart -k gui/$(id -u)/${LABEL}"
echo
echo "Uninstall:"
echo "  bash scripts/uninstall-daily-git-push-macos.sh"

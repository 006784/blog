#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

REMOTE="${GIT_REMOTE:-origin}"
BRANCH="${GIT_BRANCH:-main}"
MESSAGE_PREFIX="${AUTO_PUSH_PREFIX:-chore(auto)}"
DRY_RUN="${1:-}"

timestamp() {
  date +"%Y-%m-%d %H:%M:%S"
}

echo "[auto-push] started at $(timestamp)"
echo "[auto-push] repo: $ROOT_DIR"
echo "[auto-push] target: ${REMOTE}/${BRANCH}"

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "[auto-push] not a git repository, abort"
  exit 1
fi

if [[ -n "$(git status --porcelain)" ]]; then
  echo "[auto-push] detected local changes"
else
  echo "[auto-push] no local changes, skip push"
  exit 0
fi

if [[ "$DRY_RUN" == "--dry-run" ]]; then
  echo "[auto-push] dry-run mode, will not commit/push"
  git status --short
  exit 0
fi

git add -A

commit_message="${MESSAGE_PREFIX}: daily backup $(date +'%Y-%m-%d %H:%M')"
git commit -m "$commit_message"
git push "$REMOTE" "$BRANCH"

echo "[auto-push] pushed successfully at $(timestamp)"

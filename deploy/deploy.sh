#!/usr/bin/env bash
# Deploy the Bileton static site to a PS.kz VPS over SSH/rsync.
#
# Usage:
#   DEPLOY_HOST=1.2.3.4 DEPLOY_USER=root ./deploy/deploy.sh
#
# Optional env vars:
#   DEPLOY_PORT   SSH port (default 22)
#   DEPLOY_PATH   Remote directory to sync into (default /var/www/bileton)
#   DEPLOY_KEY    Path to a private key file, if not using an ssh-agent/password
#
# What it does:
#   1. Rsyncs index.html, assets/, Photo/ to the server (excludes dev-only
#      files: node_modules, .git, temporary screenshots, the stray skill
#      package files, source scripts).
#   2. Leaves anything already on the server that isn't part of this repo
#      untouched (no --delete by default, see the flag below if you want
#      the remote directory to exactly mirror this one).

set -euo pipefail

HOST="${DEPLOY_HOST:?Set DEPLOY_HOST to the VPS IP or hostname}"
USER="${DEPLOY_USER:-root}"
PORT="${DEPLOY_PORT:-22}"
REMOTE_PATH="${DEPLOY_PATH:-/var/www/bileton}"
KEY_OPT=()
if [[ -n "${DEPLOY_KEY:-}" ]]; then
  KEY_OPT=(-e "ssh -i ${DEPLOY_KEY} -p ${PORT}")
else
  KEY_OPT=(-e "ssh -p ${PORT}")
fi

echo "Deploying to ${USER}@${HOST}:${REMOTE_PATH} ..."

ssh "${KEY_OPT[@]:1}" "${USER}@${HOST}" "mkdir -p '${REMOTE_PATH}'"

rsync -avz --progress "${KEY_OPT[@]}" \
  --exclude 'node_modules/' \
  --exclude '.git/' \
  --exclude '.gitignore' \
  --exclude 'temporary screenshots/' \
  --exclude '.claude/' \
  --exclude '.agents/' \
  --exclude 'skills-lock.json' \
  --exclude 'SKILL.md' \
  --exclude 'SKILL f.md' \
  --exclude 'plugin.json' \
  --exclude 'core.py' \
  --exclude 'core.cpython-*.pyc' \
  --exclude 'design_system.py' \
  --exclude 'design_system.cpython-*.pyc' \
  --exclude 'search.py' \
  --exclude 'search.cpython-*.pyc' \
  --exclude 'deploy/' \
  --exclude 'serve.mjs' \
  --exclude 'screenshot.mjs' \
  --exclude 'package.json' \
  --exclude 'package-lock.json' \
  ./ "${USER}@${HOST}:${REMOTE_PATH}/"

echo "Done. Verify with: curl -I http://${HOST}/ (or https://bileton.kz/ once DNS + certbot are set up)."

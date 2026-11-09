#!/bin/sh
# Uploads the committed state of main to GitHub, which then checks, builds and publishes the app.
# The token is read from .env and only handed to git for this one push; it is never stored.
set -eu
cd "$(dirname "$0")/.."

if [ ! -f .env ]; then
  echo "Missing .env with GITHUB_TOKEN (see .env.example)." >&2
  exit 1
fi
set -a
. ./.env
set +a
if [ -z "${GITHUB_TOKEN:-}" ]; then
  echo "GITHUB_TOKEN is empty in .env." >&2
  exit 1
fi

if [ -n "$(git status --porcelain)" ]; then
  echo "There are uncommitted changes; commit them first." >&2
  git status --short >&2
  exit 1
fi

git -c credential.helper= \
  -c credential.helper='!f() { echo username=x-access-token; echo "password=$GITHUB_TOKEN"; }; f' \
  push origin main

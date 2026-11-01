#!/usr/bin/env bash
# Check that Nginx serves the portfolio and the public API returns JSON.
set -euo pipefail

BASE_URL="${1:-http://127.0.0.1}"

echo "Checking portfolio homepage: ${BASE_URL}/"
curl --fail --silent --show-error --max-time 10 --output /dev/null "${BASE_URL}/"
echo "OK: frontend responds."

echo "Checking API: ${BASE_URL}/api/skills"
CONTENT_TYPE="$(curl --fail --silent --show-error --max-time 10 --output /dev/null --write-out '%{content_type}' "${BASE_URL}/api/skills")"
if [[ "$CONTENT_TYPE" != *application/json* ]]; then
  echo "FAIL: /api/skills did not return JSON (Content-Type: ${CONTENT_TYPE})." >&2
  exit 1
fi

echo "OK: API responds with JSON."
echo "PASS: basic portfolio checks succeeded."

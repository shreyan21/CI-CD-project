#!/usr/bin/env bash
# GitHub runs this script; Docker owns the service health checks.
set -euo pipefail

: "${AWS_INSTANCE_ID:?AWS_INSTANCE_ID is required}"
: "${AWS_REGION:?AWS_REGION is required}"
: "${ECR_REGISTRY:?ECR_REGISTRY is required}"

PARAMETERS_FILE=$(mktemp)
ERROR_FILE=$(mktemp)
trap 'rm -f "$PARAMETERS_FILE" "$ERROR_FILE"' EXIT

python3 - "$PARAMETERS_FILE" <<'PY'
import base64
import json
import os
from pathlib import Path
import shlex
import sys

health = base64.b64encode(Path("docker-compose.override.yml").read_bytes()).decode("ascii")
region = shlex.quote(os.environ["AWS_REGION"])
registry = shlex.quote(os.environ["ECR_REGISTRY"])
commands = [
    "set -eu",
    "cd /home/ubuntu",
    f"printf %s {shlex.quote(health)} | base64 --decode > docker-compose.override.yml",
    "docker compose config --quiet",
    f"aws ecr get-login-password --region {region} | docker login --username AWS --password-stdin {registry}",
    "docker compose pull backend frontend",
    "docker compose up -d --no-build --wait --wait-timeout 120 db backend",
    "docker compose exec -T backend npm run db:migrate",
    "docker compose up -d --no-build --wait --wait-timeout 120 frontend",
    "docker compose ps",
]
Path(sys.argv[1]).write_text(json.dumps({"commands": commands, "executionTimeout": ["600"]}), encoding="utf-8")
PY

COMMAND_ID=$(aws ssm send-command \
    --instance-ids "$AWS_INSTANCE_ID" \
    --document-name AWS-RunShellScript \
    --timeout-seconds 60 \
    --parameters "file://$PARAMETERS_FILE" \
    --query Command.CommandId \
    --output text)
printf 'Deployment command: %s\n' "$COMMAND_ID"

# The AWS CLI's short default waiter can expire during image pulls and health checks.
# Allow twelve minutes for delivery and the remote command's ten-minute limit.
DEADLINE=$((SECONDS + 720))
while (( SECONDS < DEADLINE )); do
    if RESULT=$(aws ssm get-command-invocation \
        --command-id "$COMMAND_ID" \
        --instance-id "$AWS_INSTANCE_ID" \
        --output json 2>"$ERROR_FILE"); then
        STATUS=$(python3 -c 'import json,sys; print(json.load(sys.stdin)["Status"])' <<<"$RESULT")
        case "$STATUS" in
            Success)
                printf '%s\n' "$RESULT"
                echo "Deployment completed; Docker health checks passed."
                exit 0
                ;;
            Pending|InProgress|Delayed)
                ;;
            *)
                printf '%s\n' "$RESULT" >&2
                exit 1
                ;;
        esac
    elif ! grep -q InvocationDoesNotExist "$ERROR_FILE"; then
        cat "$ERROR_FILE" >&2
        exit 1
    fi
    sleep 5
done

echo "Timed out waiting for SSM execution; the remote command may still be running." >&2
exit 1

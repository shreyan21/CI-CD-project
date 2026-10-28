#!/usr/bin/env bash
# Submit the existing EC2 release commands and verify their SSM result.
set -euo pipefail

: "${AWS_INSTANCE_ID:?Set AWS_INSTANCE_ID to the existing EC2 instance ID}"
: "${AWS_REGION:?Set AWS_REGION to the instance region}"
: "${ECR_REGISTRY:?Set ECR_REGISTRY to the ECR registry hostname}"

# JSON and shell quoting are handled separately: these commands run on EC2.
PARAMETERS="$(python3 - <<'PY'
import json
import os
import shlex

region = shlex.quote(os.environ['AWS_REGION'])
registry = shlex.quote(os.environ['ECR_REGISTRY'])
print(json.dumps({'commands': [
    'set -e',
    'cd /home/ubuntu',
    f'aws ecr get-login-password --region {region} | docker login --username AWS --password-stdin {registry}',
    'docker compose up -d db',
    'docker compose up -d --pull always --no-deps frontend backend',
    'docker compose exec -T backend npm run db:migrate',
]}))
PY
)"

if COMMAND_ID="$(aws ssm send-command \
    --instance-ids "$AWS_INSTANCE_ID" \
    --document-name AWS-RunShellScript \
    --parameters "$PARAMETERS" \
    --query 'Command.CommandId' \
    --output text \
    --region "$AWS_REGION")"; then
  :
else
  SEND_STATUS=$?
  echo '::error::SSM rejected the deployment command. Check the target instance, AWS account/region, SSM agent and IAM access.' >&2
  exit "$SEND_STATUS"
fi

if [[ ! "$COMMAND_ID" =~ ^[[:xdigit:]]{8}-[[:xdigit:]]{4}-[[:xdigit:]]{4}-[[:xdigit:]]{4}-[[:xdigit:]]{12}$ ]]; then
  echo '::error::SSM did not return a valid command ID.' >&2
  exit 1
fi

echo "Waiting for SSM command $COMMAND_ID on $AWS_INSTANCE_ID."
WAIT_STATUS=0
aws ssm wait command-executed \
  --command-id "$COMMAND_ID" \
  --instance-id "$AWS_INSTANCE_ID" \
  --region "$AWS_REGION" || WAIT_STATUS=$?

# Print useful diagnostics even when the waiter fails or times out.
RESULT_STATUS=0
aws ssm get-command-invocation \
  --command-id "$COMMAND_ID" \
  --instance-id "$AWS_INSTANCE_ID" \
  --query '{Status:Status,ResponseCode:ResponseCode,Output:StandardOutputContent,Error:StandardErrorContent}' \
  --output json \
  --region "$AWS_REGION" || RESULT_STATUS=$?

if (( WAIT_STATUS != 0 )); then
  echo '::error::The SSM command did not complete successfully within the waiter window. Inspect its final status before retrying a release.' >&2
  exit "$WAIT_STATUS"
fi
if (( RESULT_STATUS != 0 )); then
  echo '::error::Could not retrieve the SSM execution result.' >&2
  exit "$RESULT_STATUS"
fi

echo 'SSM confirmed that the EC2 deployment commands completed successfully.'

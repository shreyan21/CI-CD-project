# AWS delivery workflow

[Back to project overview](../README.md)

## Current sequence

A push to `master` starts [`.github/workflows/ci.yml`](../.github/workflows/ci.yml). The runner checks out the source, assumes an AWS role through GitHub OIDC, logs in to ECR, runs backend tests, builds two images and pushes them to the `my-ecr` repository.

The frontend Dockerfile runs `npm run build`, then copies the output to Nginx. The backend image starts Node with watch mode. Images are currently published under the reused tags `backend-v2.0` and `frontend-v2.0`.

The final workflow step submits `AWS-RunShellScript` to the configured EC2 instance. Its commands enter `/home/ubuntu`, log in to ECR, start the database, pull/update frontend and backend containers, and execute `npm run db:migrate`.

The workflow currently ends after command submission. It does not wait for SSM to finish, capture remote stdout/stderr, verify application health, or perform automatic rollback.

## Configuration

| Repository variable | Purpose |
| --- | --- |
| `AWS_ROLE_ARN` | IAM role assumed by GitHub OIDC |
| `AWS_REGION` | AWS API region |
| `AWS_INSTANCE_ID` | Existing EC2 instance targeted by SSM |
| `ECR_REGISTRY` | Registry used by the remote Docker login |

Publishing commands currently contain the original registry URL and `my-ecr` repository. Reusing the workflow in another account requires changing those commands as well as the variables.

GitHub needs ECR push and scoped SSM command permissions. The EC2 host needs a working SSM agent, an appropriate instance role and ECR pull access. Scope the GitHub OIDC trust to the intended repository and branch. The repository does not contain Terraform or an IAM-policy provisioning script.

## The EC2 host has its own Compose configuration

The workflow does not copy the repository's Compose file or `.env` files to EC2. It runs the files already present in `/home/ubuntu`.

The checked-in Compose file is for local builds and names its images `backend:v1.0` and `frontend:v1.0`. The host's Compose file must instead reference the ECR image URLs/tags that the workflow publishes. Do not replace the host's file with the local file without adapting it. Keep the existing database volume, credentials and mount layout when updating a running environment.

For fresh local checkouts, CI now copies example environment files before `docker compose build`. The examples exist only to satisfy Compose configuration loading and contain no deployment credentials. Runtime configuration stays on the host.

## Verification still needed for a complete release claim

- Capture the SSM `CommandId`, wait for terminal status, and surface remote failures in Actions.
- Check the Nginx homepage, `/api/skills` JSON and the backend `/health` response after the update.
- Confirm both running image digests match the intended ECR release. Reused tags alone do not identify a commit.
- Record a successful migration result and a safe prior-image recovery procedure. Image rollback does not reverse schema migrations.

The existing [smoke-check script](../scripts/healthcheck.sh) checks the homepage and the content type returned by `/api/skills`; it is not yet called by the workflow. Nginx does not currently proxy `/health`.

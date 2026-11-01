# AWS delivery workflow

[Back to project overview](../README.md)

## Current sequence

A push to `master` starts [`.github/workflows/ci.yml`](../.github/workflows/ci.yml). The runner checks out the source, assumes an AWS role through GitHub OIDC, logs in to ECR, runs backend tests, builds two images and pushes them to the `my-ecr` repository.

The frontend Dockerfile runs `npm run build`, then copies the output to Nginx. The backend image starts Node with watch mode. Images are currently published under the reused tags `backend-v2.0` and `frontend-v2.0`.

The final workflow step runs `scripts/deploy.sh`. It sends `AWS-RunShellScript` to the configured EC2 instance, writes the shared health-only `docker-compose.override.yml` in `/home/ubuntu`, logs in to ECR and pulls both application images. Docker waits for PostgreSQL and the backend to become healthy, the script runs migrations, and Docker then starts/checks the frontend.

The script waits for the remote SSM result, prints its output and fails Actions on remote failure or timeout. The health checks run through Docker; there is no separate manual HTTP-check script. Automatic rollback is not implemented.

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

The workflow keeps the existing base `docker-compose.yml` and `.env` files on EC2. It sends only the health-only `docker-compose.override.yml`, which Docker merges with the existing base file. This preserves the host's image URLs, credential paths and database volume configuration.

The checked-in Compose file is for local builds and names its images `backend:v1.0` and `frontend:v1.0`. The host's Compose file must instead reference the ECR image URLs/tags that the workflow publishes. Do not replace the host's file with the local file without adapting it. Keep the existing database volume, credentials and mount layout when updating a running environment.

CI builds the frontend and backend directly from their Dockerfiles and neither reads nor creates runtime `.env` files. For local Compose use, manually create the root `.env` for the database password and `backend/.env` for backend settings. The frontend needs no environment file. Existing EC2 runtime configuration stays on the host.

## Verification still needed for a complete release claim

- Capture a new deployed run proving SSM completion and all three Docker services healthy.
- Verify the public website and browser/admin flow separately. Internal HTTP checks do not verify external access or allowed browser origins.
- Confirm both running image digests match the intended ECR release. Reused tags alone do not identify a commit.
- Record a successful migration result and a safe prior-image recovery procedure. Image rollback does not reverse schema migrations.

Health definitions live in [`docker-compose.override.yml`](../docker-compose.override.yml). PostgreSQL uses its standard `pg_isready`; the backend uses its existing `/health` endpoint; Nginx uses its bundled `wget` to check `/` and `/api/skills`. Docker manages retries, timing and status. View the result with `docker compose ps`. The frontend starts after migrations so a fresh database's missing tables do not cause a false deployment failure. Nginx does not currently proxy `/health`.

The existing `/health` implementation and its unit tests remain: they provide the backend probe and check its code behaviour, respectively. Docker is the single operational health-check mechanism. Health checks mark failures but do not automatically restart an unhealthy container or perform rollback.

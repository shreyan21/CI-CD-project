# AWS delivery workflow

[Back to project overview](../README.md)

## Current sequence

A push to `master` starts [`.github/workflows/ci.yml`](../.github/workflows/ci.yml). The runner checks out the source, assumes an AWS role through GitHub OIDC, logs in to ECR, runs backend tests, builds two images and pushes them to the `my-ecr` repository.

The frontend Dockerfile runs `npm run build`, then copies the output to Nginx. The backend image starts Node with watch mode. Images are currently published under the reused tags `backend-v2.0` and `frontend-v2.0`.

The final workflow step sends `AWS-RunShellScript` directly to EC2. Its commands enter `/home/ubuntu`, log in to ECR, start the database, pull/update the frontend and backend with `docker compose -f docker-compose.yml up -d --pull always --no-deps frontend backend`, then run migrations.

The workflow captures the SSM command ID, waits for its result and prints the output. The AWS CLI waiter has a short built-in limit, so a long image download can time out before the remote command finishes. Automatic HTTP health checks and rollback are not configured.

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

The workflow does not copy Compose or `.env` files to EC2. It uses the existing files in `/home/ubuntu` and preserves the host's credential paths and database volume configuration. Each remote Compose command selects `-f docker-compose.yml` explicitly, so any health override left from an earlier deployment is ignored. Server files are not deleted by this local rollback.

The checked-in Compose file is for local builds and names its images `backend:v1.0` and `frontend:v1.0`. The host's Compose file must instead reference the ECR image URLs/tags that the workflow publishes. Do not replace the host's file with the local file without adapting it. Keep the existing database volume, credentials and mount layout when updating a running environment.

CI builds the frontend and backend directly from their Dockerfiles and neither reads nor creates runtime `.env` files. For local Compose use, manually create the root `.env` for the database password and `backend/.env` for backend settings. The frontend needs no environment file. Existing EC2 runtime configuration stays on the host.

## Verification still needed for a complete release claim

- Capture the SSM result, then check the homepage, API and backend `/health` response manually.
- Verify the public website and browser/admin flow separately. Internal HTTP checks do not verify external access or allowed browser origins.
- Confirm both running image digests match the intended ECR release. Reused tags alone do not identify a commit.
- Record a successful migration result and a safe prior-image recovery procedure. Image rollback does not reverse schema migrations.

The existing [`scripts/healthcheck.sh`](../scripts/healthcheck.sh) provides simple manual homepage and API checks. The backend's `/health` endpoint checks PostgreSQL connectivity. The workflow does not run these HTTP checks automatically. Nginx does not currently proxy `/health`.

## How EC2 gets the new image

EC2 does not watch ECR. After publishing the images, GitHub sends SSM commands to EC2. After ECR login, `docker compose -f docker-compose.yml up -d --pull always --no-deps frontend backend` checks the configured ECR tags, downloads changed image layers and updates the application containers. The database container is left running by this application-update command.

The host Compose file must reference the full ECR image names. The tags are currently `backend-v2.0` and `frontend-v2.0`; the newest image under those tags is used, even though neither tag is named `latest`.

The equivalent separate commands are:

```bash
docker compose -f docker-compose.yml pull backend frontend
docker compose -f docker-compose.yml up -d --no-deps backend frontend
```

Pulling downloads the images; `up` updates the running containers when their images changed.

# Implementation and evidence

[Back to project overview](../README.md)

## Latest verified delivery — 10 November 2026

Reviewed [Actions run 42828479298](https://github.com/shreyan21/CI-CD-project/actions/runs/42828479298) and [job 129888177385](https://github.com/shreyan21/CI-CD-project/actions/runs/42828479298/job/129888177385) for commit [`f7be00a`](https://github.com/shreyan21/CI-CD-project/commit/f7be00a8da620297a5606e6f933fd9ab08a73fe5). The job completed successfully on **10 November 2026 at 19:52 IST** (14:22 UTC).

| Claim | Evidence | Limit |
| --- | --- | --- |
| Backend health unit tests pass | Running tests: 3 tests, 3 passed, 0 failed; [health.test.js](../backend/test/health.test.js) | The database is stubbed; this is not a real PostgreSQL integration suite |
| Both application images build and publish | Successful frontend/backend builds and ECR push digests below | Image tags are mutable |
| GitHub authenticates through OIDC | [ci.yml](../.github/workflows/ci.yml), role assumption and `id-token: write` | IAM policies/trust were not audited |
| SSM command completion is checked | `aws ssm wait command-executed` followed by `aws ssm get-command-invocation` | A waiter timeout can occur before a long remote operation finishes |
| Remote deployment command succeeded | Invocation `Status: Success`, `StatusDetails: Success`, `ResponseCode: 0` | Successful shell commands do not prove HTTP or browser health |
| Database migration command completed | stdout: `Database migrations are up to date.` | This does not prove a new schema migration was applied in that run |
| Failure diagnostics are implemented | Invocation output includes status, response code, stdout and stderr; the step exits with saved `WAIT_STATUS` | This successful run does not demonstrate an intentionally failed deployment test |

The remote command ran from **19:51:50 to 19:52:26 IST** (14:21:50–14:22:26 UTC). It logged in to ECR, ran the configured Compose updates and completed the migration command.

Image digests recorded by this run:

```text
backend-v2.0
sha256:de06be59485ca0c657c79f310be84c19acc71f8263c1da8063519193e9ab8aaa

frontend-v2.0
sha256:7446dca349283844610c2a6540c06cb3c85ad9132a8bb674805bf48614175141
```

These identify the pushed artifacts. The running EC2 image digests were not independently matched during this review.

## Current demo status — 11 November 2026

The owner reports that EC2 is stopped, so the live demo is offline. No current public availability claim is made. Source code, architecture and the successful recorded run remain inspectable.

## Earlier evidence

[Run 40129948952](https://github.com/shreyan21/CI-CD-project/actions/runs/40129948952), for commit `03acc4c`, recorded tests, image publishing and SSM command submission on 25 October 2026 IST. Its submission response was `Pending` with `CompletedCount: 0`. The newer run above supplies the terminal result that this earlier evidence lacked.

Older LinkedIn walkthroughs document earlier containerization and delivery milestones. Roadmap labels inside those historical attachments describe their state at creation; the current project description and this evidence record describe the latest verified implementation.

## Remaining verification

Automatic HTTP checks and rollback are not configured. On the next running deployment, verify the homepage, database-backed API, backend `/health`, browser/admin behavior and running image digests. The manual [healthcheck script](../scripts/healthcheck.sh) can help with homepage/API checks.

The project runs on a single EC2 host. High availability, zero downtime, full monitoring, Terraform provisioning, automatic rollback and end-to-end PostgreSQL test coverage are not implemented claims.

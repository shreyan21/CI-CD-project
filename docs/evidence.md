# Implementation and evidence

[Back to project overview](../README.md)

Reviewed against commit [`03acc4c`](https://github.com/shreyan21/CI-CD-project/commit/03acc4c5a683d5d3f4f4b6569ec0eafe0efd5fda), with the workflow completed on **25 October 2026 at 02:01 IST** (24 October 2026 at 20:31 UTC).

## Inspectable result

[GitHub Actions run 40129948952](https://github.com/shreyan21/CI-CD-project/actions/runs/40129948952) completed successfully. Its job steps and logs show backend tests, frontend/backend Docker builds, two ECR pushes and SSM command submission.

| Claim | Evidence | Limit |
| --- | --- | --- |
| Backend health tests pass | `Running tests` step; [`health.test.js`](../backend/test/health.test.js) | Three tests use a stubbed database |
| Frontend static build exists | [`frontend/Dockerfile`](../frontend/Dockerfile); successful Docker build | No UI/browser regression suite |
| Both application images published | Successful ECR push logs and digests below | Tags are mutable |
| GitHub authenticates through OIDC | [`ci.yml`](../.github/workflows/ci.yml) role assumption and `id-token: write` | IAM policies/trust were not audited |
| SSM deployment automation is implemented | `Sending commands to SSM agent on EC2` step | Log returns `Pending`, `CompletedCount: 0`; no terminal execution result |
| Runtime architecture is implemented in source | Compose, Nginx, Express routes and PostgreSQL migrations | Source inspection is not a current public availability test |

Image digests recorded by the linked run:

```text
backend-v2.0
sha256:b14b8814fb892f17b18577de65df5ace7de3feaae8f2c1409fcb6aa31fcea724

frontend-v2.0
sha256:fd654c98a354596ebbea02462f177174cf5d4bb15eaa8d2d6fd7389a77b058ae
```

These digests identify artifacts from that run. They have not been matched to running EC2 containers during this review.

## Claims reserved for later evidence

Do not describe the current project as highly available, zero-downtime, fully monitored, Terraform-provisioned, automatically rolled back or tested end to end against PostgreSQL. Do not claim that every green run proves successful EC2 deployment.

The owner has run the portfolio on EC2. The previously supplied public address was not independently reachable from the review environment; this does not establish an outage. A live demo link should be added after checking the site and its API externally.

## Add the next proof

Capture one remote SSM result with `Success`, matching running image digests and healthy API responses. A short demo should show the website, a source change, the workflow, the resulting release and a database-backed response. Redact secrets and admin cookies from all recordings.

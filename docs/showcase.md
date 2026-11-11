# Project showcase

[Back to project overview](../README.md)

## Project title

Portfolio Delivery on AWS | Docker & GitHub Actions CI/CD

## LinkedIn Projects description

The description below is synchronized with the LinkedIn project entry as of 11 November 2026.

Source code: https://github.com/shreyan21/CI-CD-project

A personal React + Express + PostgreSQL portfolio with an automated AWS delivery workflow.

IMPLEMENTED
• Containerized the three-service stack with Docker Compose and persistent PostgreSQL storage.
• Built a multi-stage frontend image: Nginx serves React and proxies /api requests to Express.
• Automated three backend health unit tests, two application image builds and Amazon ECR publishing with GitHub Actions on master.
• Used GitHub OIDC to assume an AWS IAM role and AWS Systems Manager to update application containers and run database migrations on EC2.
• Added aws ssm wait command-executed to wait for remote success, then aws ssm get-command-invocation to display status, response code, stdout and stderr. The workflow preserves the waiter's exit status so a failed command or waiter timeout fails the job.
• Diagnosed container database connectivity by replacing localhost with the Compose service name.

VERIFIED — 10 NOVEMBER 2026
Commit f7be00a: all three tests passed, both images were published to ECR, and SSM returned Success with ResponseCode 0. Migration output: "Database migrations are up to date."
Evidence: https://github.com/shreyan21/CI-CD-project/actions/runs/42828479298

STATUS
Personal portfolio lab. EC2 is currently stopped; the live demo is offline. Automatic HTTP health checks and rollback remain future work. Older walkthroughs show earlier milestones; their roadmap labels are historical.

Earlier animated walkthrough:
https://www.linkedin.com/feed/update/urn:li:activity:7521446871475662849/

## Project media

- Current architecture: [delivery-overview.png](architecture/delivery-overview.png). It includes SSM waiting/result inspection and the stopped EC2 demo status.
- Current CI/CD summary: [ci-pipeline.png](architecture/ci-pipeline.png).
- Earlier LinkedIn walkthroughs are historical milestones. Their captions identify that scope; the current implementation is described above.

Keep the GitHub source link in the project description. Use an actual architecture image for the media tile if LinkedIn cannot generate a GitHub link preview.

## LinkedIn post draft

The most useful part of building my portfolio happened after the page worked: getting the frontend, API, database and deployment pipeline to work together.

I built a React + Express + PostgreSQL application, then added:

- Docker Compose for the three-service stack and persistent database storage.
- A multi-stage frontend image with Nginx serving React and forwarding /api requests to Express.
- GitHub Actions to run three backend health unit tests, build both application images and publish them to Amazon ECR.
- GitHub OIDC for AWS authentication and Systems Manager commands to update the application containers on EC2 and run migrations.
- SSM command waiting and invocation output so the workflow checks remote completion and exposes command-failure details.

The 10 November run passed the tests, published both images and returned SSM Success with response code 0. Its migration output confirmed that the database was up to date.

My takeaway: command submission, remote command success and application health are separate checks. I now wait for the remote result; automatic HTTP checks are the next improvement.

EC2 is currently stopped, so the demo is offline. The repository and recorded run show the work:
https://github.com/shreyan21/CI-CD-project

I'm exploring junior Cloud/DevOps and application support opportunities where I can build on this hands-on work.

#DevOps #AWS #Docker #GitHubActions #CloudEngineering

This is a draft; it has not been posted.

## Two-minute demonstration

| Time | Show |
| --- | --- |
| 0:00-0:25 | Current architecture and the stopped EC2 demo status |
| 0:25-0:50 | Nginx -> Express -> PostgreSQL; service names and persistent volume |
| 0:50-1:20 | Linked 10 November Actions run: three tests, two image pushes and OIDC |
| 1:20-1:40 | SSM waiter, invocation Success/response code 0 and migration stdout |
| 1:40-2:00 | One troubleshooting example; explain the remaining HTTP health check |

For a live demonstration, start EC2 separately and verify the website/API before sharing a public demo URL.

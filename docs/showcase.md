# Project showcase

[Back to project overview](../README.md)

## Project title

Portfolio Delivery on AWS | Docker, GitHub Actions, ECR and EC2

## LinkedIn Featured / Projects description

Built a React, Express and PostgreSQL portfolio and used it to practise application delivery on AWS. Docker Compose runs Nginx, the API and a persistent database. GitHub Actions tests the backend, builds two images, publishes to ECR through OIDC and submits EC2 deployment commands through AWS Systems Manager. Includes architecture, reproducible setup and linked pipeline evidence. Release-completion checks are the next improvement.

Repository: https://github.com/shreyan21/CI-CD-project

Suggested skills: Docker, GitHub Actions, Amazon Web Services, Linux, CI/CD, Nginx, PostgreSQL.

## LinkedIn post draft

The most useful part of building my portfolio happened after the page worked: getting the frontend, API, database and deployment pipeline to work together.

I built a React + Express + PostgreSQL application, then added:

- Docker Compose for the three-service stack and persistent database storage.
- A multi-stage frontend image with Nginx serving React and forwarding /api requests to Express.
- GitHub Actions to run backend health tests, build both application images and publish them to Amazon ECR.
- GitHub OIDC for AWS authentication and Systems Manager commands to update the containers on EC2 and run migrations.

My biggest takeaway: a green pipeline needs a precise definition. My current workflow confirms that AWS accepted the deployment command; waiting for the remote result and checking application health is the next improvement.

Working through database connections, browser origins and Nginx routing made the architecture much clearer to me than studying each tool separately.

I've documented the setup, architecture and actual pipeline evidence here:
https://github.com/shreyan21/CI-CD-project

I'm exploring junior Cloud/DevOps and application support opportunities where I can build on this hands-on work.

#DevOps #AWS #Docker #GitHubActions #CloudEngineering

## Two-minute demonstration

| Time | Show |
| --- | --- |
| 0:00-0:25 | Portfolio UI and a real `/api/skills` response; check that fallback mode is absent |
| 0:25-0:50 | Nginx -> Express -> PostgreSQL; explain service names and persistent volume |
| 0:50-1:20 | Successful Actions run, tests, two image pushes and OIDC configuration |
| 1:20-1:40 | SSM deployment commands; distinguish submission from remote completion |
| 1:40-2:00 | One troubleshooting example you can explain, then the next health-verification improvement |

Use the architecture image as the post attachment. Add the repository link to LinkedIn Featured and pin the repository on GitHub. Add a public demo URL only after verifying that the site and API work from outside AWS. The draft is prepared for review; it has not been posted.

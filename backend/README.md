# Utkarsh Portfolio API

Express + PostgreSQL API for public portfolio data and authenticated skill management.

## Main commands

```powershell
npm.cmd ci
npm.cmd run db:init
npm.cmd run dev
```

Tests:

```powershell
npm.cmd test
npm.cmd run test:health
npm.cmd run test:integration
```

The health tests send HTTP requests to `/health` on a temporary local server and
cover successful responses, database failures, and recovery. They use a stubbed
database, so PostgreSQL and environment secrets are not required. These tests
verify the endpoint's behavior; they do not verify a live PostgreSQL connection.

For a GitHub Actions step, set `working-directory: backend`, install dependencies
with `npm ci`, and run `npm test` (or `npm run test:health` for only health tests).
Use Node.js 22 or newer.

Create or reset the database-backed admin account:

```powershell
npm.cmd run auth:reset -- admin
```

The command securely prompts for the password, hashes it, and saves only the hash in PostgreSQL. No admin username or password hash is needed in `.env`.

Admin auth uses a short-lived server-side PostgreSQL session, an HTTP-only SameSite cookie, and a CSRF token. No admin password or API key is stored in frontend code.

Database migrations live in `migrations/`. Seed data uses conflict-safe inserts and does not truncate existing rows.

See [SETUP.md](../SETUP.md) for complete setup.

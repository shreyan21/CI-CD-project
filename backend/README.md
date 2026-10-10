# Portfolio API

Express + PostgreSQL API for public portfolio data and authenticated skills management.

[Main setup, architecture and CI guide](../README.md) · [Local setup](../README.md#run-locally) · [Test scope](../README.md#tests-and-builds)

| Command | Purpose |
| --- | --- |
| `npm ci` | Install lockfile dependencies |
| `npm run dev` | Start the API with Node watch mode |
| `npm start` | Start the API without watch mode |
| `npm run db:migrate` | Apply database migrations |
| `npm run db:seed` | Insert initial data while preserving existing rows |
| `npm run db:init` | Run migrations and seed |
| `npm run auth:reset -- admin` | Prompt for a password and create/reset a database-backed admin |
| `npm test` | Run the checked-in mocked health tests |
| `npm run test:health` | Run only `test/health.test.js` |

The health tests use a stubbed database and do not require PostgreSQL. They cover success, failure and recovery of `/health`.

The `test:integration` script references a missing `test/integration.test.js`; it is not a working integration suite yet.

In Compose, database connections use host `db`; when running the backend directly on the host, use `localhost` and matching PostgreSQL credentials. Keep session secrets outside Git.

Admin authentication uses PostgreSQL sessions, an HTTP-only SameSite cookie and CSRF protection. The password-reset command stores a password hash and invalidates older sessions.


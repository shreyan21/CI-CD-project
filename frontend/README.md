# Portfolio frontend

React + Vite public portfolio and skills admin UI.

[Main setup, architecture and CI guide](../README.md) · [Local setup](../README.md#run-locally) · [Build checks](../README.md#tests-and-builds)

| Command | Purpose |
| --- | --- |
| `npm ci` | Install lockfile dependencies |
| `npm run dev` | Start Vite on port 5173 |
| `npm run build` | Build static production assets |
| `npm run preview` | Preview the built assets locally |

- Public site: `http://localhost:5173`
- Admin UI: `http://localhost:5173/admin`
- API base: `VITE_API_URL=http://localhost:4000/api`

The browser uses the host API URL, not the Compose service name. Keep the frontend and API hostname consistent for admin cookies. `VITE_` values reach browser code and must not contain secrets.

The current Dockerfile runs Vite's development server. A production frontend build is a separate local command and is not yet a dedicated CI step.


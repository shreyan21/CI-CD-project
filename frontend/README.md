# Portfolio frontend

React + Vite public portfolio and skills admin UI.

[Main setup, architecture and CI guide](../README.md) · [Local setup](../README.md#run-locally) · [Build checks](../README.md#tests-and-builds)

| Command | Purpose |
| --- | --- |
| `npm ci` | Install lockfile dependencies |
| `npm run dev` | Start Vite on port 5173 |
| `npm run build` | Build static production assets |
| `npm run preview` | Preview the built assets locally |

- Compose public site: `http://localhost`
- Compose admin UI: `http://localhost/admin`
- API base: `/api`, defined in `src/lib/api.js`

Nginx forwards `/api/` to `http://backend:4000`. The browser does not resolve Compose service names. Keep the frontend and API on the same origin for admin cookies. `VITE_API_URL` is not currently read by the code; `VITE_` values must never contain secrets.

The Dockerfile uses a Node build stage to run `npm run build`, then copies `dist/` into Nginx. This build is executed when CI builds the frontend image. A standalone Vite dev server still uses port 5173, but needs an API proxy/configuration for `/api` and is not the documented Compose runtime.



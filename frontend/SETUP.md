# Utkarsh Portfolio Admin — Simple Setup Guide

This project has two folders:

- Backend: `D:\backend_portfolio\backend`
- Frontend: `D:\frontend_portfolio\frontend`

Use **localhost everywhere**. Do not mix `localhost` and `127.0.0.1`, because the secure admin cookie is tied to the hostname.

## 1. Install required software

Install these first:

- Node.js 20 or newer
- PostgreSQL
- npm, which comes with Node.js

Check them in PowerShell:

```powershell
node --version
npm.cmd --version
psql --version
```

## 2. Create the PostgreSQL database

Open PowerShell:

```powershell
psql -U postgres
```

Inside PostgreSQL, run:

```sql
CREATE DATABASE utkarsh_portfolio;
```

Exit PostgreSQL:

```text
\q
```

## 3. Configure the backend

Open backend folder:

```powershell
cd D:\backend_portfolio\backend
Test-Path .env
```

If result is `False`, create it:

```powershell
Copy-Item .env.example .env
```

If result is `True`, **do not copy over it**. Keep existing database settings and add the missing admin settings below.

Open `.env` in a text editor.

Set database connection:

```env
PORT=4000
DATABASE_URL=postgresql://postgres:YOUR_POSTGRES_PASSWORD@localhost:5432/utkarsh_portfolio
FRONTEND_ORIGIN=http://localhost:5173
PGSSL=false
DB_POOL_SIZE=10
```

Do not commit `.env`. It contains secrets.

### Choose admin username

Add your own username:

```env
ADMIN_USERNAME=YOUR_CHOSEN_USERNAME
```

### Create admin password hash

Choose your own strong password. Run:

```powershell
npm.cmd run auth:hash -- "YOUR_OWN_LONG_PASSWORD"
```

Command prints a long value beginning with `scrypt$`.

Copy full value into `.env`:

```env
ADMIN_PASSWORD_HASH=PASTE_FULL_HASH_HERE
```

Do not put plain password in `.env`.

### Create session secret

Run:

```powershell
node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"
```

Copy output into `.env`:

```env
SESSION_SECRET=PASTE_RANDOM_VALUE_HERE
COOKIE_SECURE=false
```

Use `COOKIE_SECURE=false` only for local HTTP.

## 4. Install backend and prepare database

In backend folder:

```powershell
npm.cmd ci
npm.cmd run db:init
```

`db:init` runs safe migrations and safe seed data.

It does **not** delete skills you added earlier.

Start backend:

```powershell
npm.cmd run dev
```

Check health in browser:

```text
http://localhost:4000/health
```

Expected result contains:

```json
{"status":"ok","database":"connected"}
```

Keep this PowerShell window open.

## 5. Configure frontend

Open a second PowerShell window:

```powershell
cd D:\frontend_portfolio\frontend
Test-Path .env
```

If result is `False`, create it with `Copy-Item .env.example .env`. If result is `True`, keep the existing file and check its value.

Frontend `.env` must contain:

```env
VITE_API_URL=http://localhost:4000/api
```

Install and start:

```powershell
npm.cmd ci
npm.cmd run dev
```

Keep this window open.

## 6. Open portfolio and admin

Public portfolio:

```text
http://localhost:5173
```

Admin panel:

```text
http://localhost:5173/admin
```

Sign in with:

- username you placed in `ADMIN_USERNAME`
- plain password you chose before creating `ADMIN_PASSWORD_HASH`

## 7. Manage skills

Inside admin panel:

1. Click **Add skill**.
2. Enter skill name.
3. Choose existing category or type new category.
4. Choose level.
5. Set percentage only when you can defend that number.
6. Click **Add skill**.
7. Use up/down arrows to change order.
8. Use pencil button to edit.
9. Use trash button to delete.
10. Open **View site** to confirm public result.

Changes save in PostgreSQL. Public portfolio reads same data.

## 8. Run tests

Backend unit tests:

```powershell
cd D:\backend_portfolio\backend
npm.cmd test
```

Full API + temporary PostgreSQL test:

```powershell
npm.cmd run test:integration
```

This command creates a disposable test database, runs login/add/edit/reorder/read/delete checks, then removes test database.

Frontend production build:

```powershell
cd D:\frontend_portfolio\frontend
npm.cmd run build
```

## 9. Make a database backup

Before major changes:

```powershell
pg_dump -U postgres -d utkarsh_portfolio -F c -f utkarsh_portfolio.backup
```

Restore example:

```powershell
pg_restore -U postgres -d utkarsh_portfolio --clean --if-exists utkarsh_portfolio.backup
```

Only use restore when you understand that it replaces database content.

## 10. Production settings

Before internet deployment:

- Use HTTPS.
- Set `COOKIE_SECURE=true`.
- Set `FRONTEND_ORIGIN` to exact public frontend URL.
- Use strong unique admin password.
- Use new random `SESSION_SECRET`.
- Keep `.env` outside Git.
- Run frontend and API behind one domain when possible.
- Back up PostgreSQL regularly.
- Do not expose PostgreSQL port publicly.
- Do not use test credentials.

Example:

```env
NODE_ENV=production
FRONTEND_ORIGIN=https://your-domain.example
COOKIE_SECURE=true
```

## Common problems

### “Admin access is not configured”

One or more values are missing:

- `ADMIN_USERNAME`
- `ADMIN_PASSWORD_HASH`
- `SESSION_SECRET`

Restart backend after fixing `.env`.

### Login succeeds, but admin list says unauthorized

You probably mixed hostnames.

Use:

- `http://localhost:5173/admin`
- `http://localhost:4000/api`

Do not use `127.0.0.1` for one and `localhost` for other.

### CORS error

Set exact frontend address:

```env
FRONTEND_ORIGIN=http://localhost:5173
```

Restart backend.

### Database connection error

Check:

- PostgreSQL service is running.
- Database name is correct.
- PostgreSQL username/password are correct.
- `DATABASE_URL` has correct port, normally `5432`.

### Public site shows local fallback data

Backend is stopped or API cannot connect to database.

Check:

```text
http://localhost:4000/health
```

Then restart backend and refresh portfolio.

# Rotate previously committed credentials

Earlier commits contain a backend `.env` file with a database connection credential, a session secret and a legacy admin password hash. The frontend `.env` contains a public API URL. The current tree no longer tracks runtime environment files; the original values remain in Git history.

A scan of the 33 commits reachable at the time of this cleanup found no AWS access-key IDs, GitHub token patterns or private-key headers. This is a limited pattern scan, not a guarantee that every possible secret format was detected.

## Existing installations

1. Back up any PostgreSQL data you need. Generate a new unique database password using the README command. If the exposed database credential was reused elsewhere, rotate it there too.
2. For an existing local Compose database, open an interactive PostgreSQL prompt while the old configuration still works:

   ```bash
   docker compose exec db psql -U admin -d utkarsh_portfolio
   ```

   At the PostgreSQL prompt, run `\password admin` and enter the new password twice, then `\q`. The interactive command avoids putting the password in shell history. For a hosted database, use its provider's password-rotation process instead.
3. Set the new password in the root `.env` (`POSTGRES_PASSWORD`) and in `backend/.env` (`DATABASE_URL`). Compose uses the root password for the API connection. Changing the Compose variable alone does not rotate an existing database password.
4. Generate a new `SESSION_SECRET`, update `backend/.env`, and restart the backend. Old session cookies will no longer authenticate. Remove the unused `ADMIN_USERNAME` and `ADMIN_PASSWORD_HASH` entries from your local file.
5. If the legacy admin password was ever used, reset the actual database-backed admin account with `docker compose exec backend npm run auth:reset -- admin`. This prompts for a new password and invalidates that user's stored sessions. Rotate any reused password on other services as well.
6. Run `docker compose up -d`, then verify `curl --fail http://localhost:4000/health` and sign in again with the new admin password.

For a fresh clone, create new local values from the examples; do not copy credentials from old commits. No remote database or cloud credentials were rotated by the repository cleanup.

## Git history

Deleting a tracked file does not remove earlier copies. Rotation is required even if history is later rewritten, because copies may exist in clones, forks or caches. This cleanup preserves commit history. Any later history rewrite should be coordinated with collaborators and followed by fresh clones; do not force-push over other people's work casually.

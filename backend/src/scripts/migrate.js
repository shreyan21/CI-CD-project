import { pool } from '../db.js'
import { runMigrations } from '../migrations.js'

try {
  await runMigrations(pool)
  console.log('Database migrations are up to date.')
} finally {
  await pool.end()
}

import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const moduleDir = path.dirname(fileURLToPath(import.meta.url))
export const defaultMigrationsDir = path.resolve(moduleDir, '../migrations')

export async function runMigrations(db, migrationsDir = defaultMigrationsDir) {
  await db.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)
  const files = (await fs.readdir(migrationsDir)).filter((file) => file.endsWith('.sql')).sort()
  const applied = await db.query('SELECT filename FROM schema_migrations')
  const completed = new Set(applied.rows.map((row) => row.filename))

  for (const filename of files) {
    if (completed.has(filename)) continue
    const sql = await fs.readFile(path.join(migrationsDir, filename), 'utf8')
    const client = await db.connect()
    try {
      await client.query('BEGIN')
      await client.query(sql)
      await client.query('INSERT INTO schema_migrations(filename) VALUES($1)', [filename])
      await client.query('COMMIT')
      console.log(`Applied migration ${filename}`)
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }
}

import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { pool } from '../db.js'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(scriptDir, '../../')

try {
  const seed = await fs.readFile(path.join(root, 'sql/seed.sql'), 'utf8')
  await pool.query(seed)
  console.log('Safe seed completed; existing rows were preserved.')
} finally {
  await pool.end()
}

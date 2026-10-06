import { spawnSync } from 'node:child_process'
import pg from 'pg'
import 'dotenv/config'

const { Client } = pg
const TEST_DATABASE = 'utkarsh_portfolio_integration_test'

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is required to create the disposable integration database.')
  process.exit(1)
}

const source = new URL(process.env.DATABASE_URL)
const maintenanceUrl = new URL(source)
maintenanceUrl.pathname = '/postgres'
const testUrl = new URL(source)
testUrl.pathname = `/${TEST_DATABASE}`
const maintenance = new Client({ connectionString: maintenanceUrl.toString() })

async function dropTestDatabase() {
  await maintenance.query(
    'SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid <> pg_backend_pid()',
    [TEST_DATABASE],
  )
  await maintenance.query(`DROP DATABASE IF EXISTS ${TEST_DATABASE}`)
}

let exitCode = 1
try {
  await maintenance.connect()
  await dropTestDatabase()
  await maintenance.query(`CREATE DATABASE ${TEST_DATABASE}`)
  const result = spawnSync(process.execPath, ['--test', 'test/integration.test.js'], {
    cwd: process.cwd(),
    env: { ...process.env, TEST_DATABASE_URL: testUrl.toString() },
    stdio: 'inherit',
  })
  exitCode = result.status ?? 1
} finally {
  if (maintenance._connected) {
    await dropTestDatabase()
    await maintenance.end()
  }
}

process.exit(exitCode)

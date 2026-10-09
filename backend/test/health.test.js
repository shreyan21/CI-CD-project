import assert from 'node:assert/strict'
import { once } from 'node:events'
import test from 'node:test'
import { createApp } from '../src/app.js'

const timestamp = new Date('2026-01-01T12:00:00.000Z')

async function startHealthServer(t, query) {
  const logger = { error: t.mock.fn() }
  const app = createApp({
    db: { query },
    env: { NODE_ENV: 'test' },
    logger,
  })
  // An ephemeral port lets these tests run alongside an existing backend.
  const server = app.listen(0, '127.0.0.1')
  t.after(async () => {
    await new Promise((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve())
      server.closeAllConnections()
    })
  })
  await once(server, 'listening')

  return {
    logger,
    health: () => fetch(`http://127.0.0.1:${server.address().port}/health`, {
      signal: AbortSignal.timeout(5_000),
    }),
  }
}

test('GET /health returns database status and timestamp without authentication', async (t) => {
  const query = t.mock.fn(async () => ({ rows: [{ now: timestamp }] }))
  const { health, logger } = await startHealthServer(t, query)

  const response = await health()

  assert.equal(response.status, 200)
  assert.match(response.headers.get('content-type'), /^application\/json\b/)
  assert.deepEqual(await response.json(), {
    status: 'ok',
    database: 'connected',
    timestamp: timestamp.toISOString(),
  })
  assert.equal(query.mock.callCount(), 1)
  assert.equal(logger.error.mock.callCount(), 0)
})

test('GET /health returns 500 when the database fails without exposing error details', async (t) => {
  const databaseError = new Error('Database connection failed: internal-host:5432')
  const query = t.mock.fn(async () => { throw databaseError })
  const { health, logger } = await startHealthServer(t, query)

  const response = await health()

  assert.equal(response.status, 500)
  assert.match(response.headers.get('content-type'), /^application\/json\b/)
  assert.deepEqual(await response.json(), {
    error: 'The server could not complete the request.',
  })
  assert.equal(query.mock.callCount(), 1)
  assert.equal(logger.error.mock.callCount(), 1)
  assert.equal(logger.error.mock.calls[0].arguments[0], databaseError)
})

test('GET /health checks the database again and recovers after a temporary failure', async (t) => {
  let databaseAvailable = false
  const query = t.mock.fn(async () => {
    if (!databaseAvailable) throw new Error('Database temporarily unavailable')
    return { rows: [{ now: timestamp }] }
  })
  const { health } = await startHealthServer(t, query)

  const failedResponse = await health()
  assert.equal(failedResponse.status, 500)
  await failedResponse.json()

  databaseAvailable = true
  const recoveredResponse = await health()
  assert.equal(recoveredResponse.status, 200)
  assert.deepEqual(await recoveredResponse.json(), {
    status: 'ok',
    database: 'connected',
    timestamp: timestamp.toISOString(),
  })
  assert.equal(query.mock.callCount(), 2)
})

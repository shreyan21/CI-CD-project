import 'dotenv/config'
import { createApp } from './app.js'
import { pool } from './db.js'

const port = Number(process.env.PORT || 4000)
const app = createApp({ db: pool, env: process.env })

const server = app.listen(port, '0.0.0.0', () => {
  console.log(`Portfolio API listening on http://backend:${port}`)
})

async function shutdown(signal) {
  console.log(`${signal} received; closing server.`)
  server.close(async () => {
    await pool.end()
    process.exit(0)
  })
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))

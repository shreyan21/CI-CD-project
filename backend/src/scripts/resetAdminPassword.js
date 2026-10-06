import readline from 'node:readline'
import { pool } from '../db.js'
import { resetAdminPassword } from '../auth.js'
import { runMigrations } from '../migrations.js'

function readHidden(prompt) {
  return new Promise((resolve, reject) => {
    if (!process.stdin.isTTY || !process.stdout.isTTY || typeof process.stdin.setRawMode !== 'function') {
      reject(new Error('Run this command in an interactive terminal so the password can be entered securely.'))
      return
    }

    readline.emitKeypressEvents(process.stdin)
    const wasRaw = process.stdin.isRaw
    let value = ''

    const finish = (error) => {
      process.stdin.off('keypress', onKeypress)
      process.stdin.setRawMode(Boolean(wasRaw))
      process.stdin.pause()
      process.stdout.write('\n')
      if (error) reject(error)
      else resolve(value)
    }

    const onKeypress = (text, key = {}) => {
      if (key.ctrl && key.name === 'c') {
        finish(new Error('Password reset cancelled.'))
      } else if (key.name === 'return' || key.name === 'enter') {
        finish()
      } else if (key.name === 'backspace') {
        if (value) {
          value = [...value].slice(0, -1).join('')
          process.stdout.write('\b \b')
        }
      } else if (!key.ctrl && !key.meta && text) {
        value += text
        process.stdout.write('*'.repeat([...text].length))
      }
    }

    process.stdout.write(prompt)
    process.stdin.setRawMode(true)
    process.stdin.resume()
    process.stdin.on('keypress', onKeypress)
  })
}

const username = process.argv[2]

if (!username) {
  console.error('Usage: npm run auth:reset -- <username>')
  process.exitCode = 1
  await pool.end()
} else {
  try {
    const password = await readHidden('New password (at least 12 characters): ')
    const confirmation = await readHidden('Confirm new password: ')
    if (password !== confirmation) throw new Error('Passwords do not match.')

    await runMigrations(pool)
    const admin = await resetAdminPassword(pool, username, password)
    console.log(`Admin password saved in PostgreSQL for "${admin.username}". Existing sessions were signed out.`)
  } catch (error) {
    console.error(error.message)
    process.exitCode = 1
  } finally {
    await pool.end()
  }
}

import crypto from 'node:crypto'

const SESSION_COOKIE = 'portfolio_admin_session'
const SESSION_HOURS = 12

function safeEqual(left, right) {
  const a = Buffer.from(String(left || ''))
  const b = Buffer.from(String(right || ''))
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

export function hashPassword(password, salt = crypto.randomBytes(16).toString('base64url')) {
  if (typeof password !== 'string' || password.length < 12) {
    throw new Error('Password must contain at least 12 characters.')
  }
  const digest = crypto.scryptSync(password, salt, 64).toString('base64url')
  return `scrypt$${salt}$${digest}`
}

export function verifyPassword(password, encodedHash) {
  const [algorithm, salt, expected] = String(encodedHash || '').split('$')
  if (algorithm !== 'scrypt' || !salt || !expected || typeof password !== 'string') return false
  try {
    const actual = crypto.scryptSync(password, salt, 64).toString('base64url')
    return safeEqual(actual, expected)
  } catch {
    return false
  }
}

export function validateAdminUsername(username) {
  const normalized = typeof username === 'string' ? username.trim() : ''
  if (!/^[A-Za-z0-9._-]{3,64}$/.test(normalized)) {
    throw new Error('Username must be 3 to 64 characters and use only letters, numbers, dots, underscores, or hyphens.')
  }
  return normalized
}

export async function resetAdminPassword(db, username, password) {
  const normalizedUsername = validateAdminUsername(username)
  const passwordHash = hashPassword(password)
  const client = await db.connect()
  try {
    await client.query('BEGIN')
    await client.query(
      `INSERT INTO admin_users(username, password_hash)
       VALUES($1, $2)
       ON CONFLICT(username) DO UPDATE
       SET password_hash = EXCLUDED.password_hash, updated_at = NOW()`,
      [normalizedUsername, passwordHash],
    )
    await client.query('DELETE FROM admin_sessions WHERE username = $1', [normalizedUsername])
    await client.query('COMMIT')
    return { username: normalizedUsername }
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

function tokenDigest(token, secret) {
  return crypto.createHmac('sha256', secret).update(token).digest('hex')
}

function parseCookies(header = '') {
  return header.split(';').reduce((cookies, item) => {
    const separator = item.indexOf('=')
    if (separator === -1) return cookies
    const key = item.slice(0, separator).trim()
    const value = item.slice(separator + 1).trim()
    if (key) cookies[key] = decodeURIComponent(value)
    return cookies
  }, {})
}

function cookieOptions(env, maxAge) {
  const secure = env.COOKIE_SECURE === 'true' || env.NODE_ENV === 'production'
  return [
    `${SESSION_COOKIE}=`,
    'HttpOnly',
    'SameSite=Strict',
    secure ? 'Secure' : null,
    'Path=/api/admin',
    `Max-Age=${maxAge}`,
  ].filter(Boolean)
}

export function clearSessionCookie(res, env) {
  res.setHeader('Set-Cookie', cookieOptions(env, 0).join('; '))
}

export function setSessionCookie(res, env, token) {
  const parts = cookieOptions(env, SESSION_HOURS * 60 * 60)
  parts[0] = `${SESSION_COOKIE}=${encodeURIComponent(token)}`
  res.setHeader('Set-Cookie', parts.join('; '))
}

export async function createSession(db, username, sessionSecret) {
  const token = crypto.randomBytes(32).toString('base64url')
  const csrfToken = crypto.randomBytes(24).toString('base64url')
  const expiresAt = new Date(Date.now() + SESSION_HOURS * 60 * 60 * 1000)
  await db.query('DELETE FROM admin_sessions WHERE expires_at <= NOW()')
  await db.query(
    'INSERT INTO admin_sessions(token_hash, username, csrf_token, expires_at) VALUES($1, $2, $3, $4)',
    [tokenDigest(token, sessionSecret), username, csrfToken, expiresAt],
  )
  return { token, csrfToken, expiresAt }
}

export function adminAuth({ db, env, optional = false }) {
  return async function requireAdmin(req, res, next) {
    try {
      const token = parseCookies(req.headers.cookie)[SESSION_COOKIE]
      if (!token) return optional ? res.json({ authenticated: false }) : res.status(401).json({ error: 'Sign in to continue.' })

      const { rows } = await db.query(
        `SELECT token_hash, username, csrf_token, expires_at
         FROM admin_sessions
         WHERE token_hash = $1 AND expires_at > NOW()
         LIMIT 1`,
        [tokenDigest(token, env.SESSION_SECRET)],
      )
      const session = rows[0]
      if (!session) {
        clearSessionCookie(res, env)
        return optional ? res.json({ authenticated: false }) : res.status(401).json({ error: 'Your session has expired. Sign in again.' })
      }

      if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        const csrf = req.header('x-csrf-token')
        if (!safeEqual(csrf, session.csrf_token)) {
          return res.status(403).json({ error: 'Security check failed. Refresh the page and try again.' })
        }
      }

      req.admin = {
        username: session.username,
        csrfToken: session.csrf_token,
        tokenHash: session.token_hash,
      }
      next()
    } catch (error) {
      next(error)
    }
  }
}

export function validAdminConfiguration(env) {
  return Boolean(env.SESSION_SECRET?.length >= 32)
}

export { SESSION_COOKIE }

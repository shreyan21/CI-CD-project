import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import { adminAuth, clearSessionCookie, createSession, setSessionCookie, validAdminConfiguration, verifyPassword } from './auth.js'
import { validateReorder, validateSkill, validateSkillId } from './validation.js'

const asyncRoute = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next)

function originList(value, nodeEnv) {
  const configured = String(value || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
  if (nodeEnv !== 'production') {
    configured.push('http://localhost:5173', 'http://127.0.0.1:5173')
  }
  return [...new Set(configured)]
}

function skillSelect() {
  return `SELECT id, category, name, level, proficiency, sort_order AS "sortOrder", updated_at AS "updatedAt"
          FROM skills`
}

function databaseError(error, res) {
  if (error?.code === '23505') {
    return res.status(409).json({ error: 'That skill already exists in this category.' })
  }
  throw error
}

export function createApp({ db, env = process.env, logger = console }) {
  const app = express()
  const allowedOrigins = originList(env.FRONTEND_ORIGIN, env.NODE_ENV)

  app.disable('x-powered-by')
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'same-site' } }))
  app.use(cors({
    credentials: true,
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true)
      return callback(new Error('Origin is not allowed by CORS.'))
    },
  }))
  app.use(express.json({ limit: '32kb' }))
  if (env.NODE_ENV !== 'test') app.use(morgan('combined'))
  app.use('/api', rateLimit({ windowMs: 60_000, limit: 120, standardHeaders: true, legacyHeaders: false }))

  app.get('/health', asyncRoute(async (_req, res) => {
    const result = await db.query('SELECT NOW() AS now')
    res.json({ status: 'ok', database: 'connected', timestamp: result.rows[0].now })
  }))

  app.get('/api/profile', asyncRoute(async (_req, res) => {
    const { rows } = await db.query('SELECT name, headline, location, summary, email, linkedin, github FROM profile ORDER BY id LIMIT 1')
    if (!rows[0]) return res.status(404).json({ error: 'Profile has not been configured.' })
    res.json(rows[0])
  }))

  app.get('/api/skills', asyncRoute(async (_req, res) => {
    const { rows } = await db.query(`${skillSelect()} ORDER BY sort_order, id`)
    res.json(rows)
  }))

  app.get('/api/experience', asyncRoute(async (_req, res) => {
    const { rows } = await db.query(`
      SELECT e.id, e.company, e.role, e.period, e.location,
        COALESCE(json_agg(b.body ORDER BY b.sort_order) FILTER (WHERE b.id IS NOT NULL), '[]') AS bullets
      FROM experience e
      LEFT JOIN experience_bullets b ON b.experience_id = e.id
      GROUP BY e.id
      ORDER BY e.sort_order, e.id
    `)
    res.json(rows)
  }))

  app.get('/api/certifications', asyncRoute(async (_req, res) => {
    const { rows } = await db.query('SELECT id, title, sort_order AS "sortOrder" FROM certifications ORDER BY sort_order, id')
    res.json(rows)
  }))

  const loginLimiter = rateLimit({
    windowMs: 15 * 60_000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many sign-in attempts. Try again later.' },
  })

  app.post('/api/admin/auth/login', loginLimiter, asyncRoute(async (req, res) => {
    if (!validAdminConfiguration(env)) {
      return res.status(503).json({ error: 'Admin access is not configured on the server.' })
    }
    const username = typeof req.body?.username === 'string' ? req.body.username.trim() : ''
    const password = typeof req.body?.password === 'string' ? req.body.password : ''
    const { rows } = await db.query(
      'SELECT username, password_hash FROM admin_users WHERE username = $1 LIMIT 1',
      [username],
    )
    const admin = rows[0]
    if (!admin || !verifyPassword(password, admin.password_hash)) {
      return res.status(401).json({ error: 'The username or password is incorrect.' })
    }
    const session = await createSession(db, admin.username, env.SESSION_SECRET)
    setSessionCookie(res, env, session.token)
    res.json({ user: { username: admin.username }, csrfToken: session.csrfToken, expiresAt: session.expiresAt })
  }))

  const requireAdmin = adminAuth({ db, env })

  app.get('/api/admin/auth/session', adminAuth({ db, env, optional: true }), (req, res) => {
    res.json({ authenticated: true, user: { username: req.admin.username }, csrfToken: req.admin.csrfToken })
  })

  app.post('/api/admin/auth/logout', requireAdmin, asyncRoute(async (req, res) => {
    await db.query('DELETE FROM admin_sessions WHERE token_hash = $1', [req.admin.tokenHash])
    clearSessionCookie(res, env)
    res.status(204).end()
  }))

  app.get('/api/admin/skills', requireAdmin, asyncRoute(async (_req, res) => {
    const { rows } = await db.query(`${skillSelect()} ORDER BY sort_order, id`)
    res.json(rows)
  }))

  app.post('/api/admin/skills', requireAdmin, asyncRoute(async (req, res) => {
    const parsed = validateSkill(req.body)
    if (parsed.errors) return res.status(400).json({ error: 'Check the highlighted fields.', fields: parsed.errors })
    const { category, name, level, proficiency, sortOrder } = parsed.value
    try {
      const { rows } = await db.query(
        `INSERT INTO skills(category, name, level, proficiency, sort_order)
         VALUES($1, $2, $3, $4, $5)
         RETURNING id, category, name, level, proficiency, sort_order AS "sortOrder", updated_at AS "updatedAt"`,
        [category, name, level, proficiency, sortOrder],
      )
      res.status(201).json(rows[0])
    } catch (error) {
      return databaseError(error, res)
    }
  }))

  app.patch('/api/admin/skills/:id', requireAdmin, asyncRoute(async (req, res) => {
    const id = validateSkillId(req.params.id)
    if (!id) return res.status(400).json({ error: 'Skill ID is invalid.' })
    const parsed = validateSkill(req.body, { partial: true })
    if (parsed.errors) return res.status(400).json({ error: 'Check the highlighted fields.', fields: parsed.errors })
    const current = await db.query('SELECT category, name, level, proficiency, sort_order FROM skills WHERE id = $1', [id])
    if (!current.rows[0]) return res.status(404).json({ error: 'Skill not found.' })
    const next = { ...current.rows[0], ...parsed.value }
    try {
      const { rows } = await db.query(
        `UPDATE skills SET category = $1, name = $2, level = $3, proficiency = $4,
          sort_order = $5, updated_at = NOW()
         WHERE id = $6
         RETURNING id, category, name, level, proficiency, sort_order AS "sortOrder", updated_at AS "updatedAt"`,
        [next.category, next.name, next.level, next.proficiency, next.sortOrder ?? next.sort_order, id],
      )
      res.json(rows[0])
    } catch (error) {
      return databaseError(error, res)
    }
  }))

  app.post('/api/admin/skills/reorder', requireAdmin, asyncRoute(async (req, res) => {
    const parsed = validateReorder(req.body)
    if (parsed.error) return res.status(400).json({ error: parsed.error })
    const client = await db.connect()
    try {
      await client.query('BEGIN')
      const existing = await client.query('SELECT id FROM skills WHERE id = ANY($1::int[])', [parsed.ids])
      if (existing.rowCount !== parsed.ids.length) {
        await client.query('ROLLBACK')
        return res.status(400).json({ error: 'One or more skills no longer exist. Refresh and try again.' })
      }
      for (let index = 0; index < parsed.ids.length; index += 1) {
        await client.query('UPDATE skills SET sort_order = $1, updated_at = NOW() WHERE id = $2', [(index + 1) * 10, parsed.ids[index]])
      }
      await client.query('COMMIT')
      const { rows } = await db.query(`${skillSelect()} ORDER BY sort_order, id`)
      res.json(rows)
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }))

  app.delete('/api/admin/skills/:id', requireAdmin, asyncRoute(async (req, res) => {
    const id = validateSkillId(req.params.id)
    if (!id) return res.status(400).json({ error: 'Skill ID is invalid.' })
    const { rowCount } = await db.query('DELETE FROM skills WHERE id = $1', [id])
    if (!rowCount) return res.status(404).json({ error: 'Skill not found.' })
    res.status(204).end()
  }))

  app.use((_req, res) => res.status(404).json({ error: 'Route not found.' }))
  app.use((error, _req, res, _next) => {
    logger.error(error)
    if (error?.message === 'Origin is not allowed by CORS.') {
      return res.status(403).json({ error: 'This website origin is not allowed.' })
    }
    res.status(500).json({ error: 'The server could not complete the request.' })
  })

  return app
}

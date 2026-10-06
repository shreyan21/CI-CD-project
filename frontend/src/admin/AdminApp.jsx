import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Check,
  Database,
  Eye,
  EyeOff,
  Globe2,
  Layers3,
  LogOut,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  ServerCog,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react'
import { apiRequest } from '../lib/api.js'
import './admin.css'

const LEVELS = ['Learning', 'Fundamentals', 'Developing', 'Working knowledge', 'Hands-on']
const emptySkill = { category: '', name: '', level: 'Learning', proficiency: '', sortOrder: 100 }

function Spinner({ label = 'Loading' }) {
  return <span className="admin-spinner" role="status" aria-label={label} />
}

function LoginScreen({ onAuthenticated }) {
  const [form, setForm] = useState({ username: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function submit(event) {
    event.preventDefault()
    setError('')
    if (!form.username.trim() || !form.password) {
      setError('Enter both your username and password.')
      return
    }
    setSubmitting(true)
    try {
      const session = await apiRequest('/admin/auth/login', { method: 'POST', body: form })
      onAuthenticated(session)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="admin-login-shell">
      <div className="admin-login-atmosphere" aria-hidden="true" />
      <a className="admin-back-link" href="/"><ArrowLeft size={17} /> Back to portfolio</a>
      <section className="admin-login-layout">
        <div className="admin-login-intro">
          <span className="admin-kicker">PORTFOLIO CONTROL ROOM</span>
          <h1>Publish skills without touching the code.</h1>
          <p>Changes move through the same full-stack path recruiters can inspect: PostgreSQL, Express, then React.</p>
          <div className="admin-auth-promise">
            <ShieldCheck size={21} />
            <span><strong>Private by design</strong>Your password stays on the server and the browser receives only a protected session cookie.</span>
          </div>
        </div>

        <form className="admin-login-card" onSubmit={submit} noValidate>
          <div className="admin-card-mark">USR<span>.</span></div>
          <div>
            <p className="admin-overline">ADMIN ACCESS</p>
            <h2>Sign in</h2>
            <p>Use the credentials configured in the backend environment.</p>
          </div>
          <label>
            <span>Username</span>
            <input
              autoComplete="username"
              value={form.username}
              onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))}
            />
          </label>
          <label>
            <span>Password</span>
            <div className="admin-password-field">
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={form.password}
                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
              />
              <button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>
          {error ? <p className="admin-form-error" role="alert">{error}</p> : null}
          <button className="admin-primary-button" type="submit" disabled={submitting}>
            {submitting ? <Spinner label="Signing in" /> : <ShieldCheck size={18} />}
            {submitting ? 'Signing in…' : 'Open admin panel'}
          </button>
        </form>
      </section>
    </main>
  )
}

function SkillEditor({ draft, categories, busy, fieldErrors, onChange, onCancel, onSave }) {
  const isEditing = Boolean(draft?.id)
  const headingRef = useRef(null)

  useEffect(() => {
    headingRef.current?.focus()
  }, [draft?.id])

  if (!draft) {
    return (
      <aside className="admin-editor admin-editor-empty">
        <Layers3 size={28} />
        <h3>Select a skill to edit</h3>
        <p>Choose any row, or add a new skill. Saved changes appear on the public portfolio immediately.</p>
      </aside>
    )
  }

  const update = (key, value) => onChange({ ...draft, [key]: value })

  return (
    <aside className="admin-editor" id="skill-editor">
      <div className="admin-editor-heading">
        <div>
          <span className="admin-overline">{isEditing ? 'EDIT SKILL' : 'NEW SKILL'}</span>
          <h3 tabIndex="-1" ref={headingRef}>{isEditing ? draft.name : 'Add to your stack'}</h3>
        </div>
        <button className="admin-icon-button" type="button" onClick={onCancel} aria-label="Close editor"><X size={18} /></button>
      </div>

      <div className="admin-field-grid">
        <label className="admin-field admin-field-wide">
          <span>Skill name</span>
          <input value={draft.name} maxLength="80" onChange={(event) => update('name', event.target.value)} aria-invalid={Boolean(fieldErrors.name)} />
          {fieldErrors.name ? <small role="alert">{fieldErrors.name}</small> : null}
        </label>
        <label className="admin-field admin-field-wide">
          <span>Category</span>
          <input list="skill-categories" value={draft.category} maxLength="60" onChange={(event) => update('category', event.target.value)} aria-invalid={Boolean(fieldErrors.category)} />
          <datalist id="skill-categories">{categories.map((category) => <option key={category} value={category} />)}</datalist>
          <em>Choose an existing category or type a new one.</em>
          {fieldErrors.category ? <small role="alert">{fieldErrors.category}</small> : null}
        </label>
        <label className="admin-field admin-field-wide">
          <span>Level</span>
          <select value={draft.level} onChange={(event) => update('level', event.target.value)}>
            {LEVELS.map((level) => <option key={level}>{level}</option>)}
          </select>
        </label>
        <label className="admin-field admin-field-wide">
          <span>Proficiency <b>{draft.proficiency === '' ? 'Optional' : `${draft.proficiency}%`}</b></span>
          <input
            className="admin-range"
            type="range"
            min="0"
            max="100"
            step="5"
            value={draft.proficiency === '' ? 0 : draft.proficiency}
            onChange={(event) => update('proficiency', Number(event.target.value))}
          />
          <div className="admin-range-actions">
            <span>Use a number only when you can defend it.</span>
            {draft.proficiency !== '' ? <button type="button" onClick={() => update('proficiency', '')}>Clear</button> : null}
          </div>
          {fieldErrors.proficiency ? <small role="alert">{fieldErrors.proficiency}</small> : null}
        </label>
      </div>

      {fieldErrors.form ? <p className="admin-form-error" role="alert">{fieldErrors.form}</p> : null}
      <div className="admin-editor-actions">
        <button className="admin-secondary-button" type="button" onClick={onCancel}>Cancel</button>
        <button className="admin-primary-button" type="button" onClick={onSave} disabled={busy}>
          {busy ? <Spinner label="Saving skill" /> : <Check size={18} />}
          {busy ? 'Saving…' : isEditing ? 'Save changes' : 'Add skill'}
        </button>
      </div>
    </aside>
  )
}

export default function AdminApp() {
  const [authState, setAuthState] = useState('checking')
  const [session, setSession] = useState(null)
  const [skills, setSkills] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [draft, setDraft] = useState(null)
  const [fieldErrors, setFieldErrors] = useState({})
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')
  const [notice, setNotice] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)

  const expireSession = useCallback(() => {
    setSession(null)
    setAuthState('signed-out')
    setSkills([])
  }, [])

  const loadSkills = useCallback(async (csrfSession = session) => {
    setLoading(true)
    try {
      const data = await apiRequest('/admin/skills')
      setSkills(data)
    } catch (error) {
      if (error.status === 401) expireSession()
      else setNotice(error.message)
    } finally {
      setLoading(false)
    }
  }, [expireSession, session])

  useEffect(() => {
    let active = true
    apiRequest('/admin/auth/session')
      .then((data) => {
        if (!active) return
        if (!data.authenticated) {
          setAuthState('signed-out')
          return
        }
        setSession(data)
        setAuthState('signed-in')
      })
      .catch(() => active && setAuthState('signed-out'))
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (authState === 'signed-in') loadSkills()
  }, [authState, loadSkills])

  const categories = useMemo(() => [...new Set(skills.map((skill) => skill.category))].sort(), [skills])
  const visibleSkills = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return skills.filter((skill) => {
      const categoryMatches = category === 'All' || skill.category === category
      const textMatches = !needle || `${skill.name} ${skill.category} ${skill.level}`.toLowerCase().includes(needle)
      return categoryMatches && textMatches
    })
  }, [category, query, skills])

  function authenticate(data) {
    setSession(data)
    setAuthState('signed-in')
  }

  function openNewSkill() {
    setFieldErrors({})
    setDraft({ ...emptySkill, sortOrder: (skills.length + 1) * 10 })
    requestAnimationFrame(() => document.querySelector('#skill-editor')?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }

  function editSkill(skill) {
    setFieldErrors({})
    setDraft({ ...skill, proficiency: skill.proficiency ?? '' })
    requestAnimationFrame(() => document.querySelector('#skill-editor')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }))
  }

  async function saveSkill() {
    const errors = {}
    if (!draft.name.trim()) errors.name = 'Enter a skill name.'
    if (!draft.category.trim()) errors.category = 'Enter a category.'
    if (Object.keys(errors).length) {
      setFieldErrors(errors)
      return
    }
    setSaving(true)
    setFieldErrors({})
    try {
      const payload = {
        category: draft.category,
        name: draft.name,
        level: draft.level,
        proficiency: draft.proficiency === '' ? null : Number(draft.proficiency),
        sortOrder: draft.sortOrder,
      }
      const saved = await apiRequest(draft.id ? `/admin/skills/${draft.id}` : '/admin/skills', {
        method: draft.id ? 'PATCH' : 'POST',
        body: payload,
        csrfToken: session.csrfToken,
      })
      setSkills((current) => draft.id ? current.map((skill) => skill.id === saved.id ? saved : skill) : [...current, saved])
      setDraft(null)
      setNotice(draft.id ? 'Skill updated on the portfolio.' : 'Skill added to the portfolio.')
    } catch (error) {
      if (error.status === 401) expireSession()
      else {
        setFieldErrors(error.fields || { form: error.message })
        if (!Object.keys(error.fields || {}).length) setFieldErrors({ form: error.message })
      }
    } finally {
      setSaving(false)
    }
  }

  async function moveSkill(id, direction) {
    const index = skills.findIndex((skill) => skill.id === id)
    const target = index + direction
    if (index < 0 || target < 0 || target >= skills.length) return
    const previous = skills
    const reordered = [...skills]
    ;[reordered[index], reordered[target]] = [reordered[target], reordered[index]]
    setSkills(reordered)
    try {
      const updated = await apiRequest('/admin/skills/reorder', {
        method: 'POST',
        body: { ids: reordered.map((skill) => skill.id) },
        csrfToken: session.csrfToken,
      })
      setSkills(updated)
      setNotice('Skill order published.')
    } catch (error) {
      setSkills(previous)
      if (error.status === 401) expireSession()
      else setNotice(error.message)
    }
  }

  async function removeSkill() {
    if (!deleteTarget) return
    setSaving(true)
    try {
      await apiRequest(`/admin/skills/${deleteTarget.id}`, { method: 'DELETE', csrfToken: session.csrfToken })
      setSkills((current) => current.filter((skill) => skill.id !== deleteTarget.id))
      if (draft?.id === deleteTarget.id) setDraft(null)
      setDeleteTarget(null)
      setNotice('Skill removed from the portfolio.')
    } catch (error) {
      if (error.status === 401) expireSession()
      else setNotice(error.message)
    } finally {
      setSaving(false)
    }
  }

  async function logout() {
    try {
      await apiRequest('/admin/auth/logout', { method: 'POST', csrfToken: session.csrfToken })
    } finally {
      expireSession()
    }
  }

  if (authState === 'checking') {
    return <main className="admin-splash"><Spinner label="Checking admin session" /><p>Checking secure session…</p></main>
  }
  if (authState === 'signed-out') return <LoginScreen onAuthenticated={authenticate} />

  return (
    <main className="admin-app-shell">
      <a className="admin-skip-link" href="#admin-content">Skip to skill management</a>
      <header className="admin-topbar">
        <a className="admin-brand" href="/">USR<span>.</span><small>ADMIN</small></a>
        <div className="admin-topbar-actions">
          <a href="/" target="_blank" rel="noreferrer"><Globe2 size={17} /> View site</a>
          <button type="button" onClick={logout}><LogOut size={17} /> Sign out</button>
        </div>
      </header>

      <div className="admin-dashboard" id="admin-content">
        <section className="admin-hero">
          <div>
            <span className="admin-kicker">SKILL PUBLISHING DESK</span>
            <h1>Keep your portfolio current.</h1>
            <p>Add only skills you can explain and demonstrate. Every save writes to PostgreSQL and updates the public portfolio.</p>
          </div>
          <button className="admin-primary-button" type="button" onClick={openNewSkill}><Plus size={18} /> Add skill</button>
        </section>

        <section className="admin-pipeline" aria-label="Publishing flow">
          <div><Database size={19} /><span><b>PostgreSQL</b>Source of truth</span></div>
          <ArrowRight className="admin-pipeline-arrow" size={18} />
          <div><ServerCog size={19} /><span><b>Express API</b>Validated updates</span></div>
          <ArrowRight className="admin-pipeline-arrow" size={18} />
          <div><Globe2 size={19} /><span><b>Portfolio</b>Published instantly</span></div>
          <span className="admin-live-status"><i /> Connected</span>
        </section>

        <section className="admin-stats" aria-label="Skill summary">
          <div><span>Total skills</span><strong>{skills.length}</strong></div>
          <div><span>Categories</span><strong>{categories.length}</strong></div>
          <div><span>With a score</span><strong>{skills.filter((skill) => skill.proficiency !== null).length}</strong></div>
        </section>

        <section className="admin-workspace">
          <div className="admin-list-panel">
            <div className="admin-list-heading">
              <div><span className="admin-overline">PUBLIC SKILLS</span><h2>Manage your stack</h2></div>
              <button className="admin-icon-button" type="button" onClick={() => loadSkills()} disabled={loading} aria-label="Refresh skills">
                <RefreshCw size={18} className={loading ? 'admin-spin' : ''} />
              </button>
            </div>

            <div className="admin-toolbar">
              <label className="admin-search"><Search size={17} /><span className="admin-visually-hidden">Search skills</span><input type="search" placeholder="Search skills" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
              <div className="admin-category-filter" aria-label="Filter by category">
                {['All', ...categories].map((item) => <button type="button" key={item} className={category === item ? 'active' : ''} onClick={() => setCategory(item)}>{item}</button>)}
              </div>
            </div>

            {loading && skills.length === 0 ? <div className="admin-list-state"><Spinner /><p>Loading skills…</p></div> : null}
            {!loading && visibleSkills.length === 0 ? <div className="admin-list-state"><Search size={25} /><p>No skills match this filter.</p><button type="button" onClick={() => { setQuery(''); setCategory('All') }}>Clear filters</button></div> : null}

            <div className="admin-skill-list">
              {visibleSkills.map((skill) => {
                const globalIndex = skills.findIndex((item) => item.id === skill.id)
                return (
                  <article className={`admin-skill-row ${draft?.id === skill.id ? 'selected' : ''}`} key={skill.id}>
                    <div className="admin-order-controls" aria-label={`Reorder ${skill.name}`}>
                      <button type="button" onClick={() => moveSkill(skill.id, -1)} disabled={globalIndex === 0} aria-label={`Move ${skill.name} up`}><ArrowUp size={16} /></button>
                      <button type="button" onClick={() => moveSkill(skill.id, 1)} disabled={globalIndex === skills.length - 1} aria-label={`Move ${skill.name} down`}><ArrowDown size={16} /></button>
                    </div>
                    <button className="admin-skill-main" type="button" onClick={() => editSkill(skill)}>
                      <span className="admin-skill-glyph">{skill.name.slice(0, 2).toUpperCase()}</span>
                      <span><strong>{skill.name}</strong><small>{skill.category} · {skill.level}</small></span>
                    </button>
                    <div className="admin-skill-score">
                      <span>{skill.proficiency === null ? '—' : `${skill.proficiency}%`}</span>
                      <i><b style={{ width: `${skill.proficiency ?? 0}%` }} /></i>
                    </div>
                    <div className="admin-row-actions">
                      <button type="button" onClick={() => editSkill(skill)} aria-label={`Edit ${skill.name}`}><Pencil size={16} /></button>
                      <button className="danger" type="button" onClick={() => setDeleteTarget(skill)} aria-label={`Delete ${skill.name}`}><Trash2 size={16} /></button>
                    </div>
                  </article>
                )
              })}
            </div>
          </div>

          <SkillEditor
            draft={draft}
            categories={categories}
            busy={saving}
            fieldErrors={fieldErrors}
            onChange={(next) => { setDraft(next); setFieldErrors({}) }}
            onCancel={() => { setDraft(null); setFieldErrors({}) }}
            onSave={saveSkill}
          />
        </section>
      </div>

      <div className="admin-toast" aria-live="polite" aria-atomic="true">
        {notice ? <div><Check size={16} /><span>{notice}</span><button type="button" onClick={() => setNotice('')} aria-label="Dismiss notification"><X size={15} /></button></div> : null}
      </div>

      {deleteTarget ? (
        <div className="admin-dialog-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setDeleteTarget(null)}>
          <div className="admin-dialog" role="dialog" aria-modal="true" aria-labelledby="delete-title">
            <div className="admin-dialog-icon"><Trash2 size={22} /></div>
            <h2 id="delete-title">Remove “{deleteTarget.name}”?</h2>
            <p>This immediately removes the skill from PostgreSQL and the public portfolio.</p>
            <div><button className="admin-secondary-button" type="button" onClick={() => setDeleteTarget(null)}>Keep skill</button><button className="admin-danger-button" type="button" onClick={removeSkill} disabled={saving}>{saving ? 'Removing…' : 'Remove skill'}</button></div>
          </div>
        </div>
      ) : null}
    </main>
  )
}

export const SKILL_LEVELS = ['Learning', 'Fundamentals', 'Developing', 'Working knowledge', 'Hands-on']

function cleanText(value) {
  return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : value
}

function readInteger(value, field, { min = 0, max = 10_000, nullable = false } = {}) {
  if ((value === '' || value === null) && nullable) return { value: null }
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    return { error: `${field} must be a whole number from ${min} to ${max}.` }
  }
  return { value: parsed }
}

export function validateSkill(input, { partial = false } = {}) {
  const body = input && typeof input === 'object' && !Array.isArray(input) ? input : {}
  const allowed = new Set(['category', 'name', 'level', 'proficiency', 'sortOrder'])
  const unknown = Object.keys(body).filter((key) => !allowed.has(key))
  if (unknown.length) return { errors: { form: `Unknown field: ${unknown[0]}.` } }

  const result = {}
  const errors = {}
  const requireField = (key) => !partial || Object.prototype.hasOwnProperty.call(body, key)

  if (requireField('category')) {
    const category = cleanText(body.category)
    if (!category) errors.category = 'Enter a category.'
    else if (category.length > 60) errors.category = 'Use 60 characters or fewer.'
    else result.category = category
  }

  if (requireField('name')) {
    const name = cleanText(body.name)
    if (!name) errors.name = 'Enter a skill name.'
    else if (name.length > 80) errors.name = 'Use 80 characters or fewer.'
    else result.name = name
  }

  if (requireField('level')) {
    const level = cleanText(body.level || 'Learning')
    if (!SKILL_LEVELS.includes(level)) errors.level = 'Choose a valid proficiency level.'
    else result.level = level
  }

  if (requireField('proficiency')) {
    const parsed = readInteger(body.proficiency, 'Proficiency', { min: 0, max: 100, nullable: true })
    if (parsed.error) errors.proficiency = parsed.error
    else result.proficiency = parsed.value
  }

  if (requireField('sortOrder')) {
    const parsed = readInteger(body.sortOrder ?? 100, 'Sort order')
    if (parsed.error) errors.sortOrder = parsed.error
    else result.sortOrder = parsed.value
  }

  if (partial && Object.keys(result).length === 0 && Object.keys(errors).length === 0) {
    errors.form = 'Provide at least one field to update.'
  }

  return Object.keys(errors).length ? { errors } : { value: result }
}

export function validateSkillId(value) {
  const id = Number(value)
  return Number.isInteger(id) && id > 0 ? id : null
}

export function validateReorder(input) {
  const ids = input?.ids
  if (!Array.isArray(ids) || ids.length === 0) return { error: 'Provide at least one skill ID.' }
  if (ids.length > 500) return { error: 'Too many skills in one reorder request.' }
  const normalized = ids.map(Number)
  if (normalized.some((id) => !Number.isInteger(id) || id <= 0)) return { error: 'Every skill ID must be valid.' }
  if (new Set(normalized).size !== normalized.length) return { error: 'Skill IDs cannot be repeated.' }
  return { ids: normalized }
}

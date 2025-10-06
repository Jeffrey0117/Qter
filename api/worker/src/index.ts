// QTER Cloudflare Worker entry (API Gateway)
export interface Env {
  DB: D1Database
  RATE_LIMIT?: KVNamespace  // Make optional for deployment without KV
  ENV: 'dev' | 'prod' | string
  RATE_LIMIT_RPM: string
  HASH_LENGTH: string
  JWT_SECRET: string
  TURNSTILE_SITE_KEY: string
  TURNSTILE_SECRET_KEY: string
}

type Handler = (req: Request, env: Env, ctx: ExecutionContext, params: Record<string, string>) => Promise<Response>

function json(data: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(data), { headers: { 'content-type': 'application/json; charset=utf-8' }, ...init })
}

function notFound() { return json({ error: 'not_found' }, { status: 404 }) }
function badRequest(msg = 'bad_request') { return json({ error: msg }, { status: 400 }) }
function unauthorized() { return json({ error: 'unauthorized' }, { status: 401 }) }
function rateLimited() { return json({ error: 'rate_limited' }, { status: 429 }) }

function withCors(res: Response): Response {
  const headers = new Headers(res.headers)
  headers.set('access-control-allow-origin', '*')
  headers.set('access-control-allow-headers', 'authorization,content-type')
  headers.set('access-control-allow-methods', 'GET,POST,PUT,DELETE,OPTIONS')
  return new Response(res.body, { ...res, headers })
}

async function preflight(req: Request): Promise<Response | null> {
  if (req.method === 'OPTIONS') {
    return withCors(new Response(null, { status: 204 }))
  }
  return null
}

// Simple router
type Route = { method: string; pattern: RegExp; keys: string[]; handler: Handler }
const routes: Route[] = []

function addRoute(method: string, path: string, handler: Handler) {
  const keys: string[] = []
  const pattern = new RegExp('^' + path.replace(/:([A-Za-z0-9_]+)/g, (_, k) => {
    keys.push(k); return '([^/]+)'
  }) + '$')
  routes.push({ method: method.toUpperCase(), pattern, keys, handler })
}

// Health
addRoute('GET', '/api/health', async (_req, env) => {
  // D1 quick check (optional)
  let dbOk = false
  try {
    await env.DB.prepare('select 1').first()
    dbOk = true
  } catch {}
  return json({ ok: true, env: env.ENV, db: dbOk, ts: Date.now() })
})

// Public: get form by share hash (uses KV cache -> DB fallback)
addRoute('GET', '/api/public/s/:hash', async (_req, env, _ctx, params) => {
  const hash = params.hash
  if (!hash || hash.length !== Number(env.HASH_LENGTH || '12')) {
    return badRequest('invalid_hash')
  }

  // Skip KV cache if not configured
  if (env.RATE_LIMIT) {
    const cacheKey = `form:${hash}`
    const cached = await env.RATE_LIMIT.get(cacheKey, { type: 'json' }) as any | null
    if (cached) {
      return json({ source: 'kv', form: cached })
    }
  }

  // NOTE: Schema must exist in D1. Placeholder query aligns with PRD.
  const formRow = await env.DB
    .prepare(
      `select f.id, f.title, f.description, f.markdown_content as markdownContent, 
              f.display_mode as displayMode, f.auto_advance as autoAdvance,
              f.auto_advance_delay as autoAdvanceDelay, f.show_progress as showProgress,
              f.allow_go_back as allowGoBack,
              s.is_enabled as isEnabled, s.expire_at as expireAt, s.max_responses as maxResponses, s.allow_anonymous as allowAnonymous
         from share_links s
         join forms f on f.id = s.form_id
        where s.hash = ?1`
    )
    .bind(hash)
    .first<any>()

  if (!formRow) return notFound()

  // Basic gating
  if (Number(formRow.isEnabled) !== 1) return notFound()
  if (formRow.expireAt && Date.now() > Date.parse(formRow.expireAt)) return notFound()

  // Cache short TTL if KV is available
  if (env.RATE_LIMIT) {
    const cacheKey = `form:${hash}`
    await env.RATE_LIMIT.put(cacheKey, JSON.stringify(formRow), { expirationTtl: 60 })
  }
  return json({ source: 'db', form: formRow })
})

/**
 * 取得請求來源 IP
 */
function getIP(req: Request): string {
  // Cloudflare 會提供 cf-connecting-ip
  const h = req.headers.get('cf-connecting-ip')
  if (h) return h
  const xf = req.headers.get('x-forwarded-for')
  if (xf) return xf.split(',')[0].trim()
  try {
    // 最後退路
    return (new URL(req.url)).hostname || 'unknown'
  } catch {
    return 'unknown'
  }
}

/**
 * 驗證 Turnstile（若有設定 Secret）
 */
async function verifyTurnstile(token: string | undefined, secret: string | undefined, remoteip: string): Promise<boolean> {
  if (!secret) {
    // 未配置 Secret 時直接略過驗證（開發模式）
    return true
  }
  if (!token) return false

  const form = new FormData()
  form.append('secret', secret)
  form.append('response', token)
  form.append('remoteip', remoteip)

  const resp = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: form,
  })
  const data = await resp.json().catch(() => ({} as any))
  return !!data.success
}

/**
 * 簡單每分鐘速率限制（IP + hash）
 */
async function rateLimitKV(env: Env, key: string, limitPerMin: number): Promise<boolean> {
  // Skip rate limiting if KV is not configured
  if (!env.RATE_LIMIT) return true
  
  const nowKey = `rl:${key}:${Math.floor(Date.now() / 60000)}`
  const current = parseInt((await env.RATE_LIMIT.get(nowKey)) || '0', 10)
  if (current >= limitPerMin) return false
  await env.RATE_LIMIT.put(nowKey, String(current + 1), { expirationTtl: 75 })
  return true
}

// Public: submit response
addRoute('POST', '/api/public/s/:hash/submit', async (req, env, _ctx, params) => {
  try {
    const hash = params.hash
    if (!hash || hash.length !== Number(env.HASH_LENGTH || '12')) {
      return badRequest('invalid_hash')
    }

    const ip = getIP(req)
    const rpm = Number(env.RATE_LIMIT_RPM || '60')
    const ok = await rateLimitKV(env, `${hash}:${ip}`, rpm)
    if (!ok) return rateLimited()

    const body = await req.json().catch(() => ({}))
    if (!body || typeof body !== 'object' || typeof body.responses !== 'object') {
      return badRequest('invalid_payload')
    }

    // Turnstile 檢查（若已配置 Secret）
    const passed = await verifyTurnstile(body.turnstileToken, env.TURNSTILE_SECRET_KEY, ip)
    if (!passed) return unauthorized()

    // 查詢分享鏈結與表單
    const row = await env.DB
      .prepare(
        `select s.id as shareLinkId, s.form_id as formId, s.is_enabled as isEnabled, s.expire_at as expireAt, s.max_responses as maxResponses
           from share_links s
          where s.hash = ?1`
      )
      .bind(hash)
      .first<any>()

    if (!row) return notFound()
    if (Number(row.isEnabled) !== 1) return notFound()
    if (row.expireAt && Date.now() > Date.parse(row.expireAt)) return notFound()

    // 可選：檢查是否超過最大回應數
    if (row.maxResponses != null) {
      const cnt = await env.DB.prepare('select count(1) as c from responses where share_link_id = ?1').bind(row.shareLinkId).first<{ c: number }>()
      if (cnt && Number(cnt.c) >= Number(row.maxResponses)) {
        return json({ error: 'max_responses_reached' }, { status: 403 })
      }
    }

    // 建立 response
    const responseId = (crypto as any)?.randomUUID ? (crypto as any).randomUUID() : `${Date.now()}_${Math.random()}`
    const meta = {
      ip,
      ua: req.headers.get('user-agent') || '',
      ts: Date.now(),
      source: 'public',
    }

    const insertResp = await env.DB
      .prepare(
        `insert into responses(id, form_id, share_link_id, respondent_user_id, respondent_hash, submitted_at, meta_json)
         values (?1, ?2, ?3, NULL, NULL, datetime('now'), ?4)`
      )
      .bind(responseId, row.formId, row.shareLinkId, JSON.stringify(meta))
      .run()

    if (!insertResp.success) {
      return json({ error: 'db_insert_response_failed' }, { status: 500 })
    }

    // 寫入 response_items
    const entries = Object.entries(body.responses as Record<string, any>)
    for (const [questionId, val] of entries) {
      let value_text: string | null = null
      let value_number: number | null = null
      let value_json: string | null = null

      if (typeof val === 'string') {
        value_text = val
        // 嘗試轉數字
        const num = Number(val)
        if (!Number.isNaN(num) && val.trim() !== '') value_number = num
      } else if (typeof val === 'number') {
        value_number = val
        value_text = String(val)
      } else {
        value_json = JSON.stringify(val)
      }

      const itemId = (crypto as any)?.randomUUID ? (crypto as any).randomUUID() : `${Date.now()}_${Math.random()}`
      const r = await env.DB
        .prepare(
          `insert into response_items(id, response_id, question_id, value_text, value_number, value_json)
           values (?1, ?2, ?3, ?4, ?5, ?6)`
        )
        .bind(itemId, responseId, questionId, value_text, value_number, value_json)
        .run()

      if (!r.success) {
        return json({ error: 'db_insert_item_failed', questionId }, { status: 500 })
      }
    }

    return json({ ok: true, responseId })
  } catch (e: any) {
    return json({ error: 'submit_error', detail: String(e?.message || e) }, { status: 500 })
  }
})

async function extractUserId(req: Request, env: Env): Promise<string | null> {
  const authHeader = req.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null
  
  const token = authHeader.substring(7)
  if (!token) return null
  
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    
    const base64Url = parts[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    const payload = JSON.parse(jsonPayload)
    
    console.log('[Auth] Decoded payload:', { sub: payload.sub, email: payload.email })
    return payload.sub || payload.user_id || payload.id || null
  } catch (e) {
    console.error('[Auth] Token decode failed:', e)
    return null
  }
}

addRoute('POST', '/api/forms', async (req, env) => {
  const userId = await extractUserId(req, env)
  if (!userId) return unauthorized()
  
  try {
    const body = await req.json().catch(() => ({}))
    if (!body.id || !body.title || !body.questions) {
      return badRequest('missing_required_fields')
    }
    
    const { id, title, description, questions, displayMode, markdownContent, autoAdvance, autoAdvanceDelay, showProgress, allowGoBack } = body
    
    const result = await env.DB.prepare(
      `INSERT INTO forms (id, user_id, title, description, markdown_content, display_mode, questions, auto_advance, auto_advance_delay, show_progress, allow_go_back, created_at, updated_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, datetime('now'), datetime('now'))`
    ).bind(
      id, userId, title, description || '', markdownContent || '', displayMode || 'step-by-step',
      JSON.stringify(questions), autoAdvance !== false ? 1 : 0, autoAdvanceDelay || 300,
      showProgress !== false ? 1 : 0, allowGoBack !== false ? 1 : 0
    ).run()
    
    if (!result.success) return json({ error: 'create_failed' }, { status: 500 })
    return json({ success: true, form: body })
  } catch (e: any) {
    return json({ error: 'create_error', detail: String(e?.message || e) }, { status: 500 })
  }
})

addRoute('PUT', '/api/forms/:id', async (req, env, _ctx, params) => {
  const userId = await extractUserId(req, env)
  if (!userId) return unauthorized()
  
  try {
    const formId = params.id
    const existing = await env.DB.prepare('SELECT user_id FROM forms WHERE id = ?1').bind(formId).first<{ user_id: string }>()
    if (!existing) return notFound()
    if (existing.user_id !== userId) return unauthorized()
    
    const body = await req.json().catch(() => ({}))
    const { title, description, questions, displayMode, markdownContent, autoAdvance, autoAdvanceDelay, showProgress, allowGoBack } = body
    
    const result = await env.DB.prepare(
      `UPDATE forms SET
       title = COALESCE(?2, title),
       description = COALESCE(?3, description),
       markdown_content = COALESCE(?4, markdown_content),
       display_mode = COALESCE(?5, display_mode),
       questions = COALESCE(?6, questions),
       auto_advance = COALESCE(?7, auto_advance),
       auto_advance_delay = COALESCE(?8, auto_advance_delay),
       show_progress = COALESCE(?9, show_progress),
       allow_go_back = COALESCE(?10, allow_go_back),
       updated_at = datetime('now')
       WHERE id = ?1`
    ).bind(
      formId, title, description, markdownContent, displayMode,
      questions ? JSON.stringify(questions) : null,
      autoAdvance !== undefined ? (autoAdvance ? 1 : 0) : null,
      autoAdvanceDelay,
      showProgress !== undefined ? (showProgress ? 1 : 0) : null,
      allowGoBack !== undefined ? (allowGoBack ? 1 : 0) : null
    ).run()
    
    if (!result.success) return json({ error: 'update_failed' }, { status: 500 })
    return json({ success: true })
  } catch (e: any) {
    return json({ error: 'update_error', detail: String(e?.message || e) }, { status: 500 })
  }
})

addRoute('GET', '/api/forms/:id', async (req, env, _ctx, params) => {
  try {
    const formId = params.id
    const form = await env.DB.prepare(
      `SELECT id, user_id, title, description, markdown_content as markdownContent, display_mode as displayMode,
       questions, auto_advance as autoAdvance, auto_advance_delay as autoAdvanceDelay,
       show_progress as showProgress, allow_go_back as allowGoBack, created_at as createdAt, updated_at as updatedAt
       FROM forms WHERE id = ?1`
    ).bind(formId).first<any>()
    
    if (!form) return notFound()
    
    if (form.questions) {
      try {
        form.questions = JSON.parse(form.questions)
      } catch {}
    }
    form.autoAdvance = form.autoAdvance === 1
    form.showProgress = form.showProgress === 1
    form.allowGoBack = form.allowGoBack === 1
    
    return json({ success: true, form })
  } catch (e: any) {
    return json({ error: 'get_error', detail: String(e?.message || e) }, { status: 500 })
  }
})

addRoute('GET', '/api/forms', async (req, env) => {
  const userId = await extractUserId(req, env)
  if (!userId) return unauthorized()
  
  try {
    const { results } = await env.DB.prepare(
      `SELECT id, title, description, display_mode as displayMode, created_at as createdAt, updated_at as updatedAt
       FROM forms WHERE user_id = ?1 ORDER BY updated_at DESC`
    ).bind(userId).all()
    
    return json({ success: true, forms: results || [] })
  } catch (e: any) {
    return json({ error: 'list_error', detail: String(e?.message || e) }, { status: 500 })
  }
})

addRoute('DELETE', '/api/forms/:id', async (req, env, _ctx, params) => {
  const userId = await extractUserId(req, env)
  if (!userId) return unauthorized()
  
  try {
    const formId = params.id
    const existing = await env.DB.prepare('SELECT user_id FROM forms WHERE id = ?1').bind(formId).first<{ user_id: string }>()
    if (!existing) return notFound()
    if (existing.user_id !== userId) return unauthorized()
    
    const result = await env.DB.prepare('DELETE FROM forms WHERE id = ?1').bind(formId).run()
    if (!result.success) return json({ error: 'delete_failed' }, { status: 500 })
    
    return json({ success: true })
  } catch (e: any) {
    return json({ error: 'delete_error', detail: String(e?.message || e) }, { status: 500 })
  }
})

addRoute('POST', '/api/auth/register', async () => json({ ok: true, message: 'register stub' }))
addRoute('POST', '/api/auth/login', async () => json({ ok: true, token: 'stub' }))

export default {
  async fetch(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const pf = await preflight(req)
    if (pf) return pf

    const url = new URL(req.url)
    const path = url.pathname
    const method = req.method.toUpperCase()

    for (const r of routes) {
      if (r.method !== method) continue
      const m = r.pattern.exec(path)
      if (!m) continue
      const params: Record<string, string> = {}
      r.keys.forEach((k, i) => { params[k] = decodeURIComponent(m[i + 1]) })
      const res = await r.handler(req, env, ctx, params)
      return withCors(res)
    }

    return withCors(notFound())
  }
}
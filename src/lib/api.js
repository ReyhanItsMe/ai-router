import { API_BASE, ENV_API_KEY } from './config'
import { load, save } from './storage'

/* ============================================================
 * Kunci API: pakai override dari login bila ada, selain itu env.
 * ============================================================ */
export function getApiKey() {
  return load('apiKey', '') || ENV_API_KEY || ''
}

export function setApiKey(key) {
  save('apiKey', String(key || '').trim())
}

function authHeaders(key) {
  const k = (key || getApiKey() || '').trim()
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${k}`,
  }
}

async function parseError(res) {
  let detail = ''
  try {
    const text = await res.text()
    try {
      const json = JSON.parse(text)
      detail = json?.error?.message || json?.message || text
    } catch {
      detail = text
    }
  } catch {
    /* noop */
  }
  const err = new Error(detail || `HTTP ${res.status}`)
  err.status = res.status
  return err
}

/* ============================================================
 * Models — realtime dari API
 * ============================================================ */
export async function listModels(key) {
  const res = await fetch(`${API_BASE}/models`, { headers: authHeaders(key) })
  if (!res.ok) throw await parseError(res)
  const json = await res.json()
  return json?.data || []
}

export async function getModel(id, key) {
  const res = await fetch(`${API_BASE}/models/${encodeURIComponent(id)}`, { headers: authHeaders(key) })
  if (!res.ok) throw await parseError(res)
  return res.json()
}

/** Tes koneksi cepat — dipakai indikator status di navbar. */
export async function pingApi(key) {
  const t0 = Date.now()
  await listModels(key)
  return Date.now() - t0
}

/* ============================================================
 * Chat streaming (SSE) — realtime langsung dari browser
 * ============================================================ */
export async function streamChat({
  model,
  messages,
  temperature,
  maxTokens,
  topP,
  signal,
  onDelta,
  onReasoning,
  onUsage,
  onFinish,
  onDone,
  onError,
}) {
  const body = {
    model,
    messages,
    stream: true,
  }
  if (temperature != null) body.temperature = Number(temperature)
  if (maxTokens != null) body.max_tokens = Number(maxTokens)
  if (topP != null) body.top_p = Number(topP)

  const res = await fetch(`${API_BASE}/chat/completions`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(body),
    signal,
  })

  if (!res.ok) {
    const err = await parseError(res)
    onError?.(err)
    throw err
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let sawDone = false

  while (true) {
    let chunk
    try {
      chunk = await reader.read()
    } catch (e) {
      if (e?.name === 'AbortError') break
      throw e
    }
    if (chunk.done) break
    buffer += decoder.decode(chunk.value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith(':')) continue // keep-alive ": ping"
      if (!trimmed.startsWith('data:')) continue
      const payload = trimmed.slice(5).trim()
      if (payload === '[DONE]') {
        sawDone = true
        continue
      }
      let json
      try {
        json = JSON.parse(payload)
      } catch {
        continue
      }
      if (json.error) {
        onError?.(new Error(json.error.message || 'Galat di tengah stream'))
        continue
      }
      const choice = json.choices?.[0]
      const delta = choice?.delta || {}
      const reasoning = delta.reasoning_content ?? delta.reasoning
      if (reasoning) onReasoning?.(reasoning)
      if (delta.content) onDelta?.(delta.content)
      if (json.usage) onUsage?.(json.usage)
      if (choice?.finish_reason) onFinish?.(choice.finish_reason)
    }
    if (sawDone) break
  }
  onDone?.()
}

/* ============================================================
 * Chat non-stream (dipakai fallback generator media)
 * ============================================================ */
export async function chatOnce({ model, messages, temperature, maxTokens, signal, key }) {
  const body = { model, messages }
  if (temperature != null) body.temperature = Number(temperature)
  if (maxTokens != null) body.max_tokens = Number(maxTokens)
  const res = await fetch(`${API_BASE}/chat/completions`, {
    method: 'POST',
    headers: authHeaders(key),
    body: JSON.stringify(body),
    signal,
  })
  if (!res.ok) throw await parseError(res)
  const json = await res.json()
  return {
    content: json?.choices?.[0]?.message?.content ?? '',
    usage: json?.usage,
    raw: json,
  }
}

/* ============================================================
 * Generator media — mencoba beberapa strategi lalu fallback
 * (router OpenAI-compatible: /images/generations, /videos, atau
 * model chat yang mengembalikan URL/base64 media).
 * ============================================================ */
async function tryEndpoint(path, body, key, signal) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: authHeaders(key),
    body: JSON.stringify(body),
    signal,
  })
  if (!res.ok) throw await parseError(res)
  return res.json()
}

function collectFromObject(json, defaultType) {
  const items = []
  const seen = new Set()
  const push = (url, type) => {
    if (!url || typeof url !== 'string') return
    const k = url.slice(0, 240)
    if (seen.has(k)) return
    seen.add(k)
    items.push({ url, type: type || (/^data:video\//i.test(url) ? 'video' : /^data:image\//i.test(url) ? 'image' : defaultType), name: '' })
  }

  const walk = (node, depth = 0) => {
    if (node == null || depth > 6) return
    if (typeof node === 'string') {
      if (/^(https?:\/\/|data:(image|video)\/)/i.test(node)) push(node)
      return
    }
    if (Array.isArray(node)) {
      node.forEach((n) => walk(n, depth + 1))
      return
    }
    if (typeof node !== 'object') return
    if (typeof node.url === 'string') push(node.url, node.type)
    if (typeof node.b64_json === 'string') push(`data:image/png;base64,${node.b64_json}`)
    if (typeof node.video_url === 'string') push(node.video_url, 'video')
    if (typeof node.image_url === 'string') push(node.image_url, 'image')
    if (typeof node.output_url === 'string') push(node.output_url)
    for (const v of Object.values(node)) {
      if (v && typeof v === 'object') walk(v, depth + 1)
    }
  }
  walk(json)
  return items
}

export async function generateMedia({
  mode = 'image',
  model,
  prompt,
  negativePrompt,
  n = 1,
  aspect = '1:1',
  style,
  duration,
  signal,
  key,
}) {
  const fullPrompt = [style ? `Style: ${style}.` : '', prompt, negativePrompt ? `Hindari: ${negativePrompt}.` : '']
    .filter(Boolean)
    .join('\n')

  const sizeMap = {
    '1:1': '1024x1024',
    '16:9': '1792x1024',
    '9:16': '1024x1792',
    '4:3': '1024x768',
    '3:4': '768x1024',
  }
  const size = sizeMap[aspect] || '1024x1024'
  const attempts = []
  let items = []

  const strategies =
    mode === 'video'
      ? [
          {
            label: 'POST /videos/generations',
            run: () =>
              tryEndpoint(
                '/videos/generations',
                { model, prompt: fullPrompt, n: Number(n) || 1, size, duration: duration || undefined },
                key,
                signal
              ),
          },
          {
            label: 'POST /videos',
            run: () => tryEndpoint('/videos', { model, prompt: fullPrompt, size, duration: duration || undefined }, key, signal),
          },
          {
            label: 'POST /images/generations (video via chat)',
            run: () =>
              tryEndpoint(
                '/images/generations',
                { model, prompt: fullPrompt, n: Number(n) || 1, size, response_format: 'url' },
                key,
                signal
              ),
          },
        ]
      : [
          {
            label: 'POST /images/generations',
            run: () =>
              tryEndpoint(
                '/images/generations',
                { model, prompt: fullPrompt, n: Number(n) || 1, size, response_format: 'url' },
                key,
                signal
              ),
          },
        ]

  for (const s of strategies) {
    try {
      const json = await s.run()
      items = collectFromObject(json, mode)
      if (items.length) {
        attempts.push({ label: s.label, ok: true })
        return { items, attempts }
      }
      attempts.push({ label: s.label, ok: false, error: 'Tidak ada media di respons' })
    } catch (e) {
      if (e?.name === 'AbortError') throw e
      attempts.push({ label: s.label, ok: false, error: e.message })
    }
  }

  // Fallback terakhir: chat completion yang mengembalikan media
  try {
    const sys =
      mode === 'video'
        ? 'You are a video generation assistant. Generate the requested video and reply ONLY with the direct video URL(s) (mp4/webm) or embedded markdown video links. No commentary.'
        : 'You are an image generation assistant. Generate the requested image and reply ONLY with the direct image URL(s) or embedded markdown image links. No commentary.'
    const { content } = await chatOnce(
      {
        model,
        messages: [
          { role: 'system', content: sys },
          { role: 'user', content: fullPrompt },
        ],
        maxTokens: 2048,
        key,
        signal,
      }
    )
    items = collectFromObject(content, mode)
    // tambahkan URL mentah dari teks
    const rawUrls = content.match(/https?:\/\/[^\s)>"']+/g) || []
    for (const u of rawUrls) {
      if (!items.some((i) => i.url === u)) items.push({ url: u, type: mode, name: '' })
    }
    attempts.push({ label: 'chat/completions fallback', ok: items.length > 0, error: items.length ? undefined : 'Model tidak mengembalikan media' })
    return { items, attempts, text: content }
  } catch (e) {
    if (e?.name === 'AbortError') throw e
    attempts.push({ label: 'chat/completions fallback', ok: false, error: e.message })
    const err = new Error(
      attempts.map((a) => `${a.label}: ${a.error || 'ok'}`).join(' | ') || 'Gagal membuat media'
    )
    err.attempts = attempts
    throw err
  }
}

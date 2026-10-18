export function fmtCtx(n) {
  if (!n && n !== 0) return '—'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1).replace('.0', '') + 'M'
  if (n >= 1_000) return Math.round(n / 1_000) + 'K'
  return String(n)
}

export function fmtNum(n) {
  if (n == null) return '—'
  return new Intl.NumberFormat('id-ID').format(n)
}

export function fmtUSD(n, digits = 4) {
  if (n == null) return '—'
  if (n === 0) return '$0'
  if (n < 0.0001) return '$' + n.toExponential(1)
  return '$' + n.toFixed(digits).replace(/0+$/, '').replace(/\.$/, '')
}

/** Harga per 1 juta token — satuan yang lebih enak dibaca. */
export function fmtPerMillion(per1k, digits = 2) {
  if (per1k == null) return '—'
  if (per1k === 0) return 'Gratis'
  const per1m = per1k * 1000
  return '$' + per1m.toLocaleString('en-US', { maximumFractionDigits: digits })
}

export function estimateCost(usage, pricing) {
  if (!usage || !pricing) return null
  const pin = (usage.prompt_tokens || 0) / 1000 * (pricing.input_per_1k || 0)
  const pout = (usage.completion_tokens || 0) / 1000 * (pricing.output_per_1k || 0)
  return pin + pout
}

export function fmtTime(ts) {
  try {
    return new Date(ts).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
}

export function fmtDateTime(ts) {
  try {
    return new Date(ts).toLocaleString('id-ID', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return ''
  }
}

export function relTime(ts) {
  const diff = Date.now() - ts
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'baru saja'
  if (m < 60) return m + ' mnt lalu'
  const h = Math.floor(m / 60)
  if (h < 24) return h + ' jam lalu'
  const d = Math.floor(h / 24)
  return d + ' hari lalu'
}

export function titleFromText(text, max = 42) {
  const clean = String(text || '').replace(/[#*`_>\[\]()!]/g, ' ').replace(/\s+/g, ' ').trim()
  if (!clean) return 'Percakapan baru'
  return clean.length > max ? clean.slice(0, max - 1) + '…' : clean
}

export function extFromUrl(url = '') {
  const clean = url.split('?')[0].split('#')[0]
  const m = clean.match(/\.([a-z0-9]{1,8})$/i)
  return m ? m[1].toLowerCase() : ''
}

export function isImageUrl(url = '') {
  if (/^data:image\//i.test(url)) return true
  return /(jpe?g|png|webp|gif|svg|avif|bmp)$/i.test(url.split('?')[0])
}

export function isVideoUrl(url = '') {
  if (/^data:video\//i.test(url)) return true
  return /(mp4|webm|mov|m4v|ogv|mkv|m3u8)$/i.test(url.split('?')[0])
}

export function filenameFromUrl(url = '', fallback = 'file') {
  try {
    if (/^data:/i.test(url)) {
      const mime = url.slice(5).split(';')[0].split('/')[1] || 'bin'
      return fallback + '.' + (mime === 'jpeg' ? 'jpg' : mime)
    }
    const last = url.split('?')[0].split('#')[0].split('/').filter(Boolean).pop()
    return last && last.includes('.') ? last : fallback + '.' + (extFromUrl(url) || 'bin')
  } catch {
    return fallback + '.bin'
  }
}

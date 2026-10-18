import { isImageUrl, isVideoUrl, filenameFromUrl } from './format'

/**
 * Deteksi media (gambar/video) dari teks model:
 * data URI, markdown image/link, tag HTML, dan URL mentah.
 */
export function extractMedia(text = '', { defaultType = 'image' } = {}) {
  const items = []
  const seen = new Set()
  const push = (url, type, name = '') => {
    if (!url) return
    const key = url.length > 200 ? url.slice(0, 200) : url
    if (seen.has(key)) return
    seen.add(key)
    const t = type || (/^data:video\//i.test(url) ? 'video' : /^data:image\//i.test(url) ? 'image' : defaultType)
    items.push({ url, type: t, name: name || filenameFromUrl(url, t === 'video' ? 'video' : 'gambar') })
  }

  // data URI
  for (const m of text.matchAll(/data:(image|video)\/[a-zA-Z0-9+.-]+;base64,[A-Za-z0-9+/=\s]+/g)) {
    push(m[0].replace(/\s+/g, ''), m[1] === 'video' ? 'video' : 'image')
  }

  // markdown image ![alt](url)
  for (const m of text.matchAll(/!\[[^\]]*]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)) {
    push(m[1], isVideoUrl(m[1]) ? 'video' : 'image')
  }

  // markdown link [text](url) yang mengarah ke media
  for (const m of text.matchAll(/(?<!!)\[[^\]]*]\((https?:\/\/[^)\s]+)\)/g)) {
    const url = m[1]
    if (isImageUrl(url)) push(url, 'image')
    else if (isVideoUrl(url)) push(url, 'video')
  }

  // tag HTML <img>, <video>, <source>
  for (const m of text.matchAll(/<(img|video|source)\b[^>]*?(?:src|href)=["']([^"']+)["']/gi)) {
    push(m[2], m[1].toLowerCase() === 'img' ? 'image' : 'video')
  }

  // URL mentah dengan ekstensi media
  for (const m of text.matchAll(/https?:\/\/[^\s)>"'`]+/g)) {
    const url = m[0]
    if (isImageUrl(url)) push(url, 'image')
    else if (isVideoUrl(url)) push(url, 'video')
  }

  return items
}

/** Ambil semua blok kode dari teks markdown — untuk ekspor ZIP. */
export function extractCodeBlocks(text = '') {
  const blocks = []
  for (const m of text.matchAll(/```([\w+#.-]*)[^\n]*\n([\s\S]*?)```/g)) {
    blocks.push({ lang: (m[1] || 'txt').toLowerCase(), code: m[2] })
  }
  return blocks
}

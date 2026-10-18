import JSZip from 'jszip'
import { extractCodeBlocks } from './media'
import { filenameFromUrl, extFromUrl } from './format'

export function downloadBlob(name, blob) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 4000)
}

export function downloadText(name, text, mime = 'text/plain') {
  downloadBlob(name, new Blob([text], { type: mime + ';charset=utf-8' }))
}

export async function downloadUrl(url, name) {
  if (/^data:/i.test(url)) {
    const res = await fetch(url)
    downloadBlob(name, await res.blob())
    return
  }
  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error('HTTP ' + res.status)
    downloadBlob(name, await res.blob())
  } catch {
    // fallback: buka di tab baru (CORS / host asing)
    window.open(url, '_blank', 'noopener')
  }
}

export async function zipAndDownload(files, zipName = 'unduhan.zip') {
  const zip = new JSZip()
  const used = new Set()
  for (const f of files) {
    let name = f.name || 'file.txt'
    if (used.has(name)) {
      const parts = name.split('.')
      const ext = parts.length > 1 ? '.' + parts.pop() : ''
      name = parts.join('.') + '-' + Math.random().toString(36).slice(2, 6) + ext
    }
    used.add(name)
    if (f.blob) zip.file(name, f.blob)
    else zip.file(name, f.content ?? '')
  }
  const blob = await zip.generateAsync({ type: 'blob' })
  downloadBlob(zipName, blob)
}

export function exportConversationZip(conversation) {
  const files = []
  const lines = [`# ${conversation.title}`, '']
  for (const msg of conversation.messages) {
    lines.push(`## ${msg.role === 'user' ? 'Anda' : 'Asisten'}`, '', msg.content || '', '')
    const blocks = extractCodeBlocks(msg.content || '')
    blocks.forEach((b, i) => {
      files.push({
        name: `kode/${slug(conversation.title)}/${String(i + 1).padStart(2, '0')}.${fileExtForLang(b.lang)}`,
        content: b.code,
      })
    })
  }
  files.unshift({ name: 'percakapan.md', content: lines.join('\n') })
  files.push({ name: 'percakapan.json', content: JSON.stringify(conversation, null, 2) })
  return zipAndDownload(files, `${slug(conversation.title) || 'percakapan'}.zip`)
}

export function exportCodeBlocksZip(messages, zipName = 'kode.zip') {
  const files = []
  let n = 0
  for (const msg of messages) {
    for (const b of extractCodeBlocks(msg.content || '')) {
      n += 1
      files.push({ name: `${String(n).padStart(2, '0')}.${fileExtForLang(b.lang)}`, content: b.code })
    }
  }
  if (!files.length) return Promise.resolve(false)
  return zipAndDownload(files, zipName).then(() => true)
}

export async function exportMediaZip(items, zipName = 'media.zip') {
  const files = []
  for (const [i, it] of items.entries()) {
    try {
      let blob
      if (/^data:/i.test(it.url)) {
        blob = await (await fetch(it.url)).blob()
      } else {
        blob = await (await fetch(it.url)).blob()
      }
      files.push({ name: `${String(i + 1).padStart(2, '0')}-${it.name || filenameFromUrl(it.url, it.type)}`, blob })
    } catch {
      files.push({ name: `${String(i + 1).padStart(2, '0')}-link.txt`, content: it.url })
    }
  }
  return zipAndDownload(files, zipName)
}

export function slug(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
}

const LANG_EXT = {
  js: 'js', javascript: 'js', jsx: 'jsx', ts: 'ts', typescript: 'ts', tsx: 'tsx',
  py: 'py', python: 'py', rb: 'rb', ruby: 'rb', go: 'go', rs: 'rs', rust: 'rs',
  java: 'java', kt: 'kt', kotlin: 'kt', php: 'php', swift: 'swift', c: 'c',
  cpp: 'cpp', 'c++': 'cpp', cc: 'cpp', h: 'h', hpp: 'hpp', cs: 'cs', 'c#': 'cs',
  html: 'html', css: 'css', scss: 'scss', sass: 'sass', less: 'less', vue: 'vue',
  svelte: 'svelte', sh: 'sh', bash: 'sh', zsh: 'sh', shell: 'sh', powershell: 'ps1',
  ps1: 'ps1', sql: 'sql', json: 'json', yaml: 'yaml', yml: 'yml', toml: 'toml',
  xml: 'xml', md: 'md', markdown: 'md', dockerfile: 'dockerfile', makefile: 'makefile',
  ini: 'ini', env: 'env', txt: 'txt', text: 'txt', plaintext: 'txt', csv: 'csv',
  dart: 'dart', lua: 'lua', r: 'r', scala: 'scala', elixir: 'ex', ex: 'ex',
  graphql: 'graphql', diff: 'diff', patch: 'patch', http: 'http', nginx: 'conf',
  regex: 'txt', gradle: 'gradle', cmake: 'cmake',
}

export function fileExtForLang(lang = 'txt') {
  return LANG_EXT[String(lang).toLowerCase()] || 'txt'
}

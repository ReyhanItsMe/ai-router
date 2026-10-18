import { useMemo, useState } from 'react'
import hljs from 'highlight.js/lib/common'
import { Check, Copy, Download, FileCode2 } from 'lucide-react'
import { downloadText, fileExtForLang } from '../lib/export'
import { useApp } from '../context/AppContext'

function safeHighlight(code, lang) {
  try {
    if (lang && hljs.getLanguage(lang)) {
      return { html: hljs.highlight(code, { language: lang }).value, lang }
    }
    return { html: hljs.highlightAuto(code).value, lang: 'auto' }
  } catch {
    return { html: code.replace(/&/g, '&amp;').replace(/</g, '&lt;'), lang: lang || 'txt' }
  }
}

export default function CodeBlock({ code = '', lang = '', filename }) {
  const { pushToast } = useApp()
  const [copied, setCopied] = useState(false)
  const { html, lang: usedLang } = useMemo(() => safeHighlight(code, lang), [code, lang])
  const name = filename || `kode.${fileExtForLang(lang || usedLang)}`

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      pushToast('Gagal menyalin ke clipboard', 'error')
    }
  }

  const download = () => {
    downloadText(name, code, 'text/plain')
    pushToast(`Mengunduh ${name}`, 'success')
  }

  return (
    <div className="group/code my-4 overflow-hidden rounded-2xl border border-line bg-cream-200/50">
      <div className="flex items-center justify-between gap-2 border-b border-line bg-cream-200/80 px-3 py-2">
        <div className="flex items-center gap-2 text-muted">
          <FileCode2 size={14} />
          <span className="font-mono text-[11px] font-semibold uppercase tracking-wider">{lang || usedLang || 'kode'}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={copy}
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold text-muted transition-colors hover:bg-cream-50 hover:text-ink-900"
            title="Salin kode"
          >
            {copied ? <Check size={12} className="text-ok" /> : <Copy size={12} />}
            {copied ? 'Tersalin' : 'Salin'}
          </button>
          <button
            onClick={download}
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold text-muted transition-colors hover:bg-cream-50 hover:text-ink-900"
            title="Unduh file"
          >
            <Download size={12} />
            Unduh
          </button>
        </div>
      </div>
      <pre className="codeblock-body">
        <code className="hljs" dangerouslySetInnerHTML={{ __html: html }} />
      </pre>
    </div>
  )
}

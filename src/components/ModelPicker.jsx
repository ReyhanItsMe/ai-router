import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, Loader2, Search, Sparkles, Zap, Eye, Wrench, RefreshCw, Globe, Code2, MessageSquare, Brain } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { fmtCtx, fmtPerMillion } from '../lib/format'

const CAP_META = {
  reasoning: { label: 'Reasoning', icon: Brain },
  vision: { label: 'Vision', icon: Eye },
  tools: { label: 'Tools', icon: Wrench },
  streaming: { label: 'Streaming', icon: Zap },
  json_mode: { label: 'JSON', icon: Code2 },
  web_search: { label: 'Web', icon: Globe },
  chat: { label: 'Chat', icon: MessageSquare },
  coding: { label: 'Coding', icon: Code2 },
}

export function CapabilityChips({ caps = [], max = 4 }) {
  const shown = caps.slice(0, max)
  return (
    <div className="flex flex-wrap items-center gap-1">
      {shown.map((c) => {
        const meta = CAP_META[c] || { label: c, icon: Sparkles }
        const Icon = meta.icon
        return (
          <span key={c} className="chip !gap-1 !px-2 !py-0.5">
            <Icon size={10} />
            {meta.label}
          </span>
        )
      })}
      {caps.length > max && <span className="chip !px-2 !py-0.5">+{caps.length - max}</span>}
    </div>
  )
}

export default function ModelPicker({ value, onChange, filter, className = '', compact = false }) {
  const { models, modelsState, refreshModels } = useApp()
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const ref = useRef(null)

  const filtered = useMemo(() => {
    let list = models
    if (filter) list = list.filter(filter)
    const needle = q.trim().toLowerCase()
    if (needle) {
      list = list.filter(
        (m) =>
          m.id.toLowerCase().includes(needle) ||
          (m.name || '').toLowerCase().includes(needle) ||
          (m.description || '').toLowerCase().includes(needle)
      )
    }
    return list
  }, [models, q, filter])

  const current = models.find((m) => m.id === value)

  useEffect(() => {
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex w-full items-center justify-between gap-2 rounded-full border border-line bg-cream-50 px-4 py-2.5 text-left transition-all hover:shadow-soft ${
          open ? 'shadow-soft border-ink-800/25' : ''
        }`}
      >
        <span className="flex min-w-0 items-center gap-2">
          <Sparkles size={14} className="shrink-0 text-muted" />
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-ink-900">
              {current?.name || current?.id || 'Pilih model'}
            </span>
            {!compact && (
              <span className="block truncate font-mono text-[10px] text-muted">{current?.id || '—'}</span>
            )}
          </span>
        </span>
        <ChevronDown size={15} className={`shrink-0 text-muted transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-3xl border border-line bg-cream-50 shadow-pop">
          <div className="flex items-center gap-2 border-b border-line px-3 py-2.5">
            <Search size={14} className="text-muted" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cari model…"
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-2"
            />
            <button
              onClick={(e) => {
                e.stopPropagation()
                refreshModels()
              }}
              className="btn-icon !h-7 !w-7"
              title="Muat ulang daftar model"
            >
              <RefreshCw size={12} className={modelsState.loading ? 'animate-spin' : ''} />
            </button>
          </div>
          <div className="max-h-[340px] overflow-y-auto p-1.5">
            {modelsState.loading && !models.length && (
              <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted">
                <Loader2 size={15} className="animate-spin" /> Memuat model…
              </div>
            )}
            {modelsState.error && (
              <div className="px-3 py-6 text-center text-sm text-err">
                {modelsState.error}
                <button onClick={refreshModels} className="mx-auto mt-2 block text-xs font-semibold underline">
                  Coba lagi
                </button>
              </div>
            )}
            {!modelsState.loading && !filtered.length && (
              <div className="px-3 py-6 text-center text-sm text-muted">Tidak ada model yang cocok.</div>
            )}
            {filtered.map((m) => (
              <button
                key={m.id}
                onClick={() => {
                  onChange(m.id)
                  setOpen(false)
                }}
                className={`flex w-full items-start justify-between gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors hover:bg-cream-200/70 ${
                  m.id === value ? 'bg-cream-200/80' : ''
                }`}
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-ink-900">{m.name || m.id}</span>
                  <span className="mt-0.5 block truncate font-mono text-[10px] text-muted">{m.id}</span>
                  <span className="mt-1 block">
                    <CapabilityChips caps={m.capabilities || []} max={3} />
                  </span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block text-[11px] font-bold text-ink-800">
                    {fmtPerMillion(m.pricing?.input_per_1k)}
                    <span className="font-normal text-muted">/1M in</span>
                  </span>
                  <span className="mt-0.5 block text-[10px] text-muted">{fmtCtx(m.context_window)} ctx</span>
                </span>
              </button>
            ))}
          </div>
          <div className="border-t border-line px-4 py-2.5 text-[11px] text-muted">
            {models.length} model tersedia · data realtime dari API
          </div>
        </div>
      )}
    </div>
  )
}

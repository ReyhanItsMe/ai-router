import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Boxes,
  Check,
  Cpu,
  DollarSign,
  Loader2,
  RefreshCw,
  Search,
  Sparkles,
  X,
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import { getModel } from '../lib/api'
import { fmtCtx, fmtNum, fmtPerMillion } from '../lib/format'
import { CapabilityChips } from '../components/ModelPicker'

const FILTERS = ['reasoning', 'vision', 'tools', 'streaming', 'json_mode', 'web_search', 'coding']

export default function Models() {
  const { models, modelsState, refreshModels, settings, setSetting, pushToast } = useApp()
  const nav = useNavigate()
  const [q, setQ] = useState('')
  const [caps, setCaps] = useState([])
  const [sort, setSort] = useState('name')
  const [detail, setDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const list = useMemo(() => {
    let arr = [...models]
    const needle = q.trim().toLowerCase()
    if (needle) {
      arr = arr.filter(
        (m) =>
          m.id.toLowerCase().includes(needle) ||
          (m.name || '').toLowerCase().includes(needle) ||
          (m.description || '').toLowerCase().includes(needle)
      )
    }
    if (caps.length) {
      arr = arr.filter((m) => caps.every((c) => (m.capabilities || []).includes(c)))
    }
    if (sort === 'name') arr.sort((a, b) => (a.name || a.id).localeCompare(b.name || b.id))
    if (sort === 'price') arr.sort((a, b) => (a.pricing?.input_per_1k ?? 0) - (b.pricing?.input_per_1k ?? 0))
    if (sort === 'price-desc') arr.sort((a, b) => (b.pricing?.input_per_1k ?? 0) - (a.pricing?.input_per_1k ?? 0))
    if (sort === 'ctx') arr.sort((a, b) => (b.context_window || 0) - (a.context_window || 0))
    return arr
  }, [models, q, caps, sort])

  const openDetail = async (m) => {
    setDetail(m)
    setDetailLoading(true)
    try {
      const full = await getModel(m.id)
      setDetail(full)
    } catch {
      // pakai data list saja
    } finally {
      setDetailLoading(false)
    }
  }

  const toggleCap = (c) => setCaps((x) => (x.includes(c) ? x.filter((y) => y !== c) : [...x, c]))

  return (
    <div className="mx-auto max-w-6xl px-5 pb-16 pt-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label-xs">Katalog model · realtime</p>
          <h1 className="heading-2 mt-2">
            Cek semua model.
            <br />
            <span className="text-muted-2">Kemampuan &amp; harga.</span>
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={refreshModels} className="btn-ghost !px-4 !py-2.5 text-xs">
            <RefreshCw size={13} className={modelsState.loading ? 'animate-spin' : ''} /> Muat ulang
          </button>
          <div className="pill !py-2.5 text-xs">
            <Boxes size={13} /> {models.length} model
          </div>
        </div>
      </div>

      {/* filter bar */}
      <div className="mt-7 flex flex-col gap-3 rounded-[24px] border border-line bg-cream-50 p-4 sm:flex-row sm:items-center">
        <div className="flex flex-1 items-center gap-2 rounded-full border border-line bg-cream-100 px-4 py-2.5">
          <Search size={15} className="text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari nama, ID, atau deskripsi…"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-2"
          />
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="rounded-full border border-line bg-cream-100 px-4 py-2.5 text-sm font-semibold outline-none"
        >
          <option value="name">Urut: Nama</option>
          <option value="price">Harga termurah</option>
          <option value="price-desc">Harga termahal</option>
          <option value="ctx">Context terbesar</option>
        </select>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {FILTERS.map((c) => (
          <button key={c} onClick={() => toggleCap(c)} className={`chip transition-all ${caps.includes(c) ? 'chip-on' : 'hover:border-ink-800/25'}`}>
            {caps.includes(c) && <Check size={10} />}
            {c.replace('_', ' ')}
          </button>
        ))}
        {caps.length > 0 && (
          <button onClick={() => setCaps([])} className="chip hover:border-ink-800/25">
            <X size={10} /> Reset
          </button>
        )}
      </div>

      {modelsState.loading && !models.length && (
        <div className="flex items-center justify-center gap-2 py-24 text-muted">
          <Loader2 size={18} className="animate-spin" /> Memuat daftar model…
        </div>
      )}
      {modelsState.error && (
        <div className="card mt-8 px-6 py-10 text-center">
          <p className="text-err">{modelsState.error}</p>
          <button onClick={refreshModels} className="btn-dark mt-4">Coba lagi</button>
        </div>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((m) => (
          <button
            key={m.id}
            onClick={() => openDetail(m)}
            className="card group flex flex-col gap-3 p-5 text-left transition-all hover:-translate-y-0.5 hover:shadow-card"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-[15px] font-extrabold tracking-tight text-ink-900">{m.name || m.id}</p>
                <p className="mt-0.5 truncate font-mono text-[10.5px] text-muted">{m.id}</p>
              </div>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-line bg-cream-200/60 text-muted transition-colors group-hover:bg-ink-900 group-hover:text-cream-100">
                <Cpu size={15} />
              </div>
            </div>
            <p className="line-clamp-2 text-xs leading-relaxed text-muted">{m.description || '—'}</p>
            <CapabilityChips caps={m.capabilities || []} max={4} />
            <div className="mt-auto flex items-end justify-between gap-2 border-t border-line pt-3">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-2">Context</p>
                <p className="text-sm font-bold">{fmtCtx(m.context_window)} token</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-wider text-muted-2">Per 1M token</p>
                <p className="text-sm font-bold">
                  {fmtPerMillion(m.pricing?.input_per_1k)}
                  <span className="font-normal text-muted"> / </span>
                  {fmtPerMillion(m.pricing?.output_per_1k)}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {!list.length && !modelsState.loading && (
        <div className="card mt-8 px-6 py-14 text-center">
          <Sparkles size={22} className="mx-auto text-muted-2" />
          <p className="mt-3 text-muted">Tidak ada model yang cocok dengan filter.</p>
        </div>
      )}

      {/* modal detail */}
      {detail && (
        <div className="fixed inset-0 z-[85] flex items-end justify-center bg-ink-900/50 p-0 sm:items-center sm:p-6" onClick={() => setDetail(null)}>
          <div
            className="animate-fadeup max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-t-[32px] border border-line bg-cream-50 p-7 sm:rounded-[32px]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="label-xs">Detail model</p>
                <h2 className="mt-1 text-2xl font-extrabold tracking-tight">{detail.name || detail.id}</h2>
                <p className="mt-1 font-mono text-xs text-muted">{detail.id}</p>
              </div>
              <button onClick={() => setDetail(null)} className="btn-icon">
                <X size={15} />
              </button>
            </div>

            {detailLoading ? (
              <div className="flex items-center justify-center gap-2 py-10 text-muted">
                <Loader2 size={16} className="animate-spin" /> Mengambil detail…
              </div>
            ) : (
              <>
                <p className="mt-4 text-sm leading-relaxed text-muted">{detail.description || 'Tanpa deskripsi.'}</p>
                <div className="mt-5">
                  <CapabilityChips caps={detail.capabilities || []} max={9} />
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-line bg-cream-100 p-4">
                    <p className="text-[10px] uppercase tracking-wider text-muted-2">Context window</p>
                    <p className="mt-1 text-lg font-extrabold">{fmtNum(detail.context_window)} token</p>
                  </div>
                  <div className="rounded-2xl border border-line bg-cream-100 p-4">
                    <p className="text-[10px] uppercase tracking-wider text-muted-2">Tipe</p>
                    <p className="mt-1 text-lg font-extrabold capitalize">{detail.type || 'chat'}</p>
                  </div>
                  <div className="rounded-2xl border border-line bg-cream-100 p-4">
                    <p className="text-[10px] uppercase tracking-wider text-muted-2">Input / 1M</p>
                    <p className="mt-1 text-lg font-extrabold">{fmtPerMillion(detail.pricing?.input_per_1k)}</p>
                  </div>
                  <div className="rounded-2xl border border-line bg-cream-100 p-4">
                    <p className="text-[10px] uppercase tracking-wider text-muted-2">Output / 1M</p>
                    <p className="mt-1 text-lg font-extrabold">{fmtPerMillion(detail.pricing?.output_per_1k)}</p>
                  </div>
                </div>
                {(detail.modalities || detail.input_modalities) && (
                  <div className="mt-4 rounded-2xl border border-dashed border-line px-4 py-3 text-xs text-muted">
                    Modalitas input: {(detail.input_modalities || detail.modalities || []).join(', ') || '—'}
                    <br />
                    Modalitas: {(detail.modalities || []).join(', ') || '—'}
                    {detail.owned_by && (
                      <>
                        <br />
                        Dikelola oleh: {detail.owned_by}
                      </>
                    )}
                  </div>
                )}
                <div className="mt-6 flex gap-2">
                  <button
                    onClick={() => {
                      setSetting('model', detail.id)
                      pushToast(`Model aktif: ${detail.name || detail.id}`, 'success')
                      nav('/chat')
                    }}
                    className="btn-dark flex-1"
                  >
                    <DollarSign size={15} /> Pakai di Chat
                  </button>
                  <button
                    onClick={() => {
                      setSetting('mediaModel', detail.id)
                      pushToast(`Model media: ${detail.id}`, 'success')
                      nav('/media')
                    }}
                    className="btn-ghost flex-1"
                  >
                    Pakai di Media
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

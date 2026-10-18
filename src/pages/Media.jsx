import { useRef, useState } from 'react'
import {
  Download,
  Film,
  History,
  Image as ImageIcon,
  Loader2,
  Sparkles,
  Trash2,
  Wand2,
  FileArchive,
  FilmIcon,
} from 'lucide-react'
import ModelPicker from '../components/ModelPicker'
import { useApp } from '../context/AppContext'
import { generateMedia } from '../lib/api'
import { load, save, uid } from '../lib/storage'
import { downloadUrl, exportMediaZip } from '../lib/export'
import { fmtDateTime } from '../lib/format'

const ASPECTS = ['1:1', '16:9', '9:16', '4:3', '3:4']
const STYLES = ['Fotorealistik', 'Ilustrasi datar', '3D render', 'Anime', 'Lukisan cat air', 'Minimalis', 'Cinematic', 'Vintage']

export default function Media() {
  const { settings, setSetting, models, pushToast, modelsState } = useApp()
  const [mode, setMode] = useState('image')
  const [prompt, setPrompt] = useState('')
  const [negative, setNegative] = useState('')
  const [style, setStyle] = useState('')
  const [aspect, setAspect] = useState('1:1')
  const [n, setN] = useState(1)
  const [busy, setBusy] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [results, setResults] = useState([])
  const [attempts, setAttempts] = useState([])
  const [history, setHistory] = useState(() => load('mediaHistory', []))
  const [customModel, setCustomModel] = useState('')
  const [useCustom, setUseCustom] = useState(false)
  const timerRef = useRef(null)
  const abortRef = useRef(null)

  const modelId = useCustom ? customModel.trim() : settings.mediaModel || settings.model

  const pushHistory = (items) => {
    const keep = items
      .filter((i) => !/^data:/i.test(i.url)) // data URI terlalu besar untuk localStorage
      .map((i) => ({ ...i, id: uid(), mode, prompt, ts: Date.now() }))
    const next = [...keep, ...history].slice(0, 24)
    setHistory(next)
    save('mediaHistory', next)
  }

  const generate = async () => {
    if (!prompt.trim() || busy) return
    if (!modelId) {
      pushToast('Pilih model dulu', 'error')
      return
    }
    setBusy(true)
    setResults([])
    setAttempts([])
    const t0 = Date.now()
    setElapsed(0)
    timerRef.current = setInterval(() => setElapsed(Math.round((Date.now() - t0) / 1000)), 1000)
    abortRef.current = new AbortController()

    try {
      const { items, attempts: att } = await generateMedia({
        mode,
        model: modelId,
        prompt: prompt.trim(),
        negativePrompt: negative.trim(),
        n,
        aspect,
        style: style || undefined,
        signal: abortRef.current.signal,
      })
      setAttempts(att)
      if (!items.length) {
        pushToast('Model tidak mengembalikan media. Coba model / prompt lain.', 'error')
      } else {
        setResults(items)
        pushHistory(items)
        pushToast(`${items.length} ${mode === 'video' ? 'video' : 'gambar'} dibuat`, 'success')
      }
    } catch (e) {
      if (e?.name !== 'AbortError') {
        pushToast('Gagal: ' + (e.message || 'tidak diketahui').slice(0, 140), 'error')
        if (e.attempts) setAttempts(e.attempts)
      }
    } finally {
      clearInterval(timerRef.current)
      setBusy(false)
    }
  }

  const clearHistory = () => {
    setHistory([])
    save('mediaHistory', [])
  }

  return (
    <div className="mx-auto max-w-6xl px-5 pb-16 pt-6">
      {/* hero */}
      <div className="relative overflow-hidden rounded-[32px] border border-line bg-cream-200/50 px-6 py-10 sm:px-10">
        <div className="gradient-blob pointer-events-none absolute -right-24 -top-24 h-[380px] w-[380px] rounded-full" />
        <p className="label-xs">Studio media</p>
        <h1 className="heading-2 mt-2 max-w-xl">
          Bikin foto &amp; video.
          <br />
          <span className="text-muted-2">Dari satu prompt.</span>
        </h1>
        <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-muted">
          Pilih model, tulis prompt, dan ambil hasilnya. Mendukung endpoint image/video generation
          dengan fallback otomatis ke model chat multimodal.
        </p>

        {/* toggle mode */}
        <div className="mt-7 inline-flex items-center gap-1.5 rounded-full border border-line bg-cream-50 p-1.5">
          <button
            onClick={() => setMode('image')}
            className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all ${
              mode === 'image' ? 'bg-ink-900 text-cream-100' : 'text-muted hover:text-ink-900'
            }`}
          >
            <ImageIcon size={15} /> Foto
          </button>
          <button
            onClick={() => setMode('video')}
            className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all ${
              mode === 'video' ? 'bg-ink-900 text-cream-100' : 'text-muted hover:text-ink-900'
            }`}
          >
            <Film size={15} /> Video
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        {/* form */}
        <div className="card p-6 sm:p-7">
          <label className="block">
            <span className="label-xs">Prompt {mode === 'video' ? 'video' : 'gambar'}</span>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={5}
              placeholder={
                mode === 'video'
                  ? 'Contoh: timelapse awan di atas pegunungan Bandung saat matahari terbit, sinematik…'
                  : 'Contoh: logo kafe minimalis, warna hangat, latar krem, vektor datar…'
              }
              className="field mt-2"
            />
          </label>

          <div className="mt-4 flex flex-wrap gap-2">
            {STYLES.map((s) => (
              <button
                key={s}
                onClick={() => setStyle(style === s ? '' : s)}
                className={`chip transition-all ${style === s ? 'chip-on' : 'hover:border-ink-800/25'}`}
              >
                {s}
              </button>
            ))}
          </div>

          <label className="mt-4 block">
            <span className="label-xs">Prompt negatif (opsional)</span>
            <input
              value={negative}
              onChange={(e) => setNegative(e.target.value)}
              placeholder="blur, kualitas rendah, teks, watermark…"
              className="field mt-2 !py-2.5"
            />
          </label>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <span className="label-xs">Rasio</span>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {ASPECTS.map((a) => (
                  <button
                    key={a}
                    onClick={() => setAspect(a)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${
                      aspect === a
                        ? 'border-ink-800/25 bg-ink-900 text-cream-100'
                        : 'border-line bg-cream-50 text-muted hover:text-ink-900'
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <span className="label-xs">Jumlah: {n}</span>
              <input
                type="range"
                min="1"
                max="4"
                step="1"
                value={n}
                onChange={(e) => setN(Number(e.target.value))}
                className="mt-3.5"
              />
            </div>
          </div>

          <div className="mt-5">
            <div className="flex items-center justify-between">
              <span className="label-xs">Model</span>
              <button
                onClick={() => setUseCustom((v) => !v)}
                className="text-[11px] font-semibold text-muted underline"
              >
                {useCustom ? 'Pilih dari daftar' : 'Input ID manual'}
              </button>
            </div>
            {useCustom ? (
              <input
                value={customModel}
                onChange={(e) => setCustomModel(e.target.value)}
                placeholder="mis. nano-banana-pro / veo-3 / flux-1.1-pro"
                className="field mt-2 !py-2.5 font-mono !text-[13px]"
              />
            ) : (
              <ModelPicker className="mt-2" value={modelId} onChange={(id) => setSetting('mediaModel', id)} />
            )}
            <p className="mt-2 text-[11px] text-muted-2">
              Model yang mengembalikan URL/base64 media akan tampil otomatis di galeri.
            </p>
          </div>

          <button onClick={generate} disabled={busy || !prompt.trim()} className="btn-dark mt-6 w-full !py-4 text-[15px]">
            {busy ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Membuat… {elapsed}s
              </>
            ) : (
              <>
                <Wand2 size={16} /> Buat {mode === 'video' ? 'video' : 'foto'}
              </>
            )}
          </button>

          {attempts.length > 0 && (
            <div className="mt-4 rounded-2xl border border-dashed border-line px-4 py-3">
              <p className="label-xs">Log strategi API</p>
              <ul className="mt-1.5 space-y-1">
                {attempts.map((a, i) => (
                  <li key={i} className="flex items-start gap-2 font-mono text-[11px] text-muted">
                    <span className={a.ok ? 'text-ok' : 'text-warn'}>{a.ok ? '✓' : '✗'}</span>
                    <span>
                      {a.label}
                      {a.error && <span className="text-muted-2"> — {a.error}</span>}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* hasil */}
        <div className="flex flex-col gap-6">
          <div className="card flex-1 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="label-xs">Hasil generate</p>
                <p className="text-lg font-extrabold tracking-tight">
                  {results.length ? `${results.length} media` : 'Belum ada hasil'}
                </p>
              </div>
              {results.length > 1 && (
                <button
                  onClick={() => exportMediaZip(results, `hasil-${mode}.zip`)}
                  className="btn-ghost !px-3.5 !py-2 text-xs"
                >
                  <FileArchive size={13} /> ZIP semua
                </button>
              )}
            </div>

            <div className="mt-4 space-y-4">
              {busy && !results.length && (
                <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-line px-4 py-12">
                  <div className="sheen-bg h-2 w-40 animate-sheen rounded-full bg-cream-300" />
                  <p className="text-sm text-muted">
                    Sedang membuat {mode === 'video' ? 'video' : 'gambar'}… {elapsed}s
                  </p>
                </div>
              )}
              {results.map((item, i) => (
                <div key={i} className="overflow-hidden rounded-2xl border border-line bg-cream-200/40">
                  {item.type === 'video' ? (
                    <video src={item.url} controls playsInline className="max-h-[320px] w-full bg-ink-900" />
                  ) : (
                    <img src={item.url} alt={`Hasil ${i + 1}`} className="max-h-[320px] w-full object-contain" />
                  )}
                  <div className="flex items-center justify-between gap-2 px-3 py-2">
                    <span className="truncate font-mono text-[10px] text-muted">{item.url.slice(0, 60)}…</span>
                    <button
                      onClick={() => downloadUrl(item.url, `${mode}-${Date.now()}.${item.type === 'video' ? 'mp4' : 'png'}`)}
                      className="btn-icon !h-7 !w-7"
                      title="Unduh"
                    >
                      <Download size={12} />
                    </button>
                  </div>
                </div>
              ))}
              {!busy && !results.length && (
                <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-line px-4 py-12 text-center">
                  <Sparkles size={22} className="text-muted-2" />
                  <p className="text-sm text-muted">
                    Hasil akan muncul di sini.
                    <br />
                    Semua proses berjalan realtime dari browser.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* riwayat */}
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History size={15} className="text-muted" />
                <p className="text-sm font-bold">Riwayat (URL)</p>
              </div>
              {history.length > 0 && (
                <button onClick={clearHistory} className="btn-icon !h-7 !w-7" title="Bersihkan">
                  <Trash2 size={12} />
                </button>
              )}
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {history.slice(0, 9).map((h) => (
                <a
                  key={h.id}
                  href={h.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative aspect-square overflow-hidden rounded-xl border border-line"
                  title={h.prompt}
                >
                  {h.type === 'video' ? (
                    <div className="flex h-full w-full items-center justify-center bg-ink-800 text-cream-100">
                      <FilmIcon size={18} />
                    </div>
                  ) : (
                    <img src={h.url} alt="" className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                  )}
                </a>
              ))}
            </div>
            {history.length > 0 && (
              <p className="mt-3 text-[11px] text-muted-2">
                {history.length} item · {fmtDateTime(history[0].ts)} · disimpan di browser (data URI tidak disimpan)
              </p>
            )}
            {!history.length && <p className="mt-3 text-[11px] text-muted-2">Riwayat kosong.</p>}
            {modelsState.error && (
              <p className="mt-3 text-[11px] text-err">Model list: {modelsState.error}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { Download, Image as ImageIcon, Maximize2, Play, X, Film } from 'lucide-react'
import { downloadUrl } from '../lib/export'
import { useApp } from '../context/AppContext'

export default function MediaCard({ type = 'image', url, alt = '', compact = false }) {
  const { pushToast } = useApp()
  const [lightbox, setLightbox] = useState(false)
  const [broken, setBroken] = useState(false)

  if (!url) return null

  const save = async (e) => {
    e?.stopPropagation?.()
    const name = type === 'video' ? 'video.mp4' : 'gambar.png'
    try {
      await downloadUrl(url, name)
      pushToast('Mengunduh media…', 'success')
    } catch {
      pushToast('Gagal mengunduh, membuka di tab baru', 'error')
    }
  }

  if (broken) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 rounded-2xl border border-dashed border-line px-4 py-3 text-sm text-muted hover:text-ink-900"
      >
        {type === 'video' ? <Film size={16} /> : <ImageIcon size={16} />}
        <span className="truncate">Media tidak bisa dimuat — buka tautan</span>
      </a>
    )
  }

  return (
    <>
      <figure
        className={`group/media relative overflow-hidden rounded-2xl border border-line bg-cream-200/60 ${
          compact ? 'my-3' : ''
        }`}
      >
        {type === 'video' ? (
          <video src={url} controls playsInline className="max-h-[420px] w-full bg-ink-900 object-contain" />
        ) : (
          <img
            src={url}
            alt={alt || 'Gambar hasil generate'}
            loading="lazy"
            onError={() => setBroken(true)}
            className="max-h-[420px] w-full object-contain"
          />
        )}
        <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-2 p-2.5 opacity-0 transition-opacity group-hover/media:opacity-100">
          <span className="rounded-full bg-ink-900/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-cream-100">
            {type === 'video' ? 'Video' : alt || 'Gambar'}
          </span>
          <div className="flex items-center gap-1.5">
            {type === 'image' && (
              <button
                onClick={() => setLightbox(true)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-ink-900/80 text-cream-100 transition-transform hover:scale-105"
                title="Perbesar"
              >
                <Maximize2 size={14} />
              </button>
            )}
            <button
              onClick={save}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-ink-900/80 text-cream-100 transition-transform hover:scale-105"
              title="Unduh"
            >
              <Download size={14} />
            </button>
          </div>
        </div>
        {type === 'video' && (
          <span className="pointer-events-none absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-ink-900/50 text-cream-100 opacity-90">
            <Play size={22} className="ml-0.5" />
          </span>
        )}
      </figure>

      {lightbox && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-ink-900/90 p-4"
          onClick={() => setLightbox(false)}
        >
          <button
            className="absolute right-5 top-5 flex h-11 w-11 items-center justify-center rounded-full bg-cream-100 text-ink-900"
            onClick={() => setLightbox(false)}
          >
            <X size={20} />
          </button>
          <img src={url} alt={alt} className="max-h-[88vh] max-w-[94vw] rounded-2xl object-contain" />
          <button
            onClick={save}
            className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-cream-100 px-5 py-2.5 text-sm font-semibold text-ink-900"
          >
            Unduh gambar
          </button>
        </div>
      )}
    </>
  )
}

import { useState } from 'react'
import { MessageSquare, Plus, Trash2, X, Download, MoreHorizontal } from 'lucide-react'
import { relTime } from '../lib/format'
import { exportConversationZip } from '../lib/export'
import { useApp } from '../context/AppContext'

export default function Sidebar({ open, onClose, convos, activeId, onSelect, onNew, onDelete, onRename }) {
  const { pushToast } = useApp()
  const [menuId, setMenuId] = useState(null)

  return (
    <>
      {open && <div className="fixed inset-0 z-[60] bg-ink-900/40 lg:hidden" onClick={onClose} />}
      <aside
        className={`fixed inset-y-0 left-0 z-[70] flex w-[300px] flex-col border-r border-line bg-cream-100 p-4 transition-transform dark:bg-ink-800 lg:static lg:z-auto lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="label-xs">Percakapan</p>
            <p className="text-lg font-extrabold tracking-tight">Riwayat Anda</p>
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={onNew} className="btn-icon" title="Percakapan baru">
              <Plus size={16} />
            </button>
            <button onClick={onClose} className="btn-icon lg:hidden" title="Tutup">
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-1.5 overflow-y-auto pr-1">
          {convos.length === 0 && (
            <div className="card flex flex-col items-center gap-2 px-4 py-10 text-center">
              <MessageSquare size={22} className="text-muted-2" />
              <p className="text-sm text-muted">Belum ada percakapan.</p>
              <button onClick={onNew} className="btn-dark !px-4 !py-2 text-xs">
                Mulai sekarang
              </button>
            </div>
          )}
          {convos.map((c) => (
            <div
              key={c.id}
              onClick={() => onSelect(c.id)}
              className={`group relative cursor-pointer rounded-2xl border px-3.5 py-3 transition-all ${
                c.id === activeId
                  ? 'border-ink-800/20 bg-cream-50 shadow-soft'
                  : 'border-transparent hover:border-line hover:bg-cream-50/70'
              }`}
            >
              <p className="truncate pr-6 text-sm font-semibold text-ink-900">{c.title}</p>
              <p className="mt-0.5 text-[11px] text-muted">
                {c.messages.length} pesan · {relTime(c.updatedAt)}
              </p>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setMenuId(menuId === c.id ? null : c.id)
                }}
                className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full text-muted opacity-0 transition-opacity hover:bg-cream-200 group-hover:opacity-100"
              >
                <MoreHorizontal size={14} />
              </button>
              {menuId === c.id && (
                <div className="absolute right-2 top-9 z-20 w-40 overflow-hidden rounded-2xl border border-line bg-cream-50 shadow-pop">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      const t = window.prompt('Ganti judul percakapan:', c.title)
                      if (t) onRename(c.id, t)
                      setMenuId(null)
                    }}
                    className="block w-full px-3.5 py-2.5 text-left text-xs font-semibold hover:bg-cream-200/70"
                  >
                    Ganti judul
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      exportConversationZip(c)
                      pushToast('Mengunduh percakapan (.zip)', 'success')
                      setMenuId(null)
                    }}
                    className="block w-full px-3.5 py-2.5 text-left text-xs font-semibold hover:bg-cream-200/70"
                  >
                    <Download size={12} className="mr-1.5 inline" />
                    Unduh .zip
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onDelete(c.id)
                      setMenuId(null)
                    }}
                    className="block w-full px-3.5 py-2.5 text-left text-xs font-semibold text-err hover:bg-cream-200/70"
                  >
                    <Trash2 size={12} className="mr-1.5 inline" />
                    Hapus
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-3 rounded-2xl border border-dashed border-line px-4 py-3 text-[11px] leading-relaxed text-muted">
          Semua riwayat tersimpan lokal di browser ini. Ekspor ke <b>.zip</b> untuk cadangan.
        </div>
      </aside>
    </>
  )
}

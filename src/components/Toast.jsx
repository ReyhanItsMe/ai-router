import { useApp } from '../context/AppContext'
import { CheckCircle2, Info, XCircle } from 'lucide-react'

export default function Toasts() {
  const { toasts } = useApp()
  if (!toasts.length) return null
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[100] flex flex-col items-center gap-2 px-4">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="animate-fadeup pointer-events-auto flex max-w-[92vw] items-center gap-2.5 rounded-full border border-line-dark/60 bg-ink-900 px-5 py-3 text-sm font-medium text-cream-100 shadow-pop"
        >
          {t.type === 'success' && <CheckCircle2 size={16} className="text-ok" />}
          {t.type === 'error' && <XCircle size={16} className="text-err" />}
          {t.type === 'info' && <Info size={16} className="text-cream-300" />}
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  )
}

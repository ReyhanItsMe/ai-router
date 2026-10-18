import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { LogOut, Menu, Moon, Sun, X, MessageSquare, Film, Boxes, Settings2, RefreshCw } from 'lucide-react'
import Logo from './Logo'
import { useApp } from '../context/AppContext'

const LINKS = [
  { to: '/chat', label: 'Chat', icon: MessageSquare },
  { to: '/media', label: 'Media', icon: Film },
  { to: '/models', label: 'Model', icon: Boxes },
]

function StatusDot() {
  const { conn, refreshModels, modelsState } = useApp()
  const map = {
    online: { c: 'bg-ok', t: 'API terhubung' },
    offline: { c: 'bg-err', t: 'API terputus' },
    checking: { c: 'bg-warn animate-blinkdot', t: 'Memeriksa…' },
    idle: { c: 'bg-muted-2', t: 'Menunggu' },
  }
  const s = map[conn.status] || map.idle
  return (
    <button
      onClick={refreshModels}
      title={`${s.t}${conn.latency ? ` · ${conn.latency}ms` : ''} (klik untuk muat ulang)`}
      className="hidden items-center gap-2 rounded-full border border-line bg-cream-50 px-3.5 py-2 text-[11px] font-semibold text-muted transition-colors hover:text-ink-900 md:inline-flex"
    >
      <span className={`h-2 w-2 rounded-full ${s.c}`} />
      {modelsState.loading ? 'Memuat…' : s.t}
      <RefreshCw size={11} className={modelsState.loading ? 'animate-spin' : ''} />
    </button>
  )
}

export default function Navbar() {
  const { settings, setSetting, logout, session, appName } = useApp()
  const [menu, setMenu] = useState(false)
  const location = useLocation()

  useEffect(() => {
    setMenu(false)
  }, [location.pathname])

  useEffect(() => {
    document.body.style.overflow = menu ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [menu])

  return (
    <>
      <header className="sticky top-0 z-40 px-4 pt-4 sm:px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 rounded-full border border-line/80 bg-cream-100/85 px-3 py-2.5 shadow-soft backdrop-blur-xl">
          <Link to="/chat" className="pl-1">
            <Logo name={appName} />
          </Link>

          <nav className="hidden items-center gap-1 rounded-full border border-line bg-cream-200/60 p-1 lg:flex">
            {LINKS.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  `rounded-full px-5 py-2 text-[13px] font-semibold transition-all ${
                    isActive
                      ? 'bg-ink-900 text-cream-100 shadow-soft'
                      : 'text-muted hover:bg-cream-50 hover:text-ink-900'
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <StatusDot />
            <button
              onClick={() => setSetting('dark', !settings.dark)}
              className="btn-icon"
              title={settings.dark ? 'Mode terang' : 'Mode gelap'}
            >
              {settings.dark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <Link to="/settings" className="btn-icon hidden sm:inline-flex" title="Pengaturan">
              <Settings2 size={16} />
            </Link>
            <button onClick={logout} className="btn-icon hidden sm:inline-flex" title={`Keluar (${session?.user})`}>
              <LogOut size={16} />
            </button>
            <button onClick={() => setMenu(true)} className="btn-icon lg:hidden" title="Menu">
              <Menu size={17} />
            </button>
          </div>
        </div>
      </header>

      {/* Menu mobile full-screen gelap — ala menu studio */}
      {menu && (
        <div className="fixed inset-0 z-[80] flex flex-col bg-ink-700 text-cream-100">
          <div className="flex items-center justify-between px-5 pt-6">
            <Logo name={appName} dark />
            <button onClick={() => setMenu(false)} className="flex h-11 w-11 items-center justify-center rounded-full border border-line-dark text-cream-100">
              <X size={22} />
            </button>
          </div>
          <nav className="flex flex-1 flex-col justify-center gap-2 px-6">
            {LINKS.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  `flex items-center gap-4 rounded-3xl px-2 py-3 text-[42px] font-extrabold leading-none tracking-[-0.03em] transition-colors ${
                    isActive ? 'text-cream-100' : 'text-cream-300/80 hover:text-cream-100'
                  }`
                }
              >
                <l.icon size={30} strokeWidth={2.2} />
                {l.label}
              </NavLink>
            ))}
          </nav>
          <div className="px-6 pb-10">
            <div className="flex items-center gap-2 rounded-full border border-line-dark bg-ink-600/50 p-1.5">
              <button
                onClick={() => setSetting('dark', false)}
                className={`flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold ${
                  !settings.dark ? 'bg-cream-100 text-ink-900' : 'text-cream-300'
                }`}
              >
                <Sun size={15} /> Terang
              </button>
              <button
                onClick={() => setSetting('dark', true)}
                className={`flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold ${
                  settings.dark ? 'bg-cream-100 text-ink-900' : 'text-cream-300'
                }`}
              >
                <Moon size={15} /> Gelap
              </button>
            </div>
            <div className="mt-4 flex items-center justify-between px-1">
              <Link to="/settings" className="inline-flex items-center gap-2 text-lg font-semibold text-cream-300">
                <Settings2 size={18} /> Pengaturan
              </Link>
              <button onClick={logout} className="inline-flex items-center gap-2 text-lg font-semibold text-cream-300">
                <LogOut size={18} /> Keluar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

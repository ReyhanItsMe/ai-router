import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowUpRight, Code2, Eye, EyeOff, Film, KeyRound, Lock, MessageSquare, Sparkles, User, Zap, Boxes } from 'lucide-react'
import Logo from '../components/Logo'
import { useApp } from '../context/AppContext'
import { ENV_API_KEY } from '../lib/config'
import { pingApi, setApiKey } from '../lib/api'

export default function Login() {
  const { login, appName, pushToast } = useApp()
  const nav = useNavigate()
  const [user, setUser] = useState('')
  const [pass, setPass] = useState('')
  const [apiKey, setKey] = useState(ENV_API_KEY ? '' : '')
  const [showPass, setShowPass] = useState(false)
  const [showKey, setShowKey] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [shake, setShake] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setErr('')
    setBusy(true)
    try {
      const key = (apiKey || ENV_API_KEY || '').trim()
      if (!key) throw new Error('API key wajib diisi (atau set VITE_API_KEY di environment).')
      // verifikasi realtime ke API dulu
      setApiKey(key)
      try {
        await pingApi()
      } catch (e2) {
        throw new Error(`API key tidak valid / tidak bisa dihubungi: ${e2.message}`)
      }
      login(user, pass, key)
      pushToast(`Selamat datang, ${user}!`, 'success')
      nav('/chat', { replace: true })
    } catch (e2) {
      setErr(e2.message)
      setShake(true)
      setTimeout(() => setShake(false), 500)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* dekorasi blob */}
      <div className="gradient-blob pointer-events-none absolute -left-40 -top-40 h-[560px] w-[560px] rounded-full" />
      <div className="gradient-blob pointer-events-none absolute -right-32 top-1/3 h-[480px] w-[480px] rounded-full" />

      {/* tile melayang */}
      <div className="tile animate-floaty pointer-events-none absolute left-[8%] top-[18%] hidden lg:flex" style={{ animationDelay: '0.4s' }}>
        <Sparkles size={22} />
      </div>
      <div className="tile animate-floaty pointer-events-none absolute right-[10%] top-[12%] hidden lg:flex" style={{ animationDelay: '1.4s' }}>
        <Code2 size={22} />
      </div>
      <div className="tile animate-floaty pointer-events-none absolute bottom-[14%] left-[14%] hidden lg:flex" style={{ animationDelay: '2.1s' }}>
        <Zap size={22} />
      </div>
      <div className="tile animate-floaty pointer-events-none absolute bottom-[20%] right-[8%] hidden lg:flex" style={{ animationDelay: '1s' }}>
        <Boxes size={22} />
      </div>

      <div className="mx-auto grid min-h-screen max-w-6xl items-center gap-10 px-5 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
        {/* kiri: hero */}
        <div className="animate-fadeup">
          <Logo name={appName} />
          <div className="pill mt-8 w-fit !py-1.5 text-xs text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-ok" />
            Ruang kerja AI router pribadi
          </div>
          <h1 className="mt-6 text-[clamp(2.6rem,7vw,4.6rem)] font-extrabold leading-[0.98] tracking-[-0.035em]">
            Semua model.
            <br />
            <span className="text-muted-2">Satu ruang kerja.</span>
          </h1>
          <p className="mt-6 max-w-md text-[17px] leading-relaxed text-muted">
            Chat realtime dengan streaming, generate foto &amp; video, cek model, highlight kode, dan ekspor ZIP —
            langsung terhubung ke API Anda.
          </p>
          <div className="mt-8 flex flex-wrap gap-2.5">
            {[
              { icon: MessageSquare, t: 'Chat streaming' },
              { icon: Film, t: 'Foto & video' },
              { icon: Code2, t: 'Highlight kode' },
              { icon: Zap, t: 'Ekspor ZIP' },
            ].map(({ icon: Icon, t }) => (
              <span key={t} className="pill text-xs font-semibold text-ink-700">
                <Icon size={13} /> {t}
              </span>
            ))}
          </div>
        </div>

        {/* kanan: kartu login gelap */}
        <div className={`animate-fadeup ${shake ? 'animate-shake' : ''}`}>
          <form onSubmit={submit} className="rounded-[32px] bg-ink-700 p-7 text-cream-100 shadow-pop sm:p-9">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cream-300/70">Masuk akun</p>
                <h2 className="mt-1 text-3xl font-extrabold tracking-[-0.02em]">Selamat datang.</h2>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-line-dark bg-ink-600/60">
                <Lock size={19} />
              </div>
            </div>

            <div className="mt-7 space-y-3.5">
              <label className="block">
                <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-cream-300/80">
                  <User size={12} /> Username
                </span>
                <div className="rounded-2xl border border-line-dark bg-ink-600/40 focus-within:border-cream-100/30">
                  <input
                    value={user}
                    onChange={(e) => setUser(e.target.value)}
                    autoComplete="username"
                    placeholder="username dari env"
                    className="w-full bg-transparent px-4 py-3.5 text-[15px] text-cream-100 outline-none placeholder:text-cream-300/40"
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-cream-300/80">
                  <Lock size={12} /> Password
                </span>
                <div className="flex items-center rounded-2xl border border-line-dark bg-ink-600/40 focus-within:border-cream-100/30">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={pass}
                    onChange={(e) => setPass(e.target.value)}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="w-full bg-transparent px-4 py-3.5 text-[15px] text-cream-100 outline-none placeholder:text-cream-300/40"
                  />
                  <button type="button" onClick={() => setShowPass((s) => !s)} className="px-4 text-cream-300/70 hover:text-cream-100">
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </label>

              <label className="block">
                <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-cream-300/80">
                  <KeyRound size={12} /> API key {ENV_API_KEY ? '(dari env, bisa diganti)' : '(wajib)'}
                </span>
                <div className="flex items-center rounded-2xl border border-line-dark bg-ink-600/40 focus-within:border-cream-100/30">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(e) => setKey(e.target.value)}
                    placeholder={ENV_API_KEY ? 'pakai key dari environment' : 'fm_xxx…'}
                    className="w-full bg-transparent px-4 py-3.5 font-mono text-[13px] text-cream-100 outline-none placeholder:text-cream-300/40"
                  />
                  <button type="button" onClick={() => setShowKey((s) => !s)} className="px-4 text-cream-300/70 hover:text-cream-100">
                    {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </label>
            </div>

            {err && (
              <p className="mt-4 rounded-2xl border border-err/40 bg-err/10 px-4 py-3 text-sm text-err">{err}</p>
            )}

            <button type="submit" disabled={busy} className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-cream-100 px-6 py-4 text-[15px] font-bold text-ink-900 transition-transform hover:-translate-y-0.5 disabled:opacity-60">
              {busy ? 'Memverifikasi ke API…' : 'Masuk ke ruang kerja'}
              {!busy && <ArrowUpRight size={17} />}
            </button>

            <p className="mt-5 text-center text-[11px] leading-relaxed text-cream-300/60">
              Akun &amp; API key diatur lewat environment variable (VITE_AUTH_USER, VITE_AUTH_PASS, VITE_API_KEY).
              Koneksi realtime langsung dari browser ke endpoint API.
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}

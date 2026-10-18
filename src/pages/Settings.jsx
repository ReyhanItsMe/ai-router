import { useState } from 'react'
import { Eye, EyeOff, KeyRound, Moon, RefreshCw, Save, Sun, User, Zap } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { setApiKey, pingApi } from '../lib/api'
import { API_BASE, ENV_API_KEY, ENV_USER } from '../lib/config'

export default function Settings() {
  const { settings, setSetting, session, appName, pushToast, refreshModels, modelsState, models, apiKey } = useApp()
  const [key, setKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [busy, setBusy] = useState(false)

  const saveKey = async () => {
    setBusy(true)
    try {
      setApiKey(key.trim())
      await pingApi()
      pushToast('API key tersimpan & terverifikasi', 'success')
      refreshModels()
    } catch (e) {
      pushToast('Key tidak valid: ' + e.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-5 pb-16 pt-6">
      <p className="label-xs">Pengaturan</p>
      <h1 className="heading-2 mt-2">
        Kendalikan ruang kerja.
        <br />
        <span className="text-muted-2">Semua tersimpan lokal.</span>
      </h1>

      <div className="mt-8 space-y-5">
        {/* akun */}
        <section className="card p-6">
          <div className="flex items-center gap-3">
            <div className="tile !h-11 !w-11 !rounded-2xl">
              <User size={17} />
            </div>
            <div>
              <h2 className="text-lg font-extrabold tracking-tight">Akun</h2>
              <p className="text-xs text-muted">Login memakai kredensial dari environment variable.</p>
            </div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-line bg-cream-100 px-4 py-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-2">Username aktif</p>
              <p className="mt-1 font-semibold">{session?.user || ENV_USER || '—'}</p>
            </div>
            <div className="rounded-2xl border border-line bg-cream-100 px-4 py-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-2">Aplikasi</p>
              <p className="mt-1 font-semibold">{appName}</p>
            </div>
          </div>
        </section>

        {/* api */}
        <section className="card p-6">
          <div className="flex items-center gap-3">
            <div className="tile !h-11 !w-11 !rounded-2xl">
              <KeyRound size={17} />
            </div>
            <div>
              <h2 className="text-lg font-extrabold tracking-tight">API key</h2>
              <p className="text-xs text-muted">
                Base URL: <span className="font-mono">{API_BASE}</span>
              </p>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 rounded-2xl border border-line bg-cream-100 px-4">
            <input
              type={showKey ? 'text' : 'password'}
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder={apiKey ? 'Key aktif: ' + apiKey.slice(0, 8) + '… (isinya tersimpan)' : ENV_API_KEY ? 'Key berasal dari env' : 'fm_xxx…'}
              className="w-full bg-transparent py-3.5 font-mono text-[13px] outline-none placeholder:text-muted-2"
            />
            <button onClick={() => setShowKey((s) => !s)} className="text-muted hover:text-ink-900">
              {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          <button onClick={saveKey} disabled={busy || !key.trim()} className="btn-dark mt-3">
            <Save size={15} /> {busy ? 'Memverifikasi…' : 'Simpan & verifikasi'}
          </button>
        </section>

        {/* model default */}
        <section className="card p-6">
          <div className="flex items-center gap-3">
            <div className="tile !h-11 !w-11 !rounded-2xl">
              <Zap size={17} />
            </div>
            <div>
              <h2 className="text-lg font-extrabold tracking-tight">Preferensi model</h2>
              <p className="text-xs text-muted">Default dipakai untuk chat & media studio.</p>
            </div>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label>
              <span className="label-xs">Temperature: {settings.temperature}</span>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={settings.temperature}
                onChange={(e) => setSetting('temperature', Number(e.target.value))}
                className="mt-2"
              />
            </label>
            <label>
              <span className="label-xs">Maks token: {settings.maxTokens}</span>
              <input
                type="range"
                min="256"
                max="32768"
                step="256"
                value={settings.maxTokens}
                onChange={(e) => setSetting('maxTokens', Number(e.target.value))}
                className="mt-2"
              />
            </label>
          </div>
          <label className="mt-4 block">
            <span className="label-xs">System prompt global</span>
            <textarea
              value={settings.systemPrompt}
              onChange={(e) => setSetting('systemPrompt', e.target.value)}
              rows={3}
              className="field mt-2 text-[13px]"
            />
          </label>
        </section>

        {/* tampilan */}
        <section className="card p-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="tile !h-11 !w-11 !rounded-2xl">
                {settings.dark ? <Moon size={17} /> : <Sun size={17} />}
              </div>
              <div>
                <h2 className="text-lg font-extrabold tracking-tight">Tampilan</h2>
                <p className="text-xs text-muted">Mode terang krem / mode gelap.</p>
              </div>
            </div>
            <button onClick={() => setSetting('dark', !settings.dark)} className="btn-ghost">
              {settings.dark ? 'Ganti ke terang' : 'Ganti ke gelap'}
            </button>
          </div>
        </section>

        {/* status */}
        <section className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-extrabold tracking-tight">Status API</h2>
              <p className="text-xs text-muted">
                {modelsState.error ? modelsState.error : `${models.length} model terdaftar · terakhir dimuat ${new Date(modelsState.fetchedAt || Date.now()).toLocaleTimeString('id-ID')}`}
              </p>
            </div>
            <button onClick={refreshModels} className="btn-ghost">
              <RefreshCw size={14} className={modelsState.loading ? 'animate-spin' : ''} /> Refresh
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}

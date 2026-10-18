import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { listModels, getApiKey, setApiKey as persistApiKey, pingApi } from '../lib/api'
import { load, save, remove, uid } from '../lib/storage'
import { ENV_API_KEY, ENV_PASS, ENV_USER, APP_NAME } from '../lib/config'

const Ctx = createContext(null)

const DEFAULT_SETTINGS = {
  model: '',
  temperature: 0.7,
  maxTokens: 8192,
  systemPrompt: 'Kamu adalah asisten AI yang membantu, jelas, dan ringkas. Jawab dalam Bahasa Indonesia kecuali diminta lain.',
  dark: false,
}

export function AppProvider({ children }) {
  /* ---------- auth ---------- */
  const [session, setSession] = useState(() => load('session', null))

  const login = useCallback((user, pass, apiKey) => {
    const okUser = ENV_USER && user === ENV_USER
    const okPass = ENV_PASS && pass === ENV_PASS
    if (!ENV_USER || !ENV_PASS) {
      throw new Error('VITE_AUTH_USER / VITE_AUTH_PASS belum diset di environment.')
    }
    if (!okUser || !okPass) throw new Error('Username atau password salah.')
    const key = (apiKey || ENV_API_KEY || '').trim()
    if (key) persistApiKey(key)
    const s = { user, ts: Date.now() }
    save('session', s)
    setSession(s)
    return s
  }, [])

  const logout = useCallback(() => {
    remove('session')
    setSession(null)
  }, [])

  /* ---------- theme ---------- */
  const [settings, setSettings] = useState(() => ({ ...DEFAULT_SETTINGS, ...load('settings', {}) }))
  useEffect(() => {
    save('settings', settings)
    document.documentElement.classList.toggle('dark', !!settings.dark)
  }, [settings])
  const setSetting = useCallback((key, value) => {
    setSettings((s) => ({ ...s, [key]: value }))
  }, [])

  /* ---------- models (realtime) ---------- */
  const [models, setModels] = useState([])
  const [modelsState, setModelsState] = useState({ loading: false, error: null, fetchedAt: 0 })
  const [conn, setConn] = useState({ status: 'idle', latency: null })
  const busyRef = useRef(false)

  const refreshModels = useCallback(async () => {
    if (busyRef.current) return
    busyRef.current = true
    setModelsState((s) => ({ ...s, loading: true }))
    setConn((c) => ({ ...c, status: 'checking' }))
    try {
      const t0 = Date.now()
      const data = await listModels()
      setModels(data)
      setModelsState({ loading: false, error: null, fetchedAt: Date.now() })
      setConn({ status: 'online', latency: Date.now() - t0 })
    } catch (e) {
      setModelsState({ loading: false, error: e.message, fetchedAt: Date.now() })
      setConn({ status: 'offline', latency: null })
    } finally {
      busyRef.current = false
    }
  }, [])

  useEffect(() => {
    if (!session) return
    refreshModels()
  }, [session, refreshModels])

  // ping ringan tiap 60 detik untuk indikator status
  useEffect(() => {
    if (!session) return
    const id = setInterval(() => {
      pingApi().then((ms) => setConn({ status: 'online', latency: ms })).catch(() => setConn((c) => ({ ...c, status: 'offline' })))
    }, 60000)
    return () => clearInterval(id)
  }, [session])

  // pilih model default saat daftar model masuk
  useEffect(() => {
    if (!models.length) return
    setSettings((s) => {
      if (s.model && models.some((m) => m.id === s.model)) return s
      const preferred =
        models.find((m) => /opus|sonnet|gpt-5\.6-terra|gemini-3\.1-pro/i.test(m.id)) ||
        models.find((m) => (m.capabilities || []).includes('streaming')) ||
        models[0]
      return { ...s, model: preferred.id }
    })
  }, [models])

  /* ---------- toasts ---------- */
  const [toasts, setToasts] = useState([])
  const pushToast = useCallback((message, type = 'info') => {
    const id = uid()
    setToasts((t) => [...t.slice(-3), { id, message, type }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200)
  }, [])

  const value = useMemo(
    () => ({
      appName: APP_NAME,
      session,
      login,
      logout,
      apiKey: getApiKey(),
      setApiKey: persistApiKey,
      settings,
      setSetting,
      setSettings,
      models,
      modelsState,
      refreshModels,
      conn,
      toasts,
      pushToast,
    }),
    [session, login, logout, settings, setSetting, models, modelsState, refreshModels, conn, toasts, pushToast]
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useApp() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useApp harus dipakai di dalam AppProvider')
  return ctx
}

export function useModel(id) {
  const { models } = useApp()
  return useMemo(() => models.find((m) => m.id === id) || null, [models, id])
}

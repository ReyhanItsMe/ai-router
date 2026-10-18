import { useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import Toasts from './components/Toast'
import Login from './pages/Login'
import Chat from './pages/Chat'
import Media from './pages/Media'
import Models from './pages/Models'
import Settings from './pages/Settings'
import { AppProvider, useApp } from './context/AppContext'
import { APP_NAME } from './lib/config'

function Guard({ children }) {
  const { session } = useApp()
  const loc = useLocation()
  if (!session) return <Navigate to="/login" replace state={{ from: loc.pathname }} />
  return children
}

function Shell() {
  const { session, settings } = useApp()
  const loc = useLocation()

  useEffect(() => {
    document.title = session ? `${APP_NAME} — Ruang Kerja AI` : `${APP_NAME} — Masuk`
  }, [session])

  return (
    <div className={settings.dark ? 'dark' : ''}>
      <div className="min-h-screen bg-cream text-ink-900 transition-colors dark:bg-ink-800 dark:text-cream-100">
        {session && <Navbar />}
        <Routes>
          <Route path="/login" element={session ? <Navigate to="/chat" replace /> : <Login />} />
          <Route
            path="/chat"
            element={
              <Guard>
                <Chat />
              </Guard>
            }
          />
          <Route
            path="/media"
            element={
              <Guard>
                <Media />
              </Guard>
            }
          />
          <Route
            path="/models"
            element={
              <Guard>
                <Models />
              </Guard>
            }
          />
          <Route
            path="/settings"
            element={
              <Guard>
                <Settings />
              </Guard>
            }
          />
          <Route path="*" element={<Navigate to={session ? '/chat' : '/login'} replace />} />
        </Routes>
        <Toasts />
      </div>
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  )
}

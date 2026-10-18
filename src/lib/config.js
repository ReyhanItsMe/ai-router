export const env = import.meta.env

export const APP_NAME = env.VITE_APP_NAME || 'Nexa Router'
export const API_BASE = (env.VITE_API_BASE || 'https://freemodel.in/v1').replace(/\/+$/, '')
export const ENV_API_KEY = env.VITE_API_KEY || ''
export const ENV_USER = env.VITE_AUTH_USER || env.VITE_APP_USER || env.VITE_USERNAME || ''
export const ENV_PASS = env.VITE_AUTH_PASS || env.VITE_APP_PASS || env.VITE_PASSWORD || ''

/** Dua kata pertama dipisah jadi "bold + light" untuk wordmark ala studio. */
export function splitBrandName(name = APP_NAME) {
  const words = String(name).trim().split(/\s+/)
  return {
    head: words[0] || 'Router',
    tail: words.slice(1).join(' ') || 'Studio',
  }
}

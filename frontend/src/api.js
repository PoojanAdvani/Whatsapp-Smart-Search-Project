// Thin fetch wrappers around the FastAPI backend.
//
// In development, API_BASE is empty and calls hit `/api/...`, which the Vite
// dev-server proxies to the backend (see vite.config.js).
// In production (e.g. a static build on Render), set VITE_API_TARGET at build
// time to the backend's origin so calls resolve to `${API_BASE}/api/...`
// cross-origin. The backend allows all origins via CORS.
const API_BASE = (import.meta.env.VITE_API_TARGET || '').replace(/\/$/, '')

async function jsonFetch(path, options) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(`${res.status} ${res.statusText} ${detail}`)
  }
  return res.json()
}

export const getChats = () => jsonFetch('/api/chats')

export const getMessages = (chatId) =>
  jsonFetch(`/api/chats/${encodeURIComponent(chatId)}/messages`)

export const search = (query, mode) =>
  jsonFetch('/api/search', {
    method: 'POST',
    body: JSON.stringify({ query, mode }),
  })

export const getSettings = () => jsonFetch('/api/settings')

export const putSettings = (settings) =>
  jsonFetch('/api/settings', { method: 'PUT', body: JSON.stringify(settings) })

export const getIndexingStatus = () => jsonFetch('/api/indexing/status')

export const simulateIndexing = (payload) =>
  jsonFetch('/api/indexing/simulate', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

export const emergencyScan = (query) =>
  jsonFetch('/api/emergency-scan', {
    method: 'POST',
    body: JSON.stringify({ query, mode: 'smart' }),
  })

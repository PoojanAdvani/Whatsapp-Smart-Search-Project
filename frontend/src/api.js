// Thin fetch wrappers around the FastAPI backend. All calls go through the Vite
// dev-server proxy at /api -> backend.

async function jsonFetch(url, options) {
  const res = await fetch(url, {
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

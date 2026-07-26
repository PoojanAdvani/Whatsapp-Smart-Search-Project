import { useState } from 'react'
import { emergencyScan } from '../api.js'
import { Avatar, MatchBadge, ConfidenceBar, MediaChip, TYPE_META } from './ui.jsx'

// One-time, RAM-only scan for users who decline persistent indexing.
// Results are shown, then the temporary index is discarded server-side.
export default function EmergencyMode({ open, onClose, onOpenResult }) {
  const [query, setQuery] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  if (!open) return null

  const run = async () => {
    if (!query.trim()) return
    setLoading(true)
    try {
      const r = await emergencyScan(query.trim())
      setResult(r)
    } finally {
      setLoading(false)
    }
  }

  const items = result ? [...result.exact, ...result.semantic] : []

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl max-w-lg w-full shadow-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 bg-amber-50 border-b border-amber-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-wa-ink">⚡ Emergency Recall (RAM-only)</h2>
            <button onClick={onClose} className="text-wa-muted hover:text-wa-ink">✕</button>
          </div>
          <p className="text-xs text-wa-muted mt-1">
            A temporary scan runs in memory and is wiped immediately after — nothing is stored on device.
          </p>
        </div>

        <div className="p-4">
          <div className="flex gap-2">
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && run()}
              placeholder="e.g. electricity bill"
              className="flex-1 border border-wa-border rounded-lg px-3 py-2 text-sm outline-none focus:border-wa-teal"
            />
            <button onClick={run} className="px-4 py-2 rounded-lg bg-amber-500 text-white text-sm font-medium">
              Scan
            </button>
          </div>

          <div className="mt-3 max-h-72 overflow-y-auto wa-scroll">
            {loading && <div className="text-center text-sm text-wa-muted py-6">Scanning memory…</div>}
            {!loading && result && items.length === 0 && (
              <div className="text-center text-sm text-wa-muted py-6">No matches.</div>
            )}
            {!loading &&
              items.map((it) => {
                const m = it.message
                const meta = TYPE_META[m.type] || TYPE_META.text
                return (
                  <button
                    key={`${m.id}-${it.match_type}`}
                    onClick={() => {
                      onOpenResult(it)
                      onClose()
                    }}
                    className="w-full text-left px-2 py-2 border-b border-wa-border hover:bg-wa-hover flex gap-2"
                  >
                    <Avatar name={it.chat_name} color="#94a3b8" size={34} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-wa-ink truncate">{it.chat_name}</span>
                        <MatchBadge type={it.match_type} />
                        <div className="ml-auto"><ConfidenceBar value={it.confidence} /></div>
                      </div>
                      {m.type !== 'text' && <div className="my-1"><MediaChip message={m} /></div>}
                      <div className="text-xs text-wa-muted line-clamp-2">
                        {meta.icon} {it.snippet || m.text}
                      </div>
                    </div>
                  </button>
                )
              })}
          </div>

          {result && (
            <div className="mt-2 text-[11px] text-amber-600 text-center">
              🧹 Temporary index wiped from memory after this scan.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

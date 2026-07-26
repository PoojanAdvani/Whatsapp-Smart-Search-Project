// Proactive fallback nudge shown when keyword search finds nothing useful.
// Clicking it converts the user into a Smart Search — the case study's
// "Discovery Conversion" moment.
export default function FallbackNudge({ query, onTrySmart }) {
  return (
    <div className="mx-3 my-3 rounded-lg border border-violet-200 bg-violet-50 p-4 text-center">
      <div className="text-2xl mb-1">🤔</div>
      <div className="text-sm font-semibold text-wa-ink">
        No exact matches for “{query}”.
      </div>
      <div className="text-xs text-wa-muted mt-0.5 mb-3">
        Can’t recall the exact words? Smart Search finds messages, docs and media by meaning —
        all on your device.
      </div>
      <button
        onClick={onTrySmart}
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-violet-600 text-white text-sm font-medium hover:bg-violet-700"
      >
        ✨ Try Smart Search
      </button>
    </div>
  )
}

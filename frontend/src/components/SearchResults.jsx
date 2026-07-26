import { Avatar, MatchBadge, ConfidenceBar, MediaChip, TYPE_META } from './ui.jsx'
import FallbackNudge from './FallbackNudge.jsx'

function ResultCard({ item, onOpen }) {
  const m = item.message
  const meta = TYPE_META[m.type] || TYPE_META.text
  return (
    <button
      onClick={() => onOpen(item)}
      className="w-full text-left px-3 py-2.5 border-b border-wa-border hover:bg-wa-hover flex gap-3"
    >
      <Avatar name={item.chat_name} color="#94a3b8" size={38} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium text-wa-ink truncate">{item.chat_name}</span>
          <span className="text-[11px] text-wa-muted shrink-0">{m.timestamp}</span>
        </div>

        <div className="flex items-center gap-2 mt-0.5 mb-1">
          <MatchBadge type={item.match_type} />
          <span className="text-[11px] text-wa-muted">
            {meta.icon} {meta.label}
          </span>
          <div className="ml-auto">
            <ConfidenceBar value={item.confidence} />
          </div>
        </div>

        {m.type !== 'text' && (
          <div className="mb-1">
            <MediaChip message={m} />
          </div>
        )}

        <div className="text-sm text-wa-muted line-clamp-2">
          {item.snippet || m.text}
        </div>
      </div>
    </button>
  )
}

function Section({ title, subtitle, items, onOpen, accent }) {
  if (!items || items.length === 0) return null
  return (
    <div>
      <div className={`px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide sticky top-0 ${accent}`}>
        {title} · {items.length}
        {subtitle && <span className="normal-case font-normal opacity-80"> — {subtitle}</span>}
      </div>
      {items.map((it) => (
        <ResultCard key={`${it.message.id}-${it.match_type}`} item={it} onOpen={onOpen} />
      ))}
    </div>
  )
}

export default function SearchResults({ result, mode, loading, onOpen, onTrySmart }) {
  if (loading) {
    return <div className="p-6 text-center text-sm text-wa-muted">Searching…</div>
  }
  if (!result) return null

  const { exact, semantic, suggest_smart, query, engine, took_ms } = result

  // In keyword mode with no/low results, surface the proactive nudge.
  const showNudge = mode === 'keyword' && suggest_smart

  const nothing =
    (mode === 'keyword' && exact.length === 0) ||
    (mode === 'smart' && exact.length === 0 && semantic.length === 0)

  return (
    <div className="flex-1 overflow-y-auto wa-scroll bg-white">
      {/* Meta strip */}
      <div className="px-3 py-1.5 text-[11px] text-wa-muted bg-wa-panel/60 border-b border-wa-border flex items-center justify-between">
        <span>Results for “{query}”</span>
        <span title={`Engine: ${engine}`}>
          {mode === 'smart' ? '✨ Smart' : 'Keyword'} · {took_ms}ms
        </span>
      </div>

      {/* Exact matches always first (RRF prioritizes exact). */}
      <Section
        title="Exact matches"
        subtitle="keyword"
        items={exact}
        onOpen={onOpen}
        accent="bg-slate-100 text-slate-600"
      />

      {/* Clear separation between keyword and semantic results (risk mitigation #3). */}
      {mode === 'smart' && (
        <Section
          title="Smart matches"
          subtitle="found by meaning, on-device"
          items={semantic}
          onOpen={onOpen}
          accent="bg-violet-100 text-violet-700"
        />
      )}

      {showNudge && <FallbackNudge query={query} onTrySmart={onTrySmart} />}

      {nothing && !showNudge && (
        <div className="p-6 text-center text-sm text-wa-muted">
          No results found for “{query}”.
        </div>
      )}
    </div>
  )
}

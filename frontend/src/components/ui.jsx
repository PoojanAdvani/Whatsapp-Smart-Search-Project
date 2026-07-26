// Small shared presentational helpers used across the app.

export function initials(name) {
  const clean = name.replace(/[^\p{L}\p{N} ]/gu, '').trim()
  const parts = clean.split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

export function Avatar({ name, color, size = 40 }) {
  return (
    <div
      className="flex items-center justify-center rounded-full text-white font-semibold shrink-0"
      style={{ backgroundColor: color, width: size, height: size, fontSize: size * 0.38 }}
    >
      {initials(name)}
    </div>
  )
}

export const TYPE_META = {
  text: { icon: '💬', label: 'Message' },
  image: { icon: '📷', label: 'Photo' },
  pdf: { icon: '📄', label: 'Document' },
  voice: { icon: '🎤', label: 'Voice note' },
  link: { icon: '🔗', label: 'Link' },
}

// Colored pill describing how a result matched.
export function MatchBadge({ type }) {
  const map = {
    exact: { label: 'Exact', cls: 'bg-slate-200 text-slate-700' },
    semantic: { label: 'Smart', cls: 'bg-violet-100 text-violet-700' },
    both: { label: 'Exact + Smart', cls: 'bg-emerald-100 text-emerald-700' },
  }
  const m = map[type] || map.exact
  return (
    <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide ${m.cls}`}>
      {m.label}
    </span>
  )
}

// A thin confidence meter (0..1).
export function ConfidenceBar({ value }) {
  const pct = Math.round(value * 100)
  const color = value >= 0.85 ? '#25d366' : value >= 0.6 ? '#f59e0b' : '#94a3b8'
  return (
    <div className="flex items-center gap-1.5" title={`Confidence ${pct}%`}>
      <div className="w-14 h-1.5 rounded-full bg-slate-200 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="text-[10px] text-wa-muted tabular-nums">{pct}%</span>
    </div>
  )
}

// Compact attachment card used in message bubbles and result rows.
export function MediaChip({ message }) {
  const meta = TYPE_META[message.type] || TYPE_META.text
  if (message.type === 'link') {
    return (
      <div className="rounded-md border border-wa-border bg-white/70 overflow-hidden max-w-xs">
        <div className="px-3 py-2 text-xs text-wa-muted">
          <div className="font-semibold text-wa-ink truncate">{meta.icon} Link preview</div>
          <div className="truncate">{message.text}</div>
        </div>
      </div>
    )
  }
  return (
    <div className="flex items-center gap-2 rounded-md border border-wa-border bg-black/[0.03] px-2.5 py-2 max-w-xs">
      <div className="text-xl leading-none">{meta.icon}</div>
      <div className="min-w-0">
        <div className="text-sm font-medium text-wa-ink truncate">
          {message.media?.filename || meta.label}
        </div>
        <div className="text-[11px] text-wa-muted truncate">
          {message.media?.processor ? `Processed by ${message.media.processor}` : meta.label}
        </div>
      </div>
    </div>
  )
}

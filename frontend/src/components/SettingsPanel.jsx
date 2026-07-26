import { simulateIndexing } from '../api.js'

// Slide-over Smart Search settings: granular indexing scope, per-chat
// exclusions, the maintenance-gate simulator, and the binary-quantization
// footprint readout.
export default function SettingsPanel({
  open, onClose, settings, onChangeSettings, status, onRefreshStatus,
  chats, onOpenEmergency,
}) {
  if (!open) return null

  const update = (patch) => onChangeSettings({ ...settings, ...patch })

  const toggleExclusion = (chatId) => {
    const has = settings.exclusions.includes(chatId)
    update({
      exclusions: has
        ? settings.exclusions.filter((c) => c !== chatId)
        : [...settings.exclusions, chatId],
    })
  }

  const setGate = async (patch) => {
    await simulateIndexing(patch)
    onRefreshStatus()
  }

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/30" onClick={onClose}>
      <div
        className="w-full max-w-md h-full bg-white shadow-xl overflow-y-auto wa-scroll"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 h-14 bg-wa-teal text-white sticky top-0 z-10">
          <button onClick={onClose} className="text-xl">←</button>
          <span className="font-semibold">Smart Search</span>
        </div>

        <div className="p-4 space-y-6">
          {/* Master toggle */}
          <section className="flex items-center justify-between">
            <div>
              <div className="font-medium text-wa-ink">Enable Smart Search</div>
              <div className="text-xs text-wa-muted">On-device semantic recall of chats &amp; media.</div>
            </div>
            <Toggle checked={settings.enabled} onChange={(v) => update({ enabled: v })} />
          </section>

          {/* Engine + footprint */}
          {status && (
            <section className="rounded-lg border border-wa-border p-3 text-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-wa-ink">On-device index</span>
                <span className={`text-[11px] px-2 py-0.5 rounded-full ${status.gate_open ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                  {status.gate_open ? 'Gate open' : 'Gate closed'}
                </span>
              </div>
              <Row label="Semantic engine" value={status.engine} />
              <Row label="Indexed items" value={`${status.indexed_count} / ${status.total_count}`} />
              <Row label="Compression" value={`${status.compression} (binary quantization)`} />
              <Row
                label="Footprint"
                value={`${status.raw_size_kb} KB → ${status.compressed_size_kb} KB`}
              />
            </section>
          )}

          {/* Maintenance gate simulator */}
          {status && (
            <section>
              <div className="font-medium text-wa-ink mb-1">Maintenance gate</div>
              <p className="text-xs text-wa-muted mb-2">
                Indexing runs only when charging, screen off, and battery ≥ 80%.
              </p>
              <div className="space-y-2">
                <ToggleRow label={`🔌 Charging`} checked={status.charging} onChange={(v) => setGate({ charging: v })} />
                <ToggleRow label={`📴 Screen off`} checked={status.screen_off} onChange={(v) => setGate({ screen_off: v })} />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-wa-ink">🔋 Battery {status.battery}%</span>
                  <input
                    type="range" min="0" max="100" value={status.battery}
                    onChange={(e) => setGate({ battery: Number(e.target.value) })}
                    className="w-40 accent-wa-teal"
                  />
                </div>
              </div>
            </section>
          )}

          {/* Scope */}
          <section>
            <div className="font-medium text-wa-ink mb-2">What to index</div>
            <div className="space-y-1">
              <Radio name="scope" label="All chats" hint="Text, docs, images, voice notes, links"
                checked={settings.scope === 'all'} onChange={() => update({ scope: 'all' })} />
              <Radio name="scope" label="Documents &amp; media only" hint="PDFs, images, voice, links — skip plain text"
                checked={settings.scope === 'docs_only'} onChange={() => update({ scope: 'docs_only' })} />
              <Radio name="scope" label="Custom (exclude specific chats)" hint="Index everything except the chats below"
                checked={settings.scope === 'custom'} onChange={() => update({ scope: 'custom' })} />
            </div>
          </section>

          {/* Per-chat exclusions */}
          <section>
            <div className="font-medium text-wa-ink mb-2">Exclude chats</div>
            <div className="rounded-lg border border-wa-border divide-y divide-wa-border">
              {chats.map((c) => (
                <label key={c.id} className="flex items-center justify-between px-3 py-2 text-sm cursor-pointer">
                  <span className="text-wa-ink">{c.name}</span>
                  <input
                    type="checkbox"
                    checked={settings.exclusions.includes(c.id)}
                    onChange={() => toggleExclusion(c.id)}
                    className="accent-wa-teal w-4 h-4"
                  />
                </label>
              ))}
            </div>
          </section>

          {/* Emergency mode */}
          <section className="rounded-lg bg-amber-50 border border-amber-200 p-3">
            <div className="font-medium text-wa-ink">⚡ Emergency mode</div>
            <p className="text-xs text-wa-muted mt-0.5 mb-2">
              Prefer not to keep a persistent index? Run a one-time RAM-only scan that wipes itself
              afterward.
            </p>
            <button
              onClick={onOpenEmergency}
              className="px-3 py-1.5 rounded-lg bg-amber-500 text-white text-sm font-medium"
            >
              Run Emergency scan
            </button>
          </section>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className="text-wa-muted text-xs">{label}</span>
      <span className="text-wa-ink text-xs font-medium text-right ml-2">{value}</span>
    </div>
  )
}

function Toggle({ checked, onChange }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`w-11 h-6 rounded-full transition-colors relative ${checked ? 'bg-wa-teal' : 'bg-slate-300'}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${checked ? 'translate-x-5' : ''}`} />
    </button>
  )
}

function ToggleRow({ label, checked, onChange }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-wa-ink">{label}</span>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  )
}

function Radio({ name, label, hint, checked, onChange }) {
  return (
    <label className="flex items-start gap-2 px-1 py-1.5 cursor-pointer">
      <input type="radio" name={name} checked={checked} onChange={onChange} className="mt-1 accent-wa-teal" />
      <span>
        <span className="text-sm text-wa-ink" dangerouslySetInnerHTML={{ __html: label }} />
        <span className="block text-xs text-wa-muted" dangerouslySetInnerHTML={{ __html: hint }} />
      </span>
    </label>
  )
}

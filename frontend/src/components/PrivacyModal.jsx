// On-device / E2EE disclaimer shown before enabling Smart Search indexing.
// Grant -> proceed with the pending settings change. Deny -> offer Emergency
// (RAM-only) mode instead.
export default function PrivacyModal({ open, onGrant, onDeny, onClose }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-3xl mb-2">🔒</div>
        <h2 className="text-lg font-semibold text-wa-ink">Turn on Smart Search?</h2>
        <p className="text-sm text-wa-muted mt-2">
          Smart Search builds a private, searchable index of your chats and media so you can find
          things by meaning — not just exact words.
        </p>

        <ul className="mt-4 space-y-2 text-sm text-wa-ink">
          <li className="flex gap-2"><span>✅</span><span><b>Stays on your device.</b> Nothing is uploaded. End-to-end encryption is never touched.</span></li>
          <li className="flex gap-2"><span>🔋</span><span><b>Runs only when idle.</b> Indexing happens while charging with the screen off.</span></li>
          <li className="flex gap-2"><span>🗜️</span><span><b>Tiny footprint.</b> Vectors are binary-quantized (~32× smaller).</span></li>
          <li className="flex gap-2"><span>🎛️</span><span><b>You’re in control.</b> Choose what’s indexed, or exclude specific chats anytime.</span></li>
        </ul>

        <div className="mt-6 flex flex-col gap-2">
          <button
            onClick={onGrant}
            className="w-full py-2.5 rounded-lg bg-wa-teal text-white font-medium hover:bg-wa-tealDark"
          >
            Grant permission &amp; index on device
          </button>
          <button
            onClick={onDeny}
            className="w-full py-2.5 rounded-lg border border-wa-border text-wa-ink font-medium hover:bg-wa-hover"
          >
            Don’t index — use one-time Emergency scan instead
          </button>
        </div>
      </div>
    </div>
  )
}

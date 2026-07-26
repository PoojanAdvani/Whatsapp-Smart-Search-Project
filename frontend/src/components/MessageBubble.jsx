import { forwardRef } from 'react'
import { MediaChip } from './ui.jsx'

// A single message row. `flash` triggers the jump-to-message highlight.
const MessageBubble = forwardRef(function MessageBubble({ message, flash }, ref) {
  const outgoing = message.sender === 'You'
  const hasMedia = message.type !== 'text'

  return (
    <div className={`flex ${outgoing ? 'justify-end' : 'justify-start'} px-2`}>
      <div
        ref={ref}
        className={`max-w-[75%] rounded-lg px-2.5 py-1.5 shadow-sm ${
          outgoing ? 'bg-wa-bubbleOut' : 'bg-wa-bubbleIn'
        } ${flash ? 'flash-highlight' : ''}`}
      >
        {!outgoing && (
          <div className="text-xs font-semibold text-wa-teal mb-0.5">{message.sender}</div>
        )}

        {hasMedia && (
          <div className="mb-1">
            <MediaChip message={message} />
            {/* Mock SLM extracted text — italic caption to show what was indexed. */}
            {message.processed_text && (
              <div className="mt-1 text-[11px] text-wa-muted italic max-w-xs">
                “{message.processed_text.slice(0, 90)}
                {message.processed_text.length > 90 ? '…' : ''}”
              </div>
            )}
          </div>
        )}

        {message.text && <div className="text-sm text-wa-ink whitespace-pre-wrap">{message.text}</div>}

        <div className="text-[10px] text-wa-muted text-right mt-0.5">{message.timestamp}</div>
      </div>
    </div>
  )
})

export default MessageBubble

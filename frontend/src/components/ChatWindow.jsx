import { useEffect, useRef } from 'react'
import { Avatar } from './ui.jsx'
import MessageBubble from './MessageBubble.jsx'

export default function ChatWindow({ chat, messages, flashMessageId }) {
  const refs = useRef({})
  const bottomRef = useRef(null)

  // Scroll a flashed message into view when jumping from a search result.
  useEffect(() => {
    if (flashMessageId && refs.current[flashMessageId]) {
      refs.current[flashMessageId].scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [flashMessageId])

  if (!chat) {
    return (
      <div className="flex-1 flex items-center justify-center chat-wallpaper text-center">
        <div className="max-w-sm text-wa-muted">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-xl font-light text-wa-ink mb-2">WhatsApp Smart Recall</h2>
          <p className="text-sm">
            Select a chat, or use the search bar to find anything by meaning —
            even an unnamed PDF or a voice note.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Chat header */}
      <div className="flex items-center gap-3 px-4 h-14 bg-wa-panel border-l border-wa-border shrink-0">
        <Avatar name={chat.name} color={chat.avatar_color} size={38} />
        <div>
          <div className="font-medium text-wa-ink leading-tight">{chat.name}</div>
          <div className="text-[11px] text-wa-muted">
            {chat.is_group ? 'Group · tap for info' : 'online'}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto wa-scroll chat-wallpaper py-4 space-y-2">
        {messages.map((m) => (
          <MessageBubble
            key={m.id}
            message={m}
            flash={m.id === flashMessageId}
            ref={(el) => (refs.current[m.id] = el)}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Fake composer */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-wa-panel border-l border-wa-border shrink-0">
        <div className="flex-1 bg-white rounded-full px-4 py-2 text-sm text-wa-muted">
          Type a message
        </div>
        <button className="w-9 h-9 rounded-full bg-wa-teal text-white flex items-center justify-center">
          ➤
        </button>
      </div>
    </div>
  )
}

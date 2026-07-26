import { Avatar } from './ui.jsx'

export default function Sidebar({ chats, activeChatId, onSelect, onOpenSettings, indexingStatus }) {
  return (
    <div className="flex flex-col h-full bg-white border-r border-wa-border">
      {/* Panel header */}
      <div className="flex items-center justify-between px-4 h-14 bg-wa-panel shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-wa-teal text-xl">🟢</span>
          <span className="font-semibold text-wa-ink">Chats</span>
        </div>
        <button
          onClick={onOpenSettings}
          title="Smart Search settings"
          className="w-9 h-9 rounded-full hover:bg-black/5 flex items-center justify-center text-wa-muted"
        >
          ⚙️
        </button>
      </div>

      {/* Indexing status strip */}
      {indexingStatus && (
        <button
          onClick={onOpenSettings}
          className="flex items-center gap-2 px-4 py-1.5 text-[11px] text-wa-muted bg-wa-panel/60 border-b border-wa-border hover:bg-wa-hover text-left"
        >
          <span className={`w-2 h-2 rounded-full ${indexingStatus.gate_open ? 'bg-wa-green' : 'bg-amber-400'}`} />
          <span className="truncate">
            Smart index: {indexingStatus.indexed_count}/{indexingStatus.total_count} items ·{' '}
            {indexingStatus.gate_open ? 'gate open' : 'gate closed'}
          </span>
        </button>
      )}

      {/* Chat list */}
      <div className="flex-1 overflow-y-auto wa-scroll">
        {chats.map((c) => {
          const active = c.id === activeChatId
          return (
            <button
              key={c.id}
              onClick={() => onSelect(c.id)}
              className={`w-full flex items-center gap-3 px-3 py-3 text-left border-b border-wa-border/60 ${
                active ? 'bg-wa-hover' : 'hover:bg-wa-hover'
              }`}
            >
              <Avatar name={c.name} color={c.avatar_color} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-wa-ink truncate">{c.name}</span>
                  <span className="text-[11px] text-wa-muted shrink-0">{c.last_time}</span>
                </div>
                <div className="text-sm text-wa-muted truncate">
                  {c.last_message || (c.is_group ? 'Group chat' : '')}
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

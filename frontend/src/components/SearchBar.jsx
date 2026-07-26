import { useEffect, useRef } from 'react'

// Top search bar with a Keyword <-> Smart mode toggle.
export default function SearchBar({ query, onQuery, mode, onMode, onClear, engine }) {
  const inputRef = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return (
    <div className="flex items-center gap-2 px-3 h-14 bg-wa-panel border-b border-wa-border">
      <div className="flex-1 flex items-center gap-2 bg-white rounded-lg px-3 py-1.5">
        <span className="text-wa-muted">🔍</span>
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder="Search or start a smart recall…  (Ctrl+/)"
          className="flex-1 outline-none text-sm text-wa-ink bg-transparent"
        />
        {query && (
          <button onClick={onClear} className="text-wa-muted hover:text-wa-ink text-sm" title="Clear">
            ✕
          </button>
        )}
      </div>

      {/* Mode toggle */}
      <div className="flex rounded-lg overflow-hidden border border-wa-border text-xs font-medium shrink-0">
        <button
          onClick={() => onMode('keyword')}
          className={`px-3 py-2 ${mode === 'keyword' ? 'bg-wa-teal text-white' : 'bg-white text-wa-muted'}`}
        >
          Keyword
        </button>
        <button
          onClick={() => onMode('smart')}
          className={`px-3 py-2 flex items-center gap-1 ${
            mode === 'smart' ? 'bg-violet-600 text-white' : 'bg-white text-wa-muted'
          }`}
          title={engine ? `Semantic engine: ${engine}` : 'Semantic search'}
        >
          ✨ Smart
        </button>
      </div>
    </div>
  )
}

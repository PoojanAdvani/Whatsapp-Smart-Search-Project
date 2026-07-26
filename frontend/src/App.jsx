import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  getChats, getMessages, search as apiSearch,
  getSettings, putSettings, getIndexingStatus,
} from './api.js'
import Sidebar from './components/Sidebar.jsx'
import ChatWindow from './components/ChatWindow.jsx'
import SearchBar from './components/SearchBar.jsx'
import SearchResults from './components/SearchResults.jsx'
import SettingsPanel from './components/SettingsPanel.jsx'
import PrivacyModal from './components/PrivacyModal.jsx'
import EmergencyMode from './components/EmergencyMode.jsx'

export default function App() {
  const [chats, setChats] = useState([])
  const [activeChatId, setActiveChatId] = useState(null)
  const [messages, setMessages] = useState([])
  const [flashMessageId, setFlashMessageId] = useState(null)

  const [query, setQuery] = useState('')
  const [mode, setMode] = useState('keyword')
  const [result, setResult] = useState(null)
  const [searching, setSearching] = useState(false)

  const [settings, setSettings] = useState(null)
  const [status, setStatus] = useState(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [emergencyOpen, setEmergencyOpen] = useState(false)

  // Privacy modal holds a pending settings change until the user grants/denies.
  const [pendingSettings, setPendingSettings] = useState(null)

  const activeChat = useMemo(
    () => chats.find((c) => c.id === activeChatId) || null,
    [chats, activeChatId],
  )

  // --- initial load ------------------------------------------------------- #
  useEffect(() => {
    getChats().then(setChats).catch(console.error)
    getSettings().then(setSettings).catch(console.error)
    refreshStatus()
  }, [])

  const refreshStatus = useCallback(() => {
    getIndexingStatus().then(setStatus).catch(console.error)
  }, [])

  // --- open a chat -------------------------------------------------------- #
  const openChat = useCallback((chatId) => {
    setActiveChatId(chatId)
    getMessages(chatId).then(setMessages).catch(console.error)
  }, [])

  // --- search (debounced) ------------------------------------------------- #
  const debounceRef = useRef(null)
  useEffect(() => {
    if (!query.trim()) {
      setResult(null)
      return
    }
    clearTimeout(debounceRef.current)
    setSearching(true)
    debounceRef.current = setTimeout(async () => {
      try {
        const r = await apiSearch(query.trim(), mode)
        setResult(r)
      } catch (e) {
        console.error(e)
      } finally {
        setSearching(false)
      }
    }, 220)
    return () => clearTimeout(debounceRef.current)
  }, [query, mode])

  // --- jump from a result to its message in the chat ---------------------- #
  const openResult = useCallback((item) => {
    const chatId = item.message.chat_id
    setActiveChatId(chatId)
    getMessages(chatId).then((msgs) => {
      setMessages(msgs)
      // clear search overlay so the chat is visible
      setQuery('')
      setResult(null)
      // trigger the highlight after the messages render
      setTimeout(() => {
        setFlashMessageId(item.message.id)
        setTimeout(() => setFlashMessageId(null), 1900)
      }, 60)
    })
  }, [])

  // --- settings changes (may require the privacy grant) ------------------- #
  const applySettings = useCallback(async (next) => {
    const updated = await putSettings(next)
    setSettings(updated)
    refreshStatus()
  }, [refreshStatus])

  const onChangeSettings = useCallback((next) => {
    // Turning indexing ON (from off) triggers the privacy disclaimer.
    const turningOn = next.enabled && settings && !settings.enabled
    if (turningOn) {
      setPendingSettings(next)
      return
    }
    applySettings(next)
  }, [settings, applySettings])

  const grantPrivacy = useCallback(() => {
    if (pendingSettings) applySettings(pendingSettings)
    setPendingSettings(null)
  }, [pendingSettings, applySettings])

  const denyPrivacy = useCallback(() => {
    setPendingSettings(null)
    setSettingsOpen(false)
    setEmergencyOpen(true)
  }, [])

  const showResults = Boolean(query.trim())

  return (
    <div className="h-full w-full flex items-center justify-center bg-[#d1d7db] p-0 md:p-4">
      <div className="w-full h-full md:max-w-6xl md:h-[92vh] bg-white md:rounded-lg overflow-hidden shadow-2xl flex">
        {/* Left column: search + sidebar/results */}
        <div className="w-full max-w-[420px] flex flex-col border-r border-wa-border">
          <SearchBar
            query={query}
            onQuery={setQuery}
            mode={mode}
            onMode={setMode}
            onClear={() => setQuery('')}
            engine={result?.engine || status?.engine}
          />
          {showResults ? (
            <SearchResults
              result={result}
              mode={mode}
              loading={searching}
              onOpen={openResult}
              onTrySmart={() => setMode('smart')}
            />
          ) : (
            <Sidebar
              chats={chats}
              activeChatId={activeChatId}
              onSelect={openChat}
              onOpenSettings={() => setSettingsOpen(true)}
              indexingStatus={status}
            />
          )}
        </div>

        {/* Right column: active chat */}
        <ChatWindow chat={activeChat} messages={messages} flashMessageId={flashMessageId} />
      </div>

      {/* Overlays */}
      {settings && (
        <SettingsPanel
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          settings={settings}
          onChangeSettings={onChangeSettings}
          status={status}
          onRefreshStatus={refreshStatus}
          chats={chats}
          onOpenEmergency={() => { setSettingsOpen(false); setEmergencyOpen(true) }}
        />
      )}
      <PrivacyModal
        open={Boolean(pendingSettings)}
        onGrant={grantPrivacy}
        onDeny={denyPrivacy}
        onClose={() => setPendingSettings(null)}
      />
      <EmergencyMode
        open={emergencyOpen}
        onClose={() => setEmergencyOpen(false)}
        onOpenResult={openResult}
      />
    </div>
  )
}

import { useState, useEffect, useRef } from 'react'
import {
  collection, query, orderBy, limit, onSnapshot, addDoc, serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase'

const STATUS_LABELS = {
  planning: 'Planning',
  'in-progress': 'In Progress',
  review: 'In Review',
  completed: 'Completed',
}

function getYouthList(project) {
  if (project.youthCoders?.length > 0) return project.youthCoders
  if (project.youthCoderName || project.youthCoderEmail) {
    return [{ id: project.youthCoderId || '', name: project.youthCoderName || '', email: project.youthCoderEmail || '' }]
  }
  return []
}

export default function ChatTab({ projects, currentUser, currentProfile }) {
  const [selectedId, setSelectedId] = useState(null)
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  const selectedProject = projects.find(p => p.id === selectedId)

  // Auto-select first project
  useEffect(() => {
    if (projects.length > 0 && !selectedId) {
      setSelectedId(projects[0].id)
    }
  }, [projects, selectedId])

  // Subscribe to messages for selected project
  useEffect(() => {
    if (!selectedId || !db) { setMessages([]); return }
    const q = query(
      collection(db, 'projects', selectedId, 'messages'),
      orderBy('timestamp', 'asc'),
      limit(200)
    )
    const unsub = onSnapshot(q, snap => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return unsub
  }, [selectedId])

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
  }, [messages, selectedId])

  const sendMessage = async () => {
    if (!text.trim() || !db || sending || !selectedId) return
    setSending(true)
    const msg = text.trim()
    setText('')
    try {
      await addDoc(collection(db, 'projects', selectedId, 'messages'), {
        text: msg,
        senderId: currentUser.uid,
        senderName: currentProfile?.name || currentUser.email,
        senderRole: currentProfile?.role || 'youth',
        timestamp: serverTimestamp(),
      })
    } catch {
      setText(msg) // restore on failure
    }
    setSending(false)
    inputRef.current?.focus()
  }

  if (projects.length === 0) {
    return (
      <div className="dash-empty" style={{ marginTop: '2rem' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>💬</div>
        <p style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text)' }}>No project chats yet</p>
        <p style={{ fontSize: '0.88rem', color: 'var(--muted)', marginTop: '0.3rem' }}>
          Project chats appear here once projects are assigned to you.
        </p>
      </div>
    )
  }

  return (
    <div className="chat-tab-layout">
      {/* ── Project rooms list ── */}
      <div className="chat-rooms-panel">
        <div className="chat-rooms-header">Project Chats</div>
        {projects.map(p => {
          const youth = getYouthList(p)
          const membersLabel = [
            p.mentorName,
            ...youth.map(y => y.name || y.email),
          ].filter(Boolean).join(', ')

          return (
            <button
              key={p.id}
              className={`chat-room-item${selectedId === p.id ? ' active' : ''}`}
              onClick={() => setSelectedId(p.id)}
            >
              <div className="chat-room-avatar">
                {p.title.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="chat-room-name">{p.title}</div>
                <div className="chat-room-sub">{membersLabel || 'No members assigned'}</div>
              </div>
              <span className={`proj-status ${p.status || 'planning'}`}
                style={{ fontSize: '0.58rem', padding: '0.1rem 0.45rem', flexShrink: 0 }}>
                {STATUS_LABELS[p.status] || 'Planning'}
              </span>
            </button>
          )
        })}
      </div>

      {/* ── Chat panel ── */}
      <div className="chat-main-panel">
        {selectedProject ? (
          <>
            {/* Header */}
            <div className="chat-main-header">
              <div className="chat-room-avatar" style={{ width: 36, height: 36, fontSize: '1rem', borderRadius: 10, flexShrink: 0 }}>
                {selectedProject.title.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="chat-main-title">{selectedProject.title}</div>
                <div className="chat-main-sub">
                  {[
                    selectedProject.organization,
                    selectedProject.mentorName && `Mentor: ${selectedProject.mentorName}`,
                    getYouthList(selectedProject).length > 0 &&
                      `Youth: ${getYouthList(selectedProject).map(y => y.name || y.email).join(', ')}`,
                  ].filter(Boolean).join(' · ')}
                </div>
              </div>
              <span className={`proj-status ${selectedProject.status || 'planning'}`}>
                {STATUS_LABELS[selectedProject.status] || 'Planning'}
              </span>
            </div>

            {/* Messages */}
            <div className="chat-main-messages">
              {messages.length === 0 && (
                <div className="chat-main-empty">
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.6rem' }}>👋</div>
                  <p style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text)' }}>No messages yet</p>
                  <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: '0.25rem' }}>
                    Be the first to start the conversation!
                  </p>
                </div>
              )}

              {messages.map((m, i) => {
                const isOwn = m.senderId === currentUser.uid
                const roleLabel = m.senderRole === 'mentor' ? 'Mentor'
                  : m.senderRole === 'admin' ? 'Admin' : 'Youth'
                const showAvatar = !isOwn && (i === 0 || messages[i - 1]?.senderId !== m.senderId)

                return (
                  <div key={m.id} className={`chat-full-msg${isOwn ? ' own' : ''}`}>
                    {!isOwn && (
                      <div className="chat-full-avatar" style={{ visibility: showAvatar ? 'visible' : 'hidden' }}>
                        {(m.senderName || '?').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className={`chat-full-bubble-wrap${isOwn ? ' own' : ''}`}>
                      {showAvatar && !isOwn && (
                        <div className="chat-full-meta">
                          <span className="chat-msg-name">{m.senderName || 'Unknown'}</span>
                          <span className={`chat-msg-role-badge ${m.senderRole || 'youth'}`}>{roleLabel}</span>
                          <span className="chat-msg-time">
                            {m.timestamp?.toDate?.()?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || ''}
                          </span>
                        </div>
                      )}
                      <div className={`chat-full-bubble${isOwn ? ' own' : ''}`}>{m.text}</div>
                      {isOwn && (
                        <div className="chat-full-meta own">
                          <span className="chat-msg-time">
                            {m.timestamp?.toDate?.()?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || ''}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="chat-main-input-row">
              <input
                ref={inputRef}
                className="chat-main-input"
                placeholder={`Message #${selectedProject.title}…`}
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
              />
              <button className="chat-main-send" onClick={sendMessage} disabled={sending || !text.trim()}>
                {sending ? '…' : '↑'}
              </button>
            </div>
          </>
        ) : (
          <div className="chat-main-empty">
            <p style={{ color: 'var(--muted)' }}>Select a project to chat</p>
          </div>
        )}
      </div>
    </div>
  )
}

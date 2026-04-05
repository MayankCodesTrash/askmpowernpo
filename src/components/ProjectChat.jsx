import { useState, useEffect, useRef } from 'react'
import { collection, query, orderBy, limit, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'

export default function ProjectChat({ project, currentUser, currentProfile }) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    if (!db) return
    const q = query(
      collection(db, 'projects', project.id, 'messages'),
      orderBy('timestamp', 'asc'),
      limit(100)
    )
    const unsub = onSnapshot(q, snap => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return unsub
  }, [project.id])

  useEffect(() => {
    if (open) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    }
  }, [messages, open])

  const sendMessage = async () => {
    if (!text.trim() || !db || sending) return
    setSending(true)
    try {
      await addDoc(collection(db, 'projects', project.id, 'messages'), {
        text: text.trim(),
        senderId: currentUser.uid,
        senderName: currentProfile?.name || currentUser.email,
        senderRole: currentProfile?.role || 'youth',
        timestamp: serverTimestamp(),
      })
      setText('')
    } catch { /* ignore */ }
    setSending(false)
  }

  return (
    <div className="chat-section">
      <button className="chat-toggle-btn" onClick={() => setOpen(o => !o)}>
        <span>💬</span>
        <span>Team Chat</span>
        {messages.length > 0 && (
          <span className="chat-msg-count">{messages.length}</span>
        )}
        <span style={{ marginLeft: 'auto', fontSize: '0.65rem', opacity: 0.6 }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="chat-panel">
          <div className="chat-messages">
            {messages.length === 0 && (
              <p className="chat-empty">No messages yet — start the conversation!</p>
            )}
            {messages.map(m => {
              const isOwn = m.senderId === currentUser.uid
              const roleLabel = m.senderRole === 'mentor' ? 'Mentor' : m.senderRole === 'admin' ? 'Admin' : 'Youth'
              return (
                <div key={m.id} className={`chat-msg${isOwn ? ' own' : ''}`}>
                  <div className="chat-msg-header">
                    <span className="chat-msg-name">{m.senderName || 'Unknown'}</span>
                    <span className={`chat-msg-role-badge ${m.senderRole || 'youth'}`}>{roleLabel}</span>
                    <span className="chat-msg-time">
                      {m.timestamp?.toDate?.()?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || ''}
                    </span>
                  </div>
                  <div className="chat-msg-bubble">{m.text}</div>
                </div>
              )
            })}
            <div ref={bottomRef} />
          </div>
          <div className="chat-input-row">
            <input
              className="chat-input"
              placeholder="Type a message… (Enter to send)"
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
            />
            <button className="chat-send-btn" onClick={sendMessage} disabled={sending || !text.trim()}>
              {sending ? '…' : '↑'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

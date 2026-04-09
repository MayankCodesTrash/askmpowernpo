import { useState, useEffect } from 'react'
import {
  collection, query, where, onSnapshot,
  doc, updateDoc, arrayUnion,
} from 'firebase/firestore'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { db } from '../firebase'
import ChatTab from '../components/ChatTab'
import FileUpload from '../components/FileUpload'
import { useDarkMode } from '../hooks/useDarkMode'
import { useUnreadChats } from '../hooks/useUnreadChats'

const STATUS_LABELS = {
  planning: 'Planning',
  'in-progress': 'In Progress',
  review: 'In Review',
  completed: 'Completed',
}

const LINK_TYPES = ['GitHub', 'Google Drive', 'Figma', 'Replit', 'Google Slides', 'Other']
const LINK_ICONS = {
  GitHub: '🐙',
  'Google Drive': '📁',
  Figma: '🎨',
  Replit: '💻',
  'Google Slides': '📊',
  Other: '🔗',
}

// Merge two project arrays, deduplicating by id
function mergeProjects(a, b) {
  const seen = new Set()
  return [...a, ...b].filter(p => {
    if (seen.has(p.id)) return false
    seen.add(p.id)
    return true
  })
}

// ── Project Links ─────────────────────────────────────────────────────────────
function ProjectLinks({ project, userEmail }) {
  const [type, setType] = useState('GitHub')
  const [url, setUrl] = useState('')
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')

  const handleAdd = async () => {
    if (!url.trim()) { setError('Please enter a URL.'); return }
    if (!url.startsWith('http')) { setError('Please enter a valid URL starting with http.'); return }
    if (!db) { setError('Firebase not configured.'); return }
    setError('')
    setAdding(true)
    try {
      await updateDoc(doc(db, 'projects', project.id), {
        links: arrayUnion({ type, url: url.trim(), addedBy: userEmail, addedAt: new Date().toISOString() }),
      })
      setUrl('')
    } catch {
      setError('Failed to save link. Please try again.')
    } finally {
      setAdding(false)
    }
  }

  return (
    <div>
      <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.6rem' }}>
        Project Links
      </div>
      {(project.links || []).length > 0 && (
        <div className="link-list">
          {project.links.map((l, i) => (
            <a key={i} className="link-item" href={l.url} target="_blank" rel="noreferrer">
              <span className="link-item-icon">{LINK_ICONS[l.type] || '🔗'}</span>
              <span className="link-item-type">{l.type}</span>
              <span className="link-item-url">{l.url}</span>
              <span className="link-item-arrow">↗</span>
            </a>
          ))}
        </div>
      )}
      <div className="link-add-row">
        <select className="link-type-select" value={type} onChange={e => setType(e.target.value)}>
          {LINK_TYPES.map(t => <option key={t} value={t}>{LINK_ICONS[t]} {t}</option>)}
        </select>
        <input
          className="link-url-input"
          type="url"
          placeholder="https://github.com/..."
          value={url}
          onChange={e => setUrl(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
        />
        <button className="link-add-btn" onClick={handleAdd} disabled={adding}>
          {adding ? '…' : '+'}
        </button>
      </div>
      {error && <p style={{ fontSize: '0.75rem', color: '#c0392b', marginTop: '0.3rem' }}>{error}</p>}
    </div>
  )
}

// ── Project Card ──────────────────────────────────────────────────────────────
function ProjectCard({ project, userEmail, userId }) {
  const [showDesc, setShowDesc] = useState(false)

  // Normalize youth coders list (handles both old and new format)
  const youthList = (project.youthCoders && project.youthCoders.length > 0)
    ? project.youthCoders
    : (project.youthCoderEmail
        ? [{ id: project.youthCoderId || '', email: project.youthCoderEmail, name: project.youthCoderName || '' }]
        : [])

  // Other youth coders on the project (teammates)
  const teammates = youthList.filter(y => y.id !== userId && y.email !== userEmail)

  return (
    <div className="proj-card">
      <div className="proj-card-header">
        <div>
          <div className="proj-card-title">{project.title}</div>
          <div className="proj-card-id">ID: {project.id.slice(0, 8).toUpperCase()}</div>
        </div>
        <span className={`proj-status ${project.status || 'planning'}`}>
          {STATUS_LABELS[project.status] || 'Planning'}
        </span>
      </div>

      {project.description ? (
        <div style={{ marginBottom: '0.75rem' }}>
          <button className="proj-desc-toggle" onClick={() => setShowDesc(s => !s)}>
            {showDesc ? '▲ Hide description' : '▼ Show description'}
          </button>
          {showDesc && <div className="proj-desc-expanded">{project.description}</div>}
        </div>
      ) : null}

      <div className="proj-meta">
        <div className="proj-meta-row">
          <span className="proj-meta-label">Mentor</span>
          <span className="proj-meta-value">
            {project.mentorName || 'Unassigned'}
            {project.mentorEmail ? ` · ${project.mentorEmail}` : ''}
          </span>
        </div>
        {teammates.length > 0 && (
          <div className="proj-meta-row">
            <span className="proj-meta-label">Team</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
              {teammates.map((y, i) => (
                <span key={y.id || y.email || i} className="youth-tag" style={{ cursor: 'default' }}>
                  {y.name || y.email}
                </span>
              ))}
            </div>
          </div>
        )}
        <div className="proj-meta-row">
          <span className="proj-meta-label">Org</span>
          <span className="proj-meta-value">{project.organization || '—'}</span>
        </div>
        {project.orgContact && (
          <div className="proj-meta-row">
            <span className="proj-meta-label">Contact</span>
            <span className="proj-meta-value">{project.orgContact}</span>
          </div>
        )}
      </div>

      <div className="proj-divider" />
      <ProjectLinks project={project} userEmail={userEmail} />
      <div className="proj-divider" />
      <FileUpload projectId={project.id} />
    </div>
  )
}

// ── Youth Dashboard ───────────────────────────────────────────────────────────
export default function YouthDashboard() {
  const { user, profile, logout } = useAuth()
  const navigate = useNavigate()
  const [dark, toggleDark] = useDarkMode()
  const [tab, setTab] = useState('projects')
  const [projects, setProjects] = useState([])
  const [projectsLoading, setProjectsLoading] = useState(true)
  const [name, setName] = useState(profile?.name || '')
  const [saved, setSaved] = useState(false)
  const [saveLoading, setSaveLoading] = useState(false)

  const { totalUnread, markProjectRead } = useUnreadChats(projects, user?.uid)

  useEffect(() => {
    if (!user || !db) { setProjectsLoading(false); return }

    // Keep mutable refs for merging results from two queries
    let p1 = []
    let p2 = []

    // Query 1: legacy format — project has this user's email in youthCoderEmail
    const q1 = query(collection(db, 'projects'), where('youthCoderEmail', '==', user.email))
    const unsub1 = onSnapshot(q1, snap => {
      p1 = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      setProjects(mergeProjects(p1, p2))
      setProjectsLoading(false)
    }, () => setProjectsLoading(false))

    // Query 2: new multi-youth format — user's UID is in youthCoderIds array
    const q2 = query(collection(db, 'projects'), where('youthCoderIds', 'array-contains', user.uid))
    const unsub2 = onSnapshot(q2, snap => {
      p2 = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      setProjects(mergeProjects(p1, p2))
      setProjectsLoading(false)
    }, () => setProjectsLoading(false))

    return () => { unsub1(); unsub2() }
  }, [user])

  const handleLogout = async () => { await logout(); navigate('/', { replace: true }) }

  const handleSaveSettings = async () => {
    if (!user || !db || !name.trim()) return
    setSaveLoading(true)
    try {
      await updateDoc(doc(db, 'users', user.uid), { name: name.trim() })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch { /* ignore */ }
    setSaveLoading(false)
  }

  const initials = (profile?.name || user?.email || 'Y').charAt(0).toUpperCase()

  return (
    <div className="dash-layout">
      {/* ── SIDEBAR ── */}
      <aside className="dash-sidebar">
        <a className="dash-logo" href="/">
          <svg width="28" height="32" viewBox="0 0 120 165" xmlns="http://www.w3.org/2000/svg">
            <path d="M60 0 L120 20 L120 90 Q120 140 60 165 Q0 140 0 90 L0 20 Z" fill="#1a3a8f"/>
            <text x="60" y="112" textAnchor="middle" fontFamily="Georgia,serif" fontSize="82" fontWeight="900" fill="#ffffff" letterSpacing="-4">M</text>
            <path d="M20 148 Q60 162 100 148" fill="none" stroke="#e8a020" strokeWidth="5" strokeLinecap="round"/>
          </svg>
          <div>
            <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: '1rem', color: 'var(--text)' }}>
              Mpower<span style={{ color: 'var(--gold)' }}>NPO</span>
            </span>
            <span style={{ fontSize: '0.6rem', color: 'var(--muted)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Youth Portal
            </span>
          </div>
        </a>

        <div className="dash-profile">
          <div style={{ display: 'flex', gap: '0.7rem', alignItems: 'center' }}>
            <div className="dash-avatar">{initials}</div>
            <div>
              <div className="dash-name">{profile?.name || 'Youth Coder'}</div>
              <div className="dash-role-badge youth">Youth Coder</div>
            </div>
          </div>
          {(profile?.school || profile?.grade) && (
            <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: '0.6rem', paddingTop: '0.6rem', borderTop: '1px solid var(--border)' }}>
              {[profile.school, profile.grade].filter(Boolean).join(' · ')}
            </div>
          )}
        </div>

        <div className="dash-nav">
          <button className={`dash-nav-item${tab === 'projects' ? ' active' : ''}`} onClick={() => setTab('projects')}>
            <span className="dico">📁</span> My Projects
          </button>
          <button className={`dash-nav-item${tab === 'chat' ? ' active' : ''}`} onClick={() => setTab('chat')}>
            <span className="dico">💬</span> Chat
            {totalUnread > 0 && tab !== 'chat' && (
              <span className="unread-badge">{totalUnread > 99 ? '99+' : totalUnread}</span>
            )}
          </button>
          <button className={`dash-nav-item${tab === 'settings' ? ' active' : ''}`} onClick={() => setTab('settings')}>
            <span className="dico">⚙️</span> Settings
          </button>
        </div>

        <div className="dash-signout">
          <button className="dark-toggle" onClick={toggleDark}>
            {dark ? '☀️ Light Mode' : '🌙 Dark Mode'}
          </button>
          <button onClick={handleLogout} style={{ marginTop: '0.5rem' }}>Sign Out</button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main className="dash-main">
        {tab === 'projects' && (
          <>
            <div className="dash-header">
              <h1 className="dash-title">My Projects</h1>
              <p className="dash-subtitle">
                {projectsLoading
                  ? 'Loading your projects…'
                  : `${projects.length} project${projects.length !== 1 ? 's' : ''} assigned to you`}
              </p>
            </div>

            {!projectsLoading && projects.length === 0 && (
              <div className="dash-empty">
                <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📋</div>
                <p style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text)' }}>No projects yet</p>
                <p style={{ fontSize: '0.88rem', color: 'var(--muted)', marginTop: '0.3rem' }}>
                  Your mentor will assign projects to you soon. Check back here!
                </p>
              </div>
            )}

            {projectsLoading && (
              <div className="dash-empty">
                <div className="dash-spinner" />
                <p style={{ color: 'var(--muted)', marginTop: '0.75rem', fontSize: '0.9rem' }}>Loading projects…</p>
              </div>
            )}

            <div className="proj-grid">
              {projects.map(proj => (
                <ProjectCard
                  key={proj.id}
                  project={proj}
                  userEmail={user.email}
                  userId={user.uid}
                />
              ))}
            </div>
          </>
        )}

        {/* CHAT TAB */}
        {tab === 'chat' && (
          <>
            <div className="dash-header">
              <h1 className="dash-title">Team Chat</h1>
              <p className="dash-subtitle">Chat with your mentor and teammates on each project</p>
            </div>
            <ChatTab
              projects={projects}
              currentUser={user}
              currentProfile={profile}
              onProjectRead={markProjectRead}
            />
          </>
        )}

        {tab === 'settings' && (
          <>
            <div className="dash-header">
              <h1 className="dash-title">Settings</h1>
              <p className="dash-subtitle">Manage your profile information</p>
            </div>

            <div className="settings-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border)' }}>
                <div className="dash-avatar" style={{ width: 56, height: 56, fontSize: '1.4rem', borderRadius: 14, flexShrink: 0 }}>
                  {initials}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{profile?.name || 'Youth Coder'}</div>
                  <div className="dash-role-badge youth" style={{ marginTop: '0.3rem' }}>Youth Coder</div>
                </div>
              </div>

              <div className="settings-field">
                <label>Full Name</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" />
              </div>
              <div className="settings-field">
                <label>Email Address</label>
                <input value={user?.email || ''} disabled />
                <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Contact your admin to update your email.</span>
              </div>
              {profile?.school && (
                <div className="settings-field">
                  <label>School</label>
                  <input value={profile.school} disabled />
                </div>
              )}
              {profile?.grade && (
                <div className="settings-field">
                  <label>Grade</label>
                  <input value={profile.grade} disabled />
                </div>
              )}

              <button className="settings-save" onClick={handleSaveSettings} disabled={saveLoading || !name.trim()}>
                {saved ? '✓ Saved!' : saveLoading ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  )
}

import { useState, useEffect } from 'react'
import {
  collection, onSnapshot, doc, updateDoc, setDoc,
  serverTimestamp, query, orderBy, addDoc, getDocs, where, arrayUnion,
} from 'firebase/firestore'
import { initializeApp, deleteApp } from 'firebase/app'
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { db, firebaseConfig } from '../firebase'

// Creates a Firebase Auth user without logging out the admin
async function createAuthUser(email, password) {
  const tempApp = initializeApp(firebaseConfig, `temp_${Date.now()}`)
  try {
    const tempAuth = getAuth(tempApp)
    const { user } = await createUserWithEmailAndPassword(tempAuth, email, password)
    return user.uid
  } finally {
    await deleteApp(tempApp)
  }
}

const DEFAULT_PASSWORD = 'PleaseChangeMPOWER123'

const LINK_TYPES = ['GitHub', 'Google Drive', 'Figma', 'Replit', 'Google Slides', 'Other']
const LINK_ICONS = { GitHub: '🐙', 'Google Drive': '📁', Figma: '🎨', Replit: '💻', 'Google Slides': '📊', Other: '🔗' }

function ProjectLinks({ project }) {
  const [type, setType] = useState('GitHub')
  const [url, setUrl] = useState('')
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')

  const handleAdd = async () => {
    if (!url.trim()) { setError('Enter a URL.'); return }
    if (!url.startsWith('http')) { setError('URL must start with http.'); return }
    setError(''); setAdding(true)
    try {
      await updateDoc(doc(db, 'projects', project.id), {
        links: arrayUnion({ type, url: url.trim(), addedAt: new Date().toISOString() }),
      })
      setUrl('')
    } catch { setError('Failed to save link.') }
    setAdding(false)
  }

  return (
    <div>
      <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.5rem' }}>Project Links</div>
      {(project.links || []).length > 0 && (
        <div className="link-list" style={{ marginBottom: '0.6rem' }}>
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
        <input className="link-url-input" type="url" placeholder="https://..." value={url}
          onChange={e => setUrl(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAdd()} />
        <button className="link-add-btn" onClick={handleAdd} disabled={adding}>{adding ? '…' : '+'}</button>
      </div>
      {error && <p style={{ fontSize: '0.75rem', color: '#c0392b', marginTop: '0.3rem' }}>{error}</p>}
    </div>
  )
}

// Opens Gmail compose with credentials pre-filled — no third-party service needed
function openCredentialsEmail(toEmail, name, role) {
  const subject = encodeURIComponent('Welcome to MpowerNPO — Your Login Credentials')
  const body = encodeURIComponent(
    `Hi ${name},\n\nCongratulations! You've been accepted to MpowerNPO as a ${role === 'youth' ? 'Youth Coder' : 'Mentor'}.\n\nHere are your login credentials:\n\nEmail: ${toEmail}\nPassword: ${DEFAULT_PASSWORD}\n\nSign in here: ${window.location.origin}/login\n\nPlease change your password after your first sign-in.\n\nWelcome to the team!\n— The MpowerNPO Team`
  )
  window.open(`mailto:${toEmail}?subject=${subject}&body=${body}`)
}

const STATUS_OPTIONS = [
  { value: 'planning', label: 'Planning' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'review', label: 'In Review' },
  { value: 'completed', label: 'Completed' },
]
const STATUS_LABELS = { planning: 'Planning', 'in-progress': 'In Progress', review: 'In Review', completed: 'Completed' }

const SKILL_COLORS = {
  beginner: { bg: 'rgba(26,58,143,0.08)', color: 'var(--blue)' },
  intermediate: { bg: 'rgba(232,160,32,0.12)', color: '#9a6c10' },
  advanced: { bg: 'rgba(39,174,96,0.12)', color: '#1e7e50' },
}

// ── Application Card ──────────────────────────────────────────────────────────
function ApplicationCard({ app, onApprove, onReject }) {
  const [expanded, setExpanded] = useState(false)
  const [approving, setApproving] = useState(false)
  const [approveResult, setApproveResult] = useState(null) // { password } or { error }
  const isYouth = app.type === 'youth'
  const skillStyle = SKILL_COLORS[app.skillLevel] || SKILL_COLORS.beginner

  const handleApprove = async () => {
    setApproving(true)
    const result = await onApprove(app)
    setApproveResult(result)
    setApproving(false)
  }

  return (
    <div className="app-card" style={{ borderLeftColor: app.status === 'approved' ? '#27ae60' : app.status === 'rejected' ? '#c0392b' : 'var(--blue)' }}>
      <div className="app-card-top">
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.4rem' }}>
            <span className="app-type-badge" style={{ background: isYouth ? 'rgba(26,58,143,0.1)' : 'rgba(232,160,32,0.12)', color: isYouth ? 'var(--blue)' : '#9a6c10' }}>
              {isYouth ? 'Youth Coder' : 'Mentor'}
            </span>
            {isYouth && app.skillLevel && (
              <span className="app-type-badge" style={skillStyle}>{app.skillLevel} · {app.skillScore}/20</span>
            )}
            <span className={`app-status-badge ${app.status || 'pending'}`}>{app.status || 'pending'}</span>
          </div>
          <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text)' }}>{app.name}</div>
          <div style={{ fontSize: '0.83rem', color: 'var(--muted)' }}>{app.email}</div>
          {isYouth && app.school && <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{app.school}</div>}
          {!isYouth && app.background && <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{app.background}</div>}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', alignItems: 'flex-end', flexShrink: 0 }}>
          <button className="app-expand-btn" onClick={() => setExpanded(e => !e)}>{expanded ? 'Less ▲' : 'Details ▼'}</button>
          {(app.status === 'pending' || !app.status) && !approveResult && (
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <button className="app-action-btn approve" onClick={handleApprove} disabled={approving}>
                {approving ? '⏳ Creating…' : '✓ Approve'}
              </button>
              <button className="app-action-btn reject" onClick={() => onReject(app.id)} disabled={approving}>✕ Reject</button>
            </div>
          )}
        </div>
      </div>

      {/* Approve result banner */}
      {approveResult && (
        <div style={{ marginTop: '0.75rem', padding: '0.75rem 1rem', borderRadius: 10, background: approveResult.error ? 'rgba(192,57,43,0.07)' : 'rgba(39,174,96,0.08)', border: `1px solid ${approveResult.error ? 'rgba(192,57,43,0.2)' : 'rgba(39,174,96,0.25)'}` }}>
          {approveResult.error ? (
            <p style={{ fontSize: '0.83rem', color: '#c0392b' }}>❌ {approveResult.error}</p>
          ) : (
            <>
              <p style={{ fontSize: '0.83rem', fontWeight: 700, color: '#1e7e50', marginBottom: '0.3rem' }}>✅ Account created!</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--muted)', lineHeight: 1.6 }}>
                Your Gmail should have opened with the credentials pre-filled. Just hit Send.<br />
                <strong>Email:</strong> {app.email} · <strong>Password:</strong> <code style={{ background: 'rgba(0,0,0,0.06)', padding: '0.1rem 0.4rem', borderRadius: 4 }}>PleaseChangeMPOWER123</code>
              </p>
            </>
          )}
        </div>
      )}

      {expanded && (
        <div className="app-details">
          {isYouth ? (
            <>
              <Row label="Skills" value={(app.skills || []).join(', ') || '—'} />
              <Row label="Experience" value={app.experience} />
              <Row label="Previous Projects" value={app.hasPrevProjects} />
              {app.projectDesc && <Row label="Project Desc" value={app.projectDesc} />}
              <Row label="Uses Git" value={app.usesGit} />
              <Row label="Interests" value={(app.projectTypes || []).join(', ') || '—'} />
              <Row label="Hours/Week" value={app.hoursPerWeek} />
              <Row label="Motivation" value={app.motivation} />
              <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'rgba(26,58,143,0.04)', borderRadius: 8, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--blue)', marginBottom: '0.3rem' }}>Hidden Assessment</div>
                <div style={{ fontSize: '0.88rem' }}>Score: <strong>{app.skillScore}/20</strong> · Level: <strong style={skillStyle}>{app.skillLevel}</strong></div>
              </div>
            </>
          ) : (
            <>
              <Row label="Expertise" value={(app.expertise || []).join(', ') || '—'} />
              <Row label="Hours/Month" value={app.hoursPerMonth} />
              <Row label="Mentored Before" value={app.hasMentoredBefore} />
              {app.linkedIn && <Row label="LinkedIn" value={app.linkedIn} />}
              {app.motivation && <Row label="Motivation" value={app.motivation} />}
            </>
          )}
          <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.5rem' }}>
            Submitted: {app.submittedAt?.toDate?.()?.toLocaleDateString() || '—'}
          </div>
        </div>
      )}
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.83rem', marginBottom: '0.3rem' }}>
      <span style={{ fontWeight: 600, color: 'var(--text)', minWidth: 130, flexShrink: 0 }}>{label}</span>
      <span style={{ color: 'var(--muted)' }}>{value || '—'}</span>
    </div>
  )
}

// ── Create User Modal (fully automated) ──────────────────────────────────────
function CreateUserModal({ prefill, onClose }) {
  const [form, setForm] = useState({
    name: prefill?.name || '',
    email: prefill?.email || '',
    password: '',
    role: prefill?.type === 'mentor' ? 'mentor' : 'youth',
    school: prefill?.school || '',
    grade: '',
    background: prefill?.background || '',
    expertise: Array.isArray(prefill?.expertise) ? prefill.expertise.join(', ') : '',
  })
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }))

  const handleCreate = async () => {
    if (!form.name || !form.email || !form.password) {
      setError('Name, email, and password are required.')
      return
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const uid = await createAuthUser(form.email.trim().toLowerCase(), form.password)
      await setDoc(doc(db, 'users', uid), {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        role: form.role,
        ...(form.role === 'youth' ? { school: form.school.trim(), grade: form.grade.trim() } : {}),
        ...(form.role === 'mentor' ? {
          background: form.background.trim(),
          expertise: form.expertise.split(',').map(s => s.trim()).filter(Boolean),
        } : {}),
        createdAt: serverTimestamp(),
      })
      setDone(true)
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') setError('That email already has an account.')
      else if (err.code === 'auth/invalid-email') setError('Invalid email address.')
      else setError('Failed to create account. Please try again.')
    }
    setLoading(false)
  }

  return (
    <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-box">
        {done ? (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>✅</div>
            <p style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.4rem' }}>Account created!</p>
            <p style={{ fontSize: '0.88rem', color: 'var(--muted)', marginBottom: '1.5rem' }}>
              Email <strong>{form.email}</strong> their login credentials.<br />They sign in at <strong>/login</strong>.
            </p>
            <button className="modal-submit" onClick={onClose} style={{ width: '100%' }}>Done</button>
          </div>
        ) : (
          <>
            <h2 className="modal-title">Create Account</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div className="fg"><label>Full Name *</label><input type="text" value={form.name} onChange={set('name')} placeholder="First Last" /></div>
              <div className="fg">
                <label>Role *</label>
                <select value={form.role} onChange={set('role')} style={{ border: '1px solid var(--border)', borderRadius: 10, padding: '0.7rem 0.8rem', fontFamily: 'Outfit,sans-serif', fontSize: '0.9rem', width: '100%', background: 'var(--bg)', color: 'var(--text)', outline: 'none' }}>
                  <option value="youth">Youth Coder</option>
                  <option value="mentor">Mentor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <div className="fg" style={{ marginBottom: '0.75rem' }}>
              <label>Email *</label>
              <input type="email" value={form.email} onChange={set('email')} placeholder="their@email.com" />
            </div>
            <div className="fg" style={{ marginBottom: '0.75rem' }}>
              <label>Password * (you'll share this with them)</label>
              <input type="text" value={form.password} onChange={set('password')} placeholder="Min 6 characters" />
            </div>
            {form.role === 'youth' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div className="fg"><label>School</label><input type="text" value={form.school} onChange={set('school')} placeholder="School name" /></div>
                <div className="fg"><label>Grade</label><input type="text" value={form.grade} onChange={set('grade')} placeholder="e.g. 9th Grade" /></div>
              </div>
            )}
            {form.role === 'mentor' && (
              <>
                <div className="fg" style={{ marginBottom: '0.75rem' }}>
                  <label>Professional Background</label>
                  <input type="text" value={form.background} onChange={set('background')} placeholder="e.g. Software Engineer, 5 years" />
                </div>
                <div className="fg" style={{ marginBottom: '0.75rem' }}>
                  <label>Expertise (comma separated)</label>
                  <input type="text" value={form.expertise} onChange={set('expertise')} placeholder="Web Development, Data & Analytics" />
                </div>
              </>
            )}
            {error && <p style={{ fontSize: '0.83rem', color: '#c0392b', marginBottom: '0.5rem' }}>{error}</p>}
            <div className="modal-actions">
              <button className="modal-cancel" onClick={onClose} disabled={loading}>Cancel</button>
              <button className="modal-submit" onClick={handleCreate} disabled={loading}>
                {loading ? 'Creating account…' : 'Create Account →'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ── Create Project Modal ──────────────────────────────────────────────────────
function CreateProjectModal({ mentors, onClose }) {
  const [form, setForm] = useState({
    title: '', description: '', organization: '', orgContact: '',
    mentorId: '', status: 'planning',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }))

  const handleCreate = async () => {
    if (!form.title || !form.organization || !form.mentorId) {
      setError('Title, organization, and mentor are required.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const mentor = mentors.find(m => m.id === form.mentorId)
      await addDoc(collection(db, 'projects'), {
        title: form.title.trim(),
        description: form.description.trim(),
        organization: form.organization.trim(),
        orgContact: form.orgContact.trim(),
        mentorId: mentor.id,
        mentorEmail: mentor.email,
        mentorName: mentor.name,
        youthCoderId: '',
        youthCoderEmail: '',
        youthCoderName: '',
        status: form.status,
        links: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      onClose()
    } catch {
      setError('Failed to create project. Please try again.')
    }
    setLoading(false)
  }

  return (
    <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-box">
        <h2 className="modal-title">Create Project</h2>
        <div className="fg" style={{ marginBottom: '0.75rem' }}>
          <label>Project Title *</label>
          <input type="text" placeholder="e.g. Volunteer Tracker App" value={form.title} onChange={set('title')} />
        </div>
        <div className="fg" style={{ marginBottom: '0.75rem' }}>
          <label>Short Description</label>
          <textarea rows={3} placeholder="What will be built…" value={form.description} onChange={set('description')} style={{ border: '1px solid var(--border)', borderRadius: 10, padding: '0.7rem 1rem', fontFamily: 'Outfit,sans-serif', fontSize: '0.9rem', color: 'var(--text)', background: 'var(--bg)', outline: 'none', resize: 'vertical', width: '100%' }} />
        </div>
        <div className="fg" style={{ marginBottom: '0.75rem' }}>
          <label>Assign to Mentor *</label>
          <select value={form.mentorId} onChange={set('mentorId')} style={{ border: '1px solid var(--border)', borderRadius: 10, padding: '0.7rem 1rem', fontFamily: 'Outfit,sans-serif', fontSize: '0.9rem', width: '100%', background: 'var(--bg)', color: 'var(--text)', outline: 'none' }}>
            <option value="">Select a mentor…</option>
            {mentors.map(m => <option key={m.id} value={m.id}>{m.name} ({m.email})</option>)}
          </select>
        </div>
        <div className="fg" style={{ marginBottom: '0.75rem' }}>
          <label>Organization *</label>
          <input type="text" placeholder="e.g. Des Moines Food Bank" value={form.organization} onChange={set('organization')} />
        </div>
        <div className="fg" style={{ marginBottom: '0.75rem' }}>
          <label>Org Contact Email / Phone</label>
          <input type="text" placeholder="contact@org.org" value={form.orgContact} onChange={set('orgContact')} />
        </div>
        <div className="fg" style={{ marginBottom: '0.75rem' }}>
          <label>Initial Status</label>
          <select value={form.status} onChange={set('status')} style={{ border: '1px solid var(--border)', borderRadius: 10, padding: '0.7rem 1rem', fontFamily: 'Outfit,sans-serif', fontSize: '0.9rem', width: '100%', background: 'var(--bg)', color: 'var(--text)', outline: 'none' }}>
            {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        {error && <p style={{ fontSize: '0.83rem', color: '#c0392b', marginBottom: '0.5rem' }}>{error}</p>}
        <div className="modal-actions">
          <button className="modal-cancel" onClick={onClose} disabled={loading}>Cancel</button>
          <button className="modal-submit" onClick={handleCreate} disabled={loading}>
            {loading ? 'Creating…' : 'Create Project →'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Admin Dashboard ───────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const { user, profile, logout } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('applications')
  const [applications, setApplications] = useState([])
  const [projects, setProjects] = useState([])
  const [mentors, setMentors] = useState([])
  const [appsLoading, setAppsLoading] = useState(true)
  const [projLoading, setProjLoading] = useState(true)
  const [filter, setFilter] = useState('pending')
  const [createProjectModal, setCreateProjectModal] = useState(false)

  useEffect(() => {
    if (!db) { setAppsLoading(false); setProjLoading(false); return }
    const unsubApps = onSnapshot(query(collection(db, 'applications'), orderBy('submittedAt', 'desc')),
      snap => { setApplications(snap.docs.map(d => ({ id: d.id, ...d.data() }))); setAppsLoading(false) },
      () => setAppsLoading(false))
    const unsubProj = onSnapshot(query(collection(db, 'projects'), orderBy('createdAt', 'desc')),
      snap => { setProjects(snap.docs.map(d => ({ id: d.id, ...d.data() }))); setProjLoading(false) },
      () => setProjLoading(false))
    // Fetch mentors once
    getDocs(query(collection(db, 'users'), where('role', '==', 'mentor')))
      .then(snap => setMentors(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
    return () => { unsubApps(); unsubProj() }
  }, [])

  const handleApprove = async (app) => {
    try {
      // 1. Create Firebase Auth account with fixed default password
      const uid = await createAuthUser(app.email, DEFAULT_PASSWORD)

      // 2. Create Firestore user profile from application data
      const role = app.type === 'mentor' ? 'mentor' : 'youth'
      await setDoc(doc(db, 'users', uid), {
        name: app.name,
        email: app.email.toLowerCase(),
        role,
        ...(role === 'youth' ? { school: app.school || '', grade: app.grade || '' } : {}),
        ...(role === 'mentor' ? { background: app.background || '', expertise: app.expertise || [] } : {}),
        createdAt: serverTimestamp(),
      })

      // 3. Mark application as approved
      await updateDoc(doc(db, 'applications', app.id), { status: 'approved', approvedAt: serverTimestamp() })

      // 4. Open pre-filled Gmail compose window
      openCredentialsEmail(app.email, app.name, role)

      return { success: true, role }
    } catch (err) {
      const msg = err.code === 'auth/email-already-in-use'
        ? 'An account with this email already exists.'
        : 'Failed to create account. Please try again.'
      return { error: msg }
    }
  }
  const handleReject = async (id) => { await updateDoc(doc(db, 'applications', id), { status: 'rejected' }) }
  const handleLogout = async () => { await logout(); navigate('/', { replace: true }) }

  const filtered = applications.filter(a => filter === 'all' || (a.status || 'pending') === filter)
  const pending = applications.filter(a => !a.status || a.status === 'pending').length
  const initials = (profile?.name || 'A').charAt(0).toUpperCase()

  return (
    <div className="dash-layout">
      <aside className="dash-sidebar">
        <a className="dash-logo" href="/">
          <svg width="28" height="32" viewBox="0 0 120 165" xmlns="http://www.w3.org/2000/svg">
            <path d="M60 0 L120 20 L120 90 Q120 140 60 165 Q0 140 0 90 L0 20 Z" fill="#1a3a8f"/>
            <text x="60" y="112" textAnchor="middle" fontFamily="Georgia,serif" fontSize="82" fontWeight="900" fill="#ffffff" letterSpacing="-4">M</text>
            <path d="M20 148 Q60 162 100 148" fill="none" stroke="#e8a020" strokeWidth="5" strokeLinecap="round"/>
          </svg>
          <div>
            <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: '1rem', color: 'var(--text)' }}>Mpower<span style={{ color: 'var(--gold)' }}>NPO</span></span>
            <span style={{ fontSize: '0.6rem', color: 'var(--muted)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Admin</span>
          </div>
        </a>

        <div className="dash-profile">
          <div style={{ display: 'flex', gap: '0.7rem', alignItems: 'center' }}>
            <div className="dash-avatar" style={{ background: 'linear-gradient(135deg,#c0392b,#922b21)' }}>{initials}</div>
            <div>
              <div className="dash-name">{profile?.name || 'Admin'}</div>
              <div className="dash-role-badge" style={{ background: 'rgba(192,57,43,0.1)', color: '#c0392b', border: '1px solid rgba(192,57,43,0.2)' }}>Admin</div>
            </div>
          </div>
        </div>

        <div className="dash-nav">
          <button className={`dash-nav-item${tab === 'applications' ? ' active' : ''}`} onClick={() => setTab('applications')}>
            <span className="dico">📋</span> Applications
            {pending > 0 && <span style={{ marginLeft: 'auto', background: 'var(--blue)', color: '#fff', fontSize: '0.68rem', fontWeight: 700, padding: '0.1rem 0.5rem', borderRadius: 100 }}>{pending}</span>}
          </button>
          <button className={`dash-nav-item${tab === 'projects' ? ' active' : ''}`} onClick={() => setTab('projects')}>
            <span className="dico">📁</span> Projects
          </button>
          <button className={`dash-nav-item${tab === 'users' ? ' active' : ''}`} onClick={() => setTab('users')}>
            <span className="dico">👤</span> Add Member
          </button>
        </div>

        <div className="dash-signout">
          <button onClick={handleLogout}>Sign Out</button>
        </div>
      </aside>

      <main className="dash-main">
        {/* ── APPLICATIONS ── */}
        {tab === 'applications' && (
          <>
            <div className="dash-header">
              <h1 className="dash-title">Applications</h1>
              <p className="dash-subtitle">{applications.length} total · {pending} pending</p>
            </div>
            <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
              {['pending', 'approved', 'rejected', 'all'].map(f => (
                <button key={f} onClick={() => setFilter(f)} style={{ padding: '0.4rem 1rem', borderRadius: 100, border: '1px solid var(--border)', background: filter === f ? 'var(--blue)' : 'transparent', color: filter === f ? '#fff' : 'var(--muted)', fontFamily: 'Outfit,sans-serif', fontSize: '0.82rem', fontWeight: 500, cursor: 'pointer', textTransform: 'capitalize' }}>
                  {f}
                </button>
              ))}
            </div>
            {appsLoading && <div className="dash-empty"><div className="dash-spinner" /></div>}
            {!appsLoading && filtered.length === 0 && (
              <div className="dash-empty"><div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📭</div><p style={{ fontWeight: 700 }}>No {filter} applications</p></div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {filtered.map(app => <ApplicationCard key={app.id} app={app} onApprove={handleApprove} onReject={handleReject} />)}
            </div>
          </>
        )}

        {/* ── PROJECTS ── */}
        {tab === 'projects' && (
          <>
            <div className="dash-header">
              <div className="dash-section-head">
                <div>
                  <h1 className="dash-title">Projects</h1>
                  <p className="dash-subtitle">{projLoading ? 'Loading…' : `${projects.length} projects`}</p>
                </div>
                <button className="dash-add-btn" onClick={() => setCreateProjectModal(true)}>+ New Project</button>
              </div>
            </div>

            {projLoading && <div className="dash-empty"><div className="dash-spinner" /></div>}
            {!projLoading && projects.length === 0 && (
              <div className="dash-empty">
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📁</div>
                <p style={{ fontWeight: 700, marginBottom: '1rem' }}>No projects yet</p>
                <button className="dash-add-btn" style={{ borderRadius: 10 }} onClick={() => setCreateProjectModal(true)}>+ Create First Project</button>
              </div>
            )}

            <div className="proj-grid">
              {projects.map(proj => (
                <div key={proj.id} className="proj-card">
                  <div className="proj-card-header">
                    <div>
                      <div className="proj-card-title">{proj.title}</div>
                      <div className="proj-card-id">ID: {proj.id.slice(0, 8).toUpperCase()}</div>
                    </div>
                    <span className={`proj-status ${proj.status || 'planning'}`}>
                      {STATUS_LABELS[proj.status] || 'Planning'}
                    </span>
                  </div>
                  <p className="proj-desc">{proj.description || 'No description.'}</p>
                  <div className="proj-meta">
                    <div className="proj-meta-row">
                      <span className="proj-meta-label">Mentor</span>
                      <span className="proj-meta-value">{proj.mentorName || '—'} {proj.mentorEmail ? `· ${proj.mentorEmail}` : ''}</span>
                    </div>
                    <div className="proj-meta-row">
                      <span className="proj-meta-label">Youth Coder</span>
                      <span className="proj-meta-value" style={{ color: proj.youthCoderEmail ? 'var(--muted)' : '#c0392b' }}>
                        {proj.youthCoderName || (proj.youthCoderEmail ? proj.youthCoderEmail : 'Not assigned yet')}
                      </span>
                    </div>
                    <div className="proj-meta-row">
                      <span className="proj-meta-label">Org</span>
                      <span className="proj-meta-value">{proj.organization || '—'}</span>
                    </div>
                  </div>
                  <div className="proj-divider" />
                  <ProjectLinks project={proj} />
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── ADD MEMBER ── */}
        {tab === 'users' && (
          <>
            <div className="dash-header">
              <h1 className="dash-title">Add Member</h1>
              <p className="dash-subtitle">Create login accounts for youth coders and mentors</p>
            </div>
            <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 16, padding: '2rem', maxWidth: 520 }}>
              <p style={{ fontSize: '0.9rem', color: 'var(--muted)', marginBottom: '1.2rem', lineHeight: 1.7 }}>
                Fill in their name, email, role, and a temporary password — the account is created instantly. Email them their credentials and they can sign in at <strong>/login</strong>.
              </p>
              <button className="dash-add-btn" style={{ borderRadius: 10 }} onClick={() => setCreateUserModal({})}>
                + Create Account
              </button>
            </div>
          </>
        )}
      </main>

      {createProjectModal && (
        <CreateProjectModal mentors={mentors} onClose={() => setCreateProjectModal(false)} />
      )}
    </div>
  )
}

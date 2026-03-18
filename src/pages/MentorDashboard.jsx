import { useState, useEffect } from 'react'
import {
  collection, query, where, onSnapshot,
  doc, updateDoc, addDoc, serverTimestamp, arrayUnion, getDocs,
} from 'firebase/firestore'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { db } from '../firebase'

const LINK_TYPES = ['GitHub', 'Google Drive', 'Figma', 'Replit', 'Google Slides', 'Other']
const LINK_ICONS = {
  GitHub: '🐙',
  'Google Drive': '📁',
  Figma: '🎨',
  Replit: '💻',
  'Google Slides': '📊',
  Other: '🔗',
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
      <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.6rem' }}>Project Links</div>
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
        <input className="link-url-input" type="url" placeholder="https://github.com/..."
          value={url} onChange={e => setUrl(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAdd()} />
        <button className="link-add-btn" onClick={handleAdd} disabled={adding}>{adding ? '…' : '+'}</button>
      </div>
      {error && <p style={{ fontSize: '0.75rem', color: '#c0392b', marginTop: '0.3rem' }}>{error}</p>}
    </div>
  )
}

const STATUS_LABELS = {
  planning: 'Planning',
  'in-progress': 'In Progress',
  review: 'In Review',
  completed: 'Completed',
}

const STATUS_OPTIONS = [
  { value: 'planning', label: 'Planning' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'review', label: 'In Review' },
  { value: 'completed', label: 'Completed' },
]


// ── Assign Youth Coder Inline ─────────────────────────────────────────────────
function AssignYouthInline({ projectId }) {
  const [email, setEmail] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleAssign = async () => {
    if (!email.trim()) return
    setSaving(true)
    setError('')
    try {
      // Look up youth coder by email
      let name = ''
      let uid = ''
      const q = query(collection(db, 'users'), where('email', '==', email.trim().toLowerCase()), where('role', '==', 'youth'))
      const snap = await getDocs(q)
      if (!snap.empty) {
        name = snap.docs[0].data().name || ''
        uid = snap.docs[0].id
      }
      await updateDoc(doc(db, 'projects', projectId), {
        youthCoderEmail: email.trim().toLowerCase(),
        youthCoderName: name,
        youthCoderId: uid,
        updatedAt: serverTimestamp(),
      })
    } catch {
      setError('Failed to assign. Try again.')
    }
    setSaving(false)
  }

  return (
    <div style={{ flex: 1 }}>
      <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
        <input
          type="email"
          placeholder="student@email.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAssign()}
          style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '0.3rem 0.6rem', fontFamily: 'Outfit,sans-serif', fontSize: '0.8rem', color: 'var(--text)', background: 'var(--bg)', outline: 'none', flex: 1, minWidth: 0 }}
        />
        <button onClick={handleAssign} disabled={saving} style={{ padding: '0.3rem 0.7rem', background: 'var(--blue)', color: '#fff', border: 'none', borderRadius: 8, fontFamily: 'Outfit,sans-serif', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
          {saving ? '…' : 'Assign'}
        </button>
      </div>
      {error && <p style={{ fontSize: '0.72rem', color: '#c0392b', marginTop: '0.2rem' }}>{error}</p>}
    </div>
  )
}

// ── Mentor Project Card ───────────────────────────────────────────────────────
function MentorProjectCard({ project, userEmail }) {
  const [updatingStatus, setUpdatingStatus] = useState(false)

  const handleStatusChange = async (newStatus) => {
    if (!db) return
    setUpdatingStatus(true)
    try {
      await updateDoc(doc(db, 'projects', project.id), {
        status: newStatus,
        updatedAt: serverTimestamp(),
      })
    } catch { /* ignore */ }
    setUpdatingStatus(false)
  }

  return (
    <div className="proj-card">
      <div className="proj-card-header">
        <div>
          <div className="proj-card-title">{project.title}</div>
          <div className="proj-card-id">ID: {project.id.slice(0, 8).toUpperCase()}</div>
        </div>
        <select
          className={`proj-status-select proj-status ${project.status || 'planning'}`}
          value={project.status || 'planning'}
          onChange={(e) => handleStatusChange(e.target.value)}
          disabled={updatingStatus}
        >
          {STATUS_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <p className="proj-desc">{project.description || 'No description provided.'}</p>

      <div className="proj-meta">
        <div className="proj-meta-row">
          <span className="proj-meta-label">Youth</span>
          {project.youthCoderEmail ? (
            <span className="proj-meta-value">{project.youthCoderName || project.youthCoderEmail} · {project.youthCoderEmail}</span>
          ) : (
            <AssignYouthInline projectId={project.id} />
          )}
        </div>
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
    </div>
  )
}

// ── Create Project Modal ──────────────────────────────────────────────────────
function CreateProjectModal({ mentorEmail, mentorName, mentorId, onClose }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    youthCoderEmail: '',
    organization: '',
    orgContact: '',
    status: 'planning',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }))

  const handleCreate = async () => {
    if (!form.title || !form.youthCoderEmail || !form.organization) {
      setError('Please fill in Project Title, Youth Coder Email, and Organization.')
      return
    }
    if (!db) {
      setError('Firebase is not configured.')
      return
    }
    setLoading(true)
    setError('')
    try {
      // Try to look up youth coder by email
      let youthCoderName = ''
      let youthCoderId = ''
      try {
        const q = query(collection(db, 'users'), where('email', '==', form.youthCoderEmail), where('role', '==', 'youth'))
        const snap = await getDocs(q)
        if (!snap.empty) {
          youthCoderName = snap.docs[0].data().name || ''
          youthCoderId = snap.docs[0].id
        }
      } catch { /* ignore lookup errors */ }

      await addDoc(collection(db, 'projects'), {
        title: form.title.trim(),
        description: form.description.trim(),
        youthCoderEmail: form.youthCoderEmail.trim().toLowerCase(),
        youthCoderName,
        youthCoderId,
        mentorId,
        mentorEmail,
        mentorName,
        organization: form.organization.trim(),
        orgContact: form.orgContact.trim(),
        status: form.status,
        files: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      onClose()
    } catch (err) {
      setError('Failed to create project. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-box">
        <h2 className="modal-title">Create New Project</h2>

        <div className="fg" style={{ marginBottom: '1rem' }}>
          <label>Project Title *</label>
          <input type="text" placeholder="e.g. Volunteer Tracker App" value={form.title} onChange={set('title')} />
        </div>
        <div className="fg" style={{ marginBottom: '1rem' }}>
          <label>Short Description</label>
          <textarea rows={3} placeholder="Brief overview of what will be built…" value={form.description} onChange={set('description')} style={{ border: '1px solid var(--border)', borderRadius: 10, padding: '0.7rem 1rem', fontFamily: 'Outfit,sans-serif', fontSize: '0.9rem', color: 'var(--text)', background: 'var(--bg)', outline: 'none', resize: 'vertical', width: '100%' }} />
        </div>
        <div className="fg" style={{ marginBottom: '1rem' }}>
          <label>Youth Coder Email *</label>
          <input type="email" placeholder="student@example.com" value={form.youthCoderEmail} onChange={set('youthCoderEmail')} />
        </div>
        <div className="fg" style={{ marginBottom: '1rem' }}>
          <label>Organization Name *</label>
          <input type="text" placeholder="e.g. Des Moines Food Bank" value={form.organization} onChange={set('organization')} />
        </div>
        <div className="fg" style={{ marginBottom: '1rem' }}>
          <label>Org Contact Email / Phone</label>
          <input type="text" placeholder="contact@nonprofit.org" value={form.orgContact} onChange={set('orgContact')} />
        </div>
        <div className="fg" style={{ marginBottom: '1rem' }}>
          <label>Initial Status</label>
          <select value={form.status} onChange={set('status')} style={{ border: '1px solid var(--border)', borderRadius: 10, padding: '0.7rem 1rem', fontFamily: 'Outfit,sans-serif', fontSize: '0.9rem', color: 'var(--text)', background: 'var(--bg)', outline: 'none', width: '100%' }}>
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

// ── Mentor Dashboard ──────────────────────────────────────────────────────────
export default function MentorDashboard() {
  const { user, profile, logout } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('projects')
  const [projects, setProjects] = useState([])
  const [projectsLoading, setProjectsLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [name, setName] = useState(profile?.name || '')
  const [saved, setSaved] = useState(false)
  const [saveLoading, setSaveLoading] = useState(false)

  useEffect(() => {
    if (!user || !db) { setProjectsLoading(false); return }
    const q = query(collection(db, 'projects'), where('mentorEmail', '==', user.email))
    const unsub = onSnapshot(q, (snap) => {
      setProjects(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setProjectsLoading(false)
    }, () => setProjectsLoading(false))
    return unsub
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

  // Group projects by youth coder email
  const grouped = projects.reduce((acc, proj) => {
    const key = proj.youthCoderEmail || 'unassigned'
    if (!acc[key]) acc[key] = { name: proj.youthCoderName || '', email: key, projects: [] }
    acc[key].projects.push(proj)
    return acc
  }, {})

  const initials = (profile?.name || user?.email || 'M').charAt(0).toUpperCase()

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
              Mentor Portal
            </span>
          </div>
        </a>

        <div className="dash-profile">
          <div style={{ display: 'flex', gap: '0.7rem', alignItems: 'center' }}>
            <div className="dash-avatar" style={{ background: 'linear-gradient(135deg,var(--gold),#c07b10)' }}>{initials}</div>
            <div>
              <div className="dash-name">{profile?.name || 'Mentor'}</div>
              <div className="dash-role-badge mentor">Mentor</div>
            </div>
          </div>
          {profile?.background && (
            <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: '0.6rem', paddingTop: '0.6rem', borderTop: '1px solid var(--border)' }}>
              {profile.background}
            </div>
          )}
        </div>

        <div className="dash-nav">
          <button className={`dash-nav-item${tab === 'projects' ? ' active' : ''}`} onClick={() => setTab('projects')}>
            <span className="dico">📁</span> Projects
          </button>
          <button className={`dash-nav-item${tab === 'settings' ? ' active' : ''}`} onClick={() => setTab('settings')}>
            <span className="dico">⚙️</span> Settings
          </button>
        </div>

        <div className="dash-signout">
          <button onClick={handleLogout}>Sign Out</button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main className="dash-main">
        {/* PROJECTS TAB */}
        {tab === 'projects' && (
          <>
            <div className="dash-header">
              <div className="dash-section-head">
                <div>
                  <h1 className="dash-title">Projects</h1>
                  <p className="dash-subtitle">
                    {projectsLoading ? 'Loading…' : `${projects.length} project${projects.length !== 1 ? 's' : ''} across ${Object.keys(grouped).length} youth coder${Object.keys(grouped).length !== 1 ? 's' : ''}`}
                  </p>
                </div>
                <button className="dash-add-btn" onClick={() => setShowCreateModal(true)}>
                  + New Project
                </button>
              </div>
            </div>

            {!projectsLoading && projects.length === 0 && (
              <div className="dash-empty">
                <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🚀</div>
                <p style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text)' }}>No projects yet</p>
                <p style={{ fontSize: '0.88rem', color: 'var(--muted)', marginTop: '0.3rem', marginBottom: '1.2rem' }}>
                  Create your first project to get started with your youth coders.
                </p>
                <button className="dash-add-btn" onClick={() => setShowCreateModal(true)}>
                  + Create First Project
                </button>
              </div>
            )}

            {projectsLoading && (
              <div className="dash-empty">
                <div className="dash-spinner" />
                <p style={{ color: 'var(--muted)', marginTop: '0.75rem', fontSize: '0.9rem' }}>Loading projects…</p>
              </div>
            )}

            {/* Grouped by youth coder */}
            {Object.values(grouped).map(group => (
              <div className="youth-group" key={group.email}>
                <div className="youth-group-label">
                  <div className="dash-avatar" style={{ width: 30, height: 30, fontSize: '0.8rem', borderRadius: 8, flexShrink: 0 }}>
                    {(group.name || group.email).charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <span className="youth-group-name">{group.name || 'Youth Coder'}</span>
                    {group.email !== 'unassigned' && (
                      <span className="youth-group-email"> · {group.email}</span>
                    )}
                  </div>
                  <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--muted)', background: 'var(--bg2)', padding: '0.2rem 0.6rem', borderRadius: 100, border: '1px solid var(--border)' }}>
                    {group.projects.length} project{group.projects.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="proj-grid">
                  {group.projects.map(proj => (
                    <MentorProjectCard key={proj.id} project={proj} userEmail={user.email} />
                  ))}
                </div>
              </div>
            ))}
          </>
        )}

        {/* SETTINGS TAB */}
        {tab === 'settings' && (
          <>
            <div className="dash-header">
              <h1 className="dash-title">Settings</h1>
              <p className="dash-subtitle">Manage your profile information</p>
            </div>

            <div className="settings-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border)' }}>
                <div className="dash-avatar" style={{ width: 56, height: 56, fontSize: '1.4rem', borderRadius: 14, background: 'linear-gradient(135deg,var(--gold),#c07b10)', flexShrink: 0 }}>
                  {initials}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{profile?.name || 'Mentor'}</div>
                  <div className="dash-role-badge mentor" style={{ marginTop: '0.3rem' }}>Mentor</div>
                </div>
              </div>

              <div className="settings-field">
                <label>Full Name</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" />
              </div>
              <div className="settings-field">
                <label>Email Address</label>
                <input value={user?.email || ''} disabled />
                <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Contact admin to update your email.</span>
              </div>
              {profile?.background && (
                <div className="settings-field">
                  <label>Professional Background</label>
                  <input value={profile.background} disabled />
                </div>
              )}
              {profile?.expertise && (
                <div className="settings-field">
                  <label>Areas of Expertise</label>
                  <input value={Array.isArray(profile.expertise) ? profile.expertise.join(', ') : profile.expertise} disabled />
                </div>
              )}

              <button className="settings-save" onClick={handleSaveSettings} disabled={saveLoading || !name.trim()}>
                {saved ? '✓ Saved!' : saveLoading ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </>
        )}
      </main>

      {/* CREATE PROJECT MODAL */}
      {showCreateModal && (
        <CreateProjectModal
          mentorEmail={user.email}
          mentorName={profile?.name || ''}
          mentorId={user.uid}
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </div>
  )
}

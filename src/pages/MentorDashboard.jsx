import { useState, useEffect } from 'react'
import {
  collection, query, where, onSnapshot,
  doc, updateDoc, addDoc, serverTimestamp, arrayUnion, getDocs,
} from 'firebase/firestore'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { db } from '../firebase'
import ProjectChat from '../components/ProjectChat'

const LINK_TYPES = ['GitHub', 'Google Drive', 'Figma', 'Replit', 'Google Slides', 'Other']
const LINK_ICONS = {
  GitHub: '🐙',
  'Google Drive': '📁',
  Figma: '🎨',
  Replit: '💻',
  'Google Slides': '📊',
  Other: '🔗',
}

const STATUS_OPTIONS = [
  { value: 'planning', label: 'Planning' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'review', label: 'In Review' },
  { value: 'completed', label: 'Completed' },
]

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
      setError('Failed to save link.')
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

// ── Manage Youth Coders (multi-assign) ────────────────────────────────────────
function ManageYouthCoders({ project, allYouthUsers }) {
  const [showPicker, setShowPicker] = useState(false)
  const [saving, setSaving] = useState(false)

  // Normalize: handle both new array format and legacy single-youth format
  const youthList = (project.youthCoders && project.youthCoders.length > 0)
    ? project.youthCoders
    : (project.youthCoderEmail
        ? [{ id: project.youthCoderId || '', email: project.youthCoderEmail, name: project.youthCoderName || '' }]
        : [])

  const youthIds = youthList.map(y => y.id).filter(Boolean)

  const addYouth = async (youthUser) => {
    if (youthIds.includes(youthUser.id)) return
    setSaving(true)
    const newList = [...youthList, { id: youthUser.id, email: youthUser.email, name: youthUser.name || '' }]
    const newIds = newList.map(y => y.id).filter(Boolean)
    try {
      await updateDoc(doc(db, 'projects', project.id), {
        youthCoders: newList,
        youthCoderIds: newIds,
        youthCoderId: newList[0]?.id || '',
        youthCoderEmail: newList[0]?.email || '',
        youthCoderName: newList[0]?.name || '',
        updatedAt: serverTimestamp(),
      })
    } catch { /* ignore */ }
    setSaving(false)
    setShowPicker(false)
  }

  const removeYouth = async (youthId) => {
    const newList = youthList.filter(y => y.id !== youthId)
    const newIds = newList.map(y => y.id).filter(Boolean)
    try {
      await updateDoc(doc(db, 'projects', project.id), {
        youthCoders: newList,
        youthCoderIds: newIds,
        youthCoderId: newList[0]?.id || '',
        youthCoderEmail: newList[0]?.email || '',
        youthCoderName: newList[0]?.name || '',
        updatedAt: serverTimestamp(),
      })
    } catch { /* ignore */ }
  }

  const available = allYouthUsers.filter(u => !youthIds.includes(u.id))

  return (
    <div>
      {youthList.length === 0 ? (
        <span style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>No youth coders assigned</span>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginBottom: '0.45rem' }}>
          {youthList.map((y, i) => (
            <span key={y.id || y.email || i} className="youth-tag">
              {y.name || y.email}
              <button className="youth-tag-remove" onClick={() => removeYouth(y.id)} title="Remove">×</button>
            </span>
          ))}
        </div>
      )}
      {available.length > 0 && (
        <div style={{ position: 'relative' }}>
          <button className="add-youth-btn" onClick={() => setShowPicker(p => !p)} disabled={saving}>
            + Add Youth Coder
          </button>
          {showPicker && (
            <div className="youth-picker-dropdown">
              <div className="youth-picker-header">Available Youth Coders</div>
              {available.map(u => (
                <button key={u.id} className="youth-picker-item" onClick={() => addYouth(u)}>
                  <div className="dash-avatar" style={{ width: 26, height: 26, fontSize: '0.72rem', borderRadius: 7, flexShrink: 0 }}>
                    {(u.name || u.email).charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="youth-picker-name">{u.name || 'Unnamed'}</div>
                    <div className="youth-picker-email">{u.email}</div>
                  </div>
                  <span style={{ color: 'var(--blue)', fontSize: '0.75rem', fontWeight: 600 }}>+ Add</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Mentor Project Card ───────────────────────────────────────────────────────
function MentorProjectCard({ project, userEmail, allYouthUsers, currentProfile }) {
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const { user } = useAuth()

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
          <div style={{ flex: 1 }}>
            <ManageYouthCoders project={project} allYouthUsers={allYouthUsers} />
          </div>
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
      <div className="proj-divider" />
      <ProjectChat project={project} currentUser={user} currentProfile={currentProfile} />
    </div>
  )
}

// ── Create Project Modal ──────────────────────────────────────────────────────
function CreateProjectModal({ mentorEmail, mentorName, mentorId, onClose, youthUsers }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    organization: '',
    orgContact: '',
    status: 'planning',
  })
  const [selectedYouth, setSelectedYouth] = useState([])
  const [youthSearch, setYouthSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }))

  const toggleYouth = (u) => {
    setSelectedYouth(prev => {
      const exists = prev.find(y => y.id === u.id)
      return exists ? prev.filter(y => y.id !== u.id) : [...prev, u]
    })
  }

  const filteredYouth = youthUsers.filter(u =>
    youthSearch === '' ||
    (u.name || '').toLowerCase().includes(youthSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(youthSearch.toLowerCase())
  )

  const handleCreate = async () => {
    if (!form.title || !form.organization) {
      setError('Please fill in Project Title and Organization.')
      return
    }
    if (!db) {
      setError('Firebase is not configured.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const youthCoders = selectedYouth.map(u => ({ id: u.id, email: u.email, name: u.name || '' }))
      const youthCoderIds = youthCoders.map(y => y.id)

      await addDoc(collection(db, 'projects'), {
        title: form.title.trim(),
        description: form.description.trim(),
        youthCoders,
        youthCoderIds,
        youthCoderId: youthCoders[0]?.id || '',
        youthCoderEmail: youthCoders[0]?.email || '',
        youthCoderName: youthCoders[0]?.name || '',
        mentorId,
        mentorEmail,
        mentorName,
        organization: form.organization.trim(),
        orgContact: form.orgContact.trim(),
        status: form.status,
        links: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      onClose()
    } catch {
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
          <textarea rows={3} placeholder="Brief overview of what will be built…" value={form.description} onChange={set('description')}
            style={{ border: '1px solid var(--border)', borderRadius: 10, padding: '0.7rem 1rem', fontFamily: 'Outfit,sans-serif', fontSize: '0.9rem', color: 'var(--text)', background: 'var(--bg)', outline: 'none', resize: 'vertical', width: '100%' }} />
        </div>

        {/* Youth Coder Picker */}
        <div className="fg" style={{ marginBottom: '1rem' }}>
          <label>Assign Youth Coders</label>
          {selectedYouth.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginBottom: '0.5rem' }}>
              {selectedYouth.map(u => (
                <span key={u.id} className="youth-tag">
                  {u.name || u.email}
                  <button className="youth-tag-remove" onClick={() => toggleYouth(u)}>×</button>
                </span>
              ))}
            </div>
          )}
          {youthUsers.length > 0 ? (
            <div className="youth-modal-picker">
              <input
                className="youth-picker-search"
                type="text"
                placeholder="Search youth coders…"
                value={youthSearch}
                onChange={e => setYouthSearch(e.target.value)}
              />
              <div className="youth-modal-list">
                {filteredYouth.length === 0 && (
                  <div style={{ padding: '0.75rem', fontSize: '0.82rem', color: 'var(--muted)', textAlign: 'center' }}>No results</div>
                )}
                {filteredYouth.map(u => {
                  const checked = !!selectedYouth.find(y => y.id === u.id)
                  return (
                    <label key={u.id} className={`youth-modal-item${checked ? ' selected' : ''}`}>
                      <input type="checkbox" checked={checked} onChange={() => toggleYouth(u)} style={{ display: 'none' }} />
                      <div className="dash-avatar" style={{ width: 28, height: 28, fontSize: '0.75rem', borderRadius: 8, flexShrink: 0 }}>
                        {(u.name || u.email).charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text)' }}>{u.name || 'Unnamed'}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{u.email}</div>
                      </div>
                      {checked && <span style={{ color: 'var(--blue)', fontSize: '0.85rem' }}>✓</span>}
                    </label>
                  )
                })}
              </div>
            </div>
          ) : (
            <p style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>No youth coders registered yet.</p>
          )}
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
  const [youthUsers, setYouthUsers] = useState([])
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

  // Load all youth coders for assignment picker
  useEffect(() => {
    if (!db) return
    getDocs(query(collection(db, 'users'), where('role', '==', 'youth')))
      .then(snap => setYouthUsers(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
  }, [])

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

        {/* Available Youth Coders panel */}
        {youthUsers.length > 0 && (
          <div style={{ marginTop: '1rem', padding: '0.8rem', background: 'var(--bg2)', borderRadius: 10, border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted)', marginBottom: '0.5rem' }}>
              Youth Coders ({youthUsers.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              {youthUsers.slice(0, 5).map(u => (
                <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <div className="dash-avatar" style={{ width: 22, height: 22, fontSize: '0.6rem', borderRadius: 6, flexShrink: 0 }}>
                    {(u.name || u.email).charAt(0).toUpperCase()}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {u.name || u.email}
                  </span>
                </div>
              ))}
              {youthUsers.length > 5 && (
                <span style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>+{youthUsers.length - 5} more</span>
              )}
            </div>
          </div>
        )}

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
                    {projectsLoading ? 'Loading…' : `${projects.length} project${projects.length !== 1 ? 's' : ''}`}
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

            <div className="proj-grid">
              {projects.map(proj => (
                <MentorProjectCard
                  key={proj.id}
                  project={proj}
                  userEmail={user.email}
                  allYouthUsers={youthUsers}
                  currentProfile={profile}
                />
              ))}
            </div>
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
          youthUsers={youthUsers}
        />
      )}
    </div>
  )
}

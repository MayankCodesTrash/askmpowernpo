import { useState, useRef, useEffect } from 'react'
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { collection, addDoc, serverTimestamp, onSnapshot, query, orderBy } from 'firebase/firestore'
import { storage, db } from '../firebase'

function getFileIcon(type) {
  if (!type) return '📁'
  if (type.startsWith('image/')) return '🖼️'
  if (type.includes('pdf')) return '📄'
  if (type.includes('spreadsheet') || type.includes('excel') || type.includes('csv')) return '📊'
  if (type.includes('word') || type.includes('document')) return '📝'
  if (type.includes('zip') || type.includes('compressed')) return '🗜️'
  if (type.includes('video')) return '🎥'
  if (type.includes('audio')) return '🎵'
  return '📁'
}

function formatSize(bytes) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function FileUpload({ projectId }) {
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    if (!db || !projectId) return
    const q = query(
      collection(db, 'projects', projectId, 'files'),
      orderBy('uploadedAt', 'desc')
    )
    return onSnapshot(q, snap => {
      setFiles(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    }, () => {})
  }, [projectId])

  const uploadFile = (file) => {
    if (!storage || !db) { setError('Storage not configured.'); return }
    setError('')
    setUploading(true)
    setProgress(0)

    const path = `projects/${projectId}/files/${Date.now()}_${file.name}`
    const sRef = storageRef(storage, path)
    const task = uploadBytesResumable(sRef, file)

    task.on(
      'state_changed',
      snap => setProgress(Math.round(snap.bytesTransferred / snap.totalBytes * 100)),
      err => { setError(`Upload failed: ${err.message}`); setUploading(false) },
      async () => {
        const url = await getDownloadURL(task.snapshot.ref)
        await addDoc(collection(db, 'projects', projectId, 'files'), {
          name: file.name,
          url,
          size: file.size,
          type: file.type,
          storagePath: path,
          uploadedAt: serverTimestamp(),
        }).catch(() => {})
        setUploading(false)
        setProgress(0)
      }
    )
  }

  const handleDrop = e => {
    e.preventDefault()
    setDragging(false)
    Array.from(e.dataTransfer.files).forEach(uploadFile)
  }

  const handleSelect = e => {
    Array.from(e.target.files).forEach(uploadFile)
    e.target.value = ''
  }

  return (
    <div>
      <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.5rem' }}>
        Project Files
      </div>

      <div
        className={`file-drop-zone${dragging ? ' dragging' : ''}`}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => !uploading && inputRef.current?.click()}
      >
        <input ref={inputRef} type="file" multiple style={{ display: 'none' }} onChange={handleSelect} />
        <span style={{ fontSize: '1.4rem' }}>📂</span>
        <span className="file-drop-text">
          {dragging ? 'Drop to upload' : uploading ? `Uploading… ${progress}%` : 'Drag & drop files or click to upload'}
        </span>
      </div>

      {uploading && (
        <div className="file-progress-track">
          <div className="file-progress-fill" style={{ width: `${progress}%` }} />
        </div>
      )}

      {error && (
        <p style={{ fontSize: '0.75rem', color: '#c0392b', margin: '0.3rem 0' }}>{error}</p>
      )}

      {files.length > 0 && (
        <div className="file-list">
          {files.map(f => (
            <a key={f.id} href={f.url} target="_blank" rel="noreferrer" className="file-item">
              <span className="file-item-icon">{getFileIcon(f.type)}</span>
              <span className="file-item-name">{f.name}</span>
              {f.size > 0 && <span className="file-item-size">{formatSize(f.size)}</span>}
              <span className="file-item-arrow">↗</span>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}

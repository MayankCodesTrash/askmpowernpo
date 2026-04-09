import { useState, useEffect } from 'react'
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'

function storageKey(userId, projectId) {
  return `clr_${userId}_${projectId}`
}

export function useUnreadChats(projects, userId) {
  const [unreadCounts, setUnreadCounts] = useState({})

  const projectIds = projects.map(p => p.id).join(',')

  useEffect(() => {
    if (!db || !userId || projects.length === 0) return

    const unsubs = projects.map(project => {
      const q = query(
        collection(db, 'projects', project.id, 'messages'),
        orderBy('timestamp', 'asc')
      )
      return onSnapshot(q, snap => {
        const lastRead = parseInt(localStorage.getItem(storageKey(userId, project.id)) || '0')
        const unread = snap.docs.filter(d => {
          const m = d.data()
          return m.senderId !== userId && (m.timestamp?.toMillis?.() || 0) > lastRead
        }).length
        setUnreadCounts(prev => ({ ...prev, [project.id]: unread }))
      }, () => {})
    })

    return () => unsubs.forEach(u => u())
  }, [projectIds, userId]) // eslint-disable-line react-hooks/exhaustive-deps

  const totalUnread = Object.values(unreadCounts).reduce((a, b) => a + b, 0)

  const markProjectRead = (projectId) => {
    localStorage.setItem(storageKey(userId, projectId), Date.now().toString())
    setUnreadCounts(prev => ({ ...prev, [projectId]: 0 }))
  }

  return { unreadCounts, totalUnread, markProjectRead }
}

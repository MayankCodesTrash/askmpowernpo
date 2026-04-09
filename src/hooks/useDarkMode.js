import { useState, useEffect } from 'react'

export function useDarkMode() {
  const [dark, setDark] = useState(() => localStorage.getItem('mpwr_dark') === '1')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
    localStorage.setItem('mpwr_dark', dark ? '1' : '0')
  }, [dark])

  // Apply immediately on mount (before first render)
  useEffect(() => {
    const saved = localStorage.getItem('mpwr_dark') === '1'
    document.documentElement.setAttribute('data-theme', saved ? 'dark' : 'light')
  }, [])

  return [dark, () => setDark(d => !d)]
}

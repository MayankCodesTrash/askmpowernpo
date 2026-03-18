import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../AuthContext'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, user, profile, isFirebaseConfigured } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (user && profile) {
      navigate(profile.role === 'mentor' ? '/dashboard/mentor' : '/dashboard/youth', { replace: true })
    }
  }, [user, profile, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) {
      setError('Please enter your email and password.')
      return
    }
    if (!isFirebaseConfigured) {
      setError('Firebase is not configured yet. Please follow the setup instructions.')
      return
    }
    setError('')
    setLoading(true)
    try {
      const { profile: p } = await login(email, password)
      const dest = p?.role === 'mentor' ? '/dashboard/mentor'
        : p?.role === 'admin' ? '/dashboard/admin'
        : '/dashboard/youth'
      navigate(dest, { replace: true })
    } catch (err) {
      const code = err.code || ''
      if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setError('Invalid email or password. Please try again.')
      } else if (code === 'auth/too-many-requests') {
        setError('Too many failed attempts. Please try again later.')
      } else {
        setError('Sign in failed. Please check your credentials.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        {/* Logo */}
        <div className="login-logo-wrap">
          <svg width="32" height="37" viewBox="0 0 120 165" xmlns="http://www.w3.org/2000/svg">
            <path d="M60 0 L120 20 L120 90 Q120 140 60 165 Q0 140 0 90 L0 20 Z" fill="#1a3a8f"/>
            <text x="60" y="112" textAnchor="middle" fontFamily="Georgia,serif" fontSize="82" fontWeight="900" fill="#ffffff" letterSpacing="-4">M</text>
            <path d="M20 148 Q60 162 100 148" fill="none" stroke="#e8a020" strokeWidth="5" strokeLinecap="round"/>
          </svg>
          <div>
            <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: '1.15rem', color: 'var(--text)' }}>
              Mpower<span style={{ color: 'var(--gold)' }}>NPO</span>
            </span>
            <span style={{ display: 'block', fontSize: '0.6rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Member Portal
            </span>
          </div>
        </div>

        <h1 className="login-heading">Welcome back</h1>
        <p className="login-subhead">Sign in to your MpowerNPO dashboard</p>

        <form onSubmit={handleSubmit}>
          <div className="login-field">
            <label htmlFor="login-email">Email Address</label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>
          <div className="login-field">
            <label htmlFor="login-pass">Password</label>
            <input
              id="login-pass"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Your password"
              autoComplete="current-password"
            />
          </div>
          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In →'}
          </button>
        </form>

        {error && <p className="login-error">{error}</p>}

        {!isFirebaseConfigured && (
          <div className="login-notice">
            Firebase is not yet configured. Add your Firebase credentials to the <code>.env</code> file to enable sign-in.
          </div>
        )}

        <Link to="/" className="login-back">← Back to main site</Link>
      </div>
    </div>
  )
}

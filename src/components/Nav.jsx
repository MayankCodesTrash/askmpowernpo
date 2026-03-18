import { Link } from 'react-router-dom'
import { useAuth } from '../AuthContext'

export default function Nav() {
  const { user, profile } = useAuth()
  const dashLink = profile?.role === 'mentor' ? '/dashboard/mentor' : '/dashboard/youth'

  return (
    <nav className="site-nav">
      <a className="nav-logo" href="#">
        <svg width="38" height="44" viewBox="0 0 120 165" xmlns="http://www.w3.org/2000/svg">
          <path d="M60 0 L120 20 L120 90 Q120 140 60 165 Q0 140 0 90 L0 20 Z" fill="#1a3a8f"/>
          <text x="60" y="112" textAnchor="middle" fontFamily="Georgia,serif" fontSize="82" fontWeight="900" fill="#ffffff" letterSpacing="-4">M</text>
          <path d="M20 148 Q60 162 100 148" fill="none" stroke="#e8a020" strokeWidth="5" strokeLinecap="round"/>
        </svg>
        <div>
          <span className="nav-logo-main">Mpower<span>NPO</span></span>
          <span className="nav-logo-sub">Founder &amp; Youth Leader: Mayank Bhatt</span>
        </div>
      </a>
      <ul className="nav-links">
        <li><a href="#how">How It Works</a></li>
        <li><a href="#impact">Impact</a></li>
        <li><a href="#iowa">Iowa Stats</a></li>
        <li><a href="#founder">Founder</a></li>
      </ul>
      <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
        <a className="nav-cta" href="#contact">Contact Us</a>
        {user ? (
          <Link
            to={dashLink}
            className="nav-cta"
            style={{ background: 'var(--gold)', color: '#0d1b3e' }}
          >
            Dashboard →
          </Link>
        ) : (
          <Link
            to="/login"
            className="nav-cta"
            style={{ background: 'transparent', color: 'var(--blue)', border: '1.5px solid rgba(26,58,143,0.35)' }}
          >
            Sign In
          </Link>
        )}
      </div>
    </nav>
  )
}

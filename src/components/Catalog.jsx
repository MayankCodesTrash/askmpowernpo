import { useState } from 'react'

const offerings = [
  { icon: '🌐', title: 'Website Updates & Enhancements', desc: 'Refreshing or improving your existing site — new pages, content updates, accessibility fixes, and feature additions.' },
  { icon: '📅', title: 'Calendar & Schedule System Setup', desc: 'Setting up digital calendars, booking systems, or scheduling tools tailored to your organization\'s workflow.' },
  { icon: '📄', title: 'Flyers & Posters — Create & Update', desc: 'Designing or refreshing promotional materials for events, programs, and community outreach.' },
  { icon: '📊', title: 'Data Organization & Automation', desc: 'Structuring spreadsheets, databases, and workflows so your data is grant-ready, board-ready, and easy to maintain.' },
  { icon: '🛠️', title: 'Onsite Tech Support', desc: 'Hands-on assistance at your location — setting up devices, troubleshooting software, and training staff on new tools.' },
]

export default function Catalog() {
  const [open, setOpen] = useState(false)
  return (
    <section id="catalog" style={{ background: 'var(--bg2)' }}>
      <div className="inner">
        <div
          style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', cursor: 'pointer' }}
          onClick={() => setOpen(o => !o)}
        >
          <div>
            <span className="slabel">What We Offer</span>
            <h2 className="stitle">Our <em>Service Catalog</em></h2>
          </div>
          <button
            style={{ flexShrink: 0, marginTop: '0.5rem', background: 'none', border: '1px solid var(--border)', borderRadius: '6px', padding: '4px 14px', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--muted)' }}
            onClick={e => { e.stopPropagation(); setOpen(o => !o) }}
          >
            {open ? '▲ Collapse' : '▼ Expand'}
          </button>
        </div>
        {open && (
          <>
            <p className="ssub">The tech services our student teams can deliver — at no cost to your nonprofit.</p>
            <div style={{ marginTop: '2.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
              {offerings.map(o => (
                <div key={o.title} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: '16px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ fontSize: '2rem' }}>{o.icon}</div>
                  <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.1rem', fontWeight: 700, lineHeight: 1.3 }}>{o.title}</h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--muted)', lineHeight: 1.6 }}>{o.desc}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  )
}

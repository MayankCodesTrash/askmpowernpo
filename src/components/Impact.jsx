import { useState } from 'react'

export default function Impact() {
  const [open, setOpen] = useState(false)
  return (
    <section id="impact">
      <div className="inner">
        <div
          style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', cursor: 'pointer' }}
          onClick={() => setOpen(o => !o)}
        >
          <div>
            <span className="slabel">What We Build</span>
            <h2 className="stitle">Practical IT solutions<br />for <em>real needs</em></h2>
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
            <p className="ssub">MpowerNPO focuses on high-impact IT improvements — not experimental tech for its own sake.</p>
            <div className="igrid">
              <div className="icard">
                <div className="iico">🙋</div>
                <div>
                  <h3>Volunteer Registration Automation</h3>
                  <p>Replacing manual sign-up sheets with digital workflows can save nonprofit staff <strong>16+ hours per week</strong> — time better spent directly on their mission.</p>
                </div>
              </div>
              <div className="icard">
                <div className="iico">📋</div>
                <div>
                  <h3>Digitizing Intake Workflows</h3>
                  <p>Paper-based intake systems slow service delivery and create compliance risk. We build accessible digital intake tools tailored to each nonprofit's unique IT needs.</p>
                </div>
              </div>
              <div className="icard">
                <div className="iico">🗂️</div>
                <div>
                  <h3>Data Organization for Reporting</h3>
                  <p><strong>42% of nonprofits</strong> cite lack of adequate data systems as a top challenge. We organize existing data so it's grant-ready, board-ready, and impact-measurable.</p>
                </div>
              </div>
              <div className="icard">
                <div className="iico">📈</div>
                <div>
                  <h3>Service Tracking Dashboards</h3>
                  <p>Digitally mature nonprofits are <strong>4× more likely to meet their mission goals.</strong> Our dashboards give staff a live view of programs — no technical expertise needed.</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  )
}

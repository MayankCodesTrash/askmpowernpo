import { useState } from 'react'

const steps = [
  { num: '01', icon: '📥', title: 'Nonprofit Submits a Request', desc: 'A nonprofit identifies a specific IT or process pain point and submits a request for review. Concrete problems only — no vague asks.' },
  { num: '02', icon: '🤖', title: 'AI Guides Requirements Clarification', desc: 'Our AI assistant works through the IT need with the nonprofit to generate a clear, structured requirements document.' },
  { num: '03', icon: '✅', title: 'Scope Reviewed & Approved', desc: 'Before any code is written, a mentor reviews and approves the project scope to ensure feasibility and safety.' },
  { num: '04', icon: '👥', title: 'Youth Team Assigned', desc: 'A trained student team is matched to the request based on skills, availability, and project complexity.' },
  { num: '05', icon: '🧭', title: 'Mentor-Overseen Execution', desc: 'An experienced mentor oversees every stage of development, ensuring ethical standards and quality delivery.' },
  { num: '06', icon: '📊', title: 'Delivery & Documented Impact', desc: 'The solution is implemented and measurable outcomes are documented — so every project shows its real community value.' },
]

export default function HowItWorks() {
  const [open, setOpen] = useState(false)
  return (
    <section id="how">
      <div className="inner">
        <div
          style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', cursor: 'pointer' }}
          onClick={() => setOpen(o => !o)}
        >
          <div>
            <span className="slabel">Process</span>
            <h2 className="stitle">How <em>MpowerNPO</em><br />gets things done</h2>
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
            <p className="ssub">A structured, six-step model that turns real nonprofit IT needs into working solutions — responsibly and measurably.</p>
            <div className="steps">
              {steps.map(s => (
                <div className="scard" key={s.num}>
                  <span className="snum">{s.num}</span>
                  <div className="sicon">{s.icon}</div>
                  <h3>{s.title}</h3>
                  <p>{s.desc}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  )
}

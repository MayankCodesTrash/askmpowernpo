const stats = [
  { num: '32,836', title: 'Nonprofits in Iowa', desc: 'Iowa is home to over 32,000 registered nonprofits — including 18,671 charitable 501(c)(3)s — employing nearly 239,000 people statewide.' },
  { num: '42%', title: 'List Digital Transformation as a Top Priority', desc: '42% of nonprofit leaders cite digital transformation as a top-3 goal — but lack the technical support to act on it. (BDO Nonprofit Survey)' },
  { num: '16 hrs', title: 'Lost to Manual Admin Work Per Week', desc: 'Nonprofit staff lose an average of 16 hours every week to manual administrative tasks — the equivalent of two full workdays that could serve the community.' },
  { num: '4×', title: 'Mission Success for Tech-Enabled Orgs', desc: 'Salesforce research shows nonprofits that are "digitally mature" are four times more likely to meet their mission goals than those using manual systems.' },
  { num: '59%', title: 'Ready to Invest — But Need Guidance', desc: "59% of nonprofits are prepared to increase technology spending — but without structured support, most don't know where to start. That's where MpowerNPO steps in." },
]

export default function IowaStats() {
  return (
    <section id="iowa">
      <div className="inner">
        <span className="slabel">Why It Matters — Iowa</span>
        <h2 className="stitle">The IT gap is <em>right here</em><br />in Iowa</h2>
        <p className="ssub">Iowa has one of the strongest nonprofit ecosystems in the Midwest — but most organizations still struggle with outdated IT and manual processes.</p>
        <div className="iowa-grid">
          {stats.map(s => (
            <div className="iowa-card" key={s.num}>
              <div className="iowa-num">{s.num}</div>
              <div className="iowa-ttl">{s.title}</div>
              <p className="iowa-desc">{s.desc}</p>
            </div>
          ))}
        </div>
        <div className="iowa-box">
          <span>💡</span>
          <div><strong>The opportunity is clear.</strong> Iowa has thousands of nonprofits doing critical work — and an entire generation of students with coding skills who've never applied them to a real community IT need. MpowerNPO bridges that gap, one request at a time.</div>
        </div>
      </div>
    </section>
  )
}

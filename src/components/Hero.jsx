const heroStats = [
  { num: '32,836', label: 'Nonprofits in Iowa' },
  { num: '42%', label: 'Cite digital transformation as a top priority' },
  { num: '16 hrs', label: 'Lost to manual admin work per week' },
  { num: '4×', label: 'More likely to meet mission goals with tech' },
]

export default function Hero() {
  return (
    <section id="hero">
      <div className="orb orb1" />
      <div className="orb orb2" />
      <div className="hero-inner">
        <div className="hero-content">
          <div className="hero-text">
            <div className="pill">Youth-Led · AI-Assisted · Community-Driven</div>
            <h1>We <em>empower</em><br />nonprofits through<br />student-built tech.</h1>
            <p className="hero-sub">
              MpowerNPO connects local nonprofits facing IT and process needs with trained student
              developers — guided by AI-assisted planning and experienced mentors.
            </p>
            <div className="actions">
              <a href="#how" className="btn">See How It Works</a>
              <a href="#contact" className="btn-out">Submit a Request →</a>
            </div>
          </div>
          <div className="hero-statpanel">
            {heroStats.map(s => (
              <div className="hero-statcard" key={s.num}>
                <div className="hero-statnum">{s.num}</div>
                <div className="hero-statlbl">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="hero-stats">
          <div className="hstat"><div className="hnum">6</div><div className="hlbl">Step Process</div></div>
          <div className="hstat"><div className="hnum">100%</div><div className="hlbl">Mentor Reviewed</div></div>
          <div className="hstat"><div className="hnum">0$</div><div className="hlbl">Cost to Nonprofits</div></div>
        </div>
      </div>
    </section>
  )
}

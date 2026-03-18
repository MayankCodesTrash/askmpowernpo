export default function Hero() {
  return (
    <section id="hero">
      <div className="orb orb1" />
      <div className="orb orb2" />
      <div className="hero-inner">
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
        <div className="hero-stats">
          <div className="hstat"><div className="hnum">6</div><div className="hlbl">Step Process</div></div>
          <div className="hstat"><div className="hnum">32K+</div><div className="hlbl">Iowa Nonprofits</div></div>
          <div className="hstat"><div className="hnum">100%</div><div className="hlbl">Mentor Reviewed</div></div>
        </div>
      </div>
    </section>
  )
}

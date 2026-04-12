import SubmitPanel from './SubmitPanel'

export default function Hero() {
  return (
    <section id="hero">
      <div className="orb orb1" />
      <div className="orb orb2" />
      <div className="hero-layout">
        <div className="hero-inner">
          <div className="pill">Youth-Led · AI-Assisted · Community-Driven</div>
          <h1>We <em>empower</em><br />nonprofits through<br />student-built tech.</h1>
          <p className="hero-sub">
            MpowerNPO connects local nonprofits facing IT and process needs with trained student
            developers — guided by AI-assisted planning and experienced mentors.
          </p>
          <div className="hero-stats">
            <div className="hstat"><div className="hnum">6</div><div className="hlbl">Step Process</div></div>
            <div className="hstat"><div className="hnum">32K+</div><div className="hlbl">Iowa Nonprofits</div></div>
            <div className="hstat"><div className="hnum">100%</div><div className="hlbl">Mentor Reviewed</div></div>
          </div>
        </div>
        <div className="hero-form-col">
          <SubmitPanel />
        </div>
      </div>
    </section>
  )
}

import { useRef, useState } from 'react'

export default function Founder() {
  const [photo, setPhoto] = useState('/founder.png')
  const fileRef = useRef()

  const handleClick = () => fileRef.current?.click()
  const handleFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setPhoto(ev.target.result)
    reader.readAsDataURL(file)
  }

  return (
    <section id="founder">
      <div className="inner">
        <span className="slabel">Meet the Founder</span>
        <div className="finner">
          <div className="favatar" onClick={handleClick} title="Click to upload photo">
            <div className="favatar-bg" />
            {photo
              ? <img src={photo} alt="Mayank Bhatt" />
              : <span className="favatar-letter">M</span>
            }
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
          </div>
          <div>
            <div className="fname">Mayank Bhatt</div>
            <div className="ftitle">Founder &amp; Youth Leader · MpowerNPO · Johnston Middle School, 9th Grade</div>
            <p className="fbio">
              I started MpowerNPO after noticing something obvious: students learn to code in classrooms,
              and nonprofits struggle with IT problems year after year — but the two groups never interact.
              MpowerNPO connects them. Every project we take on is real, mentored, and measured. Because
              technology education should be applied, responsible, and impactful — not just theoretical.
            </p>
            <div className="chips">
              <span className="chip">AI &amp; Technology</span>
              <span className="chip">Community Impact</span>
              <span className="chip">Youth Leadership</span>
              <span className="chip">Civic Responsibility</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

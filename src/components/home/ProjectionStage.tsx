export default function ProjectionStage({ signupEndpoint }: { signupEndpoint: string }) {
  return (
    <section id="board" aria-label="About Creative Coding NYC">
      <div className="board">
        <div className="col col-a">
          <figure className="blk shot" id="shot" aria-label="Photos from Creative Coding NYC meetups">
            <img alt="" id="shotA" /><img alt="" id="shotB" />
            <div className="shot-info about-panel" id="shotInfo" aria-hidden="true" contentEditable suppressContentEditableWarning role="textbox" aria-multiline="true" spellCheck>
              <p>Creative Coding NYC is a weekly community meetup for anyone interested in bringing their creative ideas to life using code. Everyone is welcome! People from all backgrounds come to our meetups, from non-technical artists to veteran programmers. Our top priority at CCNYC is to foster an inclusive, welcoming environment where members can support and learn from one another.</p>
              <p className="about-gatherings-title">Our gatherings are a space to:</p>
              <ul><li>Work on individual projects or collaborate with others</li><li>Get creative or technical feedback</li><li>Have discussions on creative coding</li><li>Share resources, other artists&apos; work, ideas, etc.</li><li>Learn independently or with others</li><li>Build relationships with others in the creative coding community :)</li></ul>
            </div>
            <div className="shot-info agenda-panel" id="shotAgenda" aria-hidden="true">
              <p className="shot-info-title">Tuesday meeting agenda · 6–8 PM</p>
              <div className="agenda-mini"><div><time>6:00–7:20</time><p><strong>Chill, code, collaborate</strong></p></div><div><time>7:20–7:30</time><p><strong>Announcements</strong></p></div><div><time>7:30–8:00</time><p><strong>Demos</strong></p></div></div>
              <div className="agenda-signup-qr"><span>Scan to sign up for demos</span><img src="https://quickchart.io/qr?text=https%3A%2F%2Fccnyc.space%2Fmeeting-agenda&size=220&margin=2&dark=ffffff&light=00000000" width="140" height="140" alt="QR code for demo signup" /></div>
            </div>
            <div className="shot-info signup-panel" id="shotSignup" aria-hidden="true" data-signup-endpoint={signupEndpoint}>
              <div className="signup-projector-head"><div><p className="shot-info-title">Demo signup</p><p className="signup-projector-status" id="projectorSignupStatus">Loading lineup…</p></div></div>
              <ol className="projector-lineup" id="projectorLineup" aria-label="Demo signup lineup" />
            </div>
          </figure>
        </div>
        <div className="blk b-pier"><canvas id="pier" aria-label="Sketch of Pier 57 on the Hudson River" /><p className="pier-cap">Pier 57 · Hudson River Park</p><p className="pier-at">40.743° N · 74.010° W · 25 11th Ave</p></div>
      </div>
    </section>
  );
}

import HomeEffects from "@/components/home/HomeEffects";
import HomeNav from "@/components/home/HomeNav";
import ProjectionStage from "@/components/home/ProjectionStage";
import "./home.css";

const signupEndpoint = process.env.NEXT_PUBLIC_PRESENTATION_SIGNUP_URL
  ?? "https://script.google.com/macros/s/AKfycbzzj0lhnnpv0vyrOF6PscXtb7srX7MsGRbccV-nn2YsFcp3LmHoXWRrh9XcZECMYdx9/exec";

export default function HomePage() {
  return (
    <main className="home-page">
      <ProjectionStage signupEndpoint={signupEndpoint} />
      <HomeNav />
      <p className="hint" id="hint" aria-hidden="true" hidden />
      <canvas id="beam" aria-hidden="true" />
      <button className="pier-pin" id="pierPin" type="button" aria-label="Pier 57 meetup location"><span className="pier-tip">We meet at Pier 57 unless otherwise posted.</span></button>
      <p className="sub" id="sub">creative coding nyc</p>
      <HomeEffects />
    </main>
  );
}

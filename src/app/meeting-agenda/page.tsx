import DemoSignup from "@/components/signup/DemoSignup";
import "./meeting-agenda.css";

const endpoint = process.env.NEXT_PUBLIC_PRESENTATION_SIGNUP_URL
  ?? "https://script.google.com/macros/s/AKfycbzzj0lhnnpv0vyrOF6PscXtb7srX7MsGRbccV-nn2YsFcp3LmHoXWRrh9XcZECMYdx9/exec";

export default function MeetingAgendaPage() {
  return <DemoSignup endpoint={endpoint} />;
}

import PosterMaker from "@/components/poster/PosterMaker";
import { getNextPosterEvent } from "@/lib/sheets";
import "./poster-maker.css";

export default async function PosterMakerPage() {
  const event = await getNextPosterEvent();
  const dateLabel = event.date.toLocaleDateString("en-US", { timeZone: "UTC", weekday: "long", month: "long", day: "numeric" });
  return <PosterMaker dateLabel={dateLabel} location={event.location} />;
}

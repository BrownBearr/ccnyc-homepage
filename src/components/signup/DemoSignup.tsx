"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

type Presenter = { name: string; instagram?: string };
type SignupResponse = { ok: boolean; error?: string; meetingDate?: string; date?: string; presenters?: Presenter[]; names?: string[] };

const CAPACITY = 10;

function newYorkParts() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
  }).formatToParts(new Date());
  const value = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find(part => part.type === type)?.value);
  return { year: value("year"), month: value("month"), day: value("day"), hour: value("hour"), minute: value("minute"), second: value("second") };
}

function meetingTuesday() {
  const { year, month, day } = newYorkParts();
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() - (date.getUTCDay() - 2 + 7) % 7);
  return date.toISOString().slice(0, 10);
}

function isTuesday() {
  const { year, month, day } = newYorkParts();
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay() === 2;
}

function presentersFrom(data: SignupResponse): Presenter[] {
  if (Array.isArray(data.presenters)) return data.presenters;
  return Array.isArray(data.names) ? data.names.map(name => ({ name })) : [];
}

export default function DemoSignup({ endpoint }: { endpoint: string }) {
  const [presenters, setPresenters] = useState<Presenter[]>([]);
  const [status, setStatus] = useState("Loading demo signups…");
  const [error, setError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressStatus, setProgressStatus] = useState("Meetup starts at 6 PM");
  const meetingDate = useMemo(meetingTuesday, []);
  const signupOpen = isTuesday();
  const full = presenters.length >= CAPACITY;

  const readableDate = useMemo(() => new Date(`${meetingDate}T12:00:00`).toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric",
  }), [meetingDate]);

  const updateProgress = useCallback(() => {
    const now = newYorkParts();
    const localDate = `${now.year}-${String(now.month).padStart(2, "0")}-${String(now.day).padStart(2, "0")}`;
    const minutes = now.hour * 60 + now.minute + now.second / 60;
    const value = localDate === meetingDate ? Math.max(0, Math.min(100, ((minutes - 18 * 60) / 90) * 100)) : localDate > meetingDate ? 100 : 0;
    setProgress(value);
    setProgressStatus(value <= 0 ? "Meetup starts at 6 PM" : value >= 100 ? "Demos have started" : `Meetup in progress · ${Math.round(value)}%`);
  }, [meetingDate]);

  useEffect(() => {
    updateProgress();
    const timer = window.setInterval(updateProgress, 15_000);
    return () => window.clearInterval(timer);
  }, [updateProgress]);

  useEffect(() => {
    const load = async () => {
      try {
        const query = new URLSearchParams({ action: "list", date: meetingDate, t: String(Date.now()) });
        const response = await fetch(`${endpoint}?${query}`);
        const data: SignupResponse = await response.json();
        if (!response.ok || !data.ok) throw new Error(data.error || "Could not load signups");
        setPresenters((data.meetingDate || data.date) === meetingDate ? presentersFrom(data).slice(0, CAPACITY) : []);
        setStatus(signupOpen ? "Enter the meetup password to claim a spot." : "Demo signup opens Tuesday.");
      } catch (reason) {
        console.error(reason);
        setError(true);
        setStatus("Couldn’t load today’s signups. Please try again.");
      }
    };
    void load();
  }, [endpoint, meetingDate, signupOpen]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!signupOpen) { setError(true); setStatus("Demo signup is only available on Tuesdays."); return; }
    const form = event.currentTarget;
    const data = new FormData(form);
    const name = String(data.get("name") || "").trim();
    const instagram = String(data.get("instagram") || "").trim().replace(/^@/, "");
    const password = String(data.get("password") || "");
    if (!name || !password) return;
    setSubmitting(true); setError(false); setStatus("Saving your spot…");
    try {
      const body = new URLSearchParams({ action: "signup", name, instagram, password });
      const response = await fetch(endpoint, { method: "POST", body });
      const result: SignupResponse = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error || "Could not save signup");
      setPresenters(presentersFrom(result).slice(0, CAPACITY));
      form.reset();
      setStatus(`You’re signed up, ${name}!`);
    } catch (reason) {
      setError(true);
      setStatus(reason instanceof Error ? reason.message : "Couldn’t save your spot. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="signupPage">
      <div className="siteIntro"><a className="brandLink" href="/">CCNYC</a><p>Welcome to Creative Coding NYC</p></div>
      <p className="meetingDate">Every Tuesday</p>
      <div className="contentGrid">
        <section className="agendaSection" aria-labelledby="agenda-heading">
          <header><p className="eyebrow">{readableDate} · 6–8 PM</p><h1 id="agenda-heading">Meeting agenda</h1><p className="progressStatus">{progressStatus}</p></header>
          <div className="agendaBody">
            <div className="meetingProgress"><div className="progressTrack" role="progressbar" aria-label="Tuesday agenda progress until demos" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)}><span style={{ height: `${progress}%` }} /></div></div>
            <ol className="agenda"><li><time>6:00–7:20</time><div><strong>Chill, code, collaborate</strong><span>Settle in, make something, and meet people.</span></div></li><li><time>7:20–7:30</time><div><strong>Announcements</strong><span>Community news, events, and opportunities.</span></div></li><li><time>7:30–8:00</time><div><strong>Demos</strong><span>Members share what they’ve been working on.</span></div></li></ol>
          </div>
          <a className="qrPrompt" href="#demo-signup"><span className="qrCopy"><strong>Sign up for demos</strong><small>Scan the QR code</small></span><img src="https://quickchart.io/qr?text=https%3A%2F%2Fccnyc.space%2Fmeeting-agenda%23demo-signup&size=220&margin=2&dark=ffffff&light=00000000" width="150" height="150" alt="QR code for the CCNYC demo signup form" /></a>
        </section>
        <section className="demoSection" id="demo-signup" aria-labelledby="demo-heading">
          <h2 className="demoHeading" id="demo-heading">Demo signup</h2>
          <p className="intro">Each demo is approximately 3 minutes and will be filmed unless you ask not to be recorded.</p>
          <p className="resetNote">Ten spots are available. The list resets each Tuesday.</p>
          <form className="signupForm" onSubmit={submit}>
            <div className="fields">
              <label><span>Your name</span><input name="name" maxLength={60} autoComplete="name" placeholder="Enter your name" required disabled={full || !signupOpen || submitting} /></label>
              <label><span>Instagram handle <small>optional</small></span><input name="instagram" maxLength={30} autoComplete="off" placeholder="@yourhandle" disabled={full || !signupOpen || submitting} /></label>
              <label><span>Demo password</span><input name="password" type="password" autoComplete="off" placeholder="Enter the meetup password" required disabled={full || !signupOpen || submitting} /></label>
            </div>
            <button type="submit" disabled={full || !signupOpen || submitting}>{submitting ? "Saving…" : "Claim a spot"}</button>
          </form>
          <p className={`status${error ? " error" : ""}`} role="status" aria-live="polite">{full ? "This meeting’s demo list is full." : status}</p>
          <div className="listHeading"><div className="lineupTitle"><h3>Demo lineup</h3><span id="spot-count">{presenters.length} / {CAPACITY}</span></div><h3>Instagram</h3></div>
          <ol className="signupList">{Array.from({ length: CAPACITY }, (_, index) => { const presenter = presenters[index]; return <li className={presenter ? undefined : "available"} key={index}><span className="position">{index + 1}.</span>{presenter ? <><span>{presenter.name}</span>{presenter.instagram && <a className="instagram" href={`https://www.instagram.com/${presenter.instagram.replace(/^@/, "")}/`} target="_blank" rel="noreferrer">@{presenter.instagram.replace(/^@/, "")}</a>}</> : <span>Available</span>}</li>; })}</ol>
        </section>
      </div>
    </main>
  );
}

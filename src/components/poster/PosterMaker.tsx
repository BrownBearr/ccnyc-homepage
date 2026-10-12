"use client";

import { useEffect } from "react";
import HomeNav from "@/components/HomeNav";
import { initializePosterMaker } from "@/lib/poster-maker-engine";

type Props = { dateLabel: string; location: string; homeSkin?: boolean };

export default function PosterMaker({ dateLabel, location, homeSkin = false }: Props) {
  useEffect(initializePosterMaker, []);
  return (
    <main className={`maker${homeSkin ? " homeSkin" : ""}`} data-date={dateLabel} data-location={location} data-time="6–8 PM">
      {homeSkin && <HomeNav />}
      <header className="makerHeader"><div><a href="/" className="brand">CCNYC</a><p>{homeSkin ? "creative coding nyc" : "Build a poster"}</p></div>{!homeSkin && <a href="/meeting-agenda">Meeting agenda →</a>}</header>
      <div className="workspace">
        <section className="posterWrap" aria-label="Poster preview">
          <div className="poster" id="poster"><canvas id="shader-canvas" width="1080" height="1350"/><canvas id="ascii-canvas" width="1080" height="1350" aria-hidden="true"/><div className="posterCopy"><h1>CCNYC</h1><div className="eventCopy"><p>{dateLabel}</p><p>{location}</p><p className="posterTime">6–8 PM</p></div></div></div>
        </section>
        <aside className="controls" aria-label="Poster controls">
          <div className="controlHeading"><div><p className="eyebrow">Live visual studio</p><h2>Shape the background</h2></div><button className="iconButton" id="randomize" type="button">Randomize</button></div>
          <label><span>Shader</span><select id="shader-mode" defaultValue="0"><option value="0">Liquid field</option><option value="3">Warp grid</option><option value="4">ASCII flow</option></select></label>
          <div className="colorGrid"><label><span>Color 1</span><input id="color-a" type="color" defaultValue="#ff3b30"/></label><label><span>Color 2</span><input id="color-b" type="color" defaultValue="#6b4eff"/></label><label><span>Color 3</span><input id="color-c" type="color" defaultValue="#00e5a8"/></label></div>
          <Range id="scale" label="Scale" min="1" max="9" step="0.1" value="3.2" />
          <Range id="warp" label="Warp" min="0" max="1.5" step="0.01" value="0.55" />
          <Range id="speed" label="Motion" min="0" max="1.5" step="0.01" value="0.35" />
          <Range id="grain" label="Grain" min="0" max="0.3" step="0.01" value="0.08" />
          <div id="ascii-controls" hidden><Range id="ascii-density" label="ASCII density" min="20" max="72" step="1" value="42" /><Range id="ascii-opacity" label="ASCII intensity" min="0" max="0.9" step="0.01" value="0.48" /></div>
          <div className="actions"><button id="pause" type="button">Pause motion</button><button id="download" className="primary" type="button">Download poster</button></div>
          <p className="note">Exports as a 1080 × 1350 PNG, ready for Instagram.</p>
        </aside>
      </div>
    </main>
  );
}

function Range({ id, label, min, max, step, value }: { id: string; label: string; min: string; max: string; step: string; value: string }) {
  return <label><span>{label} <output id={`${id}-output`}>{value}</output></span><input id={id} type="range" min={min} max={max} step={step} defaultValue={value}/></label>;
}

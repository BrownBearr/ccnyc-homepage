"use client";

import { useState } from "react";
import Script from "next/script";

export default function HomeEffects() {
  const [effectsReady, setEffectsReady] = useState(false);

  return <>
    <Script src="/scripts/home-effects.js" strategy="afterInteractive" onReady={() => setEffectsReady(true)} />
    {effectsReady && <Script src="/vendor/p5.min.js" strategy="afterInteractive" />}
  </>;
}

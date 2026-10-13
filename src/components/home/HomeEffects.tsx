"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { supportsWebGL } from "@/lib/webgl-support";

export default function HomeEffects() {
  const [effectsState, setEffectsState] = useState<"loading" | "ready" | "failed">("loading");
  const [webGLSupported, setWebGLSupported] = useState(false);

  useEffect(() => {
    let disposed = false;
    void import("@/lib/home-effects")
      .then(({ initializeHomeEffects }) => {
        if (disposed) return;
        const supported = supportsWebGL();
        initializeHomeEffects({ webGLSupported: supported });
        setWebGLSupported(supported);
        setEffectsState("ready");
      })
      .catch((error: unknown) => {
        if (disposed) return;
        console.error("Could not initialize the homepage effects.", error);
        setEffectsState("failed");
      });

    return () => { disposed = true; };
  }, []);

  if (effectsState !== "ready" || !webGLSupported) return null;

  return (
    <Script
      src="/vendor/p5.min.js"
      strategy="afterInteractive"
      onError={(event) => {
        console.error("Could not load p5; using the static homepage.", event);
        window.dispatchEvent(new Event("home-effects-fallback"));
      }}
    />
  );
}

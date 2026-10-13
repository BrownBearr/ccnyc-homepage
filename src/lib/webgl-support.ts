export function supportsWebGL(): boolean {
  if (typeof window === "undefined") return false;

  try {
    const canvas = document.createElement("canvas");
    const attributes: WebGLContextAttributes = {
      failIfMajorPerformanceCaveat: true,
      powerPreference: "low-power",
    };

    return Boolean(
      window.WebGLRenderingContext &&
      (canvas.getContext("webgl2", attributes) ||
        canvas.getContext("webgl", attributes) ||
        canvas.getContext("experimental-webgl", attributes))
    );
  } catch {
    return false;
  }
}

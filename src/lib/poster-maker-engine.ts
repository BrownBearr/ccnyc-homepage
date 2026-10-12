export function initializePosterMaker() {
    const appWindow = window as Window & { __ccnycPosterMaker?: boolean };
    if (appWindow.__ccnycPosterMaker) return;
    appWindow.__ccnycPosterMaker = true;

    const canvas = document.querySelector<HTMLCanvasElement>("#shader-canvas");
    const asciiCanvas = document.querySelector<HTMLCanvasElement>("#ascii-canvas");
    const asciiContext = asciiCanvas?.getContext("2d");
    const maker = document.querySelector<HTMLElement>(".maker");
    const gl = canvas?.getContext("webgl", { preserveDrawingBuffer: true });

    const vertexSource = `
      attribute vec2 a_position;
      void main() { gl_Position = vec4(a_position, 0.0, 1.0); }
    `;
    const fragmentSource = `
      precision highp float;
      uniform vec2 u_resolution;
      uniform float u_time;
      uniform float u_scale;
      uniform float u_warp;
      uniform float u_grain;
      uniform int u_mode;
      uniform vec3 u_colorA;
      uniform vec3 u_colorB;
      uniform vec3 u_colorC;

      float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float noise(vec2 p) {
        vec2 i = floor(p), f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i), hash(i + vec2(1., 0.)), f.x),
                   mix(hash(i + vec2(0., 1.)), hash(i + vec2(1.)), f.x), f.y);
      }
      float fbm(vec2 p) {
        float v = 0.0, a = 0.5;
        for (int i = 0; i < 5; i++) { v += a * noise(p); p = p * 2.03 + 9.7; a *= 0.5; }
        return v;
      }
      void main() {
        vec2 uv = gl_FragCoord.xy / u_resolution.xy;
        vec2 p = (uv - 0.5) * vec2(u_resolution.x / u_resolution.y, 1.0) * u_scale;
        float t = u_time;
        float v;
        if (u_mode == 0) {
          vec2 q = vec2(fbm(p + t * 0.18), fbm(p + vec2(4.2, 1.7) - t * 0.13));
          v = fbm(p + u_warp * 3.0 * q);
        } else if (u_mode == 1) {
          v = 0.5 + 0.5 * sin((p.x + sin(p.y * 1.7 + t) * u_warp) * 5.0 + t * 2.0);
          v = mix(v, fbm(p * 1.5 + t * .15), .3);
        } else if (u_mode == 2) {
          float r = length(p + vec2(sin(t) * .2, cos(t * .7) * .2));
          v = 0.5 + 0.5 * sin(r * (10.0 + u_warp * 8.0) - t * 4.0 + fbm(p) * 4.0);
        } else if (u_mode == 3) {
          p += vec2(sin(p.y * 2.0 + t), cos(p.x * 2.0 - t)) * u_warp;
          v = smoothstep(.15, .85, sin(p.x * 4.0) * sin(p.y * 4.0) * .5 + .5);
        } else {
          v = fbm(p * .8 + vec2(t * .12, -t * .08));
        }
        vec3 color = mix(u_colorA, u_colorB, smoothstep(.05, .65, v));
        color = mix(color, u_colorC, smoothstep(.62, 1.0, v));
        color += (hash(gl_FragCoord.xy + t) - .5) * u_grain;
        gl_FragColor = vec4(color, 1.0);
      }
    `;

    function compile(type: number, source: string) {
      if (!gl) return null;
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      return shader;
    }

    const program = gl?.createProgram();
    const vertex = gl && compile(gl.VERTEX_SHADER, vertexSource);
    const fragment = gl && compile(gl.FRAGMENT_SHADER, fragmentSource);
    if (gl && program && vertex && fragment) {
      gl.attachShader(program, vertex);
      gl.attachShader(program, fragment);
      gl.linkProgram(program);
      gl.useProgram(program);
      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]), gl.STATIC_DRAW);
      const position = gl.getAttribLocation(program, "a_position");
      gl.enableVertexAttribArray(position);
      gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    }

    const getInput = (id: string) => document.querySelector<HTMLInputElement>(`#${id}`)!;
    const mode = document.querySelector<HTMLSelectElement>("#shader-mode")!;
    const asciiControls = document.querySelector<HTMLElement>("#ascii-controls");
    const scale = getInput("scale");
    const warp = getInput("warp");
    const speed = getInput("speed");
    const grain = getInput("grain");
    const asciiDensity = getInput("ascii-density");
    const asciiOpacity = getInput("ascii-opacity");
    const colorA = getInput("color-a");
    const colorB = getInput("color-b");
    const colorC = getInput("color-c");
    let paused = false;
    let heldTime = 0;
    let lastNow = performance.now();
    let lastAsciiFrame = 0;

    const hex = (value: string) => [1, 3, 5].map((start) => parseInt(value.slice(start, start + 2), 16) / 255);
    const uniform = (name: string) => gl && program ? gl.getUniformLocation(program, name) : null;
    const uniforms = {
      resolution: uniform("u_resolution"), time: uniform("u_time"), scale: uniform("u_scale"),
      warp: uniform("u_warp"), grain: uniform("u_grain"), mode: uniform("u_mode"),
      colorA: uniform("u_colorA"), colorB: uniform("u_colorB"), colorC: uniform("u_colorC"),
    };

    function drawAsciiFlow(time: number) {
      if (!asciiCanvas || !asciiContext) return;
      const columns = Number(asciiDensity.value);
      const cell = asciiCanvas.width / columns;
      const rows = Math.ceil(asciiCanvas.height / cell);
      const characters = " .·:;+*#%@";
      const opacity = Number(asciiOpacity.value);
      asciiContext.clearRect(0, 0, asciiCanvas.width, asciiCanvas.height);
      asciiContext.font = `700 ${cell * .78}px monospace`;
      asciiContext.textAlign = "center";
      asciiContext.textBaseline = "middle";
      for (let row = 0; row < rows; row += 1) {
        for (let column = 0; column < columns; column += 1) {
          const wave = Math.sin(column * .27 + time * 1.7 + Math.sin(row * .16 - time))
            + Math.cos(row * .22 - time * 1.15 + Math.sin(column * .11));
          const normalized = (wave + 2) / 4;
          const index = Math.min(characters.length - 1, Math.floor(normalized * characters.length));
          const character = characters[index];
          if (character === " ") continue;
          const alpha = opacity * (.28 + normalized * .72);
          asciiContext.fillStyle = `rgba(255,255,255,${alpha})`;
          asciiContext.fillText(character, (column + .5) * cell, (row + .5) * cell);
        }
      }
    }

    function render(now: number) {
      if (!gl || !program || !canvas) return;
      if (!paused) heldTime += (now - lastNow) / 1000 * Number(speed.value);
      lastNow = now;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uniforms.resolution, canvas.width, canvas.height);
      gl.uniform1f(uniforms.time, heldTime);
      gl.uniform1f(uniforms.scale, Number(scale.value));
      gl.uniform1f(uniforms.warp, Number(warp.value));
      gl.uniform1f(uniforms.grain, Number(grain.value));
      gl.uniform1i(uniforms.mode, Number(mode.value));
      gl.uniform3fv(uniforms.colorA, hex(colorA.value));
      gl.uniform3fv(uniforms.colorB, hex(colorB.value));
      gl.uniform3fv(uniforms.colorC, hex(colorC.value));
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      if (Number(mode.value) === 4 && now - lastAsciiFrame > 70) {
        drawAsciiFlow(heldTime);
        lastAsciiFrame = now;
      }
      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

    function updateModeControls() {
      const isAscii = Number(mode.value) === 4;
      if (asciiControls) asciiControls.hidden = !isAscii;
      if (!isAscii && asciiCanvas && asciiContext) {
        asciiContext.clearRect(0, 0, asciiCanvas.width, asciiCanvas.height);
      }
    }
    mode.addEventListener("change", updateModeControls);
    updateModeControls();

    for (const input of [scale, warp, speed, grain, asciiDensity, asciiOpacity]) {
      const output = document.querySelector<HTMLOutputElement>(`#${input.id}-output`);
      input.addEventListener("input", () => { if (output) output.value = input.value; });
    }

    const palettes = [
      ["#ff3b30", "#6b4eff", "#00e5a8"], ["#ff006e", "#ffbe0b", "#3a86ff"],
      ["#00f5d4", "#0057ff", "#9b5de5"], ["#ff4d00", "#101010", "#f5f5f5"],
    ];
    document.querySelector("#randomize")?.addEventListener("click", () => {
      const modes = [0, 3, 4];
      mode.value = String(modes[Math.floor(Math.random() * modes.length)]);
      mode.dispatchEvent(new Event("change"));
      const palette = palettes[Math.floor(Math.random() * palettes.length)];
      [colorA.value, colorB.value, colorC.value] = palette;
      scale.value = (1.5 + Math.random() * 6).toFixed(1);
      warp.value = (Math.random() * 1.4).toFixed(2);
      grain.value = (Math.random() * .18).toFixed(2);
      asciiDensity.value = String(28 + Math.floor(Math.random() * 35));
      asciiOpacity.value = (.28 + Math.random() * .45).toFixed(2);
      for (const input of [scale, warp, grain, asciiDensity, asciiOpacity]) input.dispatchEvent(new Event("input"));
    });

    const pauseButton = document.querySelector<HTMLButtonElement>("#pause");
    pauseButton?.addEventListener("click", () => {
      paused = !paused;
      pauseButton.textContent = paused ? "Resume motion" : "Pause motion";
    });

    function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
      const words = text.split(" ");
      let line = "";
      for (const word of words) {
        const test = `${line}${word} `;
        if (ctx.measureText(test).width > maxWidth && line) { ctx.fillText(line.trim(), x, y); line = `${word} `; y += lineHeight; }
        else line = test;
      }
      ctx.fillText(line.trim(), x, y);
    }

    document.querySelector("#download")?.addEventListener("click", async () => {
      if (!canvas || !maker) return;
      await document.fonts.load("220px Tanker");
      await document.fonts.load("700 54px Karla");
      const output = document.createElement("canvas");
      output.width = 1080; output.height = 1350;
      const ctx = output.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(canvas, 0, 0);
      if (asciiCanvas) ctx.drawImage(asciiCanvas, 0, 0);
      ctx.fillStyle = "white";
      ctx.font = "220px Tanker";
      ctx.fillText("CCNYC", 72, 235);
      ctx.font = "700 54px Karla";
      ctx.fillText(maker.dataset.date || "", 76, 1010);
      ctx.font = "700 46px Karla";
      wrapText(ctx, maker.dataset.location || "", 76, 1085, 780, 58);
      ctx.font = "96px Tanker";
      ctx.textAlign = "right";
      ctx.fillText(maker.dataset.time || "6–8 PM", 1004, 1260);
      const link = document.createElement("a");
      link.download = "ccnyc-poster.png";
      link.href = output.toDataURL("image/png");
      link.click();
    });
}

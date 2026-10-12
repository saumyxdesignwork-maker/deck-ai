'use client'

import { RefObject, useEffect, useRef } from 'react'
import type { BurnState, D4Theme } from '../motion/useThemeSwitch'
import { prefersReducedMotion } from '../motion/useReducedMotion'

/* The dissolve itself. The technique mirrors Shopify's Editions background:
   build a threshold field that sweeps across the screen, perturb it with
   animated noise so the front is ragged rather than a straight wipe, then
   blow out the colour sharply where |edge| ≈ 0 so a hot line travels along
   that front. Here the two sides are simply the outgoing and incoming
   chapter colours, and the hot line is the edition's ember.

   Derivatives (fwidth) are deliberately avoided so this runs on plain
   WebGL1 with no extensions — the burn front is meant to be soft anyway, so
   a fixed smoothstep width is indistinguishable and far more portable. */
const FRAG = `
precision mediump float;
varying vec2 vUv;
uniform vec3 uFrom;
uniform vec3 uTo;
uniform vec3 uEmber;
uniform float uProgress;
uniform float uTime;
uniform float uAspect;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    v += a * vnoise(p);
    p *= 2.02;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = vUv;
  vec2 auv = vec2(uv.x * uAspect, uv.y);

  float n = fbm(auv * 2.2 + vec2(0.0, uTime * 0.02));
  float n2 = fbm(auv * 6.0 - vec2(uTime * 0.05, 0.0));

  // Sweeps bottom-to-top (the direction new chapters arrive from), with the
  // front broken up by two octaves of noise at different scales. Amplitudes
  // are kept low deliberately: the wider the perturbation, the taller the
  // band of screen the front occupies, and this is meant to read as a line
  // travelling past rather than a glowing third of the page.
  float threshold = uv.y + (n - 0.5) * 0.26 + (n2 - 0.5) * 0.08;

  // Drive range is widened past [0,1] so the screen is fully cleared at both
  // ends — at progress 0 and 1 the front must sit entirely off-screen, glow
  // included, or a sliver of ember would be parked on the page.
  float edge = uProgress * 1.52 - 0.26 - threshold;

  float blend = smoothstep(-0.025, 0.025, edge);
  vec3 col = mix(uFrom, uTo, blend);

  // Scorch: a darker band just ahead of the front, where paper chars before
  // it catches.
  float scorch = (1.0 - smoothstep(0.0, 0.12, abs(edge))) * (1.0 - step(0.0, edge));
  col *= 1.0 - scorch * 0.22;

  // The ember line, flickering along its length.
  float flicker = 0.72 + 0.28 * sin(uTime * 5.0 + uv.x * 13.0 + n * 7.0);
  float heat = 1.0 - smoothstep(0.0, 0.045, abs(edge));
  col = mix(col, uEmber, clamp(heat * flicker, 0.0, 1.0) * 0.7);

  gl_FragColor = vec4(col, 1.0);
}
`

const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const sh = gl.createShader(type)
  if (!sh) return null
  gl.shaderSource(sh, src)
  gl.compileShader(sh)
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    gl.deleteShader(sh)
    return null
  }
  return sh
}

/** `#rrggbb` → linear-ish 0..1 triple for the shader. */
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.trim().replace('#', '')
  const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h
  const int = parseInt(full, 16)
  return [((int >> 16) & 255) / 255, ((int >> 8) & 255) / 255, (int & 255) / 255]
}

/**
 * Full-viewport burn dissolve played between chapter themes, scrubbed to
 * scroll by useThemeSwitch.
 *
 * Progressive enhancement throughout: if WebGL is unavailable, the context
 * is lost, or the visitor prefers reduced motion, this renders nothing and
 * never sets `data-burn`, so d4.css keeps the plain background cross-fade.
 * It also only paints while a transition is actually in flight — once
 * progress settles at 0 or 1 the canvas fades out and the render loop
 * parks, so an idle page costs nothing.
 */
export function D4Burn({
  burnRef,
  pageRef,
}: {
  burnRef: RefObject<BurnState>
  pageRef: RefObject<HTMLElement | null>
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const page = pageRef.current
    if (!canvas || !page || prefersReducedMotion()) return

    const gl = canvas.getContext('webgl', { alpha: false, antialias: false, depth: false })
    if (!gl) return

    const vs = compile(gl, gl.VERTEX_SHADER, VERT)
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG)
    if (!vs || !fs) return

    const prog = gl.createProgram()
    if (!prog) return
    gl.attachShader(prog, vs)
    gl.attachShader(prog, fs)
    gl.linkProgram(prog)
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return
    gl.useProgram(prog)

    // One fullscreen triangle — cheaper than a quad and avoids the seam.
    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    const aPos = gl.getAttribLocation(prog, 'aPos')
    gl.enableVertexAttribArray(aPos)
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)

    const uFrom = gl.getUniformLocation(prog, 'uFrom')
    const uTo = gl.getUniformLocation(prog, 'uTo')
    const uEmber = gl.getUniformLocation(prog, 'uEmber')
    const uProgress = gl.getUniformLocation(prog, 'uProgress')
    const uTime = gl.getUniformLocation(prog, 'uTime')
    const uAspect = gl.getUniformLocation(prog, 'uAspect')

    // Colours come off the element itself, so the shader can never drift
    // from the stylesheet's tokens.
    const styles = getComputedStyle(page)
    const colors: Record<D4Theme, [number, number, number]> = {
      dark: hexToRgb(styles.getPropertyValue('--d4-bg-dark') || '#141210'),
      light: hexToRgb(styles.getPropertyValue('--d4-bg-light') || '#e8e2d3'),
    }
    const ember = hexToRgb(styles.getPropertyValue('--d4-ember') || '#e0893c')
    gl.uniform3fv(uEmber, ember)

    page.dataset.burn = 'on'

    let w = 0
    let h = 0
    const resize = () => {
      // Half-resolution is plenty: the output is a soft gradient with no
      // fine detail, and it keeps the fill rate trivial on large displays.
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5) * 0.5
      const nw = Math.max(1, Math.round(window.innerWidth * dpr))
      const nh = Math.max(1, Math.round(window.innerHeight * dpr))
      if (nw === w && nh === h) return
      w = nw
      h = nh
      canvas.width = w
      canvas.height = h
      gl.viewport(0, 0, w, h)
      gl.uniform1f(uAspect, window.innerWidth / Math.max(1, window.innerHeight))
    }
    resize()
    window.addEventListener('resize', resize)

    let raf = 0
    let active = false
    const start = performance.now()

    const frame = () => {
      raf = requestAnimationFrame(frame)
      const burn = burnRef.current
      const live = burn.from !== burn.to && burn.progress > 0.001 && burn.progress < 0.999

      if (live !== active) {
        active = live
        canvas.dataset.active = String(live)
      }
      if (!live) return

      resize()
      gl.uniform3fv(uFrom, colors[burn.from])
      gl.uniform3fv(uTo, colors[burn.to])
      gl.uniform1f(uProgress, burn.progress)
      gl.uniform1f(uTime, (performance.now() - start) / 1000)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    }
    raf = requestAnimationFrame(frame)

    const onLost = (e: Event) => {
      e.preventDefault()
      cancelAnimationFrame(raf)
      canvas.dataset.active = 'false'
      delete page.dataset.burn
    }
    canvas.addEventListener('webglcontextlost', onLost)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      canvas.removeEventListener('webglcontextlost', onLost)
      delete page.dataset.burn
      gl.deleteBuffer(buf)
      gl.deleteProgram(prog)
      gl.deleteShader(vs)
      gl.deleteShader(fs)
    }
  }, [burnRef, pageRef])

  return <canvas ref={canvasRef} className="d4-burn" data-active="false" aria-hidden="true" />
}

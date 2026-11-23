import {
  compile,
  createQuad,
  effectivePointer,
  NOISE_GLSL,
  QUAD_VERT,
} from '@/scripts/webgl'

/**
 * Giant WebGL wordmark. The text is drawn into a 2D canvas (sharp alpha in R, wide blur in G)
 * and the shader melts it around the cursor like wet spray paint, with an RGB split,
 * horizontal glitch slices and a pixel-block intro.
 */

const FRAG = /* glsl */ `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;
uniform sampler2D uTex;
uniform vec2 uMouse;
uniform float uAspect;
uniform float uTime;
uniform float uIntro;
uniform float uGlitch;
uniform float uHover;
uniform float uRadius;
uniform vec3 uColor;
uniform vec3 uColorA;
uniform vec3 uColorB;
${NOISE_GLSL}

float shape(vec2 uv, float infl) {
  vec4 s = texture(uTex, uv);
  float n = noise(uv * vec2(uAspect, 1.0) * 26.0 + uTime * 0.6);
  float sprayed = smoothstep(0.32, 0.6, s.g + (n - 0.5) * 0.45);
  return mix(s.r, max(s.r * (1.0 - infl * 0.6), sprayed), clamp(infl * 1.4, 0.0, 1.0));
}

void main() {
  vec2 uv = vUv;
  // horizontal slices: used by the intro and by random glitch bursts
  float rows = 11.0;
  float row = floor(uv.y * rows);
  float tick = floor(uTime * 18.0);
  float rnd = hash(vec2(row, tick));
  float burst = step(rnd, uGlitch * 0.55) * (hash(vec2(tick, row * 1.7)) - 0.5) * 0.12 * uGlitch;
  float intro = (1.0 - uIntro);
  uv.x += burst + intro * intro * (hash(vec2(row, 3.0)) - 0.5) * 0.9;

  // cursor influence
  vec2 p = uv * vec2(uAspect, 1.0);
  vec2 m = uMouse * vec2(uAspect, 1.0);
  float d = length(p - m);
  float infl = exp(-d * d / (uRadius * uRadius)) * uHover;
  vec2 warp = (vec2(fbm(p * 3.0 + uTime * 0.4), fbm(p * 3.0 - uTime * 0.35 + 7.0)) - 0.5) * 0.06 * infl;
  warp.y -= infl * 0.025 * (0.5 + noise(vec2(p.x * 18.0, uTime * 0.5))); // drips down
  vec2 suv = uv + warp;

  float split = 0.004 + infl * 0.018 + abs(burst) * 0.4;
  float aC = shape(suv, infl);
  float aL = shape(suv + vec2(split, 0.0), infl);
  float aR = shape(suv - vec2(split, split * 0.3), infl);

  vec3 col = uColor * aC;
  col += uColorA * max(aL - aC, 0.0);
  col += uColorB * max(aR - aC, 0.0);
  float alpha = max(aC, max(aL, aR));

  // pixel blocks that fill in during the intro
  vec2 block = floor(vUv * vec2(48.0, 9.0));
  float reveal = step(hash(block + 0.37), uIntro * 1.15);
  float flicker = step(0.92, hash(block + tick)) * (1.0 - uIntro) * step(0.05, uIntro);
  alpha = alpha * reveal + flicker * 0.9 * step(0.5, texture(uTex, vUv).g + 0.3);
  col = col * reveal + uColor * flicker * 0.9;

  // print texture
  float grain = hash(vUv * 900.0 + fract(uTime * 3.0));
  alpha *= 0.9 + 0.1 * grain;
  col *= 0.9 + 0.1 * grain;
  outColor = vec4(col, alpha);
}`

const hex = (h: string): [number, number, number] => {
  const v = parseInt(h.replace('#', ''), 16)
  return [((v >> 16) & 255) / 255, ((v >> 8) & 255) / 255, (v & 255) / 255]
}

export type Wordmark = {
  state: { intro: number; glitch: number; hover: number }
  glitch: (strength?: number) => void
  redraw: () => void
}

export function createWordmark(
  canvas: HTMLCanvasElement,
  text: string,
  options: {
    color?: string
    colorA?: string
    colorB?: string
    autoGlitch?: boolean
  } = {},
): Wordmark | null {
  const gl = canvas.getContext('webgl2', {
    premultipliedAlpha: false,
    alpha: true,
    antialias: true,
  })
  if (!gl) return null
  const draw = createQuad(gl)
  const { program, uniforms } = compile(gl, QUAD_VERT, FRAG)
  const tex = gl.createTexture()!
  const state = { intro: 0, glitch: 0, hover: 0 }
  const source = document.createElement('canvas')
  const ctx = source.getContext('2d')!

  // the font family Astro generated for Archivo, read from the CSS variable
  const family =
    getComputedStyle(document.documentElement)
      .getPropertyValue('--font-archivo')
      .trim() || 'sans-serif'

  const redraw = () => {
    const rect = canvas.getBoundingClientRect()
    const dpr = Math.min(window.devicePixelRatio, 2)
    const w = Math.max(2, Math.round(rect.width * dpr))
    const h = Math.max(2, Math.round(rect.height * dpr))
    canvas.width = w
    canvas.height = h
    source.width = w
    source.height = h

    ctx.clearRect(0, 0, w, h)
    const c = ctx as CanvasRenderingContext2D & {
      fontStretch?: string
      letterSpacing?: string
    }
    c.fontStretch = 'expanded'
    c.letterSpacing = '-0.02em'
    ctx.font = `800 100px ${family}`
    const m = ctx.measureText(text)
    const size = Math.min(((w * 0.985) / m.width) * 100, h / 0.78)
    ctx.font = `800 ${size}px ${family}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'alphabetic'
    const metrics = ctx.measureText(text)
    const capH = metrics.actualBoundingBoxAscent
    const y = h / 2 + capH / 2
    // G: wide blur, R: sharp. Drawn as white, then split into channels via composite.
    const blur = document.createElement('canvas')
    blur.width = w
    blur.height = h
    const b = blur.getContext('2d')! as CanvasRenderingContext2D & {
      fontStretch?: string
      letterSpacing?: string
    }
    b.fontStretch = 'expanded'
    b.letterSpacing = '-0.02em'
    b.font = ctx.font
    b.textAlign = 'center'
    b.filter = `blur(${Math.round(size * 0.06)}px)`
    b.fillStyle = '#0f0'
    b.fillText(text, w / 2, y)

    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, w, h)
    ctx.drawImage(blur, 0, 0)
    ctx.globalCompositeOperation = 'lighter'
    ctx.fillStyle = '#f00'
    ctx.fillText(text, w / 2, y)
    ctx.globalCompositeOperation = 'source-over'

    gl.bindTexture(gl.TEXTURE_2D, tex)
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  }

  let visible = true
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting
  }).observe(canvas)

  let resizeTimer = 0
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer)
    resizeTimer = window.setTimeout(redraw, 120)
  })
  document.fonts.ready.then(redraw)
  redraw()

  const color = hex(options.color ?? '#e8321e')
  const colorA = hex(options.colorA ?? '#ff3d8b')
  const colorB = hex(options.colorB ?? '#ff6a1a')
  let nextGlitch = performance.now() + 3500
  let mouse = { x: 0.5, y: 0.5 }

  const glitch = (strength = 1) => {
    state.glitch = Math.max(state.glitch, strength)
  }

  const frame = (now: number) => {
    requestAnimationFrame(frame)
    if (!visible) return
    const rect = canvas.getBoundingClientRect()
    const ptr = effectivePointer(now)
    const tx = (ptr.x - rect.left) / rect.width
    const ty = 1 - (ptr.y - rect.top) / rect.height
    mouse.x += (tx - mouse.x) * 0.12
    mouse.y += (ty - mouse.y) * 0.12
    const inside = ty > -0.4 && ty < 1.4 && tx > -0.1 && tx < 1.1
    state.hover += ((inside ? 1 : 0) - state.hover) * 0.06

    if (options.autoGlitch !== false && now > nextGlitch) {
      glitch(0.6 + Math.random() * 0.4)
      nextGlitch = now + 3200 + Math.random() * 2400
    }
    state.glitch *= 0.9

    gl.viewport(0, 0, canvas.width, canvas.height)
    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
    gl.useProgram(program)
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, tex)
    gl.uniform1i(uniforms.uTex, 0)
    gl.uniform2f(uniforms.uMouse, mouse.x, mouse.y)
    gl.uniform1f(uniforms.uAspect, rect.width / rect.height)
    gl.uniform1f(uniforms.uTime, now / 1000)
    gl.uniform1f(uniforms.uIntro, state.intro)
    gl.uniform1f(uniforms.uGlitch, state.glitch)
    gl.uniform1f(uniforms.uHover, state.hover)
    gl.uniform1f(uniforms.uRadius, 0.5)
    gl.uniform3fv(uniforms.uColor, color)
    gl.uniform3fv(uniforms.uColorA, colorA)
    gl.uniform3fv(uniforms.uColorB, colorB)
    draw()
  }
  requestAnimationFrame(frame)

  return { state, glitch, redraw }
}

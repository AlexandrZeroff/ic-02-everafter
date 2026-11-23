import {
  compile,
  createQuad,
  createTarget,
  effectivePointer,
  NOISE_GLSL,
  QUAD_VERT,
  type Target,
} from '@/scripts/webgl'

/**
 * Fixed full-screen backdrop: slow red smoke plus a cursor trail that is carried
 * along a curl-noise flow field and fades out ("розводи").
 */

const TRAIL_FRAG = /* glsl */ `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;
uniform sampler2D uPrev;
uniform vec2 uMouse;      // uv
uniform vec2 uLast;       // uv
uniform float uAspect;
uniform float uForce;
uniform float uTime;
${NOISE_GLSL}
float segment(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a, ba = b - a;
  float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-5), 0.0, 1.0);
  return length(pa - ba * h);
}
void main() {
  vec2 flow = curl(vUv * vec2(uAspect, 1.0) * 2.2 + uTime * 0.05) * 0.0009;
  vec2 rise = vec2(0.0, 0.0006);
  vec4 prev = texture(uPrev, vUv - flow - rise);
  float decay = 0.982;
  vec2 p = vUv * vec2(uAspect, 1.0);
  float d = segment(p, uLast * vec2(uAspect, 1.0), uMouse * vec2(uAspect, 1.0));
  float splat = exp(-d * d / 0.0018) * uForce;
  float v = min(prev.r * decay + splat, 1.6);
  outColor = vec4(v, 0.0, 0.0, 1.0);
}`

const DISPLAY_FRAG = /* glsl */ `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;
uniform sampler2D uTrail;
uniform float uTime;
uniform float uAspect;
uniform float uScroll;
uniform float uIntensity;
${NOISE_GLSL}
void main() {
  vec2 p = vUv * vec2(uAspect, 1.0);
  float trail = texture(uTrail, vUv).r;
  // slow smoke drifting upward, parallax with scroll
  vec2 q = p * 1.6 + vec2(0.0, uScroll * 0.6 - uTime * 0.025);
  float w = fbm(q + fbm(q * 1.7 + uTime * 0.04) * 1.4);
  float smoke = smoothstep(0.42, 1.0, w) * (0.35 + 0.65 * (1.0 - vUv.y));
  float heat = smoke * 0.55 * uIntensity + trail * 0.9;
  vec3 bg = vec3(0.039);
  vec3 wine = vec3(0.23, 0.04, 0.04);
  vec3 red = vec3(0.91, 0.2, 0.12);
  vec3 orange = vec3(1.0, 0.42, 0.1);
  vec3 pink = vec3(1.0, 0.24, 0.55);
  vec3 col = mix(bg, wine, smoothstep(0.0, 0.25, heat));
  col = mix(col, red, smoothstep(0.2, 0.6, heat));
  col = mix(col, mix(orange, pink, 0.5 + 0.5 * sin(uTime * 0.3 + p.x * 2.0)), smoothstep(0.6, 1.2, heat));
  // vignette + grain
  float vig = smoothstep(1.25, 0.35, length(vUv - 0.5) * 1.6);
  col *= mix(0.55, 1.0, vig);
  col += (hash(vUv * 1000.0 + fract(uTime)) - 0.5) * 0.035;
  outColor = vec4(col, 1.0);
}`

export function initBackground(canvas: HTMLCanvasElement) {
  const gl = canvas.getContext('webgl2', {
    antialias: false,
    alpha: false,
    powerPreference: 'high-performance',
  })
  if (!gl) return
  const float = !!gl.getExtension('EXT_color_buffer_float')
  const draw = createQuad(gl)
  const trailProg = compile(gl, QUAD_VERT, TRAIL_FRAG)
  const displayProg = compile(gl, QUAD_VERT, DISPLAY_FRAG)

  let targets: [Target, Target]
  let dpr = 1
  const resize = () => {
    dpr = Math.min(window.devicePixelRatio, 1.5)
    canvas.width = Math.round(window.innerWidth * dpr)
    canvas.height = Math.round(window.innerHeight * dpr)
    const tw = Math.round(window.innerWidth / 4)
    const th = Math.round(window.innerHeight / 4)
    targets = [createTarget(gl, tw, th, float), createTarget(gl, tw, th, float)]
  }
  resize()
  window.addEventListener('resize', resize)

  let last = { x: 0.5, y: 0.5 }
  let intensity = 1
  let targetIntensity = 1
  window.addEventListener('bg:intensity', ((e: CustomEvent<number>) => {
    targetIntensity = e.detail
  }) as EventListener)

  const frame = (now: number) => {
    const t = now / 1000
    const ptr = effectivePointer(now)
    const mouse = {
      x: ptr.x / window.innerWidth,
      y: 1 - ptr.y / window.innerHeight,
    }
    const dist = Math.hypot(mouse.x - last.x, mouse.y - last.y)
    const force = Math.min(dist * 9, 0.9) + (ptr.idle ? 0.05 : 0)
    const aspect = window.innerWidth / window.innerHeight
    intensity += (targetIntensity - intensity) * 0.05

    // trail update
    const [read, write] = targets
    gl.bindFramebuffer(gl.FRAMEBUFFER, write.fbo)
    gl.viewport(0, 0, write.w, write.h)
    gl.useProgram(trailProg.program)
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, read.tex)
    gl.uniform1i(trailProg.uniforms.uPrev, 0)
    gl.uniform2f(trailProg.uniforms.uMouse, mouse.x, mouse.y)
    gl.uniform2f(trailProg.uniforms.uLast, last.x, last.y)
    gl.uniform1f(trailProg.uniforms.uAspect, aspect)
    gl.uniform1f(trailProg.uniforms.uForce, force)
    gl.uniform1f(trailProg.uniforms.uTime, t)
    draw()
    targets = [write, read]
    last = mouse

    // display
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    gl.viewport(0, 0, canvas.width, canvas.height)
    gl.useProgram(displayProg.program)
    gl.bindTexture(gl.TEXTURE_2D, write.tex)
    gl.uniform1i(displayProg.uniforms.uTrail, 0)
    gl.uniform1f(displayProg.uniforms.uTime, t)
    gl.uniform1f(displayProg.uniforms.uAspect, aspect)
    gl.uniform1f(
      displayProg.uniforms.uScroll,
      window.scrollY / window.innerHeight,
    )
    gl.uniform1f(displayProg.uniforms.uIntensity, intensity)
    draw()
    requestAnimationFrame(frame)
  }
  requestAnimationFrame(frame)
}

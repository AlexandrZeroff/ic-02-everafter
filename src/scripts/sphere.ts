import { compile, createQuad, NOISE_GLSL, QUAD_VERT } from '@/scripts/webgl'

/**
 * Preloader "liquid sun": a red plasma sphere that fills up with molten light as the counter
 * runs, with a wavy liquid surface, a fresnel rim and a flickering corona around it.
 */

const FRAG = /* glsl */ `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;
uniform float uTime;
uniform float uProgress;
uniform float uFlash;
${NOISE_GLSL}
void main() {
  vec2 p = (vUv - 0.5) * 2.0;
  float R = 0.62;
  float r = length(p);
  float t = uTime;

  float inside = smoothstep(R, R - 0.01, r);
  float z = sqrt(max(R * R - r * r, 0.0)) / R;

  // plasma on a sphere-warped surface
  vec2 s = p / (z + 0.55);
  float n = fbm(s * 2.4 + vec2(t * 0.12, -t * 0.22) + fbm(s * 3.1 - t * 0.18) * 1.3);

  // molten level rises with progress
  float level = mix(-R - 0.05, R + 0.05, uProgress);
  float wave = sin(p.x * 9.0 + t * 3.0) * 0.022 + sin(p.x * 17.0 - t * 4.3) * 0.011;
  float surface = level + wave * (1.0 - uProgress * 0.6);
  float filled = smoothstep(surface + 0.012, surface - 0.012, p.y);

  vec3 wine = vec3(0.23, 0.04, 0.04);
  vec3 red = vec3(0.91, 0.2, 0.12);
  vec3 orange = vec3(1.0, 0.42, 0.1);
  vec3 pink = vec3(1.0, 0.24, 0.55);

  vec3 hot = mix(wine, red, smoothstep(0.2, 0.55, n));
  hot = mix(hot, orange, smoothstep(0.55, 0.8, n));
  hot = mix(hot, pink, smoothstep(0.75, 0.95, n) * 0.6);
  hot *= 0.75 + 0.5 * z;

  vec3 cold = wine * (0.25 + 0.5 * n) + red * 0.05;
  vec3 col = mix(cold, hot, filled);

  // bright meniscus line
  float line = exp(-abs(p.y - surface) * 140.0) * inside * step(uProgress, 0.995);
  col += mix(orange, vec3(1.0, 0.85, 0.7), 0.4) * line * 1.4;

  // fresnel rim
  float rim = pow(1.0 - z, 3.0) * inside;
  col += mix(red, pink, 0.5 + 0.5 * sin(t * 1.3)) * rim * 1.2;

  // corona outside the sphere
  float ang = atan(p.y, p.x);
  float rays = fbm(vec2(ang * 3.0 + t * 0.1, r * 5.0 - t * 0.9));
  float corona = exp(-max(r - R, 0.0) * 8.0) * (0.35 + 0.9 * rays) * (0.35 + 0.65 * uProgress) * (1.0 - inside);
  col = mix(col, red * corona + pink * corona * rays * 0.4, 1.0 - inside);

  col += vec3(1.0, 0.55, 0.45) * uFlash * (inside + corona);
  float alpha = clamp(max(inside, corona), 0.0, 1.0);
  col += (hash(vUv * 700.0 + fract(t * 2.0)) - 0.5) * 0.06;
  outColor = vec4(col, alpha);
}`

export function createSphere(canvas: HTMLCanvasElement) {
  const gl = canvas.getContext('webgl2', {
    premultipliedAlpha: false,
    alpha: true,
  })
  if (!gl) return null
  const draw = createQuad(gl)
  const { program, uniforms } = compile(gl, QUAD_VERT, FRAG)
  const state = { progress: 0, flash: 0 }
  let running = true

  const resize = () => {
    const rect = canvas.getBoundingClientRect()
    const dpr = Math.min(window.devicePixelRatio, 2)
    canvas.width = Math.round(rect.width * dpr)
    canvas.height = Math.round(rect.height * dpr)
  }
  resize()
  window.addEventListener('resize', resize)

  const frame = (now: number) => {
    if (!running) return
    requestAnimationFrame(frame)
    gl.viewport(0, 0, canvas.width, canvas.height)
    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
    gl.useProgram(program)
    gl.uniform1f(uniforms.uTime, now / 1000)
    gl.uniform1f(uniforms.uProgress, state.progress)
    gl.uniform1f(uniforms.uFlash, state.flash)
    draw()
  }
  requestAnimationFrame(frame)

  return {
    state,
    stop: () => {
      running = false
    },
  }
}

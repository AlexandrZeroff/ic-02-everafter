/** Tiny WebGL2 helpers shared by the background and the wordmark. */

export const QUAD_VERT = /* glsl */ `#version 300 es
in vec2 aPos;
out vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`

export const NOISE_GLSL = /* glsl */ `
vec3 hash3(vec2 p) {
  vec3 q = vec3(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)), dot(p, vec2(419.2, 371.9)));
  return fract(sin(q) * 43758.5453);
}
float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 r = mat2(0.8, 0.6, -0.6, 0.8);
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p = r * p * 2.02;
    a *= 0.5;
  }
  return v;
}
vec2 curl(vec2 p) {
  float e = 0.01;
  float n1 = fbm(p + vec2(0.0, e));
  float n2 = fbm(p - vec2(0.0, e));
  float n3 = fbm(p + vec2(e, 0.0));
  float n4 = fbm(p - vec2(e, 0.0));
  return vec2(n1 - n2, -(n3 - n4)) / (2.0 * e);
}
`

export function compile(
  gl: WebGL2RenderingContext,
  vert: string,
  frag: string,
) {
  const make = (type: number, src: string) => {
    const s = gl.createShader(type)!
    gl.shaderSource(s, src)
    gl.compileShader(s)
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(s))
    }
    return s
  }
  const program = gl.createProgram()!
  gl.attachShader(program, make(gl.VERTEX_SHADER, vert))
  gl.attachShader(program, make(gl.FRAGMENT_SHADER, frag))
  gl.bindAttribLocation(program, 0, 'aPos')
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(program))
  }
  const uniforms: Record<string, WebGLUniformLocation | null> = {}
  const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS) as number
  for (let i = 0; i < count; i++) {
    const info = gl.getActiveUniform(program, i)!
    uniforms[info.name] = gl.getUniformLocation(program, info.name)
  }
  return { program, uniforms }
}

export function createQuad(gl: WebGL2RenderingContext) {
  const vao = gl.createVertexArray()!
  gl.bindVertexArray(vao)
  const buffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
    gl.STATIC_DRAW,
  )
  gl.enableVertexAttribArray(0)
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)
  return () => {
    gl.bindVertexArray(vao)
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
  }
}

export type Target = {
  fbo: WebGLFramebuffer
  tex: WebGLTexture
  w: number
  h: number
}

export function createTarget(
  gl: WebGL2RenderingContext,
  w: number,
  h: number,
  float: boolean,
): Target {
  const tex = gl.createTexture()!
  gl.bindTexture(gl.TEXTURE_2D, tex)
  if (float) {
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA16F,
      w,
      h,
      0,
      gl.RGBA,
      gl.HALF_FLOAT,
      null,
    )
  } else {
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      w,
      h,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      null,
    )
  }
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  const fbo = gl.createFramebuffer()!
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo)
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.COLOR_ATTACHMENT0,
    gl.TEXTURE_2D,
    tex,
    0,
  )
  gl.clearColor(0, 0, 0, 0)
  gl.clear(gl.COLOR_BUFFER_BIT)
  gl.bindFramebuffer(gl.FRAMEBUFFER, null)
  return { fbo, tex, w, h }
}

/** Pointer shared by every effect: pixels plus a smoothed velocity. */
export const pointer = {
  x: -9999,
  y: -9999,
  px: -9999,
  py: -9999,
  speed: 0,
  active: false,
  lastMove: 0,
}

if (typeof window !== 'undefined') {
  window.addEventListener(
    'pointermove',
    (e) => {
      if (!pointer.active) {
        pointer.px = e.clientX
        pointer.py = e.clientY
      }
      pointer.x = e.clientX
      pointer.y = e.clientY
      pointer.active = true
      pointer.lastMove = performance.now()
    },
    { passive: true },
  )
}

/** True when the page runs as a showreel: ?reel in the URL, or no mouse input for a while. */
export const reelMode =
  typeof window !== 'undefined' &&
  new URLSearchParams(window.location.search).has('reel')

const auto = { x: 0, y: 0, ready: false }

/**
 * Where effects should treat the cursor as being. Follows the real pointer, and after
 * 2.5 s without input (or in reel mode) drifts along a slow Lissajous path so the
 * smoke and the wordmark keep moving in a screencast.
 */
export function effectivePointer(now: number) {
  const idle = reelMode || !pointer.active || now - pointer.lastMove > 2500
  const t = now * 0.00035
  const w = window.innerWidth
  const h = window.innerHeight
  const tx = w * (0.5 + 0.36 * Math.sin(t * 1.3) + 0.08 * Math.sin(t * 3.1))
  const ty = h * (0.5 + 0.26 * Math.sin(t * 1.9 + 1.2))
  if (!auto.ready) {
    auto.x = tx
    auto.y = ty
    auto.ready = true
  }
  if (idle) {
    auto.x += (tx - auto.x) * 0.04
    auto.y += (ty - auto.y) * 0.04
  } else {
    auto.x = pointer.x
    auto.y = pointer.y
  }
  return { x: auto.x, y: auto.y, idle }
}

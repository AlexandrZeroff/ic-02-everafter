const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*/<>'

/** Flip-board style text change: letters cycle through random glyphs before settling. */
export function scramble(el: HTMLElement, to: string, duration = 700) {
  const from = el.textContent ?? ''
  const length = Math.max(from.length, to.length)
  const start = performance.now()
  const settle = Array.from({ length }, () => 0.25 + Math.random() * 0.75)
  const token = Symbol()
  ;(el as HTMLElement & { _scramble?: symbol })._scramble = token
  const tick = (now: number) => {
    if ((el as HTMLElement & { _scramble?: symbol })._scramble !== token) return
    const p = Math.min((now - start) / duration, 1)
    let out = ''
    for (let i = 0; i < length; i++) {
      const target = to[i] ?? ''
      if (p >= settle[i]) out += target
      else if (target === ' ') out += ' '
      else out += GLYPHS[(Math.random() * GLYPHS.length) | 0]
    }
    el.textContent = out
    if (p < 1) requestAnimationFrame(tick)
    else el.textContent = to
  }
  requestAnimationFrame(tick)
}

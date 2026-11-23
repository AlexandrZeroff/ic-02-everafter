import Lenis from 'lenis'
import { gsap, ScrollTrigger } from '@/scripts/gsap'

let lenis: Lenis | null = null

export const getLenis = () => lenis

/** Lenis smooth scroll driven by the GSAP ticker so ScrollTrigger stays in sync. */
export function initSmooth() {
  if (lenis) return lenis
  lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 0.9 })
  lenis.on('scroll', ScrollTrigger.update)
  gsap.ticker.add((time) => lenis?.raf(time * 1000))
  gsap.ticker.lagSmoothing(0)
  document
    .querySelectorAll<HTMLAnchorElement>('a[href^="#"]')
    .forEach((link) => {
      link.addEventListener('click', (e) => {
        const target = document.querySelector(link.getAttribute('href')!)
        if (!target) return
        e.preventDefault()
        lenis?.scrollTo(target as HTMLElement, { duration: 1.6 })
      })
    })
  return lenis
}

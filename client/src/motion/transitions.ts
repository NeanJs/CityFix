import gsap from 'gsap'
import { nextTick } from 'vue'
import { easings } from './easings'
import { blur, duration, scale } from './tokens'

export type SurfaceOrigin = 'bottom' | 'end' | 'center'

export function killMotion(targets: gsap.TweenTarget) {
  gsap.killTweensOf(targets)
}

export function enterBlocks(elements: gsap.TweenTarget) {
  const list = gsap.utils.toArray(elements)
  if (!list.length) {
    return
  }
  gsap.fromTo(
    list,
    { opacity: 0, y: 10, filter: `blur(${blur.block}px)` },
    {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      duration: duration.md,
      stagger: 0.045,
      ease: easings.primary,
      overwrite: 'auto',
    },
  )
}

export function presentSurface(
  overlay: HTMLElement,
  surface: HTMLElement,
  origin: SurfaceOrigin,
) {
  killMotion([overlay, surface])
  const from =
    origin === 'end'
      ? { xPercent: 100, yPercent: 0 }
      : origin === 'center'
        ? { xPercent: 0, yPercent: 0 }
        : { xPercent: 0, yPercent: 100 }
  gsap.set(overlay, { opacity: 0 })
  gsap.set(surface, {
    ...from,
    opacity: 1,
    scale: scale.enter,
    filter: `blur(${blur.surface}px)`,
  })
  const timeline = gsap.timeline({ overwrite: 'auto' })
  timeline.to(
    overlay,
    { opacity: 1, duration: duration.md, ease: easings.primary },
    0,
  )
  timeline.to(
    surface,
    {
      xPercent: 0,
      yPercent: 0,
      scale: 1,
      filter: 'blur(0px)',
      duration: duration.lg,
      ease: easings.primary,
    },
    0,
  )
  return timeline
}

export function dismissSurface(
  overlay: HTMLElement,
  surface: HTMLElement,
  origin: SurfaceOrigin,
): gsap.core.Timeline {
  killMotion([overlay, surface])
  const to =
    origin === 'end'
      ? { xPercent: 100, yPercent: 0 }
      : origin === 'center'
        ? { xPercent: 0, yPercent: 0 }
        : { xPercent: 0, yPercent: 100 }
  const timeline = gsap.timeline({ overwrite: 'auto' })
  timeline.to(
    overlay,
    { opacity: 0, duration: duration.sm, ease: easings.primary },
    0,
  )
  timeline.to(
    surface,
    {
      ...to,
      scale: scale.enter,
      filter: `blur(${blur.block}px)`,
      duration: duration.md,
      ease: easings.primary,
    },
    0,
  )
  return timeline
}

export async function withViewTransition(mutate: () => unknown) {
  if (typeof document.startViewTransition !== 'function') {
    await mutate()
    await nextTick()
    return
  }
  const transition = document.startViewTransition(async () => {
    await mutate()
    await nextTick()
  })
  await transition.finished.catch(() => undefined)
}

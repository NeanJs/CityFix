import gsap from 'gsap'
import type { RouteLocationNormalized } from 'vue-router'
import { easings } from './easings'
import { duration, travel } from './tokens'

export type PageMotionLayer = 'workspace' | 'layout'

type PageMotionIntent = {
  layer: PageMotionLayer | 'none'
  kind: 'slide' | 'fade'
  direction: 1 | -1
}

const pageRank: Record<string, number> = {
  login: 0,
  home: 0,
  report: 1,
  reportReceipt: 2,
  reports: 3,
  adminHome: 0,
  adminReports: 1,
  adminInsights: 2,
}

let intent: PageMotionIntent = {
  layer: 'none',
  kind: 'fade',
  direction: 1,
}

function routeName(route: RouteLocationNormalized) {
  return typeof route.name === 'string' ? route.name : ''
}

function isGuest(route: RouteLocationNormalized) {
  return route.matched.some((record) => record.meta.guest)
}

export function preparePageMotion(
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
) {
  if (!from.matched.length) {
    intent = { layer: 'none', kind: 'fade', direction: 1 }
    return
  }

  const fromName = routeName(from)
  const toName = routeName(to)

  if (!fromName || !toName || fromName === toName) {
    intent = { layer: 'none', kind: 'fade', direction: 1 }
    return
  }

  if (fromName === 'reportReceipt' || toName === 'reportReceipt') {
    intent = { layer: 'none', kind: 'fade', direction: 1 }
    return
  }

  const fromRoot = from.matched[0]?.path ?? ''
  const toRoot = to.matched[0]?.path ?? ''
  const fromRank = pageRank[fromName] ?? 0
  const toRank = pageRank[toName] ?? 0
  const direction: 1 | -1 = toRank >= fromRank ? 1 : -1

  if (fromRoot !== toRoot) {
    intent = {
      layer: 'layout',
      kind: isGuest(from) && isGuest(to) ? 'slide' : 'fade',
      direction,
    }
    return
  }

  intent = { layer: 'workspace', kind: 'slide', direction }
}

export function leavePage(
  element: HTMLElement,
  layer: PageMotionLayer,
  done: () => void,
) {
  if (intent.layer !== layer) {
    requestAnimationFrame(done)
    return
  }
  gsap.killTweensOf(element)
  const x = intent.kind === 'slide' ? intent.direction * -travel.page : 0
  const y = intent.kind === 'fade' ? travel.page : 0
  gsap.to(element, {
    opacity: 0,
    x,
    y,
    duration: duration.sm,
    ease: easings.primary,
    onComplete: done,
  })
}

export function enterPage(
  element: HTMLElement,
  layer: PageMotionLayer,
  done: () => void,
) {
  if (intent.layer !== layer) {
    gsap.set(element, { clearProps: 'transform,opacity' })
    requestAnimationFrame(done)
    return
  }
  gsap.killTweensOf(element)
  const x = intent.kind === 'slide' ? intent.direction * travel.page : 0
  const y = intent.kind === 'fade' ? travel.page : 0
  gsap.fromTo(
    element,
    { opacity: 0, x, y },
    {
      opacity: 1,
      x: 0,
      y: 0,
      duration: duration.lg,
      ease: easings.primary,
      onComplete: () => {
        gsap.set(element, { clearProps: 'transform,opacity' })
        done()
      },
    },
  )
}

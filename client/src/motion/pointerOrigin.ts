export type PointOrigin = {
  x: number
  y: number
}

const staleMs = 700
let last: (PointOrigin & { at: number }) | null = null
let listening = false

function onPointerDown(event: PointerEvent) {
  last = { x: event.clientX, y: event.clientY, at: performance.now() }
}

export function startPointerOrigin() {
  if (listening || typeof window === 'undefined') {
    return
  }
  listening = true
  window.addEventListener('pointerdown', onPointerDown, { capture: true, passive: true })
}

export function takePointerOrigin(): PointOrigin | null {
  if (!last) {
    return null
  }
  const point = last
  last = null
  if (performance.now() - point.at > staleMs) {
    return null
  }
  return { x: point.x, y: point.y }
}

export function originFromElement(el: EventTarget | null): PointOrigin | null {
  if (!(el instanceof HTMLElement) || el === document.body || el === document.documentElement) {
    return null
  }
  const rect = el.getBoundingClientRect()
  if (rect.width === 0 && rect.height === 0) {
    return null
  }
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
}

if (typeof window !== 'undefined') {
  startPointerOrigin()
}

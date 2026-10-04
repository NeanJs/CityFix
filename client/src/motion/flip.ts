import gsap from 'gsap'
import { Flip } from 'gsap/Flip'
import { nextTick } from 'vue'
import { easings } from './easings'
import { duration } from './tokens'

export function captureFlip(targets: gsap.DOMTarget, props?: string) {
  return Flip.getState(targets, props ? { props } : undefined)
}

export function playFlip(
  state: Flip.FlipState | null | undefined,
  options: Flip.FromToVars = {},
) {
  if (!state) {
    return
  }
  return Flip.from(state, {
    duration: duration.md,
    ease: easings.primary,
    fade: true,
    overwrite: 'auto',
    absoluteOnLeave: true,
    ...options,
  })
}

export async function flipLayout(options: {
  targets: gsap.DOMTarget
  mutate: () => void | Promise<void>
  absolute?: boolean
  nested?: boolean
  duration?: number
  props?: string
  onEnter?: Flip.FromToVars['onEnter']
  onLeave?: Flip.FromToVars['onLeave']
}) {
  const state = captureFlip(options.targets, options.props)
  await options.mutate()
  await nextTick()
  return playFlip(state, {
    absolute: options.absolute ?? false,
    nested: options.nested,
    duration: options.duration ?? duration.md,
    onEnter:
      options.onEnter ??
      ((elements) => {
        gsap.fromTo(
          elements,
          { opacity: 0 },
          { opacity: 1, duration: duration.xs, ease: easings.primary, overwrite: 'auto' },
        )
      }),
    onLeave:
      options.onLeave ??
      ((elements) => {
        gsap.to(elements, {
          opacity: 0,
          duration: duration.xs,
          ease: easings.primary,
          overwrite: 'auto',
        })
      }),
  })
}

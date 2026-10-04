import { captureFlip, playFlip } from './flip'

let pending: ReturnType<typeof captureFlip> | null = null

export function issueFlipSelector(id: string) {
  return `[data-flip-id^="issue-${id}-"]`
}

export function captureIssueFlip(id: string | null | undefined) {
  if (!id) {
    pending = null
    return
  }
  pending = captureFlip(issueFlipSelector(id), 'borderRadius')
}

export function playIssueFlip(options: Parameters<typeof playFlip>[1] = {}) {
  const state = pending
  pending = null
  return playFlip(state, {
    absolute: true,
    nested: true,
    fade: true,
    ...options,
  })
}

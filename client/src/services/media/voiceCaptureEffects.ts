import ce1 from '../../assets/ce_1.mp3'
import ce2 from '../../assets/ce_2.mp3'
import ce3 from '../../assets/ce_3.mp3'

export type VoiceCaptureEffect = 'start' | 'send' | 'response'

const sources: Record<VoiceCaptureEffect, string> = {
  start: ce1,
  send: ce2,
  response: ce3,
}

export function playVoiceCaptureEffect(effect: VoiceCaptureEffect) {
  const audio = new Audio(sources[effect])
  void audio.play().catch(() => {})
}

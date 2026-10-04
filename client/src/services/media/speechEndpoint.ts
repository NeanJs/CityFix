import { readVoiceLevel } from './voiceLevel'

export type SpeechEndpointHandlers = {
  onEnded: () => void
  onCancel: () => void
}

export type SpeechEndpoint = {
  prime: () => void
  attach: (stream: MediaStream) => void
  stop: () => void
  destroy: () => void
}

type Phase = 'idle' | 'warming' | 'listening' | 'speaking' | 'trailing' | 'stopped'

const warmupMs = 400
const speechOnMs = 180
const speechOffMs = 2000
const noSpeechMs = 7000
const minSpeechMs = 350
const maxMs = 60000
const quietNoiseFollow = 0.035
const trailingNoiseFollow = 0.015

function audioContextCtor() {
  return window.AudioContext || window.webkitAudioContext
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function quantile(values: number[], q: number) {
  if (values.length === 0) {
    return 0
  }
  const ranked = values.slice().sort((a, b) => a - b)
  const index = (ranked.length - 1) * q
  const lo = Math.floor(index)
  const hi = Math.ceil(index)
  const low = ranked[lo] ?? 0
  if (lo === hi) {
    return low
  }
  const high = ranked[hi] ?? low
  return low * (1 - (index - lo)) + high * (index - lo)
}

function enterThreshold(noise: number) {
  return clamp(noise * 2.8 + 0.045, 0.07, 0.42)
}

function exitThreshold(noise: number) {
  return clamp(noise * 1.7 + 0.02, 0.04, 0.28)
}

export function createSpeechEndpoint(handlers: SpeechEndpointHandlers): SpeechEndpoint {
  let context: AudioContext | null = null
  let analyser: AnalyserNode | null = null
  let sourceNode: MediaStreamAudioSourceNode | null = null
  let timeDomain: Uint8Array<ArrayBuffer> | null = null
  let frequencies: Uint8Array<ArrayBuffer> | null = null
  let frameId = 0
  let phase: Phase = 'idle'
  let startedAt = 0
  let listenStarted = 0
  let speechStarted = 0
  let aboveSince = 0
  let belowSince = 0
  let noise = 0.03
  const warmupSamples: number[] = []

  function ensureContext() {
    if (context && analyser) {
      return true
    }
    const Ctor = audioContextCtor()
    if (!Ctor) {
      return false
    }
    context = new Ctor()
    analyser = context.createAnalyser()
    analyser.fftSize = 1024
    analyser.smoothingTimeConstant = 0.32
    timeDomain = new Uint8Array(new ArrayBuffer(analyser.fftSize))
    frequencies = new Uint8Array(new ArrayBuffer(analyser.frequencyBinCount))
    return true
  }

  function haltLoop() {
    if (frameId) {
      cancelAnimationFrame(frameId)
      frameId = 0
    }
  }

  function disconnectSource() {
    sourceNode?.disconnect()
    sourceNode = null
  }

  function finish(kind: 'ended' | 'cancel') {
    if (phase === 'stopped' || phase === 'idle') {
      return
    }
    phase = 'stopped'
    haltLoop()
    disconnectSource()
    if (kind === 'ended') {
      handlers.onEnded()
      return
    }
    handlers.onCancel()
  }

  function beginListening(now: number) {
    phase = 'listening'
    listenStarted = now
    aboveSince = 0
    belowSince = 0
    speechStarted = 0
  }

  function tick(now: number) {
    if (phase === 'idle' || phase === 'stopped') {
      return
    }
    const elapsed = now - startedAt
    if (elapsed >= maxMs) {
      finish(speechStarted > 0 || !analyser ? 'ended' : 'cancel')
      return
    }
    if (!analyser || !timeDomain || !frequencies) {
      frameId = requestAnimationFrame(tick)
      return
    }
    const level = readVoiceLevel(analyser, timeDomain, frequencies).level
    const enter = enterThreshold(noise)
    const exit = exitThreshold(noise)

    if (phase === 'warming') {
      warmupSamples.push(level)
      if (elapsed >= warmupMs) {
        const estimated = quantile(warmupSamples, 0.3)
        noise = estimated > 0 ? estimated : noise
        warmupSamples.length = 0
        beginListening(now)
      }
      frameId = requestAnimationFrame(tick)
      return
    }

    if (phase === 'listening') {
      if (level < enter) {
        noise += (level - noise) * quietNoiseFollow
        aboveSince = 0
        if (now - listenStarted >= noSpeechMs) {
          finish('cancel')
          return
        }
        frameId = requestAnimationFrame(tick)
        return
      }
      if (!aboveSince) {
        aboveSince = now
      }
      if (now - aboveSince >= speechOnMs) {
        phase = 'speaking'
        speechStarted = aboveSince
        belowSince = 0
      }
      frameId = requestAnimationFrame(tick)
      return
    }

    if (phase === 'speaking') {
      if (level >= exit) {
        belowSince = 0
        frameId = requestAnimationFrame(tick)
        return
      }
      noise += (level - noise) * trailingNoiseFollow
      belowSince = now
      phase = 'trailing'
    }

    if (phase === 'trailing') {
      if (level >= enter) {
        phase = 'speaking'
        belowSince = 0
        frameId = requestAnimationFrame(tick)
        return
      }
      noise += (level - noise) * trailingNoiseFollow
      if (!belowSince) {
        belowSince = now
      }
      if (now - belowSince < speechOffMs) {
        frameId = requestAnimationFrame(tick)
        return
      }
      if (now - speechStarted >= minSpeechMs) {
        finish('ended')
        return
      }
      beginListening(now)
    }

    frameId = requestAnimationFrame(tick)
  }

  function prime() {
    if (!ensureContext() || !context) {
      return
    }
    void context.resume()
  }

  function attach(stream: MediaStream) {
    haltLoop()
    disconnectSource()
    warmupSamples.length = 0
    noise = 0.03
    aboveSince = 0
    belowSince = 0
    speechStarted = 0
    startedAt = performance.now()
    phase = 'warming'
    if (ensureContext() && context && analyser) {
      sourceNode = context.createMediaStreamSource(stream)
      sourceNode.connect(analyser)
      void context.resume()
    }
    frameId = requestAnimationFrame(tick)
  }

  function stop() {
    if (phase !== 'idle') {
      phase = 'stopped'
    }
    haltLoop()
    disconnectSource()
    warmupSamples.length = 0
  }

  function destroy() {
    stop()
    analyser?.disconnect()
    analyser = null
    timeDomain = null
    frequencies = null
    void context?.close()
    context = null
    phase = 'idle'
  }

  return {
    prime,
    attach,
    stop,
    destroy,
  }
}

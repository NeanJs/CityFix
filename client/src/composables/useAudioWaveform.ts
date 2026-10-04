import { onBeforeUnmount, toValue, watch, type MaybeRefOrGetter } from 'vue'

export type AudioWaveformFrame = {
  levels: Float32Array
  count: number
  incoming: number
  scroll: number
  visibleBars: number
  live: boolean
}

type FrameHandler = (frame: AudioWaveformFrame) => void
type Mode = 'idle' | 'live' | 'rewind' | 'hold'

const minBars = 24
const maxBars = 140
const windowSeconds = 2.4
const storedSeconds = 5
const noiseFloor = 0.014

export function useAudioWaveform(stream: MaybeRefOrGetter<MediaStream | null>) {
  let levels = new Float32Array(0)
  let count = 0
  let incoming = 0
  let envelope = 0
  let carry = 0
  let scroll = 0
  let visibleBars = 56
  let barsPerSecond = visibleBars / windowSeconds
  let recordStarted = 0
  let frameId = 0
  let loopOn = false
  let mode: Mode = 'idle'
  let rewindFrom = 0
  let rewindStarted = 0
  let rewindDuration = 640
  let context: AudioContext | null = null
  let analyser: AnalyserNode | null = null
  let sourceNode: MediaStreamAudioSourceNode | null = null
  let timeDomain: Uint8Array<ArrayBuffer> | null = null
  let frequencies: Uint8Array<ArrayBuffer> | null = null
  const listeners = new Set<FrameHandler>()

  function snapshot(): AudioWaveformFrame {
    return {
      levels,
      count,
      incoming,
      scroll,
      visibleBars,
      live: mode === 'live',
    }
  }

  function emit() {
    const frame = snapshot()
    for (const listener of listeners) {
      listener(frame)
    }
  }

  function readLevel() {
    if (!analyser || !timeDomain || !frequencies) {
      return 0
    }
    analyser.getByteTimeDomainData(timeDomain)
    let sum = 0
    for (let index = 0; index < timeDomain.length; index += 1) {
      const sample = (timeDomain[index] - 128) / 128
      sum += sample * sample
    }
    const rms = Math.sqrt(sum / timeDomain.length)
    analyser.getByteFrequencyData(frequencies)
    const voiceBins = Math.min(42, frequencies.length)
    let voice = 0
    for (let index = 2; index < voiceBins; index += 1) {
      voice += frequencies[index]
    }
    const voiceLevel = voice / ((voiceBins - 2) * 255)
    const loudness = Math.min(1, Math.pow(Math.max(0, rms - noiseFloor) * 8.8, 0.68))
    const texture = Math.min(1, Math.pow(voiceLevel, 0.78))
    return Math.min(1, loudness * 0.74 + texture * 0.46)
  }

  function followHead() {
    scroll = count + carry - visibleBars
  }

  function advance(now: number) {
    if (mode === 'live') {
      const target = readLevel()
      const follow = target > envelope ? 0.58 : 0.22
      envelope += (target - envelope) * follow
      incoming = envelope
      const headTarget = Math.min(levels.length, ((now - recordStarted) / 1000) * barsPerSecond)
      while (count < headTarget && count < levels.length) {
        levels[count] = incoming
        count += 1
      }
      carry = Math.max(0, headTarget - count)
      if (count >= levels.length) {
        carry = 0
        incoming = 0
        followHead()
        sourceNode?.disconnect()
        sourceNode = null
        emit()
        stopLoop()
        return
      }
      followHead()
    } else if (mode === 'rewind') {
      const elapsed = now - rewindStarted
      const progress = rewindDuration <= 0 ? 1 : Math.min(1, elapsed / rewindDuration)
      const eased = 1 - (1 - progress) ** 3
      scroll = rewindFrom * (1 - eased)
      if (progress >= 1) {
        scroll = 0
        mode = 'hold'
        emit()
        stopLoop()
        return
      }
    }
    emit()
    frameId = requestAnimationFrame(advance)
  }

  function startLoop() {
    if (loopOn || listeners.size === 0) {
      return
    }
    loopOn = true
    frameId = requestAnimationFrame(advance)
  }

  function stopLoop() {
    loopOn = false
    if (frameId) {
      cancelAnimationFrame(frameId)
      frameId = 0
    }
  }

  function beginRewind() {
    carry = 0
    incoming = 0
    rewindFrom = scroll
    const distance = Math.abs(rewindFrom)
    rewindDuration = Math.min(1200, Math.max(480, 420 + distance * 12))
    rewindStarted = performance.now()
    if (distance < 0.35) {
      scroll = 0
      mode = 'hold'
      emit()
      stopLoop()
      return
    }
    mode = 'rewind'
    startLoop()
  }

  function clear() {
    mode = 'idle'
    levels = new Float32Array(0)
    count = 0
    incoming = 0
    envelope = 0
    carry = 0
    scroll = 0
    stopLoop()
    emit()
  }

  function ensureContext() {
    if (context && analyser) {
      return true
    }
    if (typeof AudioContext === 'undefined') {
      return false
    }
    context = new AudioContext()
    analyser = context.createAnalyser()
    analyser.fftSize = 1024
    analyser.smoothingTimeConstant = 0.32
    timeDomain = new Uint8Array(new ArrayBuffer(analyser.fftSize))
    frequencies = new Uint8Array(new ArrayBuffer(analyser.frequencyBinCount))
    return true
  }

  function prime() {
    if (!ensureContext() || !context) {
      return
    }
    void context.resume()
  }

  function connect(next: MediaStream) {
    if (!ensureContext() || !context || !analyser) {
      return
    }
    sourceNode?.disconnect()
    barsPerSecond = Math.max(16, visibleBars / windowSeconds)
    levels = new Float32Array(Math.max(1, Math.round(barsPerSecond * storedSeconds)))
    count = 0
    incoming = 0
    envelope = 0
    carry = 0
    scroll = -visibleBars
    recordStarted = performance.now()
    mode = 'live'
    sourceNode = context.createMediaStreamSource(next)
    sourceNode.connect(analyser)
    void context.resume()
    startLoop()
  }

  function release() {
    sourceNode?.disconnect()
    sourceNode = null
    if (mode !== 'live') {
      return
    }
    if (carry > 0.2 && count < levels.length && envelope >= 0.02) {
      levels[count] = incoming
      count += 1
    }
    if (count === 0) {
      clear()
      return
    }
    beginRewind()
  }

  function destroy() {
    stopLoop()
    sourceNode?.disconnect()
    sourceNode = null
    analyser?.disconnect()
    analyser = null
    void context?.close()
    context = null
    timeDomain = null
    frequencies = null
  }

  function setVisibleBars(nextCount: number) {
    const next = Math.max(minBars, Math.min(maxBars, Math.round(nextCount)))
    if (next === visibleBars) {
      return
    }
    visibleBars = next
    if (mode === 'live') {
      followHead()
    }
    if (!loopOn) {
      emit()
    }
  }

  function subscribe(handler: FrameHandler) {
    listeners.add(handler)
    handler(snapshot())
    if (mode === 'live' || mode === 'rewind') {
      startLoop()
    }
    return () => {
      listeners.delete(handler)
      if (listeners.size === 0) {
        stopLoop()
      }
    }
  }

  watch(
    () => toValue(stream),
    (next) => {
      if (next) {
        connect(next)
        return
      }
      release()
    },
    { immediate: true },
  )

  onBeforeUnmount(destroy)

  return {
    prime,
    clear,
    setVisibleBars,
    subscribe,
  }
}

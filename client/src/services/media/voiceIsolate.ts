const highPassHz = 90
const lowPassHz = 7000
const workletName = 'near-field-gate'

const workletSource = `
class NearFieldGateProcessor extends AudioWorkletProcessor {
  constructor() {
    super()
    this.envelope = 0
    this.noise = 0.006
    this.speechPeak = 0.16
    this.gain = 1
    this.hold = 0
  }

  process(inputs, outputs) {
    const input = inputs[0] && inputs[0][0]
    const output = outputs[0] && outputs[0][0]
    if (!input || !output) {
      return true
    }
    const attack = Math.exp(-1 / (0.005 * sampleRate))
    const release = Math.exp(-1 / (0.24 * sampleRate))
    const holdSamples = 0.11 * sampleRate
    const floorGain = 0.22
    const ratio = 1.35
    for (let index = 0; index < input.length; index += 1) {
      const magnitude = Math.abs(input[index])
      const coeff = magnitude > this.envelope ? attack : release
      this.envelope = magnitude + (this.envelope - magnitude) * coeff
      const open = Math.min(
        0.22,
        Math.max(0.024, this.noise * 2.1 + 0.014, this.speechPeak * 0.1),
      )
      if (this.envelope >= open) {
        this.hold = holdSamples
        this.speechPeak += (this.envelope - this.speechPeak) * 0.02
        this.gain += (1 - this.gain) * 0.45
      } else {
        this.noise += (this.envelope - this.noise) * 0.0008
        if (this.hold > 0) {
          this.hold -= 1
          this.gain += (1 - this.gain) * 0.25
        } else {
          const scaled = this.envelope / Math.max(open, 1e-6)
          const expanded = Math.pow(Math.min(1, scaled), ratio)
          const target = Math.max(floorGain, expanded)
          this.gain += (target - this.gain) * 0.04
        }
      }
      output[index] = input[index] * this.gain
    }
    return true
  }
}

registerProcessor('${workletName}', NearFieldGateProcessor)
`

function audioContextCtor() {
  return window.AudioContext || window.webkitAudioContext
}

const voiceConstraintBase: MediaTrackConstraints = {
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: false,
}

function isFatalGetUserMediaError(error: unknown) {
  if (!(error instanceof DOMException)) {
    return false
  }
  return (
    error.name === 'NotAllowedError' ||
    error.name === 'NotFoundError' ||
    error.name === 'NotReadableError' ||
    error.name === 'SecurityError' ||
    error.name === 'AbortError'
  )
}

export async function requestVoiceMediaStream() {
  try {
    return await navigator.mediaDevices.getUserMedia({
      audio: {
        ...voiceConstraintBase,
        voiceIsolation: true,
      },
    })
  } catch (error) {
    if (isFatalGetUserMediaError(error)) {
      throw error
    }
    return navigator.mediaDevices.getUserMedia({
      audio: voiceConstraintBase,
    })
  }
}

export type VoiceIsolateGraph = {
  stream: MediaStream
  stop: () => void
}

function stopTracks(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop())
}

function connectBiquads(context: AudioContext, source: AudioNode) {
  const highPass = context.createBiquadFilter()
  highPass.type = 'highpass'
  highPass.frequency.value = highPassHz
  highPass.Q.value = 0.707
  const lowPass = context.createBiquadFilter()
  lowPass.type = 'lowpass'
  lowPass.frequency.value = lowPassHz
  lowPass.Q.value = 0.707
  source.connect(highPass)
  highPass.connect(lowPass)
  return lowPass
}

async function ensureWorklet(context: AudioContext) {
  if (!context.audioWorklet) {
    return false
  }
  const blob = new Blob([workletSource], { type: 'application/javascript' })
  const url = URL.createObjectURL(blob)
  try {
    await context.audioWorklet.addModule(url)
    return true
  } catch {
    return false
  } finally {
    URL.revokeObjectURL(url)
  }
}

export async function createVoiceIsolateGraph(raw: MediaStream): Promise<VoiceIsolateGraph> {
  const fallback = {
    stream: raw,
    stop: () => {
      stopTracks(raw)
    },
  }
  const Ctor = audioContextCtor()
  if (!Ctor || typeof Ctor.prototype.createMediaStreamDestination !== 'function') {
    return fallback
  }
  const context = new Ctor()
  try {
    if (context.state === 'suspended') {
      await context.resume()
    }
    const source = context.createMediaStreamSource(raw)
    const filtered = connectBiquads(context, source)
    const destination = context.createMediaStreamDestination()
    const gated = (await ensureWorklet(context))
      ? new AudioWorkletNode(context, workletName, {
          numberOfInputs: 1,
          numberOfOutputs: 1,
          outputChannelCount: [1],
        })
      : null
    if (gated) {
      filtered.connect(gated)
      gated.connect(destination)
    } else {
      filtered.connect(destination)
    }
    return {
      stream: destination.stream,
      stop: () => {
        stopTracks(destination.stream)
        stopTracks(raw)
        source.disconnect()
        gated?.disconnect()
        void context.close()
      },
    }
  } catch {
    void context.close()
    return fallback
  }
}

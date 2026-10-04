import { Mp3Encoder } from '@breezystack/lamejs'
import { asFormFile } from './formFile'
import { isolateVoiceSamples } from './isolateVoiceBuffer'

const bitrateKbps = 64
const targetSampleRate = 22050
const frameSamples = 1152
const yieldEveryFrames = 40

function audioContextCtor() {
  return window.AudioContext || window.webkitAudioContext
}

function floatToPcm16(input: Float32Array, output: Int16Array) {
  const length = Math.min(input.length, output.length)
  for (let index = 0; index < length; index += 1) {
    const sample = Math.max(-1, Math.min(1, input[index] ?? 0))
    output[index] = sample < 0 ? (sample * 0x8000) | 0 : (sample * 0x7fff) | 0
  }
  for (let index = length; index < output.length; index += 1) {
    output[index] = 0
  }
}

async function decodeAudio(blob: Blob) {
  const Ctor = audioContextCtor()
  if (!Ctor) {
    throw new Error('audio')
  }
  const context = new Ctor()
  try {
    if (context.state === 'suspended') {
      await context.resume()
    }
    const data = await blob.arrayBuffer()
    return await context.decodeAudioData(data.slice(0))
  } finally {
    await context.close()
  }
}

async function toMonoVoiceBuffer(buffer: AudioBuffer) {
  const durationSamples = Math.max(1, Math.round(buffer.duration * targetSampleRate))
  if (buffer.numberOfChannels === 1 && buffer.sampleRate === targetSampleRate) {
    return buffer
  }
  const offline = new OfflineAudioContext(1, durationSamples, targetSampleRate)
  const source = offline.createBufferSource()
  source.buffer = buffer
  source.connect(offline.destination)
  source.start(0)
  return offline.startRendering()
}

async function encodePcmToMp3(samples: Float32Array, sampleRate: number) {
  const encoder = new Mp3Encoder(1, sampleRate, bitrateKbps)
  const pcm = new Int16Array(frameSamples)
  const parts: Uint8Array[] = []
  let frames = 0
  for (let offset = 0; offset < samples.length; offset += frameSamples) {
    floatToPcm16(samples.subarray(offset, offset + frameSamples), pcm)
    const encoded = encoder.encodeBuffer(pcm)
    if (encoded.length > 0) {
      parts.push(encoded)
    }
    frames += 1
    if (frames % yieldEveryFrames === 0) {
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, 0)
      })
    }
  }
  const flushed = encoder.flush()
  if (flushed.length > 0) {
    parts.push(flushed)
  }
  if (!parts.length) {
    throw new Error('mp3')
  }
  return new Blob(parts as BlobPart[], { type: 'audio/mpeg' })
}

export async function compressVoiceFile(blob: Blob): Promise<File> {
  if (blob.size < 1) {
    throw new Error('empty')
  }
  const decoded = await decodeAudio(blob)
  const voice = await toMonoVoiceBuffer(decoded)
  const samples = voice.getChannelData(0)
  if (!samples.length) {
    throw new Error('empty')
  }
  const isolated = await isolateVoiceSamples(samples, voice.sampleRate)
  const mp3 = await encodePcmToMp3(isolated, voice.sampleRate)
  return asFormFile(mp3, 'voice.mp3')
}

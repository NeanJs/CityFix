export const voiceLevelNoiseFloor = 0.014

export type VoiceLevelReading = {
  level: number
  rms: number
  voice: number
}

export function readVoiceLevel(
  analyser: AnalyserNode,
  timeDomain: Uint8Array<ArrayBuffer>,
  frequencies: Uint8Array<ArrayBuffer>,
  noiseFloor = voiceLevelNoiseFloor,
): VoiceLevelReading {
  analyser.getByteTimeDomainData(timeDomain)
  let sum = 0
  for (let index = 0; index < timeDomain.length; index += 1) {
    const sample = (timeDomain[index] - 128) / 128
    sum += sample * sample
  }
  const rms = Math.sqrt(sum / timeDomain.length)
  analyser.getByteFrequencyData(frequencies)
  const voiceBins = Math.min(42, frequencies.length)
  let voiceEnergy = 0
  for (let index = 2; index < voiceBins; index += 1) {
    voiceEnergy += frequencies[index]
  }
  const voice = voiceEnergy / ((voiceBins - 2) * 255)
  const loudness = Math.min(1, Math.pow(Math.max(0, rms - noiseFloor) * 8.8, 0.68))
  const texture = Math.min(1, Math.pow(voice, 0.78))
  return {
    level: Math.min(1, loudness * 0.74 + texture * 0.46),
    rms,
    voice,
  }
}

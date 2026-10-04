const windowMs = 20
const attackMs = 6
const holdMs = 110
const releaseMs = 240
const floorGain = 0.12
const expandRatio = 1.4
const yieldEveryWindows = 240

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

function yieldFrame() {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, 0)
  })
}

function windowRms(samples: Float32Array, start: number, size: number) {
  const end = Math.min(samples.length, start + size)
  if (end <= start) {
    return 0
  }
  let sum = 0
  for (let index = start; index < end; index += 1) {
    const sample = samples[index] ?? 0
    sum += sample * sample
  }
  return Math.sqrt(sum / (end - start))
}

export async function isolateVoiceSamples(samples: Float32Array, sampleRate: number) {
  const windowSize = Math.max(32, Math.round((sampleRate * windowMs) / 1000))
  const attackSamples = Math.max(1, Math.round((sampleRate * attackMs) / 1000))
  const holdSamples = Math.max(1, Math.round((sampleRate * holdMs) / 1000))
  const releaseSamples = Math.max(1, Math.round((sampleRate * releaseMs) / 1000))
  const lookahead = attackSamples
  const levels: number[] = []
  for (let start = 0; start < samples.length; start += windowSize) {
    levels.push(windowRms(samples, start, windowSize))
    if (levels.length % yieldEveryWindows === 0) {
      await yieldFrame()
    }
  }
  if (!levels.length) {
    return samples
  }
  const floor = quantile(levels, 0.08)
  let peak = 0
  for (const level of levels) {
    if (level > peak) {
      peak = level
    }
  }
  const speech = quantile(levels, 0.9)
  if (peak < 0.02 || speech < floor * 2.4 || speech - floor < 0.02) {
    return samples
  }
  const open = Math.min(speech * 0.12, Math.max(floor * 1.9 + 0.006, 0.018))
  const attackCoeff = 1 - Math.exp(-1 / attackSamples)
  const releaseCoeff = 1 - Math.exp(-1 / releaseSamples)
  let envelope = 0
  let gain = 1
  let hold = 0
  const output = samples
  for (let index = 0; index < samples.length; index += 1) {
    const look = Math.min(samples.length - 1, index + lookahead)
    const windowIndex = Math.min(levels.length - 1, Math.floor(look / windowSize))
    const level = levels[windowIndex] ?? 0
    const coeff = level > envelope ? attackCoeff : releaseCoeff
    envelope += (level - envelope) * coeff
    if (envelope >= open) {
      hold = holdSamples
      gain += (1 - gain) * Math.min(1, attackCoeff * 4)
    } else if (hold > 0) {
      hold -= 1
      gain += (1 - gain) * Math.min(1, attackCoeff * 2)
    } else {
      const scaled = envelope / Math.max(open, 1e-6)
      const expanded = scaled ** expandRatio
      const target = Math.max(floorGain, expanded)
      gain += (target - gain) * Math.min(1, releaseCoeff)
    }
    output[index] = (samples[index] ?? 0) * gain
    if (index > 0 && index % (windowSize * yieldEveryWindows) === 0) {
      await yieldFrame()
    }
  }
  return output
}

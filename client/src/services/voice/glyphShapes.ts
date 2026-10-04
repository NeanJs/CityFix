export type GlyphPhase = 'idle' | 'connecting' | 'listening' | 'speaking' | 'error'

type Segment = readonly [number, number, number, number]

export const cityGridSize = 4
export const cityBuildingCount = cityGridSize * cityGridSize

const tau = Math.PI * 2
const groundEvery = 7
const cityFloor = -0.5
const cityHalfSpan = 0.78
const cityStreet = 0.1

function circleSegments(radius: number, steps: number): Segment[] {
  const segments: Segment[] = []
  for (let i = 0; i < steps; i += 1) {
    const a = (i / steps) * tau
    const b = ((i + 1) / steps) * tau
    segments.push([
      Math.cos(a) * radius,
      Math.sin(a) * radius,
      Math.cos(b) * radius,
      Math.sin(b) * radius,
    ])
  }
  return segments
}

function columnSegments(): Segment[] {
  const segments: Segment[] = []
  const columns = [-0.36, -0.12, 0.12, 0.36]
  const halfWidth = 0.045
  for (const x of columns) {
    segments.push([x - halfWidth, 0.2, x - halfWidth, -0.34])
    segments.push([x + halfWidth, 0.2, x + halfWidth, -0.34])
  }
  return segments
}

const glyphSegments: Segment[] = [
  ...circleSegments(0.92, 96),
  ...circleSegments(0.8, 64),
  [-0.54, 0.3, 0, 0.56],
  [0, 0.56, 0.54, 0.3],
  [-0.54, 0.3, 0.54, 0.3],
  [-0.5, 0.24, 0.5, 0.24],
  ...columnSegments(),
  [-0.5, -0.38, 0.5, -0.38],
  [-0.58, -0.45, 0.58, -0.45],
  [-0.66, -0.52, 0.66, -0.52],
]

const glyphLengths = (() => {
  const cumulative = new Float32Array(glyphSegments.length)
  let total = 0
  glyphSegments.forEach(([x1, y1, x2, y2], i) => {
    total += Math.hypot(x2 - x1, y2 - y1)
    cumulative[i] = total
  })
  return { cumulative, total }
})()

export type CityBuilding = {
  x: number
  z: number
  half: number
  band: number
  base: number
}

export const cityBuildings: CityBuilding[] = (() => {
  const cell = (cityHalfSpan * 2) / cityGridSize
  const half = (cell - cityStreet) / 2
  const buildings: CityBuilding[] = []
  for (let row = 0; row < cityGridSize; row += 1) {
    for (let col = 0; col < cityGridSize; col += 1) {
      const x = -cityHalfSpan + cell * (col + 0.5)
      const z = -cityHalfSpan + cell * (row + 0.5)
      const centrality = 1 - Math.hypot(x, z) / (cityHalfSpan * Math.SQRT2)
      const variance = ((row * 7 + col * 13) % 5) / 5
      buildings.push({ x, z, half, band: 0, base: 0.16 + centrality * 0.34 + variance * 0.14 })
    }
  }
  const order = buildings
    .map((building, index) => ({ index, distance: Math.hypot(building.x, building.z) }))
    .sort((a, b) => a.distance - b.distance)
  order.forEach(({ index }, rank) => {
    const building = buildings[index]
    if (building) {
      building.band = rank
    }
  })
  return buildings
})()

export function createSeeds(count: number) {
  const seeds = new Float32Array(count * 3)
  for (let i = 0; i < seeds.length; i += 1) {
    seeds[i] = Math.random()
  }
  return seeds
}

export function glyphTargets(out: Float32Array, seeds: Float32Array, count: number) {
  const { cumulative, total } = glyphLengths
  let segment = 0
  for (let k = 0; k < count; k += 1) {
    const distance = ((k + 0.5) / count) * total
    while (segment < cumulative.length - 1 && (cumulative[segment] ?? 0) < distance) {
      segment += 1
    }
    const [x1, y1, x2, y2] = glyphSegments[segment] ?? [0, 0, 0, 0]
    const end = cumulative[segment] ?? 0
    const length = Math.hypot(x2 - x1, y2 - y1) || 1
    const t = 1 - (end - distance) / length
    const o = k * 3
    out[o] = x1 + (x2 - x1) * t
    out[o + 1] = y1 + (y2 - y1) * t
    out[o + 2] = ((seeds[o + 2] ?? 0.5) - 0.5) * 0.05
  }
}

export function fracturedTargets(
  out: Float32Array,
  seeds: Float32Array,
  count: number,
  time: number,
) {
  glyphTargets(out, seeds, count)
  for (let k = 0; k < count; k += 1) {
    const o = k * 3
    const shard = Math.floor(k / 24)
    const drift = Math.sin(time * 0.6 + shard * 1.7)
    out[o] = (out[o] ?? 0) * 1.04 + Math.sin(shard * 12.9898) * 0.05 + drift * 0.012
    out[o + 1] = (out[o + 1] ?? 0) * 1.04 + Math.cos(shard * 78.233) * 0.05 - 0.02
  }
}

export function ringTargets(out: Float32Array, seeds: Float32Array, count: number, time: number) {
  for (let k = 0; k < count; k += 1) {
    const o = k * 3
    const orbit = Math.floor((seeds[o] ?? 0) * 3)
    const radius = 0.52 + orbit * 0.15
    const speed = (orbit % 2 === 0 ? 1 : -1) * (0.9 - orbit * 0.2)
    const angle = (seeds[o + 1] ?? 0) * tau + time * speed
    const wobble = Math.sin(angle * 3 + time * 2.4) * 0.025
    out[o] = Math.cos(angle) * (radius + wobble)
    out[o + 1] = Math.sin(angle) * (radius + wobble)
    out[o + 2] = Math.sin(angle * 2 + time) * 0.08
  }
}

function perimeter(q: number, half: number): [number, number] {
  const side = Math.min(3, Math.floor(q * 4))
  const s = ((q * 4) % 1) * 2 - 1
  if (side === 0) {
    return [s * half, -half]
  }
  if (side === 1) {
    return [half, s * half]
  }
  if (side === 2) {
    return [-s * half, half]
  }
  return [-half, -s * half]
}

function groundPoint(out: Float32Array, o: number, u: number) {
  const lines = cityGridSize + 1
  const cell = (cityHalfSpan * 2) / cityGridSize
  const line = Math.min(lines * 2 - 1, Math.floor(u * lines * 2))
  const reach = cityHalfSpan + 0.14
  const position = -reach + ((u * lines * 2) % 1) * reach * 2
  const offset = -cityHalfSpan + cell * (line % lines)
  const alongX = line < lines
  out[o] = alongX ? position : offset
  out[o + 1] = cityFloor
  out[o + 2] = alongX ? offset : position
}

export function cityBlockTargets(out: Float32Array, count: number, heights: Float32Array) {
  const groundCount = Math.ceil(count / groundEvery)
  const perBuilding = Math.max(1, Math.ceil((count - groundCount) / cityBuildingCount))
  for (let k = 0; k < count; k += 1) {
    const o = k * 3
    const groundBefore = Math.floor(k / groundEvery) + 1
    if (k % groundEvery === 0) {
      groundPoint(out, o, (groundBefore - 0.5) / groundCount)
      continue
    }
    const sequence = k - groundBefore
    const index = sequence % cityBuildingCount
    const building = cityBuildings[index]
    if (!building) {
      continue
    }
    const { x, z, half } = building
    const rise = heights[index] ?? building.base
    const u = (Math.floor(sequence / cityBuildingCount) + 0.5) / perBuilding
    if (u < 0.46) {
      const v = u / 0.46
      const [dx, dz] = perimeter(Math.floor(v * 4) / 4, half)
      out[o] = x + dx
      out[o + 1] = cityFloor + rise * ((v * 4) % 1)
      out[o + 2] = z + dz
    } else if (u < 0.82) {
      const [dx, dz] = perimeter((u - 0.46) / 0.36, half)
      out[o] = x + dx
      out[o + 1] = cityFloor + rise
      out[o + 2] = z + dz
    } else {
      const v = ((u - 0.82) / 0.18) * 2
      const [dx, dz] = perimeter(v % 1, half)
      out[o] = x + dx
      out[o + 1] = cityFloor + rise * ((Math.floor(v) + 1) / 3)
      out[o + 2] = z + dz
    }
  }
}

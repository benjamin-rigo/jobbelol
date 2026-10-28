import { contrast, fitLightness, toHsl } from './color'

export type Pair = { bg: string; ink: string }

type Rgb = [number, number, number]

const toHexRgb = ([r, g, b]: Rgb) => `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`
const distance = (a: Rgb, b: Rgb) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])

function samplePixels(image: HTMLImageElement): Rgb[] {
  const size = 64
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(image, 0, 0, size, size)
  const data = ctx.getImageData(0, 0, size, size).data
  const pixels: Rgb[] = []
  for (let i = 0; i < data.length; i += 4) if (data[i + 3] > 128) pixels.push([data[i], data[i + 1], data[i + 2]])
  return pixels
}

// k-means over the downscaled image, most common colors first, near-duplicates merged.
function dominantColors(pixels: Rgb[], k = 8): string[] {
  const sorted = [...pixels].sort((a, b) => a[0] + a[1] + a[2] - (b[0] + b[1] + b[2]))
  let centers: Rgb[] = Array.from({ length: k }, (_, i) => sorted[Math.floor(((i + 0.5) * sorted.length) / k)])
  let counts: number[] = []
  for (let iter = 0; iter < 12; iter++) {
    const sums = centers.map(() => [0, 0, 0])
    counts = centers.map(() => 0)
    for (const p of pixels) {
      let best = 0
      for (let c = 1; c < centers.length; c++) if (distance(p, centers[c]) < distance(p, centers[best])) best = c
      sums[best][0] += p[0]
      sums[best][1] += p[1]
      sums[best][2] += p[2]
      counts[best]++
    }
    centers = centers.map((c, i) => (counts[i] ? [sums[i][0] / counts[i], sums[i][1] / counts[i], sums[i][2] / counts[i]] : c))
  }
  const ranked = centers.map((c, i) => ({ c, n: counts[i] })).filter((x) => x.n > pixels.length * 0.02).sort((a, b) => b.n - a.n)
  const unique: Rgb[] = []
  for (const { c } of ranked) if (unique.every((u) => distance(u, c) > 32)) unique.push(c)
  return unique.map(toHexRgb)
}

// Each color becomes a background; its ink is the image color with the best contrast, nudged if needed.
function makePairs(colors: string[]): Pair[] {
  return colors.map((bg) => {
    const [ink] = colors.filter((c) => c !== bg).sort((a, b) => contrast(bg, b) - contrast(bg, a))
    return { bg, ink: fitLightness(ink ?? bg, [bg]) }
  })
}

export async function pairsFromImage(file: File): Promise<Pair[]> {
  const url = URL.createObjectURL(file)
  try {
    const image = new Image()
    image.src = url
    await image.decode()
    const colors = dominantColors(samplePixels(image))
    // Most saturated first: those make the most characterful card colors.
    return makePairs(colors).sort((a, b) => toHsl(b.bg)[1] - toHsl(a.bg)[1])
  } finally {
    URL.revokeObjectURL(url)
  }
}

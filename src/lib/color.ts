export const MIN_CONTRAST = 4.5

export const isHex = (v: string) => /^#[0-9a-f]{6}$/i.test(v)

const channels = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)

export function luminance(hex: string) {
  const [r, g, b] = channels(hex).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function contrast(a: string, b: string) {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p)
  return (x + 0.05) / (y + 0.05)
}

export function toHsl(hex: string): [number, number, number] {
  const [r, g, b] = channels(hex)
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return [0, 0, l]
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4
  return [h / 6, s, l]
}

export function toHex(h: number, s: number, l: number) {
  const f = (n: number) => {
    const k = (n + h * 12) % 12
    const a = s * Math.min(l, 1 - l)
    const c = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))
    return Math.round(c * 255).toString(16).padStart(2, '0')
  }
  return `#${f(0)}${f(8)}${f(4)}`
}

// Nudges lightness the shortest way until the color clears MIN_CONTRAST against every other color.
export function fitLightness(value: string, others: string[]) {
  const ok = (hex: string) => others.every((o) => contrast(hex, o) >= MIN_CONTRAST)
  if (ok(value)) return value
  const [h, s, l] = toHsl(value)
  for (let step = 0.01; step <= 1; step += 0.01) {
    for (const candidate of [l - step, l + step]) {
      if (candidate < 0 || candidate > 1) continue
      const hex = toHex(h, s, candidate)
      if (ok(hex)) return hex
    }
  }
  return value
}

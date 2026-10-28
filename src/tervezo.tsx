import { StrictMode, useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { DayColumn } from '@/components/DayColumn'
import { EventTile } from '@/components/EventTile'
import { KINDS, dayKey, events } from '@/lib/events'

const STORAGE = 'jobbelol:tervezo'

const BASE = [
  { token: 'frame', label: 'Keret (fejléc, rések)' },
  { token: 'cell', label: 'Alap' },
  { token: 'paper', label: 'Szöveg' },
  { token: 'muted', label: 'Halvány szöveg' },
]

const ALL_TOKENS = [...BASE.map((b) => b.token), ...KINDS.flatMap((k) => [`k-${k.id}`, `k-${k.id}-ink`])]

function readDefaults() {
  const style = getComputedStyle(document.documentElement)
  return Object.fromEntries(ALL_TOKENS.map((t) => [t, style.getPropertyValue(`--color-${t}`).trim()]))
}

function luminance(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrast(a: string, b: string) {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p)
  return (x + 0.05) / (y + 0.05)
}

const isHex = (v: string) => /^#[0-9a-f]{6}$/i.test(v)

const MIN_CONTRAST = 4.5

function partners(token: string): string[] {
  if (token === 'paper' || token === 'muted') return ['cell', 'frame']
  if (token === 'cell' || token === 'frame') return ['paper', 'muted']
  return [token.endsWith('-ink') ? token.slice(0, -4) : `${token}-ink`]
}

function toHsl(hex: string): [number, number, number] {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return [0, 0, l]
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4
  return [h / 6, s, l]
}

function toHex(h: number, s: number, l: number) {
  const f = (n: number) => {
    const k = (n + h * 12) % 12
    const a = s * Math.min(l, 1 - l)
    const c = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))
    return Math.round(c * 255).toString(16).padStart(2, '0')
  }
  return `#${f(0)}${f(8)}${f(4)}`
}

// Nudges lightness the shortest way until the color clears MIN_CONTRAST against every partner.
function enforce(token: string, value: string, colors: Record<string, string>) {
  const others = partners(token).map((t) => colors[t]).filter(isHex)
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

export function ColorField({ label, value, adjusted, onChange }: { label: string; value: string; adjusted: boolean; onChange: (v: string) => void }) {
  const [text, setText] = useState(value)
  const [synced, setSynced] = useState(value)
  if (value !== synced) {
    setSynced(value)
    setText(value)
  }

  return (
    <label className="flex items-center gap-2 font-mono text-[11px]">
      <input type="color" value={isHex(value) ? value : '#000000'} onChange={(e) => onChange(e.target.value)} className="size-8 shrink-0 cursor-pointer rounded-lg bg-transparent" />
      <input
        value={text}
        onChange={(e) => {
          setText(e.target.value)
          if (isHex(e.target.value)) onChange(e.target.value.toLowerCase())
        }}
        className="w-20 rounded-lg bg-cell px-2 py-2 text-paper"
      />
      <span className="text-muted">{label}</span>
      {adjusted && <span className="ml-auto text-muted">kontraszt miatt korrigálva</span>}
    </label>
  )
}

export function Ratio({ a, b }: { a: string; b: string }) {
  if (!isHex(a) || !isHex(b)) return null
  const r = contrast(a, b)
  return <span className={`rounded-full px-2 py-0.5 font-mono text-[11px] ${r >= 4.5 ? 'bg-cell text-paper' : 'bg-[#8a173f] text-white'}`}>{r.toFixed(2)}:1 {r >= 4.5 ? 'AA' : 'kevés'}</span>
}

export function Tervezo() {
  const [defaults] = useState(readDefaults)
  const [colors, setColors] = useState<Record<string, string>>(() => ({ ...defaults, ...JSON.parse(localStorage.getItem(STORAGE) ?? '{}') }))
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    for (const t of ALL_TOKENS) document.documentElement.style.setProperty(`--color-${t}`, colors[t])
    localStorage.setItem(STORAGE, JSON.stringify(colors))
  }, [colors])

  const [adjusted, setAdjusted] = useState<Record<string, boolean>>({})

  const set = (token: string) => (value: string) => {
    const fixed = enforce(token, value, colors)
    setColors({ ...colors, [token]: fixed })
    setAdjusted({ ...adjusted, [token]: fixed !== value })
  }
  const [now] = useState(() => new Date())

  const samples = KINDS.map((k) => events.find((e) => e.kind === k.id && e.start >= now) ?? events.find((e) => e.kind === k.id)!)
  const sampleDays = useMemo(() => {
    const byDay = Map.groupBy(events.filter((e) => e.start >= now), (e) => dayKey(e.start))
    return [...byDay].sort((a, b) => new Set(b[1].map((e) => e.kind)).size - new Set(a[1].map((e) => e.kind)).size).slice(0, 4).sort((a, b) => a[0].localeCompare(b[0]))
  }, [now])

  const css = ALL_TOKENS.map((t) => `  --color-${t}: ${colors[t]};`).join('\n')

  return (
    <div className="min-h-dvh bg-frame p-8 text-paper">
      <header className="mb-8 flex items-center gap-4">
        <img src="/logo.svg" alt="Jobb elöl" className="h-12 w-auto" />
        <h1 className="text-xl">Színtervező</h1>
        <div className="ml-auto flex gap-2">
          <button type="button" onClick={() => { setColors(defaults); setAdjusted({}) }} className="min-h-8 rounded-lg bg-cell px-4 font-mono text-[11px] hover:bg-raised">
            Visszaállítás
          </button>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(css)
              setCopied(true)
              setTimeout(() => setCopied(false), 2000)
            }}
            className="min-h-8 rounded-lg bg-paper px-4 font-mono text-[11px] text-frame hover:opacity-80"
          >
            {copied ? 'Kimásolva' : 'CSS másolása'}
          </button>
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-[384px_1fr]">
        <section className="flex flex-col gap-6">
          <div className="flex flex-col gap-2 rounded-2xl bg-cell/40 p-4">
            <h2 className="mb-2 font-mono text-xs text-muted">Alapszínek</h2>
            {BASE.map((b) => (
              <ColorField key={b.token} label={b.label} value={colors[b.token]} adjusted={!!adjusted[b.token]} onChange={set(b.token)} />
            ))}
          </div>

          {KINDS.map((k) => (
            <div key={k.id} className="flex flex-col gap-2 rounded-2xl bg-cell/40 p-4">
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-sm">{k.label}</h2>
                <Ratio a={colors[`k-${k.id}`]} b={colors[`k-${k.id}-ink`]} />
              </div>
              <ColorField label="Háttér" value={colors[`k-${k.id}`]} adjusted={!!adjusted[`k-${k.id}`]} onChange={set(`k-${k.id}`)} />
              <ColorField label="Szöveg" value={colors[`k-${k.id}-ink`]} adjusted={!!adjusted[`k-${k.id}-ink`]} onChange={set(`k-${k.id}-ink`)} />
            </div>
          ))}
        </section>

        <section className="flex min-w-0 flex-col gap-8">
          <div>
            <h2 className="mb-4 font-mono text-xs text-muted">Kategóriák egymás mellett</h2>
            <div className="grid grid-cols-[repeat(auto-fill,256px)] gap-1">
              {samples.map((e) => (
                <EventTile key={e.id} event={e} now={now} saved={false} onKind={() => {}} onSave={() => {}} />
              ))}
            </div>
          </div>

          <div className="min-w-0">
            <h2 className="mb-4 font-mono text-xs text-muted">Valódi napok, a legtöbb kategóriával</h2>
            <div className="flex gap-1 overflow-x-auto">
              {sampleDays.map(([key, evs]) => (
                <DayColumn key={key} dayKey={key} events={evs} isToday={false} now={now} saved={new Set()} onKind={() => {}} onSave={() => {}} />
              ))}
            </div>
          </div>

          <div>
            <h2 className="mb-4 font-mono text-xs text-muted">CSS tokenek (src/index.css)</h2>
            <pre className="overflow-x-auto rounded-2xl bg-cell/40 p-4 font-mono text-[11px] leading-relaxed">{css}</pre>
          </div>
        </section>
      </div>
    </div>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Tervezo />
  </StrictMode>,
)

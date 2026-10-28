import { StrictMode, useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { DayColumn } from '@/components/DayColumn'
import { EventTile } from '@/components/EventTile'
import { MIN_CONTRAST, contrast, fitLightness, isHex } from '@/lib/color'
import { KINDS, dayKey, events, type Kind } from '@/lib/events'
import { pairsFromImage, type Pair } from '@/lib/palette'

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

function partners(token: string): string[] {
  if (token === 'paper' || token === 'muted') return ['cell', 'frame']
  if (token === 'cell' || token === 'frame') return ['paper', 'muted']
  return [token.endsWith('-ink') ? token.slice(0, -4) : `${token}-ink`]
}

const enforce = (token: string, value: string, colors: Record<string, string>) =>
  fitLightness(value, partners(token).map((t) => colors[t]).filter(isHex))

// Busiest categories first, so auto-assign gives them the image's strongest pairs.
const KINDS_BY_SIZE = [...KINDS].sort((a, b) => events.filter((e) => e.kind === b.id).length - events.filter((e) => e.kind === a.id).length)

function PairSwatch({ pair, onApply }: { pair: Pair; onApply: (kind: Kind) => void }) {
  return (
    <div
      draggable
      onDragStart={(e) => e.dataTransfer.setData('application/x-pair', JSON.stringify(pair))}
      className="flex cursor-grab flex-col gap-2 rounded-2xl p-2 active:cursor-grabbing"
      style={{ background: pair.bg, color: pair.ink }}
    >
      <span className="text-2xl leading-none">Aa</span>
      <span className="font-mono text-[10px]">{contrast(pair.bg, pair.ink).toFixed(1)}:1</span>
      <select
        aria-label="Pár alkalmazása kategóriára"
        value=""
        onChange={(e) => onApply(e.target.value as Kind)}
        className="rounded bg-frame/40 font-mono text-[10px]"
        style={{ color: pair.ink }}
      >
        <option value="">ide…</option>
        {KINDS.map((k) => (
          <option key={k.id} value={k.id}>
            {k.label}
          </option>
        ))}
      </select>
    </div>
  )
}

function ImagePairs({ onApply, onAutoAssign }: { onApply: (kind: Kind, pair: Pair) => void; onAutoAssign: (pairs: Pair[]) => void }) {
  const [pairs, setPairs] = useState<Pair[]>([])
  const [preview, setPreview] = useState<string | null>(null)
  const [over, setOver] = useState(false)

  const load = async (file: File | undefined) => {
    if (!file?.type.startsWith('image/')) return
    setPreview(URL.createObjectURL(file))
    setPairs(await pairsFromImage(file))
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-cell/40 p-4">
      <h2 className="font-mono text-xs text-muted">Párok képből</h2>
      <label
        onDragOver={(e) => {
          e.preventDefault()
          setOver(true)
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setOver(false)
          load(e.dataTransfer.files[0])
        }}
        className={`flex min-h-24 cursor-pointer items-center justify-center gap-4 overflow-hidden rounded-2xl p-4 text-center text-xs text-muted transition-colors duration-150 ${over ? 'bg-raised' : 'bg-frame'}`}
      >
        {preview && <img src={preview} alt="" className="h-16 w-auto rounded-lg" />}
        <span>{preview ? 'Másik kép: húzd ide vagy kattints' : 'Húzz ide egy képet, vagy kattints'}</span>
        <input type="file" accept="image/*" className="sr-only" onChange={(e) => load(e.target.files?.[0])} />
      </label>
      {pairs.length > 0 && (
        <>
          <div className="grid grid-cols-4 gap-2">
            {pairs.map((p) => (
              <PairSwatch key={p.bg + p.ink} pair={p} onApply={(kind) => onApply(kind, p)} />
            ))}
          </div>
          <p className="text-xs text-muted">Húzz egy párt egy kategóriára, vagy válaszd ki alatta, hová kerüljön.</p>
          <button type="button" onClick={() => onAutoAssign(pairs)} className="min-h-8 rounded-lg bg-paper px-4 font-mono text-[11px] text-frame hover:opacity-80">
            Automatikus kiosztás
          </button>
        </>
      )}
    </div>
  )
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
      {adjusted && <span className="ml-auto text-muted">igazítva a kontraszthoz</span>}
    </label>
  )
}

export function Ratio({ a, b }: { a: string; b: string }) {
  if (!isHex(a) || !isHex(b)) return null
  const r = contrast(a, b)
  return <span className={`rounded-full px-2 py-0.5 font-mono text-[11px] ${r >= MIN_CONTRAST ? 'bg-cell text-paper' : 'bg-[#8a173f] text-white'}`}>{r.toFixed(2)}:1 {r >= MIN_CONTRAST ? 'AA' : 'kevés'}</span>
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

  // The edited color stays as chosen; its partners shift lightness to keep contrast.
  const set = (token: string) => (value: string) => {
    const next = { ...colors, [token]: value }
    const marks: Record<string, boolean> = { [token]: false }
    for (const partner of partners(token)) {
      const fixed = enforce(partner, next[partner], next)
      marks[partner] = fixed !== next[partner]
      next[partner] = fixed
    }
    next[token] = enforce(token, value, next)
    marks[token] = next[token] !== value
    setColors(next)
    setAdjusted({ ...adjusted, ...marks })
  }
  const applyPair = (kind: Kind, pair: Pair) => {
    setColors((c) => ({ ...c, [`k-${kind}`]: pair.bg, [`k-${kind}-ink`]: fitLightness(pair.ink, [pair.bg]) }))
    setAdjusted((a) => ({ ...a, [`k-${kind}`]: false, [`k-${kind}-ink`]: false }))
  }
  const autoAssign = (pairs: Pair[]) => KINDS_BY_SIZE.forEach((k, i) => pairs[i] && applyPair(k.id, pairs[i]))
  const [dropTarget, setDropTarget] = useState<Kind | null>(null)
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
          <ImagePairs onApply={applyPair} onAutoAssign={autoAssign} />

          <div className="flex flex-col gap-2 rounded-2xl bg-cell/40 p-4">
            <h2 className="mb-2 font-mono text-xs text-muted">Alapszínek</h2>
            {BASE.map((b) => (
              <ColorField key={b.token} label={b.label} value={colors[b.token]} adjusted={!!adjusted[b.token]} onChange={set(b.token)} />
            ))}
          </div>

          {KINDS.map((k) => (
            <div
              key={k.id}
              onDragOver={(e) => {
                e.preventDefault()
                setDropTarget(k.id)
              }}
              onDragLeave={() => setDropTarget(null)}
              onDrop={(e) => {
                e.preventDefault()
                setDropTarget(null)
                const data = e.dataTransfer.getData('application/x-pair')
                if (data) applyPair(k.id, JSON.parse(data))
              }}
              className={`flex flex-col gap-2 rounded-2xl p-4 transition-colors duration-150 ${dropTarget === k.id ? 'bg-raised' : 'bg-cell/40'}`}
            >
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-sm">{k.label}</h2>
                <Ratio a={colors[`k-${k.id}`]} b={colors[`k-${k.id}-ink`]} />
              </div>
              <ColorField label="Háttér" value={colors[`k-${k.id}`]} adjusted={!!adjusted[`k-${k.id}`]} onChange={set(`k-${k.id}`)} />
              <ColorField label="Szöveg" value={colors[`k-${k.id}-ink`]} adjusted={!!adjusted[`k-${k.id}-ink`]} onChange={set(`k-${k.id}-ink`)} />
            </div>
          ))}
        </section>

        <section
          className="flex min-w-0 flex-col gap-8"
          onDragOver={(e) => {
            const kind = (e.target as HTMLElement).closest<HTMLElement>('[data-kind]')?.dataset.kind as Kind | undefined
            if (!kind) return
            e.preventDefault()
            setDropTarget(kind)
          }}
          onDragLeave={() => setDropTarget(null)}
          onDrop={(e) => {
            const kind = (e.target as HTMLElement).closest<HTMLElement>('[data-kind]')?.dataset.kind as Kind | undefined
            const data = e.dataTransfer.getData('application/x-pair')
            setDropTarget(null)
            if (!kind || !data) return
            e.preventDefault()
            applyPair(kind, JSON.parse(data))
          }}
        >
          {dropTarget && <style>{`article[data-kind="${dropTarget}"] { outline: 2px solid var(--color-paper); outline-offset: 2px; }`}</style>}
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

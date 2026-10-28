import { StrictMode, useEffect, useMemo, useRef, useState } from 'react'
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


type Texture = {
  grain: boolean
  library: string[]
  assign: Partial<Record<Kind, number | null>>
  opacity: number
  blend: string
  size: number
}

const TEXTURE_STORAGE = 'jobbelol:tervezo:textura'
// Mirrors the defaults in src/index.css.
const PROJECT_TEXTURES = ['karcolt-fem', 'orveny-firka', 'szenrajz', 'pontozas', 'suru-firka', 'szenpor'].map((n) => `${import.meta.env.BASE_URL}textures/${n}.jpg`)
const DEFAULT_TEXTURE: Texture = {
  grain: true,
  library: PROJECT_TEXTURES,
  assign: { buli: 0, koncert: 1, komolyzene: 2, szinpad: 3, gyerek: 4, egyeb: 5 },
  opacity: 0.2,
  blend: 'soft-light',
  size: 336,
}
const BLENDS = ['overlay', 'soft-light', 'multiply', 'screen']

const GRAIN_SIZE = '160px'

function textureVars(t: Texture): Record<string, string> {
  const vars: Record<string, string> = { '--card-texture-opacity': String(t.opacity), '--card-texture-blend': t.blend }
  for (const k of KINDS) {
    const layers: [string, string][] = []
    if (t.grain) layers.push(['var(--card-texture-noise)', GRAIN_SIZE])
    const image = t.library[t.assign[k.id] ?? -1]
    if (image) layers.push([`url(${image})`, `${t.size}px`])
    vars[`--texture-${k.id}`] = layers.map(([i]) => i).join(', ') || 'none'
    vars[`--texture-size-${k.id}`] = layers.map(([, size]) => size).join(', ') || GRAIN_SIZE
  }
  return vars
}

function loadTexture(): Texture {
  const saved = JSON.parse(localStorage.getItem(TEXTURE_STORAGE) ?? '{}')
  if ('image' in saved) {
    saved.library = saved.image ? [saved.image] : []
    saved.assign = saved.image && saved.useImage ? Object.fromEntries(KINDS.map((k) => [k.id, 0])) : {}
  }
  const texture: Texture = { ...DEFAULT_TEXTURE, ...saved }
  // Project textures are always in the library, first; saved assignments shift past them.
  const missing = PROJECT_TEXTURES.filter((t) => !texture.library.includes(t))
  if (!missing.length) return texture
  const shift = (i: number | null | undefined) => (i == null ? i : i + missing.length)
  return {
    ...texture,
    library: [...missing, ...texture.library],
    assign: Object.fromEntries(Object.entries(texture.assign).map(([k, v]) => [k, shift(v)])),
  }
}

// Distinct textures per category while the library allows it, then repeats.
function randomAssign(count: number): Texture['assign'] {
  const order = Array.from({ length: count }, (_, i) => i).sort(() => Math.random() - 0.5)
  return Object.fromEntries(KINDS.map((k, i) => [k.id, count ? order[i % count] : null]))
}

async function shrinkImage(file: File, max = 512) {
  const url = URL.createObjectURL(file)
  try {
    const image = new Image()
    image.src = url
    await image.decode()
    const scale = Math.min(1, max / Math.max(image.width, image.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(image.width * scale)
    canvas.height = Math.round(image.height * scale)
    canvas.getContext('2d')!.drawImage(image, 0, 0, canvas.width, canvas.height)
    return canvas.toDataURL('image/jpeg', 0.85)
  } finally {
    URL.revokeObjectURL(url)
  }
}

function TexturePanel({ texture, onChange }: { texture: Texture; onChange: (t: Texture) => void }) {
  const upload = async (files: FileList | null) => {
    const images = [...(files ?? [])].filter((f) => f.type.startsWith('image/'))
    if (!images.length) return
    onChange({ ...texture, library: [...texture.library, ...(await Promise.all(images.map((f) => shrinkImage(f))))] })
  }

  const remove = (index: number) => {
    const assign = Object.fromEntries(
      Object.entries(texture.assign).map(([k, v]) => [k, v === index ? null : v != null && v > index ? v - 1 : v]),
    )
    onChange({ ...texture, library: texture.library.filter((_, i) => i !== index), assign })
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-cell/40 p-4">
      <h2 className="font-mono text-xs text-muted">Textúrák</h2>
      <button
        type="button"
        aria-pressed={texture.grain}
        onClick={() => onChange({ ...texture, grain: !texture.grain })}
        className={`min-h-8 rounded-lg px-2 font-mono text-[11px] ${texture.grain ? 'bg-paper text-frame' : 'bg-cell hover:bg-raised'}`}
      >
        Szemcse minden kártyán
      </button>

      <label
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          upload(e.dataTransfer.files)
        }}
        className="flex min-h-16 cursor-pointer items-center justify-center rounded-2xl bg-frame p-4 text-center text-xs text-muted"
      >
        Húzz ide textúraképeket (többet is), vagy kattints
        <input type="file" accept="image/*" multiple className="sr-only" onChange={(e) => upload(e.target.files)} />
      </label>

      {texture.library.length > 0 && (
        <>
          <div className="grid grid-cols-4 gap-2">
            {texture.library.map((src, i) => (
              <div key={i} className="group relative">
                <img
                  src={src}
                  alt={`Textúra ${i + 1}`}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData('application/x-texture', String(i))}
                  className="aspect-square w-full cursor-grab rounded-lg object-cover active:cursor-grabbing"
                />
                <button
                  type="button"
                  aria-label={`Textúra ${i + 1} törlése`}
                  onClick={() => remove(i)}
                  className="absolute top-1 right-1 grid size-4 place-items-center rounded-full bg-frame text-[10px] opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted">Húzz egy textúrát egy kategóriára vagy kártyára.</p>
          <button
            type="button"
            onClick={() => onChange({ ...texture, assign: randomAssign(texture.library.length) })}
            className="min-h-8 rounded-lg bg-paper px-4 font-mono text-[11px] text-frame hover:opacity-80"
          >
            Véletlen kiosztás
          </button>
        </>
      )}

      <label className="flex items-center gap-4 font-mono text-[11px] text-muted">
        <span className="w-16">Erősség</span>
        <input type="range" min={0} max={1} step={0.01} value={texture.opacity} onChange={(e) => onChange({ ...texture, opacity: Number(e.target.value) })} className="flex-1" />
        <span className="w-8 text-right">{Math.round(texture.opacity * 100)}%</span>
      </label>
      <label className="flex items-center gap-4 font-mono text-[11px] text-muted">
        <span className="w-16">Képméret</span>
        <input type="range" min={32} max={512} step={16} value={texture.size} onChange={(e) => onChange({ ...texture, size: Number(e.target.value) })} className="flex-1" />
        <span className="w-8 text-right">{texture.size}</span>
      </label>
      <div className="flex gap-2">
        {BLENDS.map((b) => (
          <button
            key={b}
            type="button"
            aria-pressed={texture.blend === b}
            onClick={() => onChange({ ...texture, blend: b })}
            className={`min-h-8 flex-1 rounded-lg px-2 font-mono text-[10px] ${texture.blend === b ? 'bg-paper text-frame' : 'bg-cell hover:bg-raised'}`}
          >
            {b}
          </button>
        ))}
      </div>
    </div>
  )
}

function TexturePicker({ texture, kind, onChange }: { texture: Texture; kind: Kind; onChange: (t: Texture) => void }) {
  if (!texture.library.length) return null
  const current = texture.assign[kind] ?? null
  const pick = (i: number | null) => onChange({ ...texture, assign: { ...texture.assign, [kind]: i } })
  return (
    <div className="flex flex-wrap items-center gap-1">
      <button
        type="button"
        aria-pressed={current === null}
        onClick={() => pick(null)}
        className={`size-8 rounded-lg font-mono text-[10px] ${current === null ? 'bg-paper text-frame' : 'bg-cell text-muted hover:bg-raised'}`}
      >
        –
      </button>
      {texture.library.map((src, i) => (
        <button
          key={i}
          type="button"
          aria-label={`Textúra ${i + 1}`}
          aria-pressed={current === i}
          onClick={() => pick(i)}
          className={`size-8 overflow-hidden rounded-lg ${current === i ? 'outline-2 outline-offset-1 outline-paper' : 'opacity-60 hover:opacity-100'}`}
        >
          <img src={src} alt="" className="size-full object-cover" />
        </button>
      ))}
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
  const [texture, setTexture] = useState<Texture>(loadTexture)

  useEffect(() => {
    for (const [k, v] of Object.entries(textureVars(texture))) document.documentElement.style.setProperty(k, v)
    try {
      localStorage.setItem(TEXTURE_STORAGE, JSON.stringify(texture))
    } catch {
      localStorage.setItem(TEXTURE_STORAGE, JSON.stringify({ ...texture, library: [], assign: {} }))
    }
  }, [texture])
  const [past, setPast] = useState<Record<string, string>[]>([])
  const [future, setFuture] = useState<Record<string, string>[]>([])
  const lastField = useRef<string | null>(null)

  // Consecutive edits of the same field (e.g. dragging a color picker) collapse into one history step.
  const commit = (next: Record<string, string>, field: string | null = null) => {
    if (field === null || field !== lastField.current) setPast((p) => [...p, colors])
    lastField.current = field
    setFuture([])
    setColors(next)
  }

  const undo = () => {
    if (!past.length) return
    setFuture((f) => [colors, ...f])
    setColors(past[past.length - 1])
    setPast((p) => p.slice(0, -1))
    setAdjusted({})
    lastField.current = null
  }

  const redo = () => {
    if (!future.length) return
    setPast((p) => [...p, colors])
    setColors(future[0])
    setFuture((f) => f.slice(1))
    setAdjusted({})
    lastField.current = null
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== 'z') return
      if ((e.target as HTMLElement).closest('input')) return
      e.preventDefault()
      if (e.shiftKey) redo()
      else undo()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

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
    commit(next, token)
    setAdjusted({ ...adjusted, ...marks })
  }
  const withPair = (c: Record<string, string>, kind: Kind, pair: Pair) => ({ ...c, [`k-${kind}`]: pair.bg, [`k-${kind}-ink`]: fitLightness(pair.ink, [pair.bg]) })

  const swapPair = (kind: Kind) => {
    commit({ ...colors, [`k-${kind}`]: colors[`k-${kind}-ink`], [`k-${kind}-ink`]: colors[`k-${kind}`] })
    setAdjusted({ ...adjusted, [`k-${kind}`]: false, [`k-${kind}-ink`]: false })
  }

  const applyPair = (kind: Kind, pair: Pair) => {
    commit(withPair(colors, kind, pair))
    setAdjusted({ ...adjusted, [`k-${kind}`]: false, [`k-${kind}-ink`]: false })
  }

  const autoAssign = (pairs: Pair[]) => {
    commit(KINDS_BY_SIZE.reduce((c, k, i) => (pairs[i] ? withPair(c, k.id, pairs[i]) : c), colors))
    setAdjusted({})
  }
  const [dropTarget, setDropTarget] = useState<Kind | null>(null)

  const dropOn = (kind: Kind, data: DataTransfer) => {
    const pair = data.getData('application/x-pair')
    const tex = data.getData('application/x-texture')
    if (pair) applyPair(kind, JSON.parse(pair))
    else if (tex) setTexture({ ...texture, assign: { ...texture.assign, [kind]: Number(tex) } })
  }
  const [now] = useState(() => new Date())

  const samples = KINDS.map((k) => events.find((e) => e.kind === k.id && e.start >= now) ?? events.find((e) => e.kind === k.id)!)
  const sampleDays = useMemo(() => {
    const byDay = Map.groupBy(events.filter((e) => e.start >= now), (e) => dayKey(e.start))
    return [...byDay].sort((a, b) => new Set(b[1].map((e) => e.kind)).size - new Set(a[1].map((e) => e.kind)).size).slice(0, 4).sort((a, b) => a[0].localeCompare(b[0]))
  }, [now])

  const css = [...ALL_TOKENS.map((t) => `  --color-${t}: ${colors[t]};`), ...Object.entries(textureVars(texture)).map(([k, v]) => `  ${k}: ${v};`)].join('\n')

  return (
    <div className="min-h-dvh bg-frame p-8 text-paper">
      <header className="mb-8 flex items-center gap-4">
        <img src={`${import.meta.env.BASE_URL}logo.svg`} alt="Jobb elöl" className="h-12 w-auto" />
        <h1 className="text-xl">Színtervező</h1>
        <div className="ml-auto flex gap-2">
          <button type="button" onClick={undo} disabled={!past.length} aria-label="Visszavonás" title="Visszavonás (Cmd+Z)" className="min-h-8 rounded-lg bg-cell px-4 font-mono text-[11px] hover:bg-raised disabled:opacity-40">
            ↶ Vissza
          </button>
          <button type="button" onClick={redo} disabled={!future.length} aria-label="Újra" title="Újra (Cmd+Shift+Z)" className="min-h-8 rounded-lg bg-cell px-4 font-mono text-[11px] hover:bg-raised disabled:opacity-40">
            ↷ Újra
          </button>
          <button type="button" onClick={() => { commit(defaults); setAdjusted({}) }} className="min-h-8 rounded-lg bg-cell px-4 font-mono text-[11px] hover:bg-raised">
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
          <TexturePanel texture={texture} onChange={setTexture} />

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
                dropOn(k.id, e.dataTransfer)
              }}
              className={`flex flex-col gap-2 rounded-2xl p-4 transition-colors duration-150 ${dropTarget === k.id ? 'bg-raised' : 'bg-cell/40'}`}
            >
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-sm">{k.label}</h2>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => swapPair(k.id)}
                    aria-label={`${k.label}: háttér és szöveg felcserélése`}
                    title="Háttér és szöveg felcserélése"
                    className="flex min-h-8 items-center gap-2 rounded-lg bg-cell px-2 font-mono text-[11px] hover:bg-raised"
                  >
                    <span aria-hidden className="flex">
                      <span className="size-3 rounded-full" style={{ background: colors[`k-${k.id}`] }} />
                      <span className="-ml-1 size-3 rounded-full" style={{ background: colors[`k-${k.id}-ink`] }} />
                    </span>
                    ⇄
                  </button>
                  <Ratio a={colors[`k-${k.id}`]} b={colors[`k-${k.id}-ink`]} />
                </div>
              </div>
              <ColorField label="Háttér" value={colors[`k-${k.id}`]} adjusted={!!adjusted[`k-${k.id}`]} onChange={set(`k-${k.id}`)} />
              <ColorField label="Szöveg" value={colors[`k-${k.id}-ink`]} adjusted={!!adjusted[`k-${k.id}-ink`]} onChange={set(`k-${k.id}-ink`)} />
              <TexturePicker texture={texture} kind={k.id} onChange={setTexture} />
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
            setDropTarget(null)
            if (!kind) return
            e.preventDefault()
            dropOn(kind, e.dataTransfer)
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

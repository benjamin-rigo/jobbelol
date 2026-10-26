import { useMemo, useRef, useState } from 'react'
import { DayColumn } from '@/components/DayColumn'
import { KindFilter } from '@/components/KindFilter'
import { KINDS, dayKey, dayRange, events, type Kind } from '@/lib/events'

const venueCount = new Set(events.map((e) => e.venue)).size

export default function App() {
  const [active, setActive] = useState<Set<Kind>>(() => new Set(KINDS.map((k) => k.id)))
  const board = useRef<HTMLDivElement>(null)
  const now = useMemo(() => new Date(), [])
  const today = dayKey(now)

  const days = useMemo(() => {
    const visible = events.filter((e) => active.has(e.kind) && (e.end ?? e.start) >= now)
    const byDay = Map.groupBy(visible, (e) => (e.start < now ? today : dayKey(e.start)))
    return dayRange(now, events[events.length - 1].start).map((key) => ({ key, events: byDay.get(key) ?? [] }))
  }, [active, now, today])

  const toggle = (kind: Kind) =>
    setActive((prev) => {
      const next = new Set(prev)
      if (next.has(kind)) next.delete(kind)
      else next.add(kind)
      return next
    })

  const step = (dir: 1 | -1) => {
    const el = board.current
    const col = el?.querySelector('section')
    if (el && col) el.scrollBy({ left: dir * col.offsetWidth })
  }

  return (
    <div className="flex h-dvh flex-col">
      <svg aria-hidden className="absolute size-0">
        <filter id="xerox">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" seed="7" />
          <feDisplacementMap in="SourceGraphic" scale="4" />
        </filter>
      </svg>
      <header className="border-b border-paper px-3 pt-3 pb-3 sm:px-4">
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
          <h1 className="stretch-wide text-[clamp(2.5rem,8vw,5.5rem)] leading-[0.85] font-black tracking-tight [filter:url(#xerox)]">
            Jobb elöl
          </h1>
          <p className="pb-1 font-mono text-xs leading-relaxed text-dim sm:text-right">
            Budapest, {venueCount} helyszín
            <br />
            klubok, koncertek, színpadok
          </p>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <KindFilter active={active} onToggle={toggle} />
          </div>
          <nav aria-label="Napok léptetése" className="flex shrink-0 gap-1">
            <button
              type="button"
              onClick={() => board.current?.scrollTo({ left: 0 })}
              className="min-h-10 border border-paper px-3 font-mono text-sm font-semibold hover:bg-paper hover:text-ink"
            >
              Ma
            </button>
            <button
              type="button"
              aria-label="Előző nap"
              onClick={() => step(-1)}
              className="hidden min-h-10 min-w-10 border border-paper text-lg font-bold hover:bg-paper hover:text-ink sm:block"
            >
              ←
            </button>
            <button
              type="button"
              aria-label="Következő nap"
              onClick={() => step(1)}
              className="hidden min-h-10 min-w-10 border border-paper text-lg font-bold hover:bg-paper hover:text-ink sm:block"
            >
              →
            </button>
          </nav>
        </div>
      </header>

      <main
        ref={board}
        tabIndex={0}
        aria-label="Programok napok szerint"
        className="flex min-h-0 flex-1 snap-x snap-mandatory overflow-auto motion-safe:scroll-smooth"
      >
        {days.map((d) => (
          <DayColumn key={d.key} dayKey={d.key} events={d.events} isToday={d.key === today} now={now} />
        ))}
      </main>
    </div>
  )
}

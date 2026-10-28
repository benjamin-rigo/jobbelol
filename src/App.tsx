import { Fragment, useMemo, useRef, useState } from 'react'
import { DayColumn } from '@/components/DayColumn'
import { FilterMenu, VenueSelect } from '@/components/FilterMenu'
import { KindSelect } from '@/components/KindTag'
import { MonthColumn } from '@/components/MonthColumn'
import { ProfileMenu } from '@/components/ProfileMenu'
import { dayKey, dayRange, events, type Kind } from '@/lib/events'
import { useSaved } from '@/lib/saved'

const GAP = 4

const venues = [...new Set(events.map((e) => e.venue))].sort((a, b) => a.localeCompare(b, 'hu'))

export default function App() {
  const [kind, setKind] = useState<Kind | null>(null)
  const [venue, setVenue] = useState<string | null>(null)
  const board = useRef<HTMLElement>(null)
  const [now] = useState(() => new Date())
  const today = dayKey(now)

  const days = useMemo(() => {
    const visible = events.filter(
      (e) => (!kind || e.kind === kind) && (!venue || e.venue === venue) && (e.end ?? e.start) >= now,
    )
    const byDay = Map.groupBy(visible, (e) => (e.start < now ? today : dayKey(e.start)))
    const all = dayRange(now, events[events.length - 1].start).map((key) => ({ key, events: byDay.get(key) ?? [] }))
    return kind || venue ? all.filter((d) => d.events.length > 0) : all
  }, [kind, venue, now, today])

  const [saved, toggleSaved] = useSaved()
  const savedEvents = useMemo(() => events.filter((e) => saved.has(e.id) && (e.end ?? e.start) >= now), [saved, now])

  const months = useMemo(() => Map.groupBy(days, (d) => d.key.slice(0, 7)), [days])

  const toggleKind = (k: Kind) => setKind((prev) => (prev === k ? null : k))

  const goToMonth = (month: string) => {
    const first = board.current?.querySelector<HTMLElement>(`[data-day^="${month}"]`)
    const strip = first?.previousElementSibling as HTMLElement | null
    if (first) board.current?.scrollTo({ left: first.offsetLeft - (strip?.offsetWidth ?? 0) - GAP })
  }

  return (
    <div className="flex h-dvh flex-col">
      <header className="relative z-40 flex items-center gap-2 bg-frame pt-4 pr-4 pb-2 pl-9 sm:pl-13">
        <h1 className="shrink-0">
          <img src={`${import.meta.env.BASE_URL}logo.svg`} alt="Jobb elöl" className="h-12 w-auto sm:h-16" />
        </h1>
        <p className="ml-2 min-w-0 font-display text-sm leading-tight font-extrabold text-paper sm:mr-4 sm:ml-4 sm:text-2xl sm:leading-none">Budapest egy helyen.</p>
        <KindSelect kind={kind} onKind={setKind} className="ml-auto hidden w-64 xl:block" />
        <VenueSelect venue={venue} venues={venues} onVenue={setVenue} className="hidden w-64 xl:block" />
        <div className="ml-auto xl:ml-0">
          <FilterMenu kind={kind} venue={venue} venues={venues} onKind={setKind} onVenue={setVenue} />
        </div>
        <ProfileMenu saved={savedEvents} onRemove={toggleSaved} />
      </header>

      <main
        ref={board}
        tabIndex={0}
        aria-label="Programok napok szerint"
        className="relative min-h-0 flex-1 scroll-pl-9 overflow-auto sm:scroll-pl-13 bg-frame"
      >
        <div className="flex min-h-full w-max gap-1 pr-1">
          {[...months].map(([month, monthDays], i) => (
            <Fragment key={month}>
              <MonthColumn monthKey={month} fromRight={months.size - 1 - i} onSelect={() => goToMonth(month)} />
              {monthDays.map((d) => (
                <DayColumn
                  key={d.key}
                  dayKey={d.key}
                  events={d.events}
                  isToday={d.key === today}
                  now={now}
                  saved={saved}
                  onKind={toggleKind}
                  onSave={toggleSaved}
                />
              ))}
            </Fragment>
          ))}
        </div>
      </main>
    </div>
  )
}

import { describeDay, type CalendarEvent } from '@/lib/events'
import { EventRow } from './EventRow'

type Props = { dayKey: string; events: CalendarEvent[]; isToday: boolean; now: Date }

export function DayColumn({ dayKey, events, isToday, now }: Props) {
  const { day, weekday, month } = describeDay(dayKey)

  return (
    <section
      aria-label={`${month} ${day}., ${weekday}`}
      className="flex w-[86vw] shrink-0 snap-start flex-col border-r border-dotted border-rule sm:w-[50vw] md:w-[34vw] lg:w-72"
    >
      <header className={`sticky top-0 z-10 px-3 pt-2 ${isToday ? 'bg-paper text-ink' : 'bg-ink'}`}>
        <div className="flex items-start justify-between gap-2">
          <span className="stretch-wide text-7xl leading-[0.9] font-black tracking-tight">{day}</span>
          {isToday && <span className="pt-1 font-mono text-xs font-semibold tracking-[0.3em] uppercase">ma</span>}
        </div>
        <div className="mt-1 flex justify-between font-mono text-xs font-semibold tracking-[0.3em] uppercase">
          <span>{weekday}</span>
          <span>{month}</span>
        </div>
        <div aria-hidden className="mt-2 overflow-hidden pb-1 font-mono text-xs leading-none whitespace-nowrap">
          {'*'.repeat(80)}
        </div>
      </header>

      <div className="flex-1">
        {events.length ? (
          events.map((e) => <EventRow key={e.id} event={e} now={now} />)
        ) : (
          <p className="px-3 py-4 font-mono text-xs text-dim">Erre a napra nincs program a kiválasztott típusokból.</p>
        )}
      </div>

      <footer className="px-3 pt-3 pb-5 font-mono text-xs">
        <div className="flex justify-between border-t border-dashed border-dim pt-2 font-semibold uppercase">
          <span className="tracking-[0.3em]">összesen</span>
          <span>{events.length}</span>
        </div>
        <div aria-hidden className="barcode mt-3 h-8 text-paper/80" />
      </footer>
    </section>
  )
}

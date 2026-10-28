import { describeDay, type CalendarEvent, type Kind } from '@/lib/events'
import { EventTile } from './EventTile'

type Props = {
  dayKey: string
  events: CalendarEvent[]
  isToday: boolean
  now: Date
  saved: Set<string>
  onKind: (kind: Kind) => void
  onSave: (id: string) => void
}

export function DayColumn({ dayKey, events, isToday, now, saved, onKind, onSave }: Props) {
  const { day, weekday, month } = describeDay(dayKey)

  return (
    <section
      data-day={dayKey}
      aria-label={`${month} ${day}., ${weekday}`}
      className="flex w-[calc(100vw-72px)] shrink-0 flex-col gap-1 pb-1 sm:w-[45vw] md:w-[30vw] lg:w-64"
    >
      <header className="sticky top-0 z-20 flex h-10 items-baseline gap-2 bg-frame px-4 pt-2">
        <span className="text-2xl leading-none font-light tracking-tight">{day}</span>
        <span className="font-mono text-[11px] text-muted">{weekday}</span>
        {isToday && <span className="ml-auto font-mono text-[11px] text-paper">ma</span>}
      </header>

      {events.map((e) => (
        <EventTile key={e.id} event={e} now={now} saved={saved.has(e.id)} onKind={onKind} onSave={onSave} />
      ))}
    </section>
  )
}

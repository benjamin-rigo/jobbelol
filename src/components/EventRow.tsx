import { KINDS, formatTime, type CalendarEvent } from '@/lib/events'

const swatch = Object.fromEntries(KINDS.map((k) => [k.id, k.swatch]))

export function EventRow({ event, now }: { event: CalendarEvent; now: Date }) {
  const live = event.start <= now && event.end !== null && now < event.end
  const place = event.stage ? `${event.venue}, ${event.stage}` : event.venue

  return (
    <a
      href={event.url ?? undefined}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex gap-3 border-b border-dotted border-rule px-3 py-3 hover:bg-paper hover:text-ink focus-visible:-outline-offset-2"
    >
      <time
        dateTime={event.start.toISOString()}
        className={`${swatch[event.kind]} h-fit shrink-0 px-1 font-mono text-sm font-semibold text-ink`}
      >
        {formatTime(event.start)}
      </time>
      <span className="min-w-0 flex-1">
        <span className="stretch-narrow block text-[1.05rem] leading-tight font-bold break-words">{event.title}</span>
        <span className="mt-1 block font-mono text-xs leading-snug text-dim group-hover:text-ink">
          {place}
          {event.end && <span className="whitespace-nowrap"> / {formatTime(event.end)}-ig</span>}
        </span>
        {live && (
          <span className="mt-1.5 inline-block bg-paper px-1 font-mono text-xs font-semibold text-ink group-hover:bg-ink group-hover:text-paper">
            most megy
          </span>
        )}
      </span>
    </a>
  )
}

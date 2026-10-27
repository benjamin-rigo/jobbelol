import { useState } from 'react'
import { formatTime, type CalendarEvent, type Kind } from '@/lib/events'
import { KindTag } from './KindTag'
import { Marquee } from './Marquee'

type Props = {
  event: CalendarEvent
  now: Date
  saved: boolean
  onKind: (kind: Kind) => void
  onSave: (id: string) => void
}

export function EventTile({ event, now, saved, onKind, onSave }: Props) {
  const live = event.start <= now && event.end !== null && now < event.end
  const place = event.stage ? `${event.venue}, ${event.stage}` : event.venue
  const [active, setActive] = useState(false)
  const on = () => setActive(true)
  const off = () => setActive(false)

  return (
    <article
      onMouseEnter={on}
      onMouseLeave={off}
      onFocus={on}
      onBlur={off}
      className="group relative flex h-tile shrink-0 flex-col rounded-2xl bg-cell px-4 py-4 hover:bg-frame transition-colors duration-150 has-[a:focus-visible]:outline-1 has-[a:focus-visible]:-outline-offset-1 has-[a:focus-visible]:outline-paper">
      <div className="flex items-baseline gap-2 font-mono text-[11px] text-muted">
        <time dateTime={event.start.toISOString()} className="whitespace-nowrap">
          {formatTime(event.start)}
          {event.end && `–${formatTime(event.end)}`}
        </time>
        {live && <span className="text-paper">most</span>}
        <span className="ml-auto">
          <KindTag kind={event.kind} onSelect={() => onKind(event.kind)} />
        </span>
      </div>
      <a
        href={event.url ?? undefined}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 line-clamp-2 text-[17px] leading-snug outline-none after:absolute after:inset-0"
      >
        {event.title}
      </a>
      <div className="mt-auto flex items-end justify-between gap-2 pt-2 text-xs text-muted">
        <Marquee text={place} active={active} rest="block truncate" className="min-w-0" />
        <SaveButton saved={saved} title={event.title} onClick={() => onSave(event.id)} />
      </div>
    </article>
  )
}

function SaveButton({ saved, title, onClick }: { saved: boolean; title: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={saved ? `Mentés törlése: ${title}` : `Mentés: ${title}`}
      onClick={onClick}
      className={`relative z-10 -m-2 shrink-0 p-2 hover:text-paper focus-visible:opacity-100 transition-colors duration-150 ${
        saved ? 'text-paper' : 'group-hover:opacity-100 [@media(hover:hover)]:opacity-0'
      }`}
    >
      <svg aria-hidden viewBox="0 0 16 16" className={`size-4 stroke-current stroke-[1.5] ${saved ? 'fill-current' : 'fill-none'}`}>
        <path d="M4 2.5h8v11l-4-3-4 3z" />
      </svg>
    </button>
  )
}

import { useState, type CSSProperties } from 'react'
import { KINDS, formatTime, type CalendarEvent, type Kind } from '@/lib/events'
import { externalLink } from '@/lib/links'
import { KindTag } from './KindTag'
import { Marquee } from './Marquee'

type Props = {
  event: CalendarEvent
  now: Date
  saved: boolean
  onKind: (kind: Kind) => void
  onSave: (id: string) => void
}

const cardColor = Object.fromEntries(KINDS.map((k) => [k.id, k.card]))

// Stable per-event pseudo-random texture placement, so every card looks like its own print.
function textureStyle(id: string, kind: Kind) {
  let hash = 0
  for (const ch of id) hash = (hash * 31 + ch.charCodeAt(0)) | 0
  const n = Math.abs(hash)
  return {
    '--texture-rotate': `${n % 360}deg`,
    '--texture-shift': `${(n >> 9) % 100}% ${(n >> 17) % 100}%`,
    '--card-texture': `var(--texture-${kind}, var(--card-texture-default))`,
    '--card-texture-size': `var(--texture-size-${kind}, var(--card-texture-size-default))`,
  } as CSSProperties
}

export function EventTile({ event, now, saved, onKind, onSave }: Props) {
  const live = event.start <= now && event.end !== null && now < event.end
  const place = event.stage ? `${event.venue}, ${event.stage}` : event.venue
  const cancelled = /\belmarad/i.test(event.title)
  const [active, setActive] = useState(false)
  const on = () => setActive(true)
  const off = () => setActive(false)

  return (
    <article
      data-kind={event.kind}
      style={textureStyle(event.id, event.kind)}
      onMouseEnter={on}
      onMouseLeave={off}
      onFocus={on}
      onBlur={off}
      className={`card-texture group relative flex h-tile shrink-0 flex-col rounded-2xl px-4 py-4 transition-colors duration-150 hover:bg-frame hover:text-paper has-[a:focus-visible]:outline-2 has-[a:focus-visible]:-outline-offset-4 has-[a:focus-visible]:outline-current ${cardColor[event.kind]}`}>
      <div className="flex items-baseline gap-2 font-mono text-[11px]">
        <time dateTime={event.start.toISOString()} className="whitespace-nowrap">
          {formatTime(event.start)}
          {event.end && `–${formatTime(event.end)}`}
        </time>
        {live && <span>most</span>}
        <span className="ml-auto">
          <KindTag kind={event.kind} onSelect={() => onKind(event.kind)} />
        </span>
      </div>
      <a
        {...externalLink(event.url)}
        className={`mt-1 line-clamp-2 text-[17px] leading-snug font-medium outline-none after:absolute after:inset-0 ${cancelled ? 'line-through' : ''}`}
      >
        {event.title}
      </a>
      <div className="mt-auto flex items-end justify-between gap-2 pt-2 text-xs">
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
      className={`relative z-10 -m-2 shrink-0 p-2 focus-visible:opacity-100 ${saved ? '' : 'group-hover:opacity-100 [@media(hover:hover)]:opacity-0'}`}
    >
      <svg aria-hidden viewBox="0 0 16 16" className={`size-4 stroke-current stroke-[1.5] ${saved ? 'fill-current' : 'fill-none'}`}>
        <path d="M4 2.5h8v11l-4-3-4 3z" />
      </svg>
    </button>
  )
}

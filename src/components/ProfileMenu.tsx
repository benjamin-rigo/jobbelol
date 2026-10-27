import { describeDay, dayKey, formatTime, type CalendarEvent } from '@/lib/events'

type Props = { saved: CalendarEvent[]; onRemove: (id: string) => void }

export function ProfileMenu({ saved, onRemove }: Props) {
  return (
    <>
      <button
        type="button"
        popoverTarget="profil"
        aria-label={`Profil, ${saved.length} mentett program`}
        className="relative grid size-8 shrink-0 place-items-center rounded-full bg-raised text-muted transition-colors duration-150 hover:text-paper"
      >
        <svg aria-hidden viewBox="0 0 16 16" className="size-4 fill-none stroke-current stroke-[1.5]">
          <circle cx="8" cy="5.5" r="2.75" />
          <path d="M2.75 14c.5-2.75 2.6-4.25 5.25-4.25s4.75 1.5 5.25 4.25" />
        </svg>
        {saved.length > 0 && (
          <span className="absolute -top-1 -right-1 grid h-4 min-w-4 place-items-center rounded-full bg-paper px-1 font-mono text-[10px] leading-none text-frame">
            {saved.length}
          </span>
        )}
      </button>

      <div
        id="profil"
        popover="auto"
        className="fixed inset-auto top-12 right-4 m-0 max-h-[70dvh] rounded-2xl w-96 max-w-[calc(100vw-32px)] overflow-y-auto bg-frame text-paper"
      >
        <h2 className="px-4 pt-4 pb-1 font-mono text-xs text-muted">Mentett programok</h2>
        {saved.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted">Még nincs mentett programod. Vidd az egeret egy program fölé, és kattints a könyvjelzőre.</p>
        ) : (
          <ul className="p-1">
            {saved.map((e) => {
              const { day, month } = describeDay(dayKey(e.start))
              return (
                <li key={e.id} className="flex items-start gap-4 rounded-lg px-4 py-4 hover:bg-cell transition-colors duration-150">
                  <a href={e.url ?? undefined} target="_blank" rel="noopener noreferrer" className="min-w-0 flex-1">
                    <span className="block font-mono text-xs text-muted">
                      {month} {day}. {formatTime(e.start)}
                    </span>
                    <span className="mt-0.5 block text-sm leading-snug">{e.title}</span>
                    <span className="mt-0.5 block truncate text-xs text-muted">{e.venue}</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => onRemove(e.id)}
                    aria-label={`Mentés törlése: ${e.title}`}
                    className="-m-1 p-1 font-mono text-xs text-muted hover:text-paper"
                  >
                    törlés
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </>
  )
}

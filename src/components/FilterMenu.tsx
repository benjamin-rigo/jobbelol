import type { Kind } from '@/lib/events'
import { Dropdown, type Option } from './Dropdown'
import { KindSelect } from './KindTag'

type Props = {
  kind: Kind | null
  venue: string | null
  venues: string[]
  onKind: (kind: Kind | null) => void
  onVenue: (venue: string | null) => void
}

export function FilterMenu({ kind, venue, venues, onKind, onVenue }: Props) {
  const active = Number(kind !== null) + Number(venue !== null)

  return (
    <>
      <button
        type="button"
        popoverTarget="szurok"
        aria-label={active ? `Szűrők, ${active} aktív` : 'Szűrők'}
        className="flex min-h-8 shrink-0 items-center gap-2 rounded-lg bg-cell px-2 font-mono text-[11px] hover:bg-raised xl:hidden transition-colors duration-150"
      >
        <svg aria-hidden viewBox="0 0 16 16" className="size-4 fill-none stroke-current stroke-[1.5]">
          <path d="M2 3h12L9.5 8.5V13l-3-1.5v-3z" />
        </svg>
        {active > 0 && <span>{active}</span>}
      </button>

      <div
        id="szurok"
        popover="auto"
        className="fixed inset-auto top-24 right-4 m-0 w-64 rounded-2xl bg-frame p-4 text-paper"
      >
        <p className="font-mono text-xs text-paper">Kategória</p>
        <KindSelect kind={kind} onKind={onKind} className="mt-2 mb-6" />

        <p className="font-mono text-xs text-paper">Helyszín</p>
        <VenueSelect venue={venue} venues={venues} onVenue={onVenue} className="mt-2" />

        {active > 0 && (
          <button
            type="button"
            onClick={() => {
              onKind(null)
              onVenue(null)
            }}
            className="mt-6 min-h-8 w-full rounded-lg bg-cell text-sm text-paper hover:bg-raised transition-colors duration-150"
          >
            Szűrők törlése
          </button>
        )}
      </div>
    </>
  )
}

type VenueSelectProps = { venue: string | null; venues: string[]; onVenue: (venue: string | null) => void; className?: string }

export function VenueSelect({ venue, venues, onVenue, className }: VenueSelectProps) {
  const options: Option<string | null>[] = [{ value: null, label: 'Minden helyszín' }, ...venues.map((v) => ({ value: v, label: v }))]
  return <Dropdown label="Helyszín" value={venue} options={options} onChange={onVenue} className={className} />
}

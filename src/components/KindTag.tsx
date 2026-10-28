import { useId, type ReactNode } from 'react'
import { KINDS, type Kind } from '@/lib/events'
import { Dropdown, type Option } from './Dropdown'

const labels = Object.fromEntries(KINDS.map((k) => [k.id, k.label]))

// Shapes are filled with the card's ink; holes punch through to the card color.
const icons: Record<Kind, { shape: ReactNode; holes?: ReactNode }> = {
  buli: { shape: <path d="M12 .5l1.6 7.6 6.5-4.2-4.2 6.5 7.6 1.6-7.6 1.6 4.2 6.5-6.5-4.2-1.6 7.6-1.6-7.6-6.5 4.2 4.2-6.5L.5 12l7.6-1.6-4.2-6.5 6.5 4.2z" /> },
  koncert: { shape: <path d="M14 .5 3.5 14H10l-2.5 9.5L20.5 9H14l3-8.5z" /> },
  komolyzene: {
    shape: (
      <>
        <path d="M8 6.5 20 3v13h-2V7.6l-8 2.3V18H8z" />
        <ellipse cx="5.5" cy="18.5" rx="3.5" ry="2.6" transform="rotate(-20 5.5 18.5)" />
        <ellipse cx="15.5" cy="16.5" rx="3.5" ry="2.6" transform="rotate(-20 15.5 16.5)" />
      </>
    ),
  },
  szinpad: {
    shape: <path d="M3 2.5c6 2 12 2 18 0V11a9 9 0 0 1-18 0z" />,
    holes: (
      <>
        <path d="M6.5 8.5c1-1.6 3-1.6 4 0-1 .9-3 .9-4 0zM13.5 8.5c1-1.6 3-1.6 4 0-1 .9-3 .9-4 0z" />
        <path d="M7.5 13.5c2.5 1.6 6.5 1.6 9 0-.6 3.4-8.4 3.4-9 0z" />
      </>
    ),
  },
  gyerek: {
    shape: (
      <>
        {[0, 60, 120, 180, 240, 300].map((a) => (
          <circle key={a} cx="12" cy="5.5" r="5" transform={`rotate(${a} 12 12)`} />
        ))}
      </>
    ),
    holes: <circle cx="12" cy="12" r="3" />,
  },
  egyeb: {
    shape: (
      <>
        {[0, 60, 120].map((a) => (
          <rect key={a} x="9.5" y="1" width="5" height="22" rx="2.5" transform={`rotate(${a + 15} 12 12)`} />
        ))}
      </>
    ),
  },
}

export function KindIcon({ kind, className }: { kind: Kind; className?: string }) {
  const id = useId()
  const { shape, holes } = icons[kind]
  return (
    <svg aria-hidden viewBox="0 0 24 24" className={`fill-current ${className ?? ''}`}>
      {holes && (
        <mask id={id}>
          <rect width="24" height="24" fill="white" />
          <g fill="black">{holes}</g>
        </mask>
      )}
      <g mask={holes ? `url(#${id})` : undefined}>{shape}</g>
    </svg>
  )
}

type Props = { kind: Kind; onSelect: () => void }

export function KindTag({ kind, onSelect }: Props) {
  return (
    <button
      type="button"
      aria-label={`Szűrés: ${labels[kind]}`}
      title={labels[kind]}
      onClick={onSelect}
      className="relative z-10 -my-2 -mr-1 p-1 transition-transform duration-150 hover:scale-125 hover:-rotate-12"
    >
      <KindIcon kind={kind} className="size-6" />
    </button>
  )
}

type SelectProps = { kind: Kind | null; onKind: (kind: Kind | null) => void; className?: string }

const kindOptions: Option<Kind | null>[] = [{ value: null, label: 'Minden kategória' }, ...KINDS.map((k) => ({ value: k.id, label: k.label, swatch: k.swatch }))]

export function KindSelect({ kind, onKind, className }: SelectProps) {
  return <Dropdown label="Kategória" value={kind} options={kindOptions} onChange={onKind} className={className} rainbow={kind === null} />
}

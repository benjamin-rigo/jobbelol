import { useId, type ReactNode } from 'react'
import { KINDS, type Kind } from '@/lib/events'
import { Dropdown, type Option } from './Dropdown'

const labels = Object.fromEntries(KINDS.map((k) => [k.id, k.label]))
const inks = Object.fromEntries(KINDS.map((k) => [k.id, k.ink]))

// Shapes are filled with the card's ink; holes punch through to the card color.
const icons: Record<Kind, { shape: ReactNode; holes?: ReactNode }> = {
  buli: { shape: <path d="M12 .5l1.6 7.6 6.5-4.2-4.2 6.5 7.6 1.6-7.6 1.6 4.2 6.5-6.5-4.2-1.6 7.6-1.6-7.6-6.5 4.2 4.2-6.5L.5 12l7.6-1.6-4.2-6.5 6.5 4.2z" /> },
  koncert: {
    shape: <path d="M1.75 12c1.1 -2.7 2.3 -2.7 3.4 0c1.1 6.7 2.3 6.7 3.4 0c1.1 -12.0 2.3 -12.0 3.4 0c1.1 12.0 2.3 12.0 3.4 0c1.1 -6.7 2.3 -6.7 3.4 0c1.1 2.7 2.3 2.7 3.4 0" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />,
  },
  komolyzene: {
    shape: (
      <>
        <rect x="0.5" y="11.5" width="2" height="4.5" rx="0.5" />
        <rect x="2" y="12.5" width="12" height="2.5" />
        <path d="M13 12.5c4 0 6.5-2.5 10.5-5.5v14c-4-3-6.5-5.5-10.5-5.5z" />
        <rect x="4" y="12.5" width="10" height="9" rx="2.5" />
        {[5, 8, 11].map((x) => (
          <g key={x}>
            <rect x={x} y="8" width="1.6" height="5" />
            <rect x={x - 0.5} y="6" width="2.6" height="2" rx="0.5" />
          </g>
        ))}
      </>
    ),
    holes: <rect x="5.8" y="16.2" width="6.4" height="3.6" rx="1" />,
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
      className={`relative z-10 -my-2 -mr-1 p-1 transition-transform duration-150 hover:scale-125 hover:-rotate-12 ${inks[kind]}`}
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

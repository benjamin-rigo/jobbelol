import { KINDS, type Kind } from '@/lib/events'
import { Dropdown, type Option } from './Dropdown'

const labels = Object.fromEntries(KINDS.map((k) => [k.id, k.label]))

type Props = { kind: Kind; onSelect: () => void }

export function KindTag({ kind, onSelect }: Props) {
  return (
    <button
      type="button"
      aria-label={`Szűrés: ${labels[kind]}`}
      onClick={onSelect}
      className="relative z-10 rounded-full bg-paper px-2 py-0.5 font-sans text-[11px] leading-tight font-medium text-frame transition-opacity duration-150 hover:opacity-80"
    >
      {labels[kind].toLowerCase()}
    </button>
  )
}

type SelectProps = { kind: Kind | null; onKind: (kind: Kind | null) => void; className?: string }

const kindOptions: Option<Kind | null>[] = [{ value: null, label: 'Minden kategória' }, ...KINDS.map((k) => ({ value: k.id, label: k.label }))]

export function KindSelect({ kind, onKind, className }: SelectProps) {
  return <Dropdown label="Kategória" value={kind} options={kindOptions} onChange={onKind} className={className} />
}

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
      className="relative z-10 font-sans text-xs text-muted hover:text-paper transition-colors duration-150"
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

import { KINDS, type Kind } from '@/lib/events'

type Props = { active: Set<Kind>; onToggle: (kind: Kind) => void }

export function KindFilter({ active, onToggle }: Props) {
  return (
    <div role="group" aria-label="Programtípusok" className="flex gap-2 overflow-x-auto">
      {KINDS.map((k) => {
        const on = active.has(k.id)
        return (
          <button
            key={k.id}
            type="button"
            aria-pressed={on}
            onClick={() => onToggle(k.id)}
            className={`flex min-h-10 shrink-0 items-center gap-2 border px-3 font-mono text-sm font-semibold ${
              on ? `${k.swatch} border-transparent text-ink` : 'border-dashed border-rule text-dim hover:border-paper hover:text-paper'
            }`}
          >
            <span aria-hidden className={`size-2.5 ${on ? 'bg-ink' : k.swatch}`} />
            {k.label}
          </button>
        )
      })}
    </div>
  )
}

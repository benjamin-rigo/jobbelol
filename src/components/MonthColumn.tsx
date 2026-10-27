import type { CSSProperties } from 'react'
import { monthName } from '@/lib/events'

type Props = { monthKey: string; fromRight: number; onSelect: () => void }

const STRIP = 2

export function MonthColumn({ monthKey, fromRight, onSelect }: Props) {
  const name = monthName(monthKey)

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-label={`Ugrás: ${name}`}
      style={{ '--right': `${fromRight * STRIP}rem` } as CSSProperties}
      className="sticky left-0 z-30 flex w-8 shrink-0 flex-col sm:right-(--right) items-center bg-frame text-muted transition-colors duration-150 hover:text-paper focus-visible:-outline-offset-2"
    >
      <span className="sticky top-0 rotate-180 pt-6 pb-6 text-xl leading-none whitespace-nowrap [writing-mode:vertical-rl]">{name}</span>
      <span className="sticky bottom-0 mt-auto rotate-180 pt-6 pb-6 font-mono text-[11px] [writing-mode:vertical-rl]">
        {monthKey.slice(0, 4)}
      </span>
    </button>
  )
}

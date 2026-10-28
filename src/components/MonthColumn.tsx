import type { CSSProperties } from 'react'
import { monthName } from '@/lib/events'

type Props = { monthKey: string; fromRight: number; onSelect: () => void }

const STRIP = 3

export function MonthColumn({ monthKey, fromRight, onSelect }: Props) {
  const name = monthName(monthKey)

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-label={`Ugrás: ${name}`}
      style={{ '--right': `${fromRight * STRIP}rem` } as CSSProperties}
      className="group sticky left-0 z-30 flex w-8 shrink-0 sm:w-12 flex-col sm:right-(--right) items-center bg-frame text-muted transition-colors duration-150 hover:text-paper focus-visible:-outline-offset-2"
    >
      {/* Viewport-tall so the wave fills the gap between the name and the year on screen. */}
      <span className="sticky top-0 flex h-[calc(100dvh-72px)] sm:h-[calc(100dvh-88px)] flex-col items-center">
        <span className="rotate-180 pt-6 pb-15 text-xl leading-none whitespace-nowrap text-paper transition-opacity duration-150 group-hover:opacity-80 [writing-mode:vertical-rl]">{name}</span>
        <span aria-hidden className="wave-line w-2 flex-1" />
        <span className="rotate-180 pt-6 pb-6 font-mono text-[11px] [writing-mode:vertical-rl]">{monthKey.slice(0, 4)}</span>
      </span>
    </button>
  )
}

import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'

export type Option<T> = { value: T; label: string; swatch?: string }

type Props<T> = {
  label: string
  value: T
  options: Option<T>[]
  onChange: (value: T) => void
  className?: string
  rainbow?: boolean
}

// Category card colors around the border (buli uses its ink, its card is near-black); the fill sits on top via padding-box.
const RAINBOW = {
  background:
    'linear-gradient(var(--fill), var(--fill)) padding-box, conic-gradient(var(--color-k-koncert), var(--color-k-buli-ink), var(--color-k-komolyzene), var(--color-k-szinpad), var(--color-k-gyerek), var(--color-k-egyeb), var(--color-k-koncert)) border-box',
}

export function Dropdown<T extends string | null>({ label, value, options, onChange, className = '', rainbow = false }: Props<T>) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const root = useRef<HTMLDivElement>(null)
  const list = useRef<HTMLUListElement>(null)
  const button = useRef<HTMLButtonElement>(null)
  const id = useId()
  const current = options.find((o) => o.value === value) ?? options[0]

  useEffect(() => {
    if (!open) return
    const close = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [open])

  useEffect(() => {
    if (!open) return
    list.current?.focus()
    list.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [open, active])

  const show = () => {
    setActive(Math.max(0, options.indexOf(current)))
    setOpen(true)
  }

  const choose = (i: number) => {
    onChange(options[i].value)
    setOpen(false)
    button.current?.focus()
  }

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowDown') setActive((i) => Math.min(options.length - 1, i + 1))
    else if (e.key === 'ArrowUp') setActive((i) => Math.max(0, i - 1))
    else if (e.key === 'Home') setActive(0)
    else if (e.key === 'End') setActive(options.length - 1)
    else if (e.key === 'Enter' || e.key === ' ') choose(active)
    else if (e.key === 'Escape') {
      setOpen(false)
      button.current?.focus()
    } else if (e.key === 'Tab') setOpen(false)
    else return
    e.preventDefault()
  }

  return (
    <div ref={root} className={`relative ${className}`}>
      <button
        ref={button}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`${label}: ${current.label}`}
        onClick={() => (open ? setOpen(false) : show())}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault()
            show()
          }
        }}
        style={rainbow ? RAINBOW : undefined}
        className={`flex min-h-8 w-full items-center gap-2 rounded-lg pr-2 pl-4 font-mono text-[11px] transition-colors duration-150 ${
          rainbow
            ? 'border-2 border-transparent [--fill:var(--color-cell)] hover:[--fill:var(--color-raised)] aria-expanded:[--fill:var(--color-raised)]'
            : 'bg-cell hover:bg-raised aria-expanded:bg-raised'
        }`}
      >
        <span className="truncate">{current.label}</span>
        {current.swatch && <span aria-hidden className={`ml-auto size-2 shrink-0 rounded-full ${current.swatch}`} />}
        <svg aria-hidden viewBox="0 0 16 16" className={`${current.swatch ? '' : 'ml-auto'} size-4 shrink-0 fill-none stroke-current stroke-[1.5] ${open ? 'rotate-180' : ''}`}>
          <path d="M4 6l4 4 4-4" />
        </svg>
      </button>

      {open && (
        <ul
          ref={list}
          role="listbox"
          tabIndex={-1}
          aria-label={label}
          aria-activedescendant={`${id}-${active}`}
          onKeyDown={onKeyDown}
          className="absolute top-full right-0 z-50 mt-1 max-h-96 w-full overflow-y-auto rounded-lg bg-cell p-2 font-mono text-[11px] outline-none"
        >
          {options.map((o, i) => {
            const selected = o.value === value
            return (
              <li
                key={o.value ?? ''}
                id={`${id}-${i}`}
                data-index={i}
                role="option"
                aria-selected={selected}
                onPointerMove={() => setActive(i)}
                onClick={() => choose(i)}
                className={`flex cursor-pointer items-center gap-2 rounded px-2 py-2 ${i === active ? 'bg-frame' : ''}`}
              >
                <span className="truncate">{o.label}</span>
                <span className="ml-auto flex shrink-0 items-center gap-2">
                  {selected && (
                    <svg aria-hidden viewBox="0 0 16 16" className="size-4 fill-none stroke-current stroke-[1.5]">
                      <path d="M3.5 8.5l3 3 6-7" />
                    </svg>
                  )}
                  {o.swatch && <span aria-hidden className={`size-2 rounded-full ${o.swatch}`} />}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

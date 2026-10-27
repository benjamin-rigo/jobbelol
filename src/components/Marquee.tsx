import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react'

type Props = { text: string; active: boolean; rest: string; className?: string }

const GAP = 32

function singleLineWidth(el: HTMLElement) {
  if (el.scrollHeight <= el.clientHeight + 1 && el.scrollWidth <= el.clientWidth + 1) return 0
  const { display, whiteSpace } = el.style
  el.style.display = 'block'
  el.style.whiteSpace = 'nowrap'
  const width = el.scrollWidth
  el.style.display = display
  el.style.whiteSpace = whiteSpace
  return width
}

export function Marquee({ text, active, rest, className = '' }: Props) {
  const ref = useRef<HTMLSpanElement>(null)
  const [width, setWidth] = useState(0)

  useLayoutEffect(() => {
    setWidth(active && ref.current ? singleLineWidth(ref.current) : 0)
  }, [active, text])

  if (width === 0)
    return (
      <span ref={ref} className={`overflow-hidden ${rest} ${className}`}>
        {text}
      </span>
    )

  const shift = width + GAP
  const style = { '--shift': `-${shift}px`, animationDuration: `${shift / 150}s`, animationDelay: '0.6s' } as CSSProperties

  return (
    <span ref={ref} className={`block overflow-hidden whitespace-nowrap ${className}`}>
      <span className="inline-block motion-safe:animate-marquee" style={style}>
        <span style={{ paddingRight: GAP }}>{text}</span>
        <span aria-hidden style={{ paddingRight: GAP }}>
          {text}
        </span>
      </span>
    </span>
  )
}

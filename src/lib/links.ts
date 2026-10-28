import type { KeyboardEvent } from 'react'

// Links without href so the browser doesn't show its URL preview bar on hover.
export function externalLink(url: string | null) {
  const open = () => url && window.open(url, '_blank', 'noopener,noreferrer')
  return {
    role: 'link',
    tabIndex: 0,
    onClick: open,
    onKeyDown: (e: KeyboardEvent) => e.key === 'Enter' && open(),
  } as const
}

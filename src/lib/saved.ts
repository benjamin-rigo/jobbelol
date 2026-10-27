import { useEffect, useState } from 'react'

const KEY = 'jobbelol:saved'

function load(): Set<string> {
  try {
    const ids: unknown = JSON.parse(localStorage.getItem(KEY) ?? '[]')
    return new Set(Array.isArray(ids) ? ids.filter((id) => typeof id === 'string') : [])
  } catch {
    return new Set()
  }
}

export function useSaved() {
  const [saved, setSaved] = useState<Set<string>>(load)

  useEffect(() => localStorage.setItem(KEY, JSON.stringify([...saved])), [saved])

  const toggle = (id: string) =>
    setSaved((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  return [saved, toggle] as const
}

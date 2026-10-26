import clubs from '@/data/clubs.snapshot.json'

export const KINDS = [
  { id: 'buli', label: 'Buli', swatch: 'bg-buli' },
  { id: 'koncert', label: 'Koncert', swatch: 'bg-koncert' },
  { id: 'komolyzene', label: 'Komolyzene', swatch: 'bg-komolyzene' },
  { id: 'szinpad', label: 'Színpad', swatch: 'bg-szinpad' },
  { id: 'gyerek', label: 'Gyerek', swatch: 'bg-gyerek' },
  { id: 'egyeb', label: 'Egyéb', swatch: 'bg-egyeb' },
] as const

export type Kind = (typeof KINDS)[number]['id']

export type CalendarEvent = {
  id: string
  title: string
  venue: string
  stage: string
  start: Date
  end: Date | null
  url: string | null
  kind: Kind
}

const TZ = 'Europe/Budapest'

const KID = /ringató|baba|tesz-vesz|óvoda|gyerek|család|mikulás|mese|kőketánc|babazuri/i
const PARTY = /party|\bdj\b|b2b|techno|house|disco|diszkó|rave|all night|\bw\/|drum|bass|jungle|club night|hardtek|hardcore|uptempo/i
const OTHER = /filmklub|vetítés|tárlat|kiállítás|vezetés|kvíz|workshop|beszélget|könyvbemutató|irodalom/i
const CLASSICAL = /opera|zenekar|kórus|filharmon|szimfoni|hangverseny|kamarazen|zongoraest|requiem|oratórium|puccini|brahms|liszt|mozart|bach|beethoven|sosztakovics|saint-saëns|vivaldi|händel|haydn|schubert|verdi|wagner|strauss|csajkovszkij/i
const STAGE = /balett|tánc|színház|társulat|cirkusz|recirquel|előadás|bemutató/i
const STAGE_VENUES = /Nemzeti Táncszínház|Trafó/

const hourFmt = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour: '2-digit', hourCycle: 'h23' })

function classify(title: string, venue: string, stage: string, isMusical: boolean, start: Date): Kind {
  if (KID.test(title)) return 'gyerek'
  if (PARTY.test(title)) return 'buli'
  if (OTHER.test(title)) return 'egyeb'
  if (isMusical) {
    if (CLASSICAL.test(title)) return 'komolyzene'
    return Number(hourFmt.format(start)) >= 22 ? 'buli' : 'koncert'
  }
  if (STAGE.test(title) || STAGE_VENUES.test(venue) || stage === 'Fesztivál Színház' || stage === 'Millenáris') return 'szinpad'
  return 'egyeb'
}

export const events: CalendarEvent[] = clubs
  .flatMap((v) => {
    const stages = new Map(v.stages.map((s) => [s.id, s.name]))
    return v.events.map((e) => {
      const stage = stages.get(e.stageId) ?? ''
      const start = new Date(e.startsAt)
      return {
        id: e.id,
        title: e.title,
        venue: v.name,
        stage: stage === v.name ? '' : stage,
        start,
        end: e.endsAt ? new Date(e.endsAt) : null,
        url: e.sourceUrl,
        kind: classify(e.title, v.name, stage, e.isMusical, start),
      }
    })
  })
  .sort((a, b) => a.start.getTime() - b.start.getTime())

const dayKeyFmt = new Intl.DateTimeFormat('sv-SE', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' })
const timeFmt = new Intl.DateTimeFormat('hu-HU', { timeZone: TZ, hour: '2-digit', minute: '2-digit' })

export const dayKey = (d: Date) => dayKeyFmt.format(d)
export const formatTime = (d: Date) => timeFmt.format(d)

export function dayRange(from: Date, to: Date): string[] {
  const keys: string[] = []
  const cursor = new Date(`${dayKey(from)}T12:00:00Z`)
  const last = dayKey(to)
  while (dayKey(cursor) <= last) {
    keys.push(dayKey(cursor))
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }
  return keys
}

const weekdayFmt = new Intl.DateTimeFormat('hu-HU', { timeZone: 'UTC', weekday: 'long' })
const monthFmt = new Intl.DateTimeFormat('hu-HU', { timeZone: 'UTC', month: 'long' })

export function describeDay(key: string) {
  const d = new Date(`${key}T12:00:00Z`)
  return { day: d.getUTCDate(), weekday: weekdayFmt.format(d), month: monthFmt.format(d) }
}

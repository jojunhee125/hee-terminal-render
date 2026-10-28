import type { Clock } from './theme'

export type Sent = { text: string; at: number }
export type TurnEnd = { durationMs: number; at: number }

const KEEP = 500
const SLACK_MS = 2000
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export const SEOUL = 'Asia/Seoul'
export const LOCAL_ZONE = 'local'

const ZONE_LABELS: Record<string, string> = { [SEOUL]: 'KST' }

const two = (n: number) => String(n).padStart(2, '0')

const formatters = new Map<string, Intl.DateTimeFormat>()

const formatterOf = (zone: string): Intl.DateTimeFormat => {
  let fmt = formatters.get(zone)
  if (!fmt) {
    fmt = new Intl.DateTimeFormat('en-US', { timeZone: zone, year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', hourCycle: 'h23', timeZoneName: 'short' })
    formatters.set(zone, fmt)
  }
  return fmt
}

export const isZone = (zone: string): boolean => {
  try {
    formatterOf(zone)
    return true
  } catch {
    return false
  }
}

export const pickZone = (value: unknown): string => {
  const asked = typeof value === 'string' ? value.trim() : ''
  if (asked.toLowerCase() === LOCAL_ZONE) return LOCAL_ZONE
  if (asked && isZone(asked)) return formatterOf(asked).resolvedOptions().timeZone
  return isZone(SEOUL) ? SEOUL : LOCAL_ZONE
}

type Parts = { year: number; month: number; day: number; hour: number; minute: number; label: string }

const partsOf = (at: number, zone: string): Parts => {
  if (zone === LOCAL_ZONE || !isZone(zone)) {
    const d = new Date(at)
    return { year: d.getFullYear(), month: d.getMonth(), day: d.getDate(), hour: d.getHours(), minute: d.getMinutes(), label: '' }
  }
  const p: Record<string, string> = {}
  for (const part of formatterOf(zone).formatToParts(at)) p[part.type] = part.value
  return { year: Number(p.year), month: Number(p.month) - 1, day: Number(p.day), hour: Number(p.hour) % 24, minute: Number(p.minute), label: ZONE_LABELS[zone] ?? p.timeZoneName ?? '' }
}

export const clockText = (at: number, now: number, clock: Clock, zone: string = LOCAL_ZONE): string => {
  const d = partsOf(at, zone)
  const h = d.hour
  const time = clock === '12h' ? `${h % 12 === 0 ? 12 : h % 12}:${two(d.minute)} ${h < 12 ? 'AM' : 'PM'}` : `${two(h)}:${two(d.minute)}`
  const today = partsOf(now, zone)
  const isToday = d.year === today.year && d.month === today.month && d.day === today.day
  const stamp = isToday ? time : `${MONTHS[d.month]} ${d.day} ${time}`
  return d.label ? `${stamp} ${d.label}` : stamp
}

export const promptKey = (text: string) => text.trim().replace(/\s+/g, ' ').slice(0, 300)

export const withRecord = <T>(list: readonly T[], record: T): T[] => [...list, record].slice(-KEEP)

export const sentAt = (sent: readonly Sent[], text: string, drawnAt: number): number | undefined => {
  const key = promptKey(text)
  return sent.findLast(one => one.text === key && one.at <= drawnAt)?.at
}

export const endedAt = (ends: readonly TurnEnd[], durationMs: number, drawnAt: number): number | undefined => {
  let best: TurnEnd | undefined
  for (const end of ends) {
    if (end.at > drawnAt) continue
    const gap = Math.abs(end.durationMs - durationMs)
    if (gap <= SLACK_MS && (best === undefined || gap <= Math.abs(best.durationMs - durationMs))) best = end
  }
  return best?.at
}

export const ORGS = {
  'antioch-assembly': { name: 'The Antioch Assembly', tag: 'Ministry', tagClass: 'tag-ministry', color: '#1A5E2E' },
  'lsbc':             { name: 'LSBC',                  tag: 'Ministry', tagClass: 'tag-ministry', color: '#1A3A6B' },
  'beacon':           { name: 'Beacon Media Solutions', tag: 'Business', tagClass: 'tag-business', color: '#7A3D00' },
  'antioch-21':       { name: 'Antioch 21',             tag: 'Mission',  tagClass: 'tag-mission',  color: '#3D1E7A' },
}

export const AVATARS = [
  { i: 'AZ', bg: '#E8F0ED', c: '#2D4A3E' },
  { i: 'JN', bg: '#EBF2FF', c: '#1A3A6B' },
  { i: 'LM', bg: '#FEF3E2', c: '#7A3D00' },
  { i: 'RK', bg: '#F0EBFC', c: '#3D1E7A' },
]

export const STATUS_LABEL = { 'not-started': 'Not started', 'in-progress': 'In progress', 'done': 'Done' }
export const PRIORITY_LABEL = { critical: 'Critical', medium: 'Medium', low: 'Low' }
export const STATUS_CLASS = { 'not-started': 's-ns', 'in-progress': 's-ip', 'done': 's-dn' }
export const PRIORITY_CLASS = { critical: 'p-critical', medium: 'p-medium', low: 'p-low' }
export const STATUS_CYCLE = ['not-started', 'in-progress', 'done']

export function fmtDate(d) {
  if (!d) return ''
  const dt = new Date(d + 'T00:00')
  return dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export function isOverdue(d) {
  if (!d) return false
  return new Date(d + 'T00:00') < new Date()
}

export function daysUntil(d) {
  if (!d) return 999
  return Math.round((new Date(d + 'T00:00') - new Date()) / (1000 * 60 * 60 * 24))
}

export function exportIcal(title, date, startTime, endTime, location, notes) {
  const dateStr = date.replace(/-/g, '')
  const fmt = t => t.replace(/:/g, '')
  const start = startTime ? `${dateStr}T${fmt(startTime)}00` : dateStr
  const end = endTime ? `${dateStr}T${fmt(endTime)}00` : start
  const uid = `lifeos-${Date.now()}@lifeos`
  const ics = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//LifeOS//EN',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
    startTime ? `DTSTART:${start}` : `DTSTART;VALUE=DATE:${dateStr}`,
    startTime ? `DTEND:${end}` : `DTEND;VALUE=DATE:${dateStr}`,
    `SUMMARY:${title}`,
    location ? `LOCATION:${location}` : '',
    notes ? `DESCRIPTION:${notes.replace(/\n/g, '\\n')}` : '',
    'END:VEVENT', 'END:VCALENDAR',
  ].filter(Boolean).join('\r\n')
  const blob = new Blob([ics], { type: 'text/calendar' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `${title.replace(/\s+/g, '-').toLowerCase()}.ics`
  a.click()
}

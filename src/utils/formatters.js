export function formatOrUnknown(value) {
  return value === undefined || value === null || value === '' ? '未识别' : value
}

export function maskIdNumber(idNo) {
  const s = String(idNo || '')
  if (!s) return ''
  if (s.length <= 4) return s
  return '*'.repeat(s.length - 4) + s.slice(-4)
}

export function calcBmi(heightCm, weightKg) {
  const h = Number(heightCm), w = Number(weightKg)
  if (!h || !w || h <= 0) return null
  return w / Math.pow(h / 100, 2)
}

export function parseTimeToMonth(v) {
  if (!v) return null
  const m = String(v).match(/(\d{4})\D+(\d{1,2})/)
  if (!m) return null
  return { y: Number(m[1]), m: Number(m[2]) }
}

export function monthDiff(a, b) {
  return (b.y - a.y) * 12 + (b.m - a.m)
}

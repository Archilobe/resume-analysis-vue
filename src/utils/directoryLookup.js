// 名录查询：运行时解析 public/data/*.md，名录数据禁止硬编码进本文件
const SECTION_ALIASES = [
  { key: 'QS前200', re: /QS前200/ },
  { key: '国内985', re: /国内985/ },
  { key: '国内211', re: /国内211/ },
  { key: '国内一本', re: /国内一本/ }
]

function splitRow(line) {
  return line.replace(/^\||\|$/g, '').split('|').map((s) => s.trim())
}

export function parseSchoolTable(mdText) {
  const byName = new Map()
  const categories = {}
  let current = null
  for (const raw of mdText.split(/\r?\n/)) {
    const line = raw.trim()
    const sec = SECTION_ALIASES.find((s) => s.re.test(line) && line.startsWith('##'))
    if (sec) { current = sec.key; categories[current] = []; continue }
    if (!line.startsWith('|') || !current) continue
    const cells = splitRow(line)
    if (cells.length < 4 || /^[-:]+$/.test(cells[0]) || cells[0] === '序号') continue
    const name = cells[1]
    if (!name) continue
    const item = { name, category: current, country: cells[3] || '' }
    categories[current].push(item)
    if (!byName.has(name)) byName.set(name, [])
    byName.get(name).push(item)
  }
  return { byName, categories }
}

export function parseMajorTable(mdText) {
  const byName = new Map()
  for (const raw of mdText.split(/\r?\n/)) {
    const line = raw.trim()
    if (!line.startsWith('|')) continue
    const cells = splitRow(line)
    if (cells.length < 3 || /^[-:]+$/.test(cells[0]) || cells[0] === '序号') continue
    const [name, category] = [cells[1], cells[2]]
    if (!name) continue
    if (!byName.has(name)) byName.set(name, [])
    byName.get(name).push({ name, category })
  }
  return { byName }
}

function normalize(text) {
  return String(text || '').trim().replace(/\s+/g, '')
}

export async function createLookup({ schoolText, majorText } = {}) {
  if (schoolText == null) {
    schoolText = await (await fetch('/data/2026届院校名录.md')).text()
  }
  if (majorText == null) {
    majorText = await (await fetch('/data/冷门专业名录.md')).text()
  }
  const schoolIdx = parseSchoolTable(schoolText)
  const majorIdx = parseMajorTable(majorText)
  return {
    querySchool(name, country) {
      const hits = schoolIdx.byName.get(normalize(name)) || []
      const matches = country ? hits.filter((m) => normalize(m.country) === normalize(country)) : hits
      return { in_directory: matches.length > 0, matches }
    },
    queryMajor(name) {
      const hits = majorIdx.byName.get(normalize(name)) || []
      if (!hits.length) return { in_directory: false, is_cold_major: false, category: '未收录' }
      const isCold = hits.some((m) => m.category === '冷门')
      return { in_directory: true, is_cold_major: isCold, category: isCold ? '冷门' : '非冷门' }
    }
  }
}

export async function loadDefaultLookup() {
  return createLookup()
}

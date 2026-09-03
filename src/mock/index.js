// axios adapter 形式的 mock 层。VITE_USE_MOCK=false 时本文件不被引用。
import { SEED_RESUMES } from './data'
import { loadDefaultLookup } from '@/utils/directoryLookup'
import { runWarnings } from '@/utils/warningEngine'

const resumes = new Map(SEED_RESUMES.map((r) => [r.id, JSON.parse(JSON.stringify(r))]))
const tasks = new Map() // resumeId -> {startAt}
const PARSE_MS = 5000 // 模拟解析时长 5s
let seq = 1

async function computeWarnings(resume) {
  const lookup = await loadDefaultLookup()
  return runWarnings(resume, lookup)
}

function listSummary(r) {
  return {
    id: r.id, fileName: r.fileName, name: r.basic?.name, gender: r.basic?.gender,
    highestDegree: r.basic?.highestDegree, graduationDate: r.basic?.graduationDate,
    parsedAt: r.parsedAt
  }
}

function json(config, data, status = 200) {
  return { status, data, config }
}

export default async function mockAdapter(config) {
  const { url = '', method = 'get', data } = config
  const body = typeof data === 'string' ? JSON.parse(data) : data || {}
  const path = url.replace(/\?.*$/, '').replace(config.baseURL || '', '')

  // POST /resume/upload — multipart 里取 file 需在 api 层直接传 FormData；
  // mock 层从 FormData 提取文件名与大小
  if (path === '/resume/upload' && method === 'post') {
    const form = body instanceof FormData ? body : config.data
    let fileName = '简历.pdf', size = 0
    if (form && form.get) {
      const f = form.get('file')
      if (f) { fileName = f.name; size = f.size }
    }
    const id = `r-${Date.now()}-${seq++}`
    const seed = SEED_RESUMES[seq % SEED_RESUMES.length] // 轮换模板
    const newResume = JSON.parse(JSON.stringify({ ...seed, id, fileName, parsedAt: '' }))
    newResume.basic = { ...newResume.basic, name: guessName(fileName) }
    resumes.set(id, newResume)
    tasks.set(id, { startAt: Date.now() })
    return json(config, { resumeId: id, fileName, size })
  }

  const m = path.match(/^\/resume\/([^/]+)(\/progress)?$/)
  if (m) {
    const id = m[1]
    // GET progress
    if (m[2]) {
      const t = tasks.get(id)
      if (!t) return json(config, { message: '解析任务不存在' }, 404)
      const percent = Math.min(100, Math.floor(((Date.now() - t.startAt) / PARSE_MS) * 100))
      if (percent >= 100) {
        const r = resumes.get(id)
        if (r && !r.parsedAt) r.parsedAt = fmtNow()
        return json(config, { percent: 100, status: 'done' })
      }
      return json(config, { percent, status: 'parsing' })
    }
    // GET detail
    const r = resumes.get(id)
    if (!r) return json(config, { message: '简历不存在' }, 404)
    const warnings = await computeWarnings(r)
    return json(config, { ...structuredClone(r), warnings })
  }

  if (path === '/resume/list' && method === 'get') {
    return json(config, [...resumes.values()].sort(byParsedDesc).map(listSummary))
  }
  const del = path.match(/^\/resume\/([^/]+)\/delete$/)
  if (del && method === 'post') {
    resumes.delete(del[1]); tasks.delete(del[1])
    return json(config, { deleted: true })
  }
  return json(config, { message: `mock 未实现: ${method.toUpperCase()} ${path}` }, 404)
}

function guessName(fileName) {
  const base = fileName.replace(/\.[^.]+$/, '')
  const m = base.match(/^([一-龥]{2,4})/)
  return m ? m[1] : '未识别'
}

function fmtNow() {
  const d = new Date()
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

function byParsedDesc(a, b) {
  return String(b.parsedAt).localeCompare(String(a.parsedAt))
}

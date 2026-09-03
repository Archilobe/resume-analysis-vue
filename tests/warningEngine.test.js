import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { runWarnings, NAVY_DISTRICTS } from '@/utils/warningEngine'
import { calcBmi, parseTimeToMonth, monthDiff, maskIdNumber, formatOrUnknown } from '@/utils/formatters'

// 最小 lookup stub：规则 7/10 不参与多数用例
const stubLookup = {
  querySchool: (n) => ({ in_directory: true, matches: [{ name: n, category: '国内985', country: '中国' }] }),
  queryMajor: () => ({ in_directory: true, is_cold_major: false, category: '非冷门' })
}

const baseResume = () => ({
  basic: { name: '张三', gender: '女', birthDate: '2000-01-15', highestDegree: '硕士', graduationDate: '2026-06-30', workYears: '0年', maritalStatus: '未婚', height: 175, weight: 68, overseasEducation: false, country: '中国' },
  contact: { phone: '13800000000', email: 'z@x.com' },
  certificate: { nationality: '中国', idType: '居民身份证', idNumber: '320102200001150011' },
  intention: { currentCity: '上海', targetCities: ['南京'], onboardTime: '2026-07', expectSalary: '15k' },
  agreeAdjust: true,
  educationList: [
    { start: '2023-09', end: '2026-06', school: '上海大学', major: '计算机科学与技术', level: '硕士', location: '上海', studyMode: '全日制' },
    { start: '2019-09', end: '2023-06', school: '上海大学', major: '软件工程', level: '本科', location: '上海', studyMode: '全日制' }
  ],
  workList: [{ start: '2025-05', end: '2025-09', company: '九方智投控股', position: '算法实习生', department: '', description: '大模型算法研发', achievement: '', reason: '' }],
  projectList: [{ start: '2025-05', end: '2025-09', name: '心语', description: 'AI共情对话', duty: 'NLP算法与大模型开发' }],
  skillList: [{ name: 'Python', level: '精通', years: '3年' }],
  languageList: [{ language: '英语', level: '熟练', certificate: 'CET-6 520分' }],
  awardList: [], family: { father: {}, mother: {} },
  companyRelatives: { hasRelatives: false, needAvoidance: false },
  photos: [], attachments: [],
  selfEvaluation: '', interests: '',
  practiceList: [], campusList: [], trainingList: [],
  extraQuestions: { majorViolation: '无', business: '无', majorIllness: '无' }
})

function findRule(warnings, no) { return warnings.find((w) => w.ruleNo === no) }

describe('工具函数', () => {
  it('calcBmi', () => { expect(calcBmi(175, 68)).toBeCloseTo(22.2, 1); expect(calcBmi(0, 68)).toBeNull() })
  it('parseTimeToMonth', () => {
    expect(parseTimeToMonth('2023.09')).toEqual({ y: 2023, m: 9 })
    expect(parseTimeToMonth('2023年9月')).toEqual({ y: 2023, m: 9 })
    expect(parseTimeToMonth('abc')).toBeNull()
  })
  it('monthDiff', () => { expect(monthDiff({ y: 2023, m: 6 }, { y: 2024, m: 9 })).toBe(15) })
  it('maskIdNumber', () => { expect(maskIdNumber('320102200001150011')).toBe('**************0011'); expect(maskIdNumber('1234')).toBe('1234') })
  it('formatOrUnknown', () => { expect(formatOrUnknown('')).toBe('未识别'); expect(formatOrUnknown(null)).toBe('未识别'); expect(formatOrUnknown('x')).toBe('x') })
  it('NAVY_DISTRICTS 含 12 区县', () => { expect(NAVY_DISTRICTS).toHaveLength(12); expect(NAVY_DISTRICTS).toContain('江宁区') })
})

describe('规则1 最高学历', () => {
  it('本科 → high', async () => {
    const r = baseResume(); r.basic.highestDegree = '本科'
    expect(findRule(await runWarnings(r, stubLookup), 1).level).toBe('high')
  })
  it('硕士 → 无预警', async () => {
    expect(findRule(await runWarnings(baseResume(), stubLookup), 1)).toBeUndefined()
  })
  it('缺失 → medium', async () => {
    const r = baseResume(); delete r.basic.highestDegree
    expect(findRule(await runWarnings(r, stubLookup), 1).level).toBe('medium')
  })
})

describe('规则2 毕业时间', () => {
  it('国内 2026-06 → 无预警', async () => {
    expect(findRule(await runWarnings(baseResume(), stubLookup), 2)).toBeUndefined()
  })
  it('国内 2025-12 → high', async () => {
    const r = baseResume(); r.basic.graduationDate = '2025-12-31'
    expect(findRule(await runWarnings(r, stubLookup), 2).level).toBe('high')
  })
  it('海外 2025-06 → 无预警', async () => {
    const r = baseResume()
    r.basic.overseasEducation = true
    r.basic.graduationDate = '2025-06-30'
    expect(findRule(await runWarnings(r, stubLookup), 2)).toBeUndefined()
  })
  it('缺失 → medium', async () => {
    const r = baseResume(); delete r.basic.graduationDate
    expect(findRule(await runWarnings(r, stubLookup), 2).level).toBe('medium')
  })
})

describe('规则3 实习经历', () => {
  it('有实习且职责含 AI 关键词 → 无预警', async () => {
    expect(findRule(await runWarnings(baseResume(), stubLookup), 3)).toBeUndefined()
  })
  it('无工作经历 → medium', async () => {
    const r = baseResume(); r.workList = []
    expect(findRule(await runWarnings(r, stubLookup), 3).level).toBe('medium')
  })
  it('职责不含技术关键词 → high', async () => {
    const r = baseResume()
    r.workList = [{ ...r.workList[0], company: '某某公司', position: '行政专员', description: '负责行政与后勤事务' }]
    r.projectList = []
    expect(findRule(await runWarnings(r, stubLookup), 3).level).toBe('high')
  })
})

describe('规则4 英语要求', () => {
  it('CET-6 520 → 无预警', async () => {
    expect(findRule(await runWarnings(baseResume(), stubLookup), 4)).toBeUndefined()
  })
  it('英语无证书 → medium（需人工核验）', async () => {
    const r = baseResume(); r.languageList = [{ language: '英语', level: '熟练', certificate: '' }]
    expect(findRule(await runWarnings(r, stubLookup), 4).level).toBe('medium')
  })
  it('雅思5.5 → high', async () => {
    const r = baseResume(); r.languageList = [{ language: '英语', level: '熟练', certificate: '雅思5.5' }]
    expect(findRule(await runWarnings(r, stubLookup), 4).level).toBe('high')
  })
})

describe('规则5 学历空白期', () => {
  it('本科2023-06结束→硕士2023-09开始 → 无预警', async () => {
    expect(findRule(await runWarnings(baseResume(), stubLookup), 5)).toBeUndefined()
  })
  it('空白 >12 个月 → high', async () => {
    const r = baseResume(); r.educationList[0].start = '2024-09'
    expect(findRule(await runWarnings(r, stubLookup), 5).level).toBe('high')
  })
  it('缺本科或硕士 → medium', async () => {
    const r = baseResume(); r.educationList = r.educationList.filter((e) => e.level !== '本科')
    expect(findRule(await runWarnings(r, stubLookup), 5).level).toBe('medium')
  })
})

describe('规则6 意向城市', () => {
  it('南京 → 无预警', async () => {
    expect(findRule(await runWarnings(baseResume(), stubLookup), 6)).toBeUndefined()
  })
  it('上海 → high', async () => {
    const r = baseResume(); r.intention.targetCities = ['上海']
    expect(findRule(await runWarnings(r, stubLookup), 6).level).toBe('high')
  })
  it('未填写 → medium', async () => {
    const r = baseResume(); r.intention.targetCities = []
    expect(findRule(await runWarnings(r, stubLookup), 6).level).toBe('medium')
  })
  it('南京下辖区县 → 无预警', async () => {
    const r = baseResume(); r.intention.targetCities = ['江宁区']
    expect(findRule(await runWarnings(r, stubLookup), 6)).toBeUndefined()
  })
  it('南京市（带市后缀）→ 无预警', async () => {
    const r = baseResume(); r.intention.targetCities = ['南京市']
    expect(findRule(await runWarnings(r, stubLookup), 6)).toBeUndefined()
  })
})

describe('规则7 冷门专业（走 lookup）', () => {
  it('冷门专业 → high', async () => {
    const lookup = { ...stubLookup, queryMajor: (n) => n === '考古学' ? { in_directory: true, is_cold_major: true, category: '冷门' } : stubLookup.queryMajor(n) }
    const r = baseResume(); r.educationList[1].major = '考古学'
    expect(findRule(await runWarnings(r, lookup), 7).level).toBe('high')
  })
  it('非冷门 → 无预警', async () => {
    expect(findRule(await runWarnings(baseResume(), stubLookup), 7)).toBeUndefined()
  })
  it('专业未收录 → medium', async () => {
    const lookup = { ...stubLookup, queryMajor: () => ({ in_directory: false, is_cold_major: false, category: '未收录' }) }
    expect(findRule(await runWarnings(baseResume(), lookup), 7).level).toBe('medium')
  })
})

describe('规则8 家庭信息', () => {
  it('完整 → 无预警', async () => {
    const r = baseResume()
    r.family = { father: { relation: '父亲', name: '张父', company: '某公司', position: '职员', birthDate: '1970-01-01' }, mother: { relation: '母亲', name: '李母', company: '某公司', position: '职员', birthDate: '1972-01-01' } }
    expect(findRule(await runWarnings(r, stubLookup), 8)).toBeUndefined()
  })
  it('父亲缺字段 → high', async () => {
    const r = baseResume()
    r.family = { father: { name: '张父' }, mother: { relation: '母亲', name: '李母', company: 'c', position: 'p', birthDate: '1972-01-01' } }
    expect(findRule(await runWarnings(r, stubLookup), 8).level).toBe('high')
  })
  it('双亲全缺 → high', async () => {
    expect(findRule(await runWarnings(baseResume(), stubLookup), 8).level).toBe('high')
  })
})

describe('规则9 是否同意调剂', () => {
  it('同意 → 无预警', async () => {
    expect(findRule(await runWarnings(baseResume(), stubLookup), 9)).toBeUndefined()
  })
  it('不同意 → high', async () => {
    const r = baseResume(); r.agreeAdjust = false
    expect(findRule(await runWarnings(r, stubLookup), 9).level).toBe('high')
  })
  it('未填写 → medium', async () => {
    const r = baseResume(); delete r.agreeAdjust
    expect(findRule(await runWarnings(r, stubLookup), 9).level).toBe('medium')
  })
})

describe('规则10 学校范围（走 lookup）', () => {
  it('在名录内 → 无预警', async () => {
    expect(findRule(await runWarnings(baseResume(), stubLookup), 10)).toBeUndefined()
  })
  it('任一院校不在名录 → high', async () => {
    const lookup = { ...stubLookup, querySchool: (n) => n === '野鸡大学' ? { in_directory: false, matches: [] } : stubLookup.querySchool(n) }
    const r = baseResume(); r.educationList[1].school = '野鸡大学'
    expect(findRule(await runWarnings(r, lookup), 10).level).toBe('high')
  })
  it('海外院校按国家过滤命中 → 无预警', async () => {
    const lookup = { ...stubLookup, querySchool: (n, c) => n === '东北大学' && c === '日本' ? { in_directory: true, matches: [{ name: n, category: 'QS前200', country: '日本' }] } : stubLookup.querySchool(n) }
    const r = baseResume()
    r.basic.overseasEducation = true
    r.educationList[0] = { ...r.educationList[0], school: '东北大学', country: '日本' }
    expect(findRule(await runWarnings(r, lookup), 10)).toBeUndefined()
  })
})

describe('规则11 BMI', () => {
  it('22.2 → 无预警', async () => {
    expect(findRule(await runWarnings(baseResume(), stubLookup), 11)).toBeUndefined()
  })
  it('BMI 17 → high', async () => {
    const r = baseResume(); r.basic.height = 175; r.basic.weight = 52
    expect(findRule(await runWarnings(r, stubLookup), 11).level).toBe('high')
  })
  it('身高体重缺失 → medium', async () => {
    const r = baseResume(); delete r.basic.height; delete r.basic.weight
    expect(findRule(await runWarnings(r, stubLookup), 11).level).toBe('medium')
  })
})

describe('综合', () => {
  it('每条预警都带 ruleNo/ruleName/level/description/fieldMarks', async () => {
    const r = baseResume(); r.basic.highestDegree = '专科'
    const ws = await runWarnings(r, stubLookup)
    for (const w of ws) {
      expect(w.ruleNo).toBeTypeOf('number')
      expect(w.ruleName).toBeTypeOf('string')
      expect(['high', 'medium']).toContain(w.level)
      expect(w.description).toBeTypeOf('string')
      expect(Array.isArray(w.fieldMarks)).toBe(true)
    }
  })
})

import { SEED_RESUMES } from '@/mock/data'
import { createLookup } from '@/utils/directoryLookup'

describe('mock seed 简历预警回归', () => {
  it('三份 seed 预警数量符合预期（demo-1: 3条, demo-2: 8条, demo-3: 0条）', async () => {
    const schoolText = readFileSync(join(__dirname, 'fixtures/院校名录-mini.md'), 'utf-8')
    // seed 用真实名录数据：mock 数据里院校须用真实名录内院校（上海大学/南京大学）
    // 这里直接读 public/data 真名录验证（若文件缺失则跳过）
    let lookup
    try {
      const realSchool = readFileSync(join(__dirname, '../public/data/2026届院校名录.md'), 'utf-8')
      const realMajor = readFileSync(join(__dirname, '../public/data/冷门专业名录.md'), 'utf-8')
      lookup = await createLookup({ schoolText: realSchool, majorText: realMajor })
    } catch {
      lookup = await createLookup({ schoolText: schoolText, majorText: '| 序号 | 专业名称 | 类别 |\n|---|---|---|\n| 1 | 哲学 | 冷门 |' })
    }
    const r1 = await runWarnings(SEED_RESUMES[0], lookup)
    const r2 = await runWarnings(SEED_RESUMES[1], lookup)
    const r3 = await runWarnings(SEED_RESUMES[2], lookup)
    expect(r1.map((w) => w.ruleNo).sort((a, b) => a - b)).toEqual([4, 6, 8])
    expect(r2.map((w) => w.ruleNo).sort((a, b) => a - b)).toEqual([1, 2, 4, 5, 6, 8, 10, 11])
    expect(r3).toEqual([])
  })
})

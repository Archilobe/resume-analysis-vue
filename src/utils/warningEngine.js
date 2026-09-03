// 11 条预警规则的纯函数实现（需求 2.4.1）
import { calcBmi, parseTimeToMonth, monthDiff } from './formatters'

export const NAVY_DISTRICTS = ['玄武区', '秦淮区', '建邺区', '鼓楼区', '浦口区', '栖霞区', '雨花台区', '江宁区', '六合区', '溧水区', '高淳区', '江北新区']

const TECH_KEYWORDS = [
  'IT', '信息技术', '系统运维', '网络管理',
  '产品经理', '产品运营', '需求分析', 'PRD',
  '软件开发', '程序员', '前端', '后端', '全栈', 'Java', 'Python', 'C++',
  '测试工程师', 'QA', '自动化测试', '性能测试',
  'AI', '人工智能', '机器学习', '深度学习', 'NLP', '算法', '大模型', 'LLM'
]

const RULE_NAMES = {
  1: '最高学历', 2: '毕业时间', 3: '实习经历', 4: '英语要求', 5: '学历空白期',
  6: '期望工作地点', 7: '冷门专业', 8: '家庭信息完整性', 9: '是否同意调剂', 10: '学校范围', 11: 'BMI 分析'
}

function warn(ruleNo, level, description, fieldMarks = []) {
  return { ruleNo, ruleName: RULE_NAMES[ruleNo], level, description, fieldMarks }
}

const DEGREES_OK = ['硕士', '博士']

function month(v) { return parseTimeToMonth(v) }

function inRange(t, startIncl, endExcl) {
  return t && monthDiff(startIncl, t) >= 0 && monthDiff(t, endExcl) > 0
}

function hasValue(v) {
  return v !== undefined && v !== null && String(v).trim() !== ''
}

function isTechDuty(text) {
  const s = String(text || '')
  return TECH_KEYWORDS.some((k) => s.includes(k))
}

function extractIelts(cert) {
  const m = String(cert || '').match(/雅思\s*([\d.]+)/)
  return m ? Number(m[1]) : null
}

function extractCet(cert, level) {
  const m = String(cert || '').match(new RegExp(`(?:CET-?${level}|${level === 4 ? '四级' : '六级'})[^\\d]{0,4}([\\d.]+)`, 'i'))
  return m ? Number(m[1]) : null
}

function checkFamilySide(side, label) {
  const missing = ['relation', 'name', 'company', 'position', 'birthDate'].filter((k) => !hasValue(side?.[k]))
  return { label, complete: missing.length === 0, missingAll: missing.length === 5, missing }
}

function normalizeCity(c) {
  return String(c || '').trim().replace(/(市|地区|特别行政区)$/, '')
}

function runRule(resume, lookup) {
  const out = []
  const basic = resume.basic || {}
  const edus = resume.educationList || []

  // 规则1 最高学历
  if (!hasValue(basic.highestDegree)) {
    out.push(warn(1, 'medium', '最高学历未填写，无法判断学历要求', ['basic.highestDegree']))
  } else if (!DEGREES_OK.includes(basic.highestDegree)) {
    out.push(warn(1, 'high', `最高学历为「${basic.highestDegree}」，非硕士/博士`, ['basic.highestDegree']))
  }

  // 规则2 毕业时间（按海外/国内区分区间）
  const t = month(basic.graduationDate)
  if (!t) {
    out.push(warn(2, 'medium', '毕业时间未识别，无法核验毕业时间要求', ['basic.graduationDate']))
  } else {
    const ok = basic.overseasEducation
      ? inRange(t, { y: 2025, m: 1 }, { y: 2026, m: 8 })
      : inRange(t, { y: 2026, m: 1 }, { y: 2026, m: 8 })
    if (!ok) {
      const isOversea = basic.overseasEducation
      out.push(warn(2, 'high', `最高学历毕业时间 ${basic.graduationDate}，不符合${isOversea ? '海外（2025-01~2026-07）' : '国内（2026-01~2026-07）'}要求`, ['basic.graduationDate']))
    }
  }

  // 规则3 实习经历
  const works = resume.workList || []
  const hasIntern = works.some((w) => hasValue(w.company))
  const techDuty = works.some((w) => isTechDuty(w.description) || isTechDuty(w.position)) || (resume.projectList || []).some((p) => isTechDuty(p.duty))
  if (!hasIntern) {
    out.push(warn(3, 'medium', '简历中未提供实习/工作经历，无法判断', ['workList']))
  } else if (!techDuty) {
    out.push(warn(3, 'high', '有实习经历，但职责描述未涉及 IT/产品/软件开发/测试/AI 等技术领域', ['workList']))
  }

  // 规则4 英语要求
  const langs = resume.languageList || []
  const english = langs.find((l) => /英语|英文/i.test(String(l.language || '')))
  if (!english) {
    out.push(warn(4, 'medium', '简历中未提供英语能力信息，需人工核验', ['languageList']))
  } else {
    const cert = english.certificate
    if (!hasValue(cert)) {
      out.push(warn(4, 'medium', '语种为英语，但未提供雅思/四级等成绩证明，需人工核验', ['languageList']))
    } else {
      const ielts = extractIelts(cert)
      const cet4 = extractCet(cert, 4)
      const cet6 = extractCet(cert, 6)
      const ok = (ielts !== null && ielts >= 6) || (cet4 !== null && cet4 >= 425) || (cet6 !== null && cet6 >= 425)
      if (!ok) {
        out.push(warn(4, 'high', `英语证书「${cert}」未达要求（雅思≥6 或 四级≥425）`, ['languageList']))
      }
    }
  }

  // 规则5 学历空白期：本科结束 → 硕士开始 月份差 > 12
  const bachelor = edus.find((e) => /本科/.test(String(e.level || '')))
  const master = edus.find((e) => /硕士|研究生/.test(String(e.level || '')))
  if (!bachelor || !master) {
    out.push(warn(5, 'medium', '缺少本科或硕士学历记录，无法核验学历衔接', ['educationList']))
  } else {
    const endB = month(bachelor.end)
    const startM = month(master.start)
    if (!endB || !startM) {
      out.push(warn(5, 'medium', '教育经历时间无法识别，无法核验学历衔接', ['educationList']))
    } else {
      const gap = monthDiff(endB, startM)
      if (gap > 12) {
        out.push(warn(5, 'high', `本科结束（${bachelor.end}）至硕士开始（${master.start}）间隔 ${gap} 个月，超过 12 个月`, ['educationList']))
      }
    }
  }

  // 规则6 意向城市
  const cities = resume.intention?.targetCities || []
  if (!cities.length) {
    out.push(warn(6, 'medium', '意向城市未填写，无法确认是否接受南京工作地点', ['intention.targetCities']))
  } else {
    const isNanjing = cities.some((c) => normalizeCity(c) === '南京' || NAVY_DISTRICTS.includes(c))
    if (!isNanjing) {
      out.push(warn(6, 'high', `意向城市为「${cities.join('、')}」，非南京及下辖区县`, ['intention.targetCities']))
    }
  }

  // 规则7 冷门专业（本科及以上，工具查询）
  const higherEdus = edus.filter((e) => /本科|硕士|博士|研究生/.test(String(e.level || '')))
  if (!higherEdus.length) {
    out.push(warn(7, 'medium', '无本科及以上学历记录，无法核验专业', ['educationList']))
  } else {
    const colds = []
    let unknown = false
    for (const e of higherEdus) {
      if (!hasValue(e.major)) { unknown = true; continue }
      const r = lookup.queryMajor(e.major)
      if (r.is_cold_major) colds.push(`${e.school || ''}「${e.major}」`)
      if (r.category === '未收录') unknown = true
    }
    if (colds.length) {
      out.push(warn(7, 'high', `专业属于冷门专业名录：${colds.join('、')}`, higherEdus.map((e, i) => `educationList[${i}].major`)))
    } else if (unknown) {
      out.push(warn(7, 'medium', '部分专业未在名录中收录，需人工核验', higherEdus.map((e, i) => `educationList[${i}].major`)))
    }
  }

  // 规则8 家庭信息完整性
  const f = checkFamilySide(resume.family?.father, '父亲')
  const m = checkFamilySide(resume.family?.mother, '母亲')
  const marks = []
  if (!f.complete) marks.push('family.father')
  if (!m.complete) marks.push('family.mother')
  if (!f.complete || !m.complete) {
    const descs = []
    if (f.missingAll) descs.push('父亲信息完全未填写')
    else if (!f.complete) descs.push(`父亲缺少：${f.missing.join('/')}`)
    if (m.missingAll) descs.push('母亲信息完全未填写')
    else if (!m.complete) descs.push(`母亲缺少：${m.missing.join('/')}`)
    out.push(warn(8, 'high', descs.join('；'), marks))
  }

  // 规则9 是否同意调剂
  if (!hasValue(resume.agreeAdjust)) {
    out.push(warn(9, 'medium', '未填写是否同意调剂，需人工核验', ['agreeAdjust']))
  } else if (resume.agreeAdjust !== true) {
    out.push(warn(9, 'high', '不同意调剂', ['agreeAdjust']))
  }

  // 规则10 学校范围（工具查询；海外院校按国家过滤）
  if (!edus.length) {
    out.push(warn(10, 'medium', '无教育经历记录，无法核验院校范围', ['educationList']))
  } else {
    const outside = []
    edus.forEach((e) => {
      if (!hasValue(e.school)) { outside.push('（未识别）'); return }
      const country = basic.overseasEducation ? (e.country || '') : '中国'
      const r = lookup.querySchool(e.school, basic.overseasEducation ? country : undefined)
      if (!r.in_directory) outside.push(`「${e.school}」`)
    })
    if (outside.length) {
      out.push(warn(10, 'high', `以下院校不在 2026 届院校名录内：${outside.join('、')}`, edus.map((e, i) => `educationList[${i}].school`)))
    }
  }

  // 规则11 BMI
  const bmi = calcBmi(basic.height, basic.weight)
  if (bmi === null) {
    out.push(warn(11, 'medium', '身高或体重未填写，无法计算 BMI', ['basic.height', 'basic.weight']))
  } else if (bmi < 18 || bmi > 24) {
    out.push(warn(11, 'high', `BMI ${bmi.toFixed(1)} 超出正常范围（18~24）`, ['basic.height', 'basic.weight']))
  }

  return out
}

export async function runWarnings(resume, lookup) {
  return runRule(resume, lookup)
}

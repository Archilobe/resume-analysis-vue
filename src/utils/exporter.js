// 导出静态 HTML（自包含、内联样式）与触发 PDF 打印
import { MODULES } from '@/components/detail/modules'
import { formatOrUnknown } from './formatters'

function esc(s) {
  return String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
}
function fv(v) { return esc(formatOrUnknown(v)) }
function kvTable(mod, resume) {
  const data = resume[mod.key] || {}
  const cells = mod.fields.map(([k, label]) => `<div class="cell"><span class="lb">${esc(label)}</span><span class="vl">${fv(Array.isArray(data[k]) ? data[k].join('、') : data[k])}</span></div>`).join('')
  return `<div class="grid">${cells}</div>`
}
function listSection(mod, resume) {
  const rows = resume[mod.key] || []
  if (!rows.length) return `<p class="unknown">未识别</p>`
  return rows.map((r, i) => {
    const title = r.period || r.date || `#${i + 1}`
    const items = mod.fields.filter(([k]) => k !== 'period' && k !== 'date')
      .map(([k, label]) => `<div><span class="lb">${esc(label)}：</span>${fv(r[k])}</div>`).join('')
    return `<div class="li"><div class="li-t">${esc(title)}</div>${items}</div>`
  }).join('')
}
function textList(mod, resume) {
  const rows = resume[mod.key] || []
  return rows.length ? `<ul>${rows.map((r) => `<li>${fv(typeof r === 'string' ? r : JSON.stringify(r))}</li>`).join('')}</ul>` : `<p class="unknown">未识别</p>`
}
function familySection(resume) {
  const fam = resume.family || {}
  const side = (label, person) => {
    const fields = [['relation', '与本人关系'], ['name', '姓名'], ['company', '公司名称'], ['position', '职位名称'], ['birthDate', '出生日期']]
    return `<div class="li"><div class="li-t">${label}</div>${fields.map(([k, lb]) => `<div><span class="lb">${lb}：</span>${fv(person?.[k])}</div>`).join('')}</div>`
  }
  return side('父亲', fam.father) + side('母亲', fam.mother)
}
function photoSection(mod, resume) {
  const rows = resume[mod.key] || []
  return rows.length ? `<ul>${rows.map((r) => `<li>${fv(r.name)}${r.size ? `（${(r.size / 1024).toFixed(0)}KB）` : ''}</li>`).join('')}</ul>` : `<p class="unknown">未识别</p>`
}

export function buildStaticHtml(vo) {
  const { basic = {}, warnings = [], summary, interview } = vo
  const bodyModules = MODULES.map((m) => {
    let inner = ''
    if (m.type === 'kv' || m.type === 'kv-id') inner = kvTable(m, vo)
    else if (m.type === 'list') inner = listSection(m, vo)
    else if (m.type === 'textlist') inner = textList(m, vo)
    else if (m.type === 'family') inner = familySection(vo)
    else if (m.type === 'photos') inner = photoSection(m, vo)
    else if (m.type === 'longtext') inner = `<p>${fv(vo[m.key])}</p>`
    return `<section><h2>${m.no}. ${esc(m.title)}</h2>${inner}</section>`
  }).join('')

  const warnHtml = warnings.length
    ? warnings.map((w) => `<div class="wi ${w.level}"><b>规则${w.ruleNo}：${esc(w.ruleName)}</b><p>${esc(w.description)}</p><span>等级：${w.level === 'high' ? '高' : '中（需人工核验）'}</span></div>`).join('')
    : `<p>无预警，全部规则检查通过。</p>`

  return `<!DOCTYPE html>
<html lang="zh-CN"><head><meta charset="UTF-8"><title>简历解析结果 — ${fv(basic.name)}</title>
<style>
body{font-family:system-ui,-apple-system,'PingFang SC','Microsoft YaHei',sans-serif;max-width:1080px;margin:24px auto;padding:0 16px;color:#303133}
h1{border-bottom:2px solid #409eff;padding-bottom:8px}
section{background:#fff;border:1px solid #e4e7ed;border-radius:8px;padding:16px;margin-bottom:16px}
h2{font-size:16px;margin:0 0 12px}
.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px 16px}
.cell{display:flex;gap:6px}.lb{color:#909399;white-space:nowrap}
.li{border-left:3px solid #dcdfe6;padding:6px 10px;margin-bottom:8px}
.li-t{font-weight:600;margin-bottom:4px}
.unknown{color:#909399}
.wi{border:1px solid #e4e7ed;border-radius:8px;padding:10px;margin-bottom:8px}
.wi.high{border-left:4px solid #f56c6c}.wi.medium{border-left:4px solid #e6a23c}
.side{display:grid;grid-template-columns:1fr 1fr;gap:16px}
</style></head><body>
<h1>简历解析结果 — ${fv(basic.name)}</h1>
<div class="side"><div>
${bodyModules}
</div><div>
<section><h2>预警结果（${warnings.length}）</h2>${warnHtml}</section>
<section><h2>简历摘要</h2>
<h3>候选人概况</h3><p>${fv(summary?.overview)}</p>
<h3>实习与项目经验</h3><p>${fv(summary?.internships)}</p>
<h3>核心技能</h3><p>${fv(summary?.skills)}</p>
<h3>风险提示</h3><p>${fv((summary?.risks || []).join('；'))}</p>
</section>
<section><h2>面试建议</h2>
<h3>建议面试方向</h3><p>${fv(interview?.directions?.join(' / '))}</p>
<h3>建议面试问题</h3>${(interview?.questionGroups || []).map((g) => `<div><b>${esc(g.category)}</b><ul>${g.questions.map((q) => `<li>${esc(q)}</li>`).join('')}</ul></div>`).join('')}
<h3>面试中需关注</h3><ul>${(interview?.concerns || []).map((c) => `<li>${esc(c)}</li>`).join('')}</ul>
</section>
</div></div>
</body></html>`
}

export function exportHtml(vo) {
  const blob = new Blob([buildStaticHtml(vo)], { type: 'text/html;charset=utf-8' })
  import('file-saver').then(({ saveAs }) => saveAs(blob, `简历解析结果_${vo.basic?.name || vo.id}.html`))
}

export function exportPdf() {
  window.print()
}

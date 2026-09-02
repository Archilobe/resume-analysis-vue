# 简历解析与预警系统前端 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现需求文档的完整 Vue3 前端：简历上传 → 解析进度 → 三栏详情页（21 模块 + 11 条预警规则 + 摘要 + 面试建议），Mock 数据独立可运行。

**Architecture:** axios 自定义 adapter 实现 mock/真实接口零成本切换；预警引擎为纯函数（输入结构化简历 JSON + 名录查询器，输出预警数组）；名录（院校/冷门专业）作为外部数据源放 `public/data/*.md`，运行时 fetch 并解析 Markdown 表格，禁止硬编码名单。

**Tech Stack:** Vite 5 / Vue 3.4 (`<script setup>`) / Vuex 4 / Vue Router 4 / Element Plus 2.x / Axios / Vitest / file-saver

**Spec:** `docs/superpowers/specs/2026-08-31-resume-analysis-vue-design.md`（本计划与其配套阅读）

## Global Constraints

- Node v22 / npm 10；npm registry 为公司 nexus（`http://nexus.goodcol.com/repository/npm-public/`），不要改 npm 配置
- Mock 默认开启：`VITE_USE_MOCK` 缺省即 mock；仅显式 `false` 时走真实 HTTP
- 名录数据（423 所院校、冷门专业）禁止以常量形式写进 src 代码，只能放 `public/data/*.md` 运行时解析（测试 fixture 除外）
- 未识别字段一律展示「未识别」，不留空
- 预警等级两种：`high`（红，明确触发不符合）/ `medium`（黄，信息未提供无法判断需人工核验）；与需求文档示例一致：规则 4 英语未提供证书→中、规则 6 意向城市未填→中、规则 8 家庭信息缺失→高
- 证件号码脱敏仅显后 4 位；「查看完整」需 ElMessageBox 二次确认
- 上传限制：`.pdf/.doc/.docx`、单文件 ≤ 20MB、单次 1 个
- 所有用户可见文案为中文

---

### Task 1: 项目脚手架与可运行骨架

**Files:**
- Create: `package.json`, `vite.config.js`, `index.html`, `.env`, `.gitignore`, `src/main.js`, `src/App.vue`, `src/router/index.js`, `src/store/index.js`, `src/store/modules/resume.js`（占位）, `src/views/UploadView.vue`（占位）, `src/views/ResumeListView.vue`（占位）, `src/views/ResumeDetailView.vue`（占位）

**Interfaces:**
- Produces: dev server（5173 端口）；`@` 别名 → `src/`；Vitest（environment: node）；路由表 `/`→UploadView、`/list`→ResumeListView、`/resume/:id`→ResumeDetailView；`src/store/index.js` 导出装配了 resume 模块的 store

- [ ] **Step 1: git init 与 .gitignore**

```bash
cd /Users/archilobe/workspace/project/goodcol/resume-analysis-vue && git init
```

`.gitignore`：

```
node_modules
dist
.DS_Store
*.local
```

- [ ] **Step 2: package.json**

```json
{
  "name": "resume-analysis-vue",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run"
  },
  "dependencies": {
    "@element-plus/icons-vue": "^2.3.1",
    "axios": "^1.7.9",
    "element-plus": "^2.9.3",
    "file-saver": "^2.0.5",
    "vue": "^3.5.13",
    "vue-router": "^4.5.0",
    "vuex": "^4.1.0"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^5.2.1",
    "vitest": "^2.1.8",
    "vite": "^5.4.11"
  }
}
```

- [ ] **Step 3: vite.config.js**

```js
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:8080', changeOrigin: true }
    }
  },
  test: { environment: 'node' }
})
```

- [ ] **Step 4: index.html 与 .env**

`index.html`：

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>简历解析与预警系统</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.js"></script>
  </body>
</html>
```

`.env`：

```
VITE_USE_MOCK=true
VITE_API_BASE_URL=/api
```

- [ ] **Step 5: src/main.js 与 src/App.vue**

`src/main.js`：

```js
import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import 'element-plus/dist/index.css'
import App from './App.vue'
import router from './router'
import store from './store'

const app = createApp(App)
app.use(store)
app.use(router)
app.use(ElementPlus, { locale: zhCn })
app.mount('#app')
```

`src/App.vue`：

```vue
<template>
  <el-config-provider>
    <router-view />
  </el-config-provider>
</template>
```

- [ ] **Step 6: router 与 store**

`src/router/index.js`：

```js
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'upload', component: () => import('@/views/UploadView.vue') },
    { path: '/list', name: 'list', component: () => import('@/views/ResumeListView.vue') },
    { path: '/resume/:id', name: 'detail', component: () => import('@/views/ResumeDetailView.vue') }
  ]
})

export default router
```

`src/store/index.js`：

```js
import { createStore } from 'vuex'
import resume from './modules/resume'

export default createStore({
  modules: { resume }
})
```

`src/store/modules/resume.js`（本任务占位，Task 6 补全）：

```js
export default {
  namespaced: true,
  state: () => ({ list: [], current: null }),
  mutations: {},
  actions: {},
  getters: {}
}
```

- [ ] **Step 7: 三个占位视图**

`src/views/UploadView.vue`：

```vue
<template>
  <div class="page"><el-empty description="简历上传（开发中）" /></div>
</template>
```

`src/views/ResumeListView.vue`：

```vue
<template>
  <div class="page"><el-empty description="简历列表（开发中）" /></div>
</template>
```

`src/views/ResumeDetailView.vue`：

```vue
<template>
  <div class="page"><el-empty description="简历详情（开发中）" /></div>
</template>
```

- [ ] **Step 8: 安装依赖并验证**

```bash
npm install
npm run build
```

Expected: build 成功生成 dist/。再 `npm run dev` 启动后浏览器访问 `http://localhost:5173` 能看到「简历上传（开发中）」空态页（验证后 Ctrl+C 停掉）。

- [ ] **Step 9: Commit**

```bash
git add -A && git commit -m "chore: 项目脚手架（Vite+Vue3+Vuex+Router+ElementPlus）"
```

### Task 2: 名录数据源与查询工具（TDD）

**Files:**
- Create: `public/data/2026届院校名录.md`（复制自需求目录）、`public/data/冷门专业名录.md`
- Create: `src/utils/directoryLookup.js`
- Test: `tests/directoryLookup.test.js`
- Test fixture: `tests/fixtures/院校名录-mini.md`（含重名院校的最小名录，测试不依赖大文件）

**Interfaces:**
- Produces:
  - `createLookup({ schoolSource, majorSource })` → `Promise<Lookup>`；`Lookup.querySchool(name, country?)` → `{ in_directory: boolean, matches: [{name, category, country}] }`；`Lookup.queryMajor(name)` → `{ in_directory: boolean, is_cold_major: boolean, category: '冷门'|'非冷门'|'未收录' }`
  - `parseSchoolTable(mdText)` / `parseMajorTable(mdText)`：导出的纯解析函数（供测试）
  - `loadDefaultLookup()`：fetch `/data/2026届院校名录.md` 与 `/data/冷门专业名录.md` 并返回 Lookup（浏览器用）

- [ ] **Step 1: 复制名录并创建冷门专业名录**

```bash
cp "/Users/archilobe/workspace/project/goodcol/resume-analysis/简历解析需求/2026届院校名录.md" public/data/2026届院校名录.md
```

`public/data/冷门专业名录.md`（附录 C 示例，注明待业务方提供）：

```markdown
# 冷门专业名录

> 数据来源：业务方提供（当前为参考示例，正式名录待业务方确认后替换本文件，无需修改代码）。

| 序号 | 专业名称 | 类别 |
|------|----------|------|
| 1 | 哲学 | 冷门 |
| 2 | 历史学 | 冷门 |
| 3 | 考古学 | 冷门 |
| 4 | 宗教学 | 冷门 |
| 5 | 古文字学 | 冷门 |
| 6 | 人类学 | 冷门 |
| 7 | 民族学 | 冷门 |
| 8 | 计算机科学与技术 | 非冷门 |
| 9 | 软件工程 | 非冷门 |
| 10 | 电子信息工程 | 非冷门 |
| 11 | 金融学 | 非冷门 |
```

- [ ] **Step 2: 写失败测试**

`tests/fixtures/院校名录-mini.md`：

```markdown
# 测试名录

## QS前200（1所）

| 序号 | 学校名称 | 英文名 | 国家/地区 |
|------|----------|--------|-----------|
| 1 | 东北大学 | Tohoku University | 日本 |

## 国内985（1所）

| 序号 | 学校名称 | 英文名 | 国家/地区 |
|------|----------|--------|-----------|
| 1 | 东北大学 |  | 中国 |

## 国内211（1所）

| 序号 | 学校名称 | 英文名 | 国家/地区 |
|------|----------|--------|-----------|
| 1 | 上海大学 |  | 中国 |

## 国内一本（0所）

| 序号 | 学校名称 | 英文名 | 国家/地区 |
|------|----------|--------|-----------|
```

`tests/directoryLookup.test.js`：

```js
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { parseSchoolTable, parseMajorTable, createLookup } from '@/utils/directoryLookup'

const mini = readFileSync(join(__dirname, 'fixtures/院校名录-mini.md'), 'utf-8')
const majorMd = `| 序号 | 专业名称 | 类别 |
|------|----------|------|
| 1 | 哲学 | 冷门 |
| 2 | 计算机科学与技术 | 非冷门 |`

describe('parseSchoolTable', () => {
  it('解析四个分类与院校行', () => {
    const idx = parseSchoolTable(mini)
    expect(Object.keys(idx.categories).sort()).toEqual(['国内211', '国内985', '国内一本', 'QS前200'])
    expect(idx.byName.get('上海大学')).toEqual([{ name: '上海大学', category: '国内211', country: '中国' }])
  })
  it('重名院校（东北大学）返回两条不同国家记录', () => {
    const idx = parseSchoolTable(mini)
    expect(idx.byName.get('东北大学')).toHaveLength(2)
  })
})

describe('parseMajorTable', () => {
  it('解析专业类别', () => {
    const idx = parseMajorTable(majorMd)
    expect(idx.byName.get('哲学')[0].category).toBe('冷门')
    expect(idx.byName.get('计算机科学与技术')[0].category).toBe('非冷门')
  })
})

describe('createLookup', () => {
  it('querySchool 命中/未命中/按国家过滤', async () => {
    const lookup = await createLookup({ schoolText: mini, majorText: majorMd })
    expect(lookup.querySchool('东北大学', '中国').in_directory).toBe(true)
    expect(lookup.querySchool('东北大学').matches).toHaveLength(2)
    expect(lookup.querySchool('不存在的大学').in_directory).toBe(false)
    expect(lookup.querySchool('东北大学', '美国').in_directory).toBe(false)
  })
  it('queryMajor 三种类别', async () => {
    const lookup = await createLookup({ schoolText: mini, majorText: majorMd })
    expect(lookup.queryMajor('哲学').is_cold_major).toBe(true)
    expect(lookup.queryMajor('计算机科学与技术').is_cold_major).toBe(false)
    expect(lookup.queryMajor('量子园艺').category).toBe('未收录')
  })
})
```

- [ ] **Step 3: 运行测试确认失败**

Run: `npx vitest run tests/directoryLookup.test.js`
Expected: FAIL（模块不存在）

- [ ] **Step 4: 实现 src/utils/directoryLookup.js**

```js
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
```

- [ ] **Step 5: 运行测试确认通过**

Run: `npx vitest run tests/directoryLookup.test.js`
Expected: PASS（6 个用例）

- [ ] **Step 6: 验证真实名录可解析 + Commit**

```bash
node --input-type=module -e "
import { readFileSync } from 'node:fs';
import { parseSchoolTable } from './src/utils/directoryLookup.js';
const idx = parseSchoolTable(readFileSync('public/data/2026届院校名录.md', 'utf-8'));
let n = 0; for (const v of idx.byName.values()) n += v.length;
console.log('total:', n, '上海大学:', idx.byName.get('上海大学')[0].category);
"
```

Expected: `total: 423 上海大学: 国内211`

```bash
git add -A && git commit -m "feat: 名录外部数据源与运行时查询工具（含单测）"
```

---

### Task 3: 格式化工具与预警引擎（TDD）

**Files:**
- Create: `src/utils/formatters.js`, `src/utils/warningEngine.js`
- Test: `tests/warningEngine.test.js`

**Interfaces:**
- Consumes: Task 2 的 `createLookup` 产物 Lookup
- Produces:
  - `formatOrUnknown(value)`：空值 → `'未识别'`，否则原值
  - `maskIdNumber(idNo)`：保留后 4 位，如 `****1234`；长度 ≤4 时全显
  - `calcBmi(heightCm, weightKg)` → number | null
  - `parseTimeToMonth(v)`：`'2023.09'`/`'2023-09'`/`'2023年9月'`/`'2023-09-01'` → `{y: 2023, m: 9}` | null
  - `monthDiff(a, b)`：b − a 的月数
  - `runWarnings(resume, lookup)` → `Promise<Array<{ruleNo, ruleName, level, description, fieldMarks}>>`；`fieldMarks` 为字段路径数组（如 `['basic.name', 'education[0].school']`）
  - `NAVY_DISTRICTS`（南京下辖区县常量，附录 A）

- [ ] **Step 1: 写失败测试**

`tests/warningEngine.test.js`：

```js
import { describe, it, expect } from 'vitest'
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
  it('maskIdNumber', () => { expect(maskIdNumber('320102200001150011')).toBe('************0011'); expect(maskIdNumber('1234')).toBe('1234') })
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
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npx vitest run tests/warningEngine.test.js`
Expected: FAIL（模块不存在）

- [ ] **Step 3: 实现 formatters 与 warningEngine**

`src/utils/formatters.js`：

```js
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
```

`src/utils/warningEngine.js`：

```js
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
  const m = String(cert || '').match(new RegExp(`(?:CET-?${level}|四${level === 4 ? '级' : '六级'})[^\\d]{0,4}([\\d.]+)`, 'i'))
  return m ? Number(m[1]) : null
}

function checkFamilySide(side, label) {
  const missing = ['relation', 'name', 'company', 'position', 'birthDate'].filter((k) => !hasValue(side?.[k]))
  return { label, complete: missing.length === 0, missingAll: missing.length === 5, missing }
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
    const isNanjing = cities.some((c) => c === '南京' || NAVY_DISTRICTS.includes(c))
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
    edus.forEach((e, i) => {
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
```

注意实现中（对照测试修正）：`warn(7, ...)` 未收录分支的括号，以及 `parseTimeToMonth` 对 `'2023年9月'` 的支持。

- [ ] **Step 4: 运行测试确认通过**

Run: `npx vitest run tests/warningEngine.test.js`
Expected: PASS（~35 个用例）

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: 11条预警规则引擎与格式化工具（含单测）"
```

---


### Task 4: Mock 数据层 + API 层 + Vuex

**Files:**
- Create: `src/mock/data.js`, `src/mock/index.js`, `src/api/request.js`, `src/api/resume.js`
- Modify: `src/store/modules/resume.js`（补全）

**Interfaces:**
- Consumes: Task 2 `loadDefaultLookup`、Task 3 `runWarnings`
- Produces:
  - `src/api/resume.js`：`uploadResume(file, onProgress)` → `Promise<{resumeId, fileName, size}>`；`getProgress(id)` → `Promise<{percent, status: 'parsing'|'done'|'failed'}>`；`getResume(id)` → `Promise<ResumeVO>`；`getResumeList()` → `Promise<Array>`；`deleteResume(id)` → `Promise<void>`
  - 简历 JSON 结构 = Task 3 `baseResume()` 的扁平结构（basic/contact/certificate/intention/agreeAdjust/educationList/workList/projectList/practiceList/campusList/trainingList/skillList/certificateList/languageList/awardList/family/companyRelatives/photos/attachments/selfEvaluation/interests/extraQuestions）+ 顶层 `id/fileName/parsedAt/summary/interview`；`warnings` 不入库，由引擎实时计算
  - Vuex resume 模块：state `{list: [], current: null, lookup: null}`；actions `fetchList/fetchDetail/remove/initLookup`；getters `currentWarnings`（基于 current + lookup 调 runWarnings，返回 promise 风格由组件处理）

**说明**：`family` 五字段判定字段名统一为 `{relation, name, company, position, birthDate}`；`certificateList`（模块12 资格证书）字段 `{name, date, org}`；`awardList`（模块14）字段 `{name, date, org, referee, level}`；`photos` 为 `[{name, url}]`（url 用 placehold.co 或纯色 data-uri 占位）；`attachments` 为 `[{name, size, url}]`。

- [ ] **Step 1: mock 三份示例简历**

`src/mock/data.js`：三份简历均为**扁平结构全字段**（不许省略字段），并导出 `SEED_RESUMES`：

- demo-1「郑前」（对应需求文档示例）：女 2000-01-01，上海大学硕士 2023-09~2026-06（国内211，名录内），本科上海大学软件工程 2019-09~2023-06；工作经历：交通银行算法实习生 2023-09~2025-04（描述含 NLP/算法）、九方智投算法实习生 2025-05~2025-09（描述含 大模型/Agent）；项目经历：心语 Hearsay（职责含 NLP/LLM）、QuickCapture（职责含 RAG）；技能：LLM应用开发/精通 等 4 条；**语言技能仅一条英语且 certificate: ''**（规则4→medium）；**targetCities: []**（规则6→medium）；**family 双亲全空**（规则8→high）；身高165 体重55；agreeAdjust: true；预期：规则 4/6/8 三条预警（2 medium + 1 high），其余通过
- demo-2「王强」：男 1999-03-04，**highestDegree: '本科'**（规则1→high），毕业时间 **2027-06**（规则2→high），**targetCities: ['上海']**（规则6→high），身高175 体重90（BMI 29.4→规则11 high），本科院校「华东联合大学」**不在名录**（规则10→high），语言技能英语 certificate: ''（规则4→medium），family 只有母亲缺父亲（规则8→high），教育经历单段本科 2021-09~2027-06 专业「计算机科学与技术」（非冷门，规则7过），有 1 段实习（描述含 软件开发/Python，规则3过），agreeAdjust: true（规则9过）；注意无硕士学历记录 → 规则5 也会触发 medium（缺硕士无法核验衔接）；预期：规则 1/2/6/10/11/8 六条 high + 规则4/5 两条 medium，共 8 条
- demo-3「李慧」：男改女，1999-05-12 出生，**本科** 2022-09~2026-06 南京大学软件工程（名录内），硕士无（规则1 会 high？不——demo-3 必须无预警，故 **highestDegree: '本科' 会触发规则1**）

**修正 demo-3**：demo-3 为「无预警」样本，但规则 1 要求硕士/博士——故 demo-3 highestDegree: '硕士'，南京大学硕士 2024-09~2026-06、本科南京大学 2020-09~2024-06；南京籍 targetCities: ['南京市']（**注意规则6 判断**：'南京市' ≠ '南京'，引擎需 normalize 去掉「市」后匹配，见 Step 2 引擎修正）；英语雅思 7.0（≥6 通过）；家庭完整；身高162 体重52（BMI 19.8 通过）；实习职责含 AI。预期：0 条预警。

- [ ] **Step 2: 引擎修正（demo-3 暴露的问题）**

`src/utils/warningEngine.js` 规则 6 匹配时对城市名做 normalize：去掉尾部「市」/「地区」再比较；同步在 `tests/warningEngine.test.js` 加一个用例：

```js
it('南京市（带市后缀）→ 无预警', async () => {
  const r = baseResume(); r.intention.targetCities = ['南京市']
  expect(findRule(await runWarnings(r, stubLookup), 6)).toBeUndefined()
})
```

规则 6 实现改为：

```js
function normalizeCity(c) {
  return String(c || '').trim().replace(/(市|地区|特别行政区)$/, '')
}
const isNanjing = cities.some((c) => ['南京'].includes(normalizeCity(c)) || NAVY_DISTRICTS.includes(c))
```

- [ ] **Step 3: mock adapter 与 API 层**

`src/mock/index.js`：

```js
// axios adapter 形式的 mock 层。VITE_USE_MOCK=false 时本文件不被引用。
import { SEED_RESUMES } from './data'
import { loadDefaultLookup } from '@/utils/directoryLookup'
import { runWarnings } from '@/utils/warningEngine'

const resumes = new Map(SEED_RESUMES.map((r) => [r.id, { ...r }]))
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
    const seed = SEED_RESUMES[(id.length + seq) % SEED_RESUMES.length] // 轮换模板
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
```

`src/api/request.js`：

```js
import axios from 'axios'

const useMock = import.meta.env.VITE_USE_MOCK !== 'false'

async function mockAdapter(config) {
  const { default: mock } = await import('@/mock/index')
  const res = await mock(config)
  // 模拟网络延迟，让进度条可见
  await new Promise((r) => setTimeout(r, 150))
  return res
}

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 30000,
  ...(useMock ? { adapter: mockAdapter } : {})
})

request.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const msg = err.response?.data?.message || err.message || '请求失败'
    return Promise.reject(new Error(msg))
  }
)

export default request
```

`src/api/resume.js`：

```js
import request from './request'

export function uploadResume(file, onProgress) {
  const form = new FormData()
  form.append('file', file)
  return request.post('/resume/upload', form, {
    onUploadProgress: (e) => { if (e.total && onProgress) onProgress(Math.round((e.loaded / e.total) * 100)) }
  })
}

export function getProgress(id) {
  return request.get(`/resume/${id}/progress`)
}

export function getResume(id) {
  return request.get(`/resume/${id}`)
}

export function getResumeList() {
  return request.get('/resume/list')
}

export function deleteResume(id) {
  return request.post(`/resume/${id}/delete`)
}
```

- [ ] **Step 4: Vuex resume 模块**

`src/store/modules/resume.js`（整文件替换）：

```js
import { getResume, getResumeList, deleteResume } from '@/api/resume'
import { loadDefaultLookup } from '@/utils/directoryLookup'
import { runWarnings } from '@/utils/warningEngine'

export default {
  namespaced: true,
  state: () => ({ list: [], current: null, lookup: null }),
  mutations: {
    SET_LIST(state, list) { state.list = list },
    SET_CURRENT(state, r) { state.current = r },
    SET_LOOKUP(state, l) { state.lookup = l }
  },
  actions: {
    async initLookup({ commit, state }) {
      if (!state.lookup) commit('SET_LOOKUP', await loadDefaultLookup())
      return state.lookup
    },
    async fetchList({ commit }) {
      commit('SET_LIST', await getResumeList())
    },
    async fetchDetail({ commit }, id) {
      const r = await getResume(id)
      commit('SET_CURRENT', r)
      return r
    },
    async remove({ dispatch }, id) {
      await deleteResume(id)
      await dispatch('fetchList')
    },
    async computeWarnings({ state }, resume) {
      const lookup = await loadDefaultLookup()
      return runWarnings(resume, lookup)
    }
  },
  getters: {
    warnMap(state) {
      // {'basic.name': 'high', ...}
      const map = {}
      for (const w of state.current?.warnings || []) {
        for (const p of w.fieldMarks) if (!map[p] || map[p] === 'medium') map[p] = w.level
      }
      // high 覆盖 medium
      for (const w of state.current?.warnings || []) {
        if (w.level === 'high') for (const p of w.fieldMarks) map[p] = 'high'
      }
      return map
    },
    warnCount(state) { return state.current?.warnings?.length || 0 }
  }
}
```

注意：detail 接口已返回服务端计算的 warnings（mock adapter 里算好），store 的 `computeWarnings` 仅作前端兜底（真实后端就绪后如果后端不算预警，前端仍可用）。

- [ ] **Step 5: 冒烟验证与 Commit**

```bash
npm run build
```

Expected: 构建通过（mock/api/store 均被正确打包）。

```bash
git add -A && git commit -m "feat: mock数据层、axios适配器、API层与Vuex状态"
```

---

### Task 5: 上传页与列表页

**Files:**
- Modify: `src/views/UploadView.vue`, `src/views/ResumeListView.vue`
- Create: `src/layouts/PageHeader.vue`（简单页头，三个页面共用）

**Interfaces:**
- Consumes: Task 4 API（`uploadResume/getProgress`）、Vuex `resume/fetchList/remove`
- Produces: 完整可交互的上传流（校验→上传→进度→自动跳转 `/resume/:id`）与列表页（表格/删除/跳转）

- [ ] **Step 1: PageHeader 组件**

`src/layouts/PageHeader.vue`：

```vue
<template>
  <header class="page-header">
    <div class="left">
      <slot name="left" />
    </div>
    <div class="title">{{ title }}</div>
    <div class="right">
      <slot name="right" />
    </div>
  </header>
</template>

<script setup>
defineProps({ title: { type: String, default: '' } })
</script>

<style scoped>
.page-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 24px; height: 56px;
  background: #fff; border-bottom: 1px solid var(--el-border-color-light);
  position: sticky; top: 0; z-index: 10;
}
.title { font-size: 16px; font-weight: 600; color: var(--el-text-color-primary); }
</style>
```

- [ ] **Step 2: 上传页**

`src/views/UploadView.vue`（整文件替换）：

```vue
<template>
  <div class="upload-page">
    <PageHeader title="简历上传">
      <template #right>
        <el-button text @click="router.push('/list')">简历列表</el-button>
      </template>
    </PageHeader>

    <div class="body">
      <el-card class="card">
        <template #header><b>简历上传</b></template>

        <el-upload
          v-if="phase === 'idle'"
          drag
          :auto-upload="false"
          :show-file-list="false"
          :on-change="onFileChange"
          class="uploader"
        >
          <el-icon :size="48" class="upload-icon"><UploadFilled /></el-icon>
          <div class="el-upload__text">将简历文件拖拽到此处，或 <em>点击选择文件</em></div>
          <template #tip>
            <div class="el-upload__tip">支持 PDF / Word 格式，单文件 ≤ 20MB，每次上传 1 份</div>
          </template>
        </el-upload>

        <div v-else class="file-panel">
          <div class="file-row">
            <el-icon :size="28"><Document /></el-icon>
            <span class="fname">{{ file?.name }}</span>
            <span class="fsize">{{ sizeText }}</span>
          </div>

          <template v-if="phase === 'uploading'">
            <div class="status">上传中 {{ upPercent }}%</div>
            <el-progress :percentage="upPercent" />
          </template>

          <template v-else-if="phase === 'parsing'">
            <div class="status"><el-icon class="is-loading"><Loading /></el-icon> 解析中，请稍候…</div>
            <el-progress :percentage="parsePercent" :stroke-width="10" />
          </template>

          <template v-else-if="phase === 'failed'">
            <el-alert type="error" :title="`解析失败：${errorMsg}`" :closable="false" show-icon />
            <el-button type="primary" @click="reset">重新上传</el-button>
          </template>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { UploadFilled, Document, Loading } from '@element-plus/icons-vue'
import PageHeader from '@/layouts/PageHeader.vue'
import { uploadResume, getProgress } from '@/api/resume'

const router = useRouter()
const ACCEPT = ['.pdf', '.doc', '.docx']
const MAX_MB = 20

const phase = ref('idle') // idle | uploading | parsing | failed
const file = ref(null)
const upPercent = ref(0)
const parsePercent = ref(0)
const errorMsg = ref('')
let timer = null

const sizeText = computed(() => file.value ? `${(file.value.size / 1024 / 1024).toFixed(1)}MB` : '')

function onFileChange(uploadFile) {
  const f = uploadFile.raw
  if (!f) return
  const ext = `.${f.name.split('.').pop().toLowerCase()}`
  if (!ACCEPT.includes(ext)) { ElMessage.error(`不支持的文件格式 ${ext}，仅支持 PDF / Word`); return }
  if (f.size > MAX_MB * 1024 * 1024) { ElMessage.error(`文件超过 ${MAX_MB}MB 限制`); return }
  start(f)
}

async function start(f) {
  file.value = f
  phase.value = 'uploading'
  upPercent.value = 0
  try {
    const { resumeId } = await uploadResume(f, (p) => { upPercent.value = p })
    phase.value = 'parsing'
    parsePercent.value = 0
    poll(resumeId)
  } catch (e) {
    phase.value = 'failed'
    errorMsg.value = e.message
  }
}

function poll(id) {
  timer = setInterval(async () => {
    try {
      const { percent, status } = await getProgress(id)
      parsePercent.value = percent
      if (status === 'done') {
        stop()
        ElMessage.success('解析完成')
        router.push(`/resume/${id}`)
      } else if (status === 'failed') {
        stop(); phase.value = 'failed'; errorMsg.value = '解析失败'
      }
    } catch (e) { stop(); phase.value = 'failed'; errorMsg.value = e.message }
  }, 500)
}

function stop() { if (timer) { clearInterval(timer); timer = null } }
function reset() {
  stop(); phase.value = 'idle'; file.value = null
  upPercent.value = 0; parsePercent.value = 0; errorMsg.value = ''
}
onUnmounted(stop)
</script>

<style scoped>
.upload-page { min-height: 100vh; background: var(--el-fill-color-lighter); }
.body { max-width: 720px; margin: 48px auto; padding: 0 16px; }
.uploader { width: 100%; }
.upload-icon { color: var(--el-color-primary); margin-bottom: 8px; }
.file-panel { display: flex; flex-direction: column; gap: 16px; }
.file-row { display: flex; align-items: center; gap: 10px; color: var(--el-text-color-primary); }
.fname { font-weight: 600; }
.fsize { color: var(--el-text-color-secondary); font-size: 13px; }
.status { display: flex; align-items: center; gap: 6px; color: var(--el-text-color-regular); }
</style>
```

- [ ] **Step 3: 列表页**

`src/views/ResumeListView.vue`（整文件替换）：

```vue
<template>
  <div class="list-page">
    <PageHeader title="简历列表">
      <template #left>
        <el-button text @click="router.push('/')">← 上传简历</el-button>
      </template>
    </PageHeader>

    <div class="body">
      <el-card shadow="never">
        <el-table :data="list" v-loading="loading" stripe>
          <el-table-column prop="name" label="姓名" width="120" />
          <el-table-column prop="gender" label="性别" width="80" />
          <el-table-column prop="highestDegree" label="最高学历" width="100" />
          <el-table-column prop="graduationDate" label="毕业时间" width="140" />
          <el-table-column label="解析时间" min-width="160">
            <template #default="{ row }">{{ row.parsedAt || '—' }}</template>
          </el-table-column>
          <el-table-column label="操作" width="160" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click="router.push(`/resume/${row.id}`)">查看</el-button>
              <el-button link type="danger" @click="onDelete(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-empty v-if="!loading && !list.length" description="暂无简历，去上传第一份吧" />
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import PageHeader from '@/layouts/PageHeader.vue'
import { useStore } from 'vuex'

const router = useRouter()
const store = useStore()
const list = computed(() => store.state.resume.list)
const loading = ref(false)

onMounted(async () => {
  loading.value = true
  await store.dispatch('resume/fetchList').catch((e) => ElMessage.error(e.message))
  loading.value = false
})

async function onDelete(row) {
  await ElMessageBox.confirm(`确定删除「${row.name || row.fileName}」的简历吗？`, '删除确认', { type: 'warning' })
  await store.dispatch('resume/remove', row.id)
  ElMessage.success('已删除')
}
</script>

<style scoped>
.list-page { min-height: 100vh; background: var(--el-fill-color-lighter); }
.body { max-width: 1080px; margin: 24px auto; padding: 0 16px; }
</style>
```

注意：`computed` 需从 vue 导入（上面 script 漏了，实现时补：`import { onMounted, ref, computed } from 'vue'`）。

- [ ] **Step 4: 手动验证与 Commit**

`npm run dev` → 首页上传任意一个 `.pdf` 文件 → 进度条走到 100% → 自动跳转 `/resume/r-xxx`（详情页仍是占位空态，属正常）→ 手动改 URL 到 `/list` 能看到刚上传的记录。验证后停掉 dev server。

```bash
git add -A && git commit -m "feat: 上传页（校验/进度/自动跳转）与简历列表页"
```

---

### Task 6: 详情页（三栏布局 + 21 模块 + 右栏三面板 + 导出）

**Files:**
- Create: `src/utils/exporter.js`, `src/components/detail/ModuleNav.vue`, `src/components/detail/FieldValue.vue`, `src/components/detail/ModuleCard.vue`, `src/components/detail/ListRenderer.vue`, `src/components/detail/WarningPanel.vue`, `src/components/detail/SummaryPanel.vue`, `src/components/detail/InterviewPanel.vue`
- Modify: `src/views/ResumeDetailView.vue`（整文件替换）

**Interfaces:**
- Consumes: Task 3/4 全部（resume VO 结构、`maskIdNumber`、`formatOrUnknown`、Vuex getters `resume/warnMap`、`resume/warnCount`）
- Produces: 完整详情页。导出 HTML 的 `buildStaticHtml(vo)` 在 exporter.js，输入同详情页 VO。

- [ ] **Step 1: MODULES 元数据 + exporter**

`src/components/detail/modules.js`：

```js
// 21 模块元数据：驱动左侧导航与中栏渲染
export const MODULES = [
  { no: 1, key: 'basic', title: '基本信息', type: 'kv', fields: [
    ['name', '姓名'], ['gender', '性别'], ['birthDate', '出生日期'],
    ['highestDegree', '最高学历'], ['graduationDate', '毕业时间'], ['workYears', '工作年限'],
    ['employmentStatus', '在职状态'], ['maritalStatus', '婚姻状态'], ['height', '身高(cm)'],
    ['weight', '体重(kg)'], ['overseasEducation', '海外教育经历'], ['country', '国家/地区'],
    ['householdType', '入学前户口性质'], ['householdLocation', '入学前户口所在地'], ['hometown', '籍贯'],
    ['hukouLocation', '户口所在地'], ['ethnicity', '民族'], ['politicalStatus', '政治面貌'],
    ['formalWorkExperience', '正式工作经历']
  ]},
  { no: 2, key: 'contact', title: '联系信息', type: 'kv', fields: [
    ['phone', '手机号'], ['email', '邮箱'], ['postcode', '邮编'], ['address', '居住地址']
  ]},
  { no: 3, key: 'certificate', title: '证件信息', type: 'kv-id', fields: [
    ['nationality', '国籍'], ['idType', '证件类型'], ['idNumber', '证件号码']
  ]},
  { no: 4, key: 'intention', title: '求职意向', type: 'kv', fields: [
    ['currentCity', '现居地'], ['targetCities', '意向城市'], ['onboardTime', '到岗时间'], ['expectSalary', '期望薪资']
  ]},
  { no: 5, key: 'educationList', title: '教育经历', type: 'list', fields: [
    ['period', '时间段'], ['school', '院校'], ['major', '专业'], ['location', '院校所在地'],
    ['studyMode', '学习形式'], ['rank', '成绩排名'], ['gpa', '绩点'], ['gpaFull', '满分绩点'],
    ['retake', '重修/补考'], ['isFullTime', '是否全日制']
  ]},
  { no: 6, key: 'workList', title: '工作经历', type: 'list', fields: [
    ['period', '时间段'], ['company', '公司名称'], ['position', '职位'], ['department', '部门'],
    ['description', '工作描述'], ['achievement', '工作业绩'], ['reason', '离职原因']
  ]},
  { no: 7, key: 'projectList', title: '项目经历', type: 'list', fields: [
    ['period', '时间段'], ['name', '项目名称'], ['description', '项目描述'], ['duty', '职责描述']
  ]},
  { no: 8, key: 'practiceList', title: '实践经历', type: 'textlist' },
  { no: 9, key: 'campusList', title: '校园活动', type: 'textlist' },
  { no: 10, key: 'trainingList', title: '培训经历', type: 'textlist' },
  { no: 11, key: 'skillList', title: '专业技能', type: 'list', fields: [
    ['name', '技能名称'], ['level', '掌握程度'], ['years', '使用时长']
  ]},
  { no: 12, key: 'certificateList', title: '资格证书', type: 'list', fields: [
    ['name', '证书名称'], ['date', '获得时间'], ['org', '授予机构']
  ]},
  { no: 13, key: 'languageList', title: '语言技能', type: 'list', fields: [
    ['language', '语种'], ['level', '掌握程度'], ['certificate', '获得证书']
  ]},
  { no: 21, key: 'extraQuestions', title: '附加问题', type: 'kv', fields: [
    ['majorViolation', '重大违法违规违纪或涉黑涉恶'], ['business', '个人经商办企业'], ['majorIllness', '重大疾病或家族遗传病史']
  ]},
  { no: 14, key: 'awardList', title: '获奖信息', type: 'list', fields: [
    ['name', '获奖名称'], ['date', '获得时间'], ['org', '授予单位'], ['referee', '证明人'], ['level', '奖项级别']
  ]},
  { no: 15, key: 'family', title: '家庭信息', type: 'family' },
  { no: 16, key: 'companyRelatives', title: '我司亲属', type: 'kv', fields: [
    ['hasRelatives', '是否有我司亲属'], ['needAvoidance', '是否涉及亲属回避']
  ]},
  { no: 17, key: 'photos', title: '生活照', type: 'photos' },
  { no: 18, key: 'selfEvaluation', title: '自我评价', type: 'longtext' },
  { no: 19, key: 'interests', title: '特长兴趣', type: 'longtext' },
  { no: 20, key: 'attachments', title: '附件', type: 'photos' },
  { no: 21b, key: 'extraQuestions2', title: '附加问题占位', type: 'hidden' }
]
```

> 模块顺序修正：需求文档导航顺序为 1基本信息 2联系信息 3证件信息 4求职意向 5教育经历 6工作经历 7项目经历 8实践经历 9校园活动 10培训经历 11专业技能 12资格证书 13语言技能 14获奖信息 15家庭信息 16我司亲属 17生活照 18自我评价 19特长兴趣 20附件 21附加问题。上面数组里 21(附加问题) 放错位了——**以需求顺序为准**：extraQuestions 是 no:21 放最后，删除上面数组中第一次出现的 extraQuestions 条目与最后的占位条目，正确数组为：

```js
export const MODULES = [
  { no: 1, key: 'basic', title: '基本信息', type: 'kv', fields: [
    ['name', '姓名'], ['gender', '性别'], ['birthDate', '出生日期'],
    ['highestDegree', '最高学历'], ['graduationDate', '毕业时间'], ['workYears', '工作年限'],
    ['employmentStatus', '在职状态'], ['maritalStatus', '婚姻状态'], ['height', '身高(cm)'],
    ['weight', '体重(kg)'], ['overseasEducation', '海外教育经历'], ['country', '国家/地区'],
    ['householdType', '入学前户口性质'], ['householdLocation', '入学前户口所在地'], ['hometown', '籍贯'],
    ['hukouLocation', '户口所在地'], ['ethnicity', '民族'], ['politicalStatus', '政治面貌'],
    ['formalWorkExperience', '正式工作经历']
  ]},
  { no: 2, key: 'contact', title: '联系信息', type: 'kv', fields: [
    ['phone', '手机号'], ['email', '邮箱'], ['postcode', '邮编'], ['address', '居住地址']
  ]},
  { no: 3, key: 'certificate', title: '证件信息', type: 'kv-id', fields: [
    ['nationality', '国籍'], ['idType', '证件类型'], ['idNumber', '证件号码']
  ]},
  { no: 4, key: 'intention', title: '求职意向', type: 'kv', fields: [
    ['currentCity', '现居地'], ['targetCities', '意向城市'], ['onboardTime', '到岗时间'], ['expectSalary', '期望薪资']
  ]},
  { no: 5, key: 'educationList', title: '教育经历', type: 'list', fields: [
    ['period', '时间段'], ['school', '院校'], ['major', '专业'], ['location', '院校所在地'],
    ['studyMode', '学习形式'], ['rank', '成绩排名'], ['gpa', '绩点'], ['gpaFull', '满分绩点'],
    ['retake', '重修/补考'], ['isFullTime', '是否全日制']
  ]},
  { no: 6, key: 'workList', title: '工作经历', type: 'list', fields: [
    ['period', '时间段'], ['company', '公司名称'], ['position', '职位'], ['department', '部门'],
    ['description', '工作描述'], ['achievement', '工作业绩'], ['reason', '离职原因']
  ]},
  { no: 7, key: 'projectList', title: '项目经历', type: 'list', fields: [
    ['period', '时间段'], ['name', '项目名称'], ['description', '项目描述'], ['duty', '职责描述']
  ]},
  { no: 8, key: 'practiceList', title: '实践经历', type: 'textlist' },
  { no: 9, key: 'campusList', title: '校园活动', type: 'textlist' },
  { no: 10, key: 'trainingList', title: '培训经历', type: 'textlist' },
  { no: 11, key: 'skillList', title: '专业技能', type: 'list', fields: [
    ['name', '技能名称'], ['level', '掌握程度'], ['years', '使用时长']
  ]},
  { no: 12, key: 'certificateList', title: '资格证书', type: 'list', fields: [
    ['name', '证书名称'], ['date', '获得时间'], ['org', '授予机构']
  ]},
  { no: 13, key: 'languageList', title: '语言技能', type: 'list', fields: [
    ['language', '语种'], ['level', '掌握程度'], ['certificate', '获得证书']
  ]},
  { no: 14, key: 'awardList', title: '获奖信息', type: 'list', fields: [
    ['name', '获奖名称'], ['date', '获得时间'], ['org', '授予单位'], ['referee', '证明人'], ['level', '奖项级别']
  ]},
  { no: 15, key: 'family', title: '家庭信息', type: 'family' },
  { no: 16, key: 'companyRelatives', title: '我司亲属', type: 'kv', fields: [
    ['hasRelatives', '是否有我司亲属'], ['needAvoidance', '是否涉及亲属回避']
  ]},
  { no: 17, key: 'photos', title: '生活照', type: 'photos' },
  { no: 18, key: 'selfEvaluation', title: '自我评价', type: 'longtext' },
  { no: 19, key: 'interests', title: '特长兴趣', type: 'longtext' },
  { no: 20, key: 'attachments', title: '附件', type: 'photos' },
  { no: 21, key: 'extraQuestions', title: '附加问题', type: 'kv', fields: [
    ['majorViolation', '重大违法违规违纪或涉黑涉恶'], ['business', '个人经商办企业'], ['majorIllness', '重大疾病或家族遗传病史']
  ]}
]
```

- [ ] **Step 2: FieldValue 与 ModuleCard 组件**

`src/components/detail/FieldValue.vue`：

```vue
<template>
  <span :class="['fv', levelClass]" :title="levelTitle">
    <template v-if="masked">{{ display }}<el-button link type="primary" size="small" @click="onReveal">查看完整</el-button></template>
    <template v-else>{{ display }}</template>
  </span>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessageBox } from 'element-plus'
import { formatOrUnknown } from '@/utils/formatters'

const props = defineProps({
  value: { type: null, default: '' },
  warnLevel: { type: String, default: '' },
  warnTitle: { type: String, default: '' },
  sensitive: { type: Boolean, default: false }
})
const revealed = ref(false)
const levelClass = computed(() => props.warnLevel ? `field-${props.warnLevel}` : '')
const levelTitle = computed(() => props.warnLevel ? `预警：${props.warnTitle}` : '')
const masked = computed(() => props.sensitive && !revealed.value)
const display = computed(() => {
  const v = formatOrUnknown(props.value)
  if (!masked.value) return v
  const s = String(props.value || '')
  return s.length <= 4 ? v : '*'.repeat(Math.max(4, s.length - 4)) + s.slice(-4)
})
async function onReveal() {
  await ElMessageBox.confirm('查看完整证件号码需要二次确认，确认查看？', '敏感信息确认', { type: 'warning' })
  revealed.value = true
  setTimeout(() => { revealed.value = false }, 60000) // 60s 后自动重新脱敏
}
</script>

<style scoped>
.fv.field-high { background: var(--el-color-danger-light-7); color: var(--el-color-danger); padding: 1px 6px; border-radius: 3px; }
.fv.field-medium { background: var(--el-color-warning-light-7); color: var(--el-color-warning-dark); padding: 1px 6px; border-radius: 3px; }
</style>
```

`src/components/detail/ModuleCard.vue`：

```vue
<template>
  <section :id="`mod-${module.key}`" class="module-card">
    <div class="mod-head">
      <span class="mod-no">{{ module.no }}</span>
      <span class="mod-title">{{ module.title }}</span>
    </div>
    <div class="mod-body">
      <!-- kv / kv-id -->
      <el-descriptions v-if="module.type === 'kv' || module.type === 'kv-id'" :column="3" border>
        <el-descriptions-item v-for="f in module.fields" :key="f[0]" :label="f[1]">
          <FieldValue
            :value="displayValue(f[0])"
            :warn-level="warnMap[path(f[0])]"
            :warn-title="warnTitle(path(f[0]))"
            :sensitive="module.type === 'kv-id' && f[0] === 'idNumber'"
          />
        </el-descriptions-item>
      </el-descriptions>

      <!-- list -->
      <template v-else-if="module.type === 'list'">
        <el-empty v-if="!rows.length" description="未识别" :image-size="48" />
        <el-timeline v-else>
          <el-timeline-item v-for="(row, i) in rows" :key="i" :timestamp="row.period || row.date || `#${i + 1}`" placement="top">
            <div class="list-grid">
              <div v-for="f in module.fields.filter((x) => x[0] !== 'period' && x[0] !== 'date')" :key="f[0]" class="list-item">
                <span class="li-label">{{ f[1] }}：</span>
                <FieldValue :value="row[f[0]]" :warn-level="warnMap[path(f[0], i)]" :warn-title="warnTitle(path(f[0], i))" />
              </div>
            </div>
          </el-timeline-item>
        </el-timeline>
      </template>

      <!-- textlist -->
      <template v-else-if="module.type === 'textlist'">
        <el-empty v-if="!rows.length" description="未识别" :image-size="48" />
        <ul v-else class="text-list">
          <li v-for="(t, i) in rows" :key="i">{{ typeof t === 'string' ? t : JSON.stringify(t, null, 2) }}</li>
        </ul>
      </template>

      <!-- family -->
      <template v-else-if="module.type === 'family'">
        <el-descriptions :column="5" border title="父亲">
          <el-descriptions-item v-for="f in FAMILY_FIELDS" :key="f[0]" :label="f[1]">
            <FieldValue :value="rows.father?.[f[0]]" :warn-level="warnMap[`family.father`]" :warn-title="warnTitle('family.father')" />
          </el-descriptions-item>
        </el-descriptions>
        <el-descriptions :column="5" border title="母亲" style="margin-top: 12px">
          <el-descriptions-item v-for="f in FAMILY_FIELDS" :key="f[0]" :label="f[1]">
            <FieldValue :value="rows.mother?.[f[0]]" :warn-level="warnMap[`family.mother`]" :warn-title="warnTitle('family.mother')" />
          </el-descriptions-item>
        </el-descriptions>
      </template>

      <!-- photos / attachments -->
      <template v-else-if="module.type === 'photos'">
        <el-empty v-if="!rows.length" description="未识别" :image-size="48" />
        <div v-else-if="module.key === 'photos'" class="photo-grid">
          <el-image v-for="(p, i) in rows" :key="i" :src="p.url" :preview-src-list="[p.url]" fit="cover" class="photo" />
        </div>
        <ul v-else class="text-list">
          <li v-for="(a, i) in rows" :key="i">
            {{ a.name }}（{{ (a.size / 1024).toFixed(0) }}KB）
            <el-tag size="small" type="info">演示数据</el-tag>
          </li>
        </ul>
      </template>

      <!-- longtext -->
      <template v-else-if="module.type === 'longtext'">
        <span class="longtext">{{ formatOrUnknown(rows) }}</span>
      </template>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import FieldValue from './FieldValue.vue'
import { formatOrUnknown } from '@/utils/formatters'

const props = defineProps({
  module: { type: Object, required: true },
  resume: { type: Object, required: true },
  warnMap: { type: Object, default: () => ({}) },
  warnDescriptions: { type: Object, default: () => ({}) }
})

const FAMILY_FIELDS = [['relation', '与本人关系'], ['name', '姓名'], ['company', '公司名称'], ['position', '职位名称'], ['birthDate', '出生日期']]

const rows = computed(() => {
  const v = props.resume[props.module.key]
  if (props.module.type === 'family') return v || { father: {}, mother: {} }
  return Array.isArray(v) ? v : v ?? ''
})

function path(field, index) {
  return index === undefined ? `${props.module.key}.${field}` : `${props.module.key}[${index}].${field}`
}
function displayValue(field) {
  const v = props.resume[props.module.key]?.[field]
  return Array.isArray(v) ? (v.length ? v.join('、') : '') : v
}
function warnTitle(p) {
  return props.warnDescriptions[p] || ''
}
</script>

<style scoped>
.module-card { background: #fff; border-radius: 8px; padding: 16px 20px; margin-bottom: 16px; border: 1px solid var(--el-border-color-lighter); }
.mod-head { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
.mod-no { background: var(--el-color-primary); color: #fff; border-radius: 4px; font-size: 12px; padding: 1px 7px; }
.mod-title { font-weight: 600; }
.list-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 16px; }
.li-label { color: var(--el-text-color-secondary); }
.text-list { margin: 0; padding-left: 20px; line-height: 1.9; }
.photo-grid { display: flex; gap: 12px; flex-wrap: wrap; }
.photo { width: 96px; height: 128px; border-radius: 6px; }
.longtext { white-space: pre-wrap; line-height: 1.8; }
</style>
```

- [ ] **Step 3: ModuleNav 与右栏三面板**

`src/components/detail/ModuleNav.vue`：

```vue
<template>
  <nav class="mod-nav">
    <div
      v-for="m in MODULES"
      :key="m.key"
      :class="['nav-item', { active: m.key === activeKey }]"
      @click="$emit('jump', m.key)"
    >
      {{ m.no }}. {{ m.title }}
    </div>
  </nav>
</template>

<script setup>
import { MODULES } from './modules'

defineProps({ activeKey: { type: String, default: '' } })
defineEmits(['jump'])
</script>

<style scoped>
.mod-nav { display: flex; flex-direction: column; gap: 2px; }
.nav-item { padding: 7px 12px; border-radius: 6px; cursor: pointer; font-size: 13px; color: var(--el-text-color-regular); }
.nav-item:hover { background: var(--el-fill-color); }
.nav-item.active { background: var(--el-color-primary-light-9); color: var(--el-color-primary); font-weight: 600; }
</style>
```

`src/components/detail/WarningPanel.vue`：

```vue
<template>
  <el-card shadow="never" class="panel">
    <template #header>
      <div class="head">
        <b>预警结果</b>
        <el-tag :type="count ? 'danger' : 'success'" size="small">{{ count ? `共 ${count} 项预警` : '无预警' }}</el-tag>
      </div>
    </template>
    <el-empty v-if="!count" description="全部规则检查通过" :image-size="60" />
    <div v-for="w in warnings" :key="w.ruleNo" :class="['w-item', w.level]">
      <div class="w-head">
        <span class="w-dot">{{ w.level === 'high' ? '🔴' : '🟡' }}</span>
        <span class="w-title">规则{{ w.ruleNo }}：{{ w.ruleName }}</span>
      </div>
      <div class="w-desc">{{ w.description }}</div>
      <div class="w-level">预警等级：{{ w.level === 'high' ? '🔴 高' : '🟡 中（需人工核验）' }}</div>
    </div>
  </el-card>
</template>

<script setup>
defineProps({
  warnings: { type: Array, default: () => [] },
  count: { type: Number, default: 0 }
})
</script>

<style scoped>
.panel { margin-bottom: 16px; }
.head { display: flex; justify-content: space-between; align-items: center; }
.w-item { border: 1px solid var(--el-border-color-lighter); border-radius: 8px; padding: 10px 12px; margin-bottom: 10px; }
.w-item.high { border-left: 4px solid var(--el-color-danger); }
.w-item.medium { border-left: 4px solid var(--el-color-warning); }
.w-head { display: flex; gap: 6px; align-items: center; font-weight: 600; font-size: 13px; }
.w-desc { color: var(--el-text-color-regular); font-size: 12px; margin: 6px 0; line-height: 1.6; }
.w-level { font-size: 12px; color: var(--el-text-color-secondary); }
</style>
```

`src/components/detail/SummaryPanel.vue`：

```vue
<template>
  <el-card shadow="never" class="panel">
    <template #header><b>简历摘要</b></template>
    <template v-if="summary">
      <div class="sec"><div class="sec-t">👤 候选人概况</div><p class="sec-b">{{ summary.overview }}</p></div>
      <div class="sec"><div class="sec-t">💼 实习与项目经验</div><p class="sec-b">{{ summary.internships }}</p></div>
      <div class="sec"><div class="sec-t">🛠 核心技能</div><p class="sec-b">{{ summary.skills }}</p></div>
      <div class="sec"><div class="sec-t">⚠️ 风险提示</div>
        <ul v-if="summary.risks?.length" class="risk-list"><li v-for="(r, i) in summary.risks" :key="i">{{ r }}</li></ul>
        <p v-else class="sec-b">无</p>
      </div>
    </template>
    <el-empty v-else description="未识别" :image-size="60" />
  </el-card>
</template>

<script setup>
defineProps({ summary: { type: Object, default: null } })
</script>

<style scoped>
.panel { margin-bottom: 16px; }
.sec { margin-bottom: 12px; }
.sec-t { font-weight: 600; font-size: 13px; margin-bottom: 4px; }
.sec-b { margin: 0; font-size: 13px; line-height: 1.7; color: var(--el-text-color-regular); white-space: pre-wrap; }
.risk-list { margin: 0; padding-left: 18px; font-size: 13px; color: var(--el-color-warning-dark); line-height: 1.8; }
</style>
```

`src/components/detail/InterviewPanel.vue`：

```vue
<template>
  <el-card shadow="never" class="panel">
    <template #header><b>面试建议</b></template>
    <template v-if="interview">
      <div class="sec"><div class="sec-t">📌 建议面试方向</div>
        <p class="sec-b">{{ interview.directions?.join(' / ') }}</p>
      </div>
      <div class="sec"><div class="sec-t">📝 建议面试问题</div>
        <div v-for="(g, gi) in interview.questionGroups" :key="gi" class="q-group">
          <div class="q-cat">{{ gi + 1 }}. {{ g.category }}</div>
          <ul class="q-list"><li v-for="(q, qi) in g.questions" :key="qi">{{ q }}</li></ul>
        </div>
      </div>
      <div class="sec"><div class="sec-t">⚠️ 面试中需关注</div>
        <ul class="q-list"><li v-for="(c, i) in interview.concerns" :key="i">{{ c }}</li></ul>
      </div>
    </template>
    <el-empty v-else description="未识别" :image-size="60" />
  </el-card>
</template>

<script setup>
defineProps({ interview: { type: Object, default: null } })
</script>

<style scoped>
.panel { margin-bottom: 16px; }
.sec { margin-bottom: 12px; }
.sec-t { font-weight: 600; font-size: 13px; margin-bottom: 4px; }
.sec-b { margin: 0; font-size: 13px; color: var(--el-text-color-regular); }
.q-group { margin-bottom: 8px; }
.q-cat { font-size: 13px; font-weight: 600; color: var(--el-text-color-primary); }
.q-list { margin: 4px 0 0; padding-left: 18px; font-size: 13px; line-height: 1.8; color: var(--el-text-color-regular); }
</style>
```

- [ ] **Step 4: exporter 与详情页视图**

`src/utils/exporter.js`：

```js
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
```

`src/views/ResumeDetailView.vue`（整文件替换）：

```vue
<template>
  <div class="detail-page">
    <PageHeader :title="`简历解析结果 — ${resume?.basic?.name || ''}`">
      <template #left>
        <el-button text @click="router.push('/list')">← 返回列表</el-button>
      </template>
      <template #right>
        <el-button @click="onExportHtml">导出 HTML</el-button>
        <el-button type="primary" @click="onExportPdf">导出 PDF</el-button>
      </template>
    </PageHeader>

    <div v-loading="loading" class="three-col">
      <template v-if="resume">
        <aside class="col-left">
          <ModuleNav :active-key="activeKey" @jump="onJump" />
        </aside>
        <main class="col-mid">
          <ModuleCard v-for="m in MODULES" :key="m.key" :module="m" :resume="resume" :warn-map="warnMap" :warn-descriptions="warnDescriptions" />
        </main>
        <aside class="col-right">
          <WarningPanel :warnings="resume.warnings || []" :count="warnCount" />
          <SummaryPanel :summary="resume.summary" />
          <InterviewPanel :interview="resume.interview" />
        </aside>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import PageHeader from '@/layouts/PageHeader.vue'
import ModuleNav from '@/components/detail/ModuleNav.vue'
import ModuleCard from '@/components/detail/ModuleCard.vue'
import WarningPanel from '@/components/detail/WarningPanel.vue'
import SummaryPanel from '@/components/detail/SummaryPanel.vue'
import InterviewPanel from '@/components/detail/InterviewPanel.vue'
import { MODULES } from '@/components/detail/modules'
import { useStore } from 'vuex'
import { exportHtml, exportPdf } from '@/utils/exporter'

const route = useRoute()
const router = useRouter()
const store = useStore()
const loading = ref(true)
const activeKey = ref('basic')

const resume = computed(() => store.state.resume.current)
const warnMap = computed(() => store.getters['resume/warnMap'])
const warnCount = computed(() => store.getters['resume/warnCount'])

// fieldPath -> 预警说明（FieldValue title 提示用）
const warnDescriptions = computed(() => {
  const map = {}
  for (const w of resume.value?.warnings || []) {
    for (const p of w.fieldMarks) if (!map[p]) map[p] = `${w.ruleName}：${w.description}`
  }
  return map
})

onMounted(async () => {
  try {
    await store.dispatch('resume/fetchDetail', route.params.id)
    await store.dispatch('resume/initLookup')
  } catch (e) {
    ElMessage.error(e.message)
  } finally {
    loading.value = false
    setupObserver()
  }
})

let observer = null
function setupObserver() {
  observer = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) {
        const key = e.target.id.replace('mod-', '')
        activeKey.value = key
      }
    }
  }, { rootMargin: '-96px 0px -60% 0px' })
  document.querySelectorAll('.module-card').forEach((el) => observer.observe(el))
}
onUnmounted(() => observer?.disconnect())

function onJump(key) {
  document.getElementById(`mod-${key}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
function onExportHtml() {
  exportHtml(resume.value)
  ElMessage.success('HTML 导出成功')
}
function onExportPdf() {
  exportPdf()
}
</script>

<style scoped>
.detail-page { min-height: 100vh; background: var(--el-fill-color-lighter); }
.three-col { display: grid; grid-template-columns: 200px 1fr 360px; gap: 16px; max-width: 1440px; margin: 16px auto; padding: 0 16px; align-items: start; }
.col-left { position: sticky; top: 72px; background: #fff; border-radius: 8px; padding: 12px; border: 1px solid var(--el-border-color-lighter); }
.col-right { position: sticky; top: 72px; max-height: calc(100vh - 88px); overflow-y: auto; }
@media (max-width: 1100px) {
  .three-col { grid-template-columns: 1fr; }
  .col-left, .col-right { position: static; max-height: none; }
}

/* 打印样式：导出 PDF 时只打印中栏与右栏 */
@media print {
  .col-left, .page-header { display: none !important; }
  .three-col { display: block; }
  .module-card, .panel { break-inside: avoid; }
}
</style>
```

注意：全局 print 样式需在 `src/App.vue` 或全局 css 补充 `@page { size: A4; margin: 12mm; }` 与 `body { background: #fff; }`（scoped 内 `.detail-page` 背景无法覆盖 body），实现时在 `src/main.js` 引入的样式后追加一段非 scoped 的 `<style>` 于 `App.vue`：

```vue
<style>
body { margin: 0; background: var(--el-fill-color-lighter); }
@page { size: A4; margin: 12mm; }
@media print { body { background: #fff; } }
</style>
```

- [ ] **Step 5: 全流程手动验证**

`npm run dev`：
1. 上传任一 pdf → 进度 → 跳转详情页
2. 详情页三栏渲染、左导航点击滚动 + 滚动高亮联动
3. 列表页三份 seed 数据与刚上传的新简历都在；demo-1（郑前）显示规则 4/6/8 三条预警；证件号码脱敏 + 查看完整二次确认
4. 预警字段红/黄高亮（如郑前-语言技能 certificate 黄色、家庭信息红色）
5. 导出 HTML 下载后浏览器打开内容完整；导出 PDF 弹打印预览

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: 详情页三栏布局、21模块渲染、预警高亮、摘要面试建议与导出"
```

---

### Task 7: 全量测试与构建验证

**Files:**
- Test: `tests/warningEngine.test.js`（补 demo 场景用例：三份 seed 的预警数量断言）

**Interfaces:**
- Consumes: Task 4 `SEED_RESUMES`、Task 3 `runWarnings`
- Produces: `npm test` 全绿、`npm run build` 成功

- [ ] **Step 1: 补 seed 简历预警数量回归用例**

追加到 `tests/warningEngine.test.js`：

```js
import { SEED_RESUMES } from '@/mock/data'
import { createLookup } from '@/utils/directoryLookup'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

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
    expect(r1.map((w) => w.ruleNo).sort()).toEqual([4, 6, 8])
    expect(r2.map((w) => w.ruleNo).sort()).toEqual([1, 2, 4, 5, 6, 8, 10, 11])
    expect(r3).toEqual([])
  })
})
```

- [ ] **Step 2: 运行全部测试**

Run: `npm test`
Expected: 全部 PASS。若有失败：修复 seed 数据或引擎边界（以需求文档规则为准）。

- [ ] **Step 3: 构建验证**

Run: `npm run build`
Expected: 构建成功无错误。

- [ ] **Step 4: 全流程冒烟（dev server）**

按 Task 6 Step 5 清单再跑一遍。

- [ ] **Step 5: 写 README 与 Commit**

`README.md`：

```markdown
# resume-analysis-vue

简历解析与预警系统前端（Vue3 + Vite + Element Plus）。

## 快速开始

npm install
npm run dev      # http://localhost:5173
npm test         # Vitest 单测
npm run build    # 生产构建

## 说明

- 默认 Mock 模式运行（VITE_USE_MOCK=true），无需后端；上传任意 PDF/Word 即可体验完整流程
- 三份内置示例：郑前（3条预警）、王强（7条预警）、李慧（无预警）；新上传的简历会从示例模板轮换生成
- 预警规则在前端实现（src/utils/warningEngine.js，11 条规则）；院校名录/冷门专业名录为外部数据源（public/data/*.md，运行时解析，禁止硬编码）
- 对接真实后端：.env 中设 VITE_USE_MOCK=false，接口契约见 src/api/resume.js
```

```bash
git add -A && git commit -m "test: seed预警回归用例、README 与构建验证"
```

# 简历解析与预警系统前端 — 设计文档

- 日期：2026-08-31
- 状态：已确认（用户批准）
- 需求来源：`/Users/archilobe/workspace/project/goodcol/resume-analysis/简历解析需求/简历解析与预警需求文档.md`

## 1. 目标

实现需求文档的完整前端：简历上传 → 解析进度 → 详情页（三栏布局：21 个模块 + 预警结果 + 简历摘要 + 面试建议），支持导出 HTML / PDF。**Mock 数据独立可运行**，不依赖后端；预留 axios 请求层，后端就绪后改环境变量即可切换。

用户已确认的两个决策：

1. 数据策略：Mock 数据，独立可运行（axios 适配器可切换）
2. 页面范围：上传页 + 列表页 + 详情页（三页）

## 2. 技术栈

| 项 | 选择 |
|---|---|
| 构建 | Vite 5 |
| 框架 | Vue 3.4（`<script setup>` 组合式 API） |
| 状态 | Vuex 4（resume 模块） |
| 范式 | Vue Router 4（history 模式） |
| UI | Element Plus 完整引入 + @element-plus/icons-vue |
| HTTP | Axios |
| 测试 | Vitest |
| 导出 | file-saver（HTML）+ window.print()（PDF） |

## 3. Mock 架构

- `src/api/request.js`：创建 axios 实例。`VITE_USE_MOCK=true`（默认）时注册自定义适配器（axios `adapter` 配置），把请求分发到 `src/mock/`；false 时走真实 HTTP。
- `src/mock/index.js`：路由表 `{ 'POST /api/resume/upload': handler, ... }`。模拟网络延迟（200-800ms）。上传接口返回 resumeId 后，`GET /api/resume/{id}/progress` 模拟解析进度（基于经过时间算百分比，完成后返回 100 + 结果就绪状态）。
- `src/mock/data.js`：3 份完整示例简历（21 模块全字段）：高预警（触发规则 4/6/8）、中预警（触发规则 1/10）、无预警。列表页数据即详情数据的摘要视图。
- 持久化：Vuex resume 模块 state 同步到 localStorage，刷新不丢。

## 4. 预警引擎

`src/utils/warningEngine.js` — 纯函数 `runWarnings(resume, { schoolDir, majorDir })`，输出：

```js
[{ ruleNo, ruleName, level: 'high'|'medium', description, fieldMarks: ['basic.name', ...] }]
```

11 条规则实现要点：

| 规则 | 实现要点 |
|---|---|
| 1 最高学历 | 非 硕士/博士 → high；字段缺失 → medium |
| 2 毕业时间 | 按「是否有海外教育经历」区分：国内院校 2026-01（含）≤ t < 2026-08 正常；海外院校 2025-01（含）≤ t < 2026-08 正常；否则 → high；缺失 → medium |
| 3 实习经历 | ≥1 段工作经历公司名非空 且 项目/工作描述命中附录 B 关键词 → 正常；缺失/未命中 → medium |
| 4 英语要求 | 语言技能含英语且（雅思 ≥6 或 CET-4 ≥425）正常；英语无证书 → high；无英语记录 → medium |
| 5 学历空白期 | 本科结束月 → 硕士开始月 >12 个月 → high |
| 6 意向城市 | 意向城市 ∈ 南京或 12 个下辖区县 → 正常；未填写 → medium；非南京 → high |
| 7 冷门专业 | 遍历本科及以上专业，majorDir 查询 is_cold_major → high；名录未收录 → medium |
| 8 家庭信息 | 父/母亲 5 字段任一缺失 → high；全缺 → high |
| 9 同意调剂 | 不同意/未填写 → medium（"未填写"按文档属中等级别需人工核验情形） |
| 10 学校范围 | 任一院校 schoolDir 查询 in_directory=false → high |
| 11 BMI | 体重/(身高m)² <18 或 >24 → high；数据缺失 → medium |

等级约定：**high**=明确触发不符合；**medium**=信息未提供无法判断，需人工核验。字段级高亮通过 `fieldMarks` 路径实现，详情页按等级染红/黄。

## 5. 名录查询（外部数据源，禁止硬编码）

- `public/data/2026届院校名录.md`：从需求目录复制原文件（423 所，Markdown 表格）。
- `public/data/冷门专业名录.md`：按附录 C 示例创建（哲学类、历史学类等 + 注明"待业务方提供"）。
- `src/utils/directoryLookup.js`：fetch 名录 md → 解析 Markdown 表格 → 构建索引：
  - `querySchool(name, country?)` → `{in_directory, matches:[{name,category,country}]}`
  - `queryMajor(name)` → `{in_directory, is_cold_major, category}`
- 名录更新只需替换 public/data 下文件，无需改代码。

## 6. 页面设计

### 6.1 路由

```
/            UploadView      上传页
/list        ResumeListView  简历列表页
/resume/:id  ResumeDetailView 详情页
```

### 6.2 上传页

- el-upload（drag，单文件，beforeUpload 校验 pdf/doc/docx + ≤20MB）
- 校验失败 ElMessage.error；成功后显示文件信息 + el-progress 解析进度，1.5s 间隔轮询进度接口
- 100% 后 ElMessage.success + router.push(`/resume/${id}`)
- 失败态：显示原因 + 重新上传按钮

### 6.3 列表页

- el-table：姓名 / 性别 / 最高学历 / 毕业时间 / 预警数（红色徽标）/ 解析时间 / 操作（查看、删除）
- 删除走 ElMessageBox.confirm；空态引导去上传

### 6.4 详情页（三栏）

- 左栏（220px，sticky）：21 模块锚点导航，IntersectionObserver 高亮当前模块，点击 scrollIntoView
- 中栏：21 个模块卡片
  - 键值对模块（基本信息/联系/证件/求职意向/家庭/附加问题/我司亲属）：el-descriptions；预警字段按 fieldMarks 红/黄底色
  - 列表模块（教育/工作/项目/技能/证书/语言/获奖）：el-timeline 或多卡片，按时间倒序
  - 自由文本（实践/校园活动/培训/自我评价/特长兴趣）：段落展示
  - 生活照：缩略图 + el-image 大图预览
  - 附件：文件列表 + 下载图标（mock 无真实文件，展示"演示数据"提示）
  - 证件号码：默认 `****xxxx`（后4位），「查看完整」→ ElMessageBox.confirm 二次确认后展示，60s 后自动重新脱敏
- 右栏（360px，sticky）：预警结果 → 简历摘要 → 面试建议
  - 预警卡片：`规则{ruleNo}：{ruleName}`、说明、等级徽标（高-红 danger，中-黄 warning）
  - 摘要四段：候选人概况 / 实习与项目经验 / 核心技能 / 风险提示（风险提示由预警结果直接映射）
  - 面试建议三段：建议面试方向 / 建议面试问题（分类分组）/ 面试中需关注
- 顶栏：返回列表 + 标题 + [导出 HTML] [导出 PDF]
  - 导出 HTML：`buildStaticHtml(resume, warnings, summary, interview)` 拼接完整 HTML 文件（内联样式）→ file-saver 下载
  - 导出 PDF：window.print() + print CSS（隐藏左右栏导航交互元素，仅打印中栏+右栏内容）

### 6.5 预警高亮

详情页加载时将 warnings 的 fieldMarks 映射到模块字段。渲染时：`warnLevel(fieldPath)` 返回 ''/'high'/'medium'，对应 class `field-high`（红底）/ `field-medium`（黄底），并加 title 提示预警说明。

## 7. 目录结构

```
resume-analysis-vue/
├── public/data/
│   ├── 2026届院校名录.md
│   └── 冷门专业名录.md
├── src/
│   ├── api/{request.js, resume.js}
│   ├── mock/{index.js, data.js}
│   ├── store/{index.js, modules/resume.js}
│   ├── router/index.js
│   ├── utils/{warningEngine.js, directoryLookup.js, formatters.js, exporter.js}
│   ├── components/
│   │   ├── ModuleNav.vue
│   │   ├── warn/（预警/摘要/面试建议三面板）
│   │   └── modules/（21 模块渲染器，键值对/列表/文本/照片/附件五类）
│   ├── views/{UploadView.vue, ResumeListView.vue, ResumeDetailView.vue}
│   ├── App.vue, main.js
├── tests/（Vitest：warningEngine + directoryLookup）
```

## 8. 测试策略

- warningEngine：每条规则至少 3 用例（触发 / 不触发 / 边界或缺失字段），共 ~35 用例
- directoryLookup：md 表格解析、重名院校（东北大学中日双录）、未收录
- 页面流程：dev 服务器手动验证 上传→进度→跳转→详情→高亮→导出

## 9. 环境配置

`.env`：

```
VITE_USE_MOCK=true
VITE_API_BASE_URL=/api
```

后端就绪后设 `VITE_USE_MOCK=false` 并配 vite proxy。

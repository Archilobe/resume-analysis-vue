# resume-analysis-vue

简历解析与预警系统前端（Vue3 + Vite + Element Plus）。

## 快速开始

npm install
npm run dev      # http://localhost:5173
npm test         # Vitest 单测
npm run build    # 生产构建

## 说明

- 默认 Mock 模式运行（VITE_USE_MOCK=true），无需后端；上传任意 PDF/Word 即可体验完整流程
- 三份内置示例：郑前（3条预警）、王强（8条预警）、李慧（无预警）；新上传的简历会从示例模板轮换生成
- 预警规则在前端实现（src/utils/warningEngine.js，11 条规则）；院校名录/冷门专业名录为外部数据源（public/data/*.md，运行时解析，禁止硬编码）
- 对接真实后端：.env 中设 VITE_USE_MOCK=false，接口契约见 src/api/resume.js

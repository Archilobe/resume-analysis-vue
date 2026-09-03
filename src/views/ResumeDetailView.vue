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
const visibleKeys = new Set()
function setupObserver() {
  observer = new IntersectionObserver((entries) => {
    for (const e of entries) {
      const key = e.target.id.replace('mod-', '')
      if (e.isIntersecting) visibleKeys.add(key)
      else visibleKeys.delete(key)
    }
    // 当前相交模块中取序号最小者作为当前模块
    const first = MODULES.find((m) => visibleKeys.has(m.key))
    if (first) activeKey.value = first.key
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

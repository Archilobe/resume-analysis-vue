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

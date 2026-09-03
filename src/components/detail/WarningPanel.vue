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

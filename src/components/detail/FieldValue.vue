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

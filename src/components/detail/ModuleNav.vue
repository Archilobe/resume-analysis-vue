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

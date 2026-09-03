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

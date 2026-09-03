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

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

<template>
  <div class="list-page">
    <PageHeader title="简历列表">
      <template #left>
        <el-button text @click="router.push('/')">← 上传简历</el-button>
      </template>
    </PageHeader>

    <div class="body">
      <el-card shadow="never">
        <el-table :data="list" v-loading="loading" stripe>
          <el-table-column prop="name" label="姓名" width="120" />
          <el-table-column prop="gender" label="性别" width="80" />
          <el-table-column prop="highestDegree" label="最高学历" width="100" />
          <el-table-column prop="graduationDate" label="毕业时间" width="140" />
          <el-table-column label="解析时间" min-width="160">
            <template #default="{ row }">{{ row.parsedAt || '—' }}</template>
          </el-table-column>
          <el-table-column label="操作" width="160" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click="router.push(`/resume/${row.id}`)">查看</el-button>
              <el-button link type="danger" @click="onDelete(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-empty v-if="!loading && !list.length" description="暂无简历，去上传第一份吧" />
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import PageHeader from '@/layouts/PageHeader.vue'
import { useStore } from 'vuex'

const router = useRouter()
const store = useStore()
const list = computed(() => store.state.resume.list)
const loading = ref(false)

onMounted(async () => {
  loading.value = true
  await store.dispatch('resume/fetchList').catch((e) => ElMessage.error(e.message))
  loading.value = false
})

async function onDelete(row) {
  await ElMessageBox.confirm(`确定删除「${row.name || row.fileName}」的简历吗？`, '删除确认', { type: 'warning' })
  await store.dispatch('resume/remove', row.id)
  ElMessage.success('已删除')
}
</script>

<style scoped>
.list-page { min-height: 100vh; background: var(--el-fill-color-lighter); }
.body { max-width: 1080px; margin: 24px auto; padding: 0 16px; }
</style>

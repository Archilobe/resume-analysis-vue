<template>
  <div class="upload-page">
    <PageHeader title="简历上传">
      <template #right>
        <el-button text @click="router.push('/list')">简历列表</el-button>
      </template>
    </PageHeader>

    <div class="body">
      <el-card class="card">
        <template #header><b>简历上传</b></template>

        <el-upload
          v-if="phase === 'idle'"
          drag
          :auto-upload="false"
          :show-file-list="false"
          :on-change="onFileChange"
          class="uploader"
        >
          <el-icon :size="48" class="upload-icon"><UploadFilled /></el-icon>
          <div class="el-upload__text">将简历文件拖拽到此处，或 <em>点击选择文件</em></div>
          <template #tip>
            <div class="el-upload__tip">支持 PDF / Word 格式，单文件 ≤ 20MB，每次上传 1 份</div>
          </template>
        </el-upload>

        <div v-else class="file-panel">
          <div class="file-row">
            <el-icon :size="28"><Document /></el-icon>
            <span class="fname">{{ file?.name }}</span>
            <span class="fsize">{{ sizeText }}</span>
          </div>

          <template v-if="phase === 'uploading'">
            <div class="status">上传中 {{ upPercent }}%</div>
            <el-progress :percentage="upPercent" />
          </template>

          <template v-else-if="phase === 'parsing'">
            <div class="status"><el-icon class="is-loading"><Loading /></el-icon> 解析中，请稍候…</div>
            <el-progress :percentage="parsePercent" :stroke-width="10" />
          </template>

          <template v-else-if="phase === 'failed'">
            <el-alert type="error" :title="`解析失败：${errorMsg}`" :closable="false" show-icon />
            <el-button type="primary" @click="reset">重新上传</el-button>
          </template>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { UploadFilled, Document, Loading } from '@element-plus/icons-vue'
import PageHeader from '@/layouts/PageHeader.vue'
import { uploadResume, getProgress } from '@/api/resume'

const router = useRouter()
const ACCEPT = ['.pdf', '.doc', '.docx']
const MAX_MB = 20

const phase = ref('idle') // idle | uploading | parsing | failed
const file = ref(null)
const upPercent = ref(0)
const parsePercent = ref(0)
const errorMsg = ref('')
let timer = null

const sizeText = computed(() => file.value ? `${(file.value.size / 1024 / 1024).toFixed(1)}MB` : '')

function onFileChange(uploadFile) {
  const f = uploadFile.raw
  if (!f) return
  const ext = `.${f.name.split('.').pop().toLowerCase()}`
  if (!ACCEPT.includes(ext)) { ElMessage.error(`不支持的文件格式 ${ext}，仅支持 PDF / Word`); return }
  if (f.size > MAX_MB * 1024 * 1024) { ElMessage.error(`文件超过 ${MAX_MB}MB 限制`); return }
  start(f)
}

async function start(f) {
  file.value = f
  phase.value = 'uploading'
  upPercent.value = 0
  try {
    const { resumeId } = await uploadResume(f, (p) => { upPercent.value = p })
    phase.value = 'parsing'
    parsePercent.value = 0
    poll(resumeId)
  } catch (e) {
    phase.value = 'failed'
    errorMsg.value = e.message
  }
}

function poll(id) {
  timer = setInterval(async () => {
    try {
      const { percent, status } = await getProgress(id)
      parsePercent.value = percent
      if (status === 'done') {
        stop()
        ElMessage.success('解析完成')
        router.push(`/resume/${id}`)
      } else if (status === 'failed') {
        stop(); phase.value = 'failed'; errorMsg.value = '解析失败'
      }
    } catch (e) { stop(); phase.value = 'failed'; errorMsg.value = e.message }
  }, 500)
}

function stop() { if (timer) { clearInterval(timer); timer = null } }
function reset() {
  stop(); phase.value = 'idle'; file.value = null
  upPercent.value = 0; parsePercent.value = 0; errorMsg.value = ''
}
onUnmounted(stop)
</script>

<style scoped>
.upload-page { min-height: 100vh; background: var(--el-fill-color-lighter); }
.body { max-width: 720px; margin: 48px auto; padding: 0 16px; }
.uploader { width: 100%; }
.upload-icon { color: var(--el-color-primary); margin-bottom: 8px; }
.file-panel { display: flex; flex-direction: column; gap: 16px; }
.file-row { display: flex; align-items: center; gap: 10px; color: var(--el-text-color-primary); }
.fname { font-weight: 600; }
.fsize { color: var(--el-text-color-secondary); font-size: 13px; }
.status { display: flex; align-items: center; gap: 6px; color: var(--el-text-color-regular); }
</style>

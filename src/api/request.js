import axios from 'axios'

const useMock = import.meta.env.VITE_USE_MOCK !== 'false'

async function mockAdapter(config) {
  const { default: mock } = await import('@/mock/index')
  const res = await mock(config)
  // 模拟网络延迟，让进度条可见
  await new Promise((r) => setTimeout(r, 150))
  return res
}

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 30000,
  ...(useMock ? { adapter: mockAdapter } : {})
})

request.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const msg = err.response?.data?.message || err.message || '请求失败'
    return Promise.reject(new Error(msg))
  }
)

export default request

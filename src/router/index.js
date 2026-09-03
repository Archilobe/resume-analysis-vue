import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'upload', component: () => import('@/views/UploadView.vue') },
    { path: '/list', name: 'list', component: () => import('@/views/ResumeListView.vue') },
    { path: '/resume/:id', name: 'detail', component: () => import('@/views/ResumeDetailView.vue') }
  ]
})

export default router

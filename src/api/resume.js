import request from './request'

export function uploadResume(file, onProgress) {
  const form = new FormData()
  form.append('file', file)
  return request.post('/resume/upload', form, {
    onUploadProgress: (e) => { if (e.total && onProgress) onProgress(Math.round((e.loaded / e.total) * 100)) }
  })
}

export function getProgress(id) {
  return request.get(`/resume/${id}/progress`)
}

export function getResume(id) {
  return request.get(`/resume/${id}`)
}

export function getResumeList() {
  return request.get('/resume/list')
}

export function deleteResume(id) {
  return request.post(`/resume/${id}/delete`)
}

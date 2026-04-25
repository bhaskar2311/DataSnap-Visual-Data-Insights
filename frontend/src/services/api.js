import axios from 'axios'

const BASE_URL = '/api'

export async function uploadCSV(file) {
  const formData = new FormData()
  formData.append('file', file)

  const response = await axios.post(`${BASE_URL}/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data
}

export async function downloadSample() {
  const response = await axios.get(`${BASE_URL}/sample`, {
    responseType: 'blob',
  })

  const url = window.URL.createObjectURL(new Blob([response.data]))
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', 'sample.csv')
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}

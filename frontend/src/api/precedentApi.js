import api from './axiosConfig'

export async function fetchPrecedents() {
  const res = await api.get('/api/precedents/')
  return Array.isArray(res.data) ? res.data : []
}

export async function searchPrecedents(query) {
  const res = await api.get('/api/precedents/search/', {
    params: { q: query }
  })
  return Array.isArray(res.data) ? res.data : []
}

export async function insertPrecedent(draftId, precedentId) {
  const res = await api.post(`/api/precedents/insert/${draftId}/${precedentId}/`)
  return res.data
}

import api from './axiosConfig'

export async function listVersions(draftId) {
  const res = await api.get(`/api/versions/list/${draftId}/`)
  return Array.isArray(res.data) ? res.data : []
}

export async function saveVersion(draftId) {
  const res = await api.post(`/api/versions/save/${draftId}/`)
  return res.data
}

export async function restoreVersion(versionId) {
  const res = await api.post(`/api/versions/restore/${versionId}/`)
  return res.data
}

export async function compareDraftVersions(versionAId, versionBId) {
  const res = await api.post('/api/versions/compare/', {
    version_a: versionAId,
    version_b: versionBId
  })
  return res.data
}

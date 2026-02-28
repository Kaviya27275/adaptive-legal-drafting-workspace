import api from './axiosConfig'

export async function compareVersions(versionAId, versionBId) {
  const res = await api.post('/api/versions/compare/', {
    version_a: versionAId,
    version_b: versionBId
  })
  return res.data
}

export async function compareDrafts(draftAId, draftBId) {
  const res = await api.post('/api/comparison/drafts/', {
    draft_a: draftAId,
    draft_b: draftBId
  })
  return res.data
}

export async function listComparisonLogs() {
  const res = await api.get('/api/comparison/logs/')
  return Array.isArray(res.data) ? res.data : []
}


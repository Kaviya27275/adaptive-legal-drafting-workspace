const clone = (value) => JSON.parse(JSON.stringify(value))

export function createDraftEntity({ title, documentType }) {
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    title,
    documentType,
    bodyText: '',
    clauses: [],
    versions: [
      {
        id: crypto.randomUUID(),
        label: 'v1',
        savedAt: now,
        bodyText: '',
        clauses: []
      }
    ],
    updatedAt: now
  }
}

export function updateDraftEntity(draft, payload) {
  return {
    ...draft,
    ...payload,
    updatedAt: new Date().toISOString()
  }
}

export function snapshotDraftVersion(draft) {
  return {
    id: crypto.randomUUID(),
    label: `v${draft.versions.length + 1}`,
    savedAt: new Date().toISOString(),
    bodyText: draft.bodyText || '',
    clauses: clone(draft.clauses)
  }
}

export function getDraftById(drafts, draftId) {
  return drafts.find((draft) => draft.id === draftId) || null
}

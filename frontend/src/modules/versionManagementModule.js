function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

export function createVersionSnapshot(draft) {
  return {
    id: crypto.randomUUID(),
    label: `v${draft.versions.length + 1}`,
    savedAt: new Date().toISOString(),
    bodyText: draft.bodyText || '',
    clauses: clone(draft.clauses)
  }
}

export function rollbackToVersion(draft, versionId) {
  const version = draft.versions.find((item) => item.id === versionId)
  if (!version) return draft

  return {
    ...draft,
    bodyText: version.bodyText || '',
    clauses: clone(version.clauses),
    updatedAt: new Date().toISOString()
  }
}

export function compareVersions(versionA, versionB) {
  if (!versionA || !versionB) return []

  const mapA = new Map(versionA.clauses.map((clause) => [clause.type, clause]))
  const mapB = new Map(versionB.clauses.map((clause) => [clause.type, clause]))
  const allTypes = Array.from(new Set([...mapA.keys(), ...mapB.keys()]))

  return allTypes.map((type) => {
    const clauseA = mapA.get(type)
    const clauseB = mapB.get(type)

    if (clauseA && !clauseB) return { type, status: 'removed', clauseA, clauseB: null }
    if (!clauseA && clauseB) return { type, status: 'added', clauseA: null, clauseB }
    if (clauseA.title !== clauseB.title || clauseA.text !== clauseB.text) {
      return { type, status: 'modified', clauseA, clauseB }
    }

    return { type, status: 'unchanged', clauseA, clauseB }
  })
}

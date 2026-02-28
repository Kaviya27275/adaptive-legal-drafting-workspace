const DEFAULT_NEW_CLAUSE = {
  type: 'Parties',
  title: '',
  text: ''
}

function stampDraft(draft, clauses) {
  return {
    ...draft,
    clauses,
    updatedAt: new Date().toISOString()
  }
}

export function addClauseToDraft(draft, payload = DEFAULT_NEW_CLAUSE) {
  const clause = {
    id: crypto.randomUUID(),
    ...DEFAULT_NEW_CLAUSE,
    ...payload,
    order: draft.clauses.length
  }

  return stampDraft(draft, [...draft.clauses, clause])
}

export function updateClauseInDraft(draft, clauseId, payload) {
  return stampDraft(
    draft,
    draft.clauses.map((clause) => (clause.id === clauseId ? { ...clause, ...payload } : clause))
  )
}

export function deleteClauseFromDraft(draft, clauseId) {
  const nextClauses = draft.clauses.filter((clause) => clause.id !== clauseId).map((clause, index) => ({
    ...clause,
    order: index
  }))
  return stampDraft(draft, nextClauses)
}

export function reorderClauseInDraft(draft, clauseId, direction) {
  const index = draft.clauses.findIndex((clause) => clause.id === clauseId)
  if (index < 0) return draft

  const targetIndex = direction === 'up' ? index - 1 : index + 1
  if (targetIndex < 0 || targetIndex >= draft.clauses.length) return draft

  const nextClauses = [...draft.clauses]
  const [moved] = nextClauses.splice(index, 1)
  nextClauses.splice(targetIndex, 0, moved)

  return stampDraft(
    draft,
    nextClauses.map((clause, order) => ({
      ...clause,
      order
    }))
  )
}

const REQUIRED_CLAUSES = {
  'Employment Contract': ['Parties', 'Scope', 'Term', 'Termination', 'Governing Law'],
  NDA: ['Parties', 'Confidentiality', 'Term', 'Governing Law', 'Dispute Resolution'],
  'Service Agreement': ['Parties', 'Scope', 'Payment Terms', 'Liability', 'Termination'],
  'Lease Agreement': ['Parties', 'Scope', 'Payment Terms', 'Term', 'Governing Law']
}

export function validateDraftCompliance(draft) {
  if (!draft) {
    return {
      requiredClauses: [],
      missingClauses: [],
      missingValues: [],
      warnings: [],
      score: 0
    }
  }

  const requiredClauses = REQUIRED_CLAUSES[draft.documentType] || []
  const existingClauseTypes = new Set(draft.clauses.map((clause) => clause.type))
  const missingClauses = requiredClauses.filter((clauseType) => !existingClauseTypes.has(clauseType))

  const missingValues = draft.clauses.flatMap((clause, idx) => {
    const issues = []
    if (!clause.title?.trim()) {
      issues.push({ clauseId: clause.id, field: 'title', message: `Clause ${idx + 1} is missing a title.` })
    }
    if (!clause.text?.trim()) {
      issues.push({ clauseId: clause.id, field: 'text', message: `Clause ${idx + 1} is missing text content.` })
    }
    return issues
  })

  const warnings = [
    ...missingClauses.map((clauseType) => `Mandatory clause missing: ${clauseType}`),
    ...missingValues.map((item) => item.message)
  ]

  const denominator = requiredClauses.length + missingValues.length
  const score = denominator
    ? Math.round(((requiredClauses.length - missingClauses.length) / denominator) * 100)
    : 100

  return {
    requiredClauses,
    missingClauses,
    missingValues,
    warnings,
    score: Math.max(score, 0)
  }
}

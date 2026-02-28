export function generateAISuggestions(draft, complianceReport) {
  if (!draft || !complianceReport) return []

  const suggestions = []

  if (complianceReport.missingClauses.length > 0) {
    const missingType = complianceReport.missingClauses[0]
    suggestions.push({
      id: `missing-${missingType}`,
      type: 'clause_gap',
      clauseType: missingType,
      title: `${missingType} Clause`,
      text: `Suggested ${missingType.toLowerCase()} language tailored for ${draft.documentType}. Validate against jurisdictional requirements before use.`,
      explanation: `${missingType} is missing and is typically mandatory for ${draft.documentType}.`
    })
  }

  const firstMissingValue = complianceReport.missingValues[0]
  if (firstMissingValue) {
    suggestions.push({
      id: `missing-value-${firstMissingValue.clauseId}-${firstMissingValue.field}`,
      type: 'value_gap',
      clauseType: null,
      title: 'Complete Missing Clause Value',
      text: '',
      explanation: firstMissingValue.message
    })
  }

  return suggestions
}

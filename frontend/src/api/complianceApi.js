import api from './axiosConfig'

export const DOCUMENT_TYPE_RULES = {
  service_agreement: {
    label: 'Service Agreement',
    requiredClauses: [
      { type: 'scope_of_services', label: 'Scope of Services', keywords: ['scope of services', 'services'] },
      { type: 'payment_terms', label: 'Payment Terms', keywords: ['payment', 'fees', 'invoic'] },
      { type: 'term_termination', label: 'Term & Termination', keywords: ['termination', 'term'] },
      { type: 'confidentiality', label: 'Confidentiality', keywords: ['confidential', 'non-disclosure'] },
      { type: 'jurisdiction', label: 'Jurisdiction', keywords: ['jurisdiction', 'governing law'] }
    ]
  },
  nda: {
    label: 'Non-Disclosure Agreement',
    requiredClauses: [
      { type: 'definition_confidential_info', label: 'Definition of Confidential Information', keywords: ['confidential information', 'proprietary'] },
      { type: 'obligations', label: 'Obligations of Receiving Party', keywords: ['shall not disclose', 'obligation', 'use solely'] },
      { type: 'exceptions', label: 'Exceptions', keywords: ['exception', 'public domain', 'already known'] },
      { type: 'term_termination', label: 'Term & Termination', keywords: ['termination', 'term'] },
      { type: 'jurisdiction', label: 'Jurisdiction', keywords: ['jurisdiction', 'governing law'] }
    ]
  },
  employment_contract: {
    label: 'Employment Contract',
    requiredClauses: [
      { type: 'position_duties', label: 'Position & Duties', keywords: ['position', 'duties', 'responsibilities'] },
      { type: 'compensation', label: 'Compensation & Benefits', keywords: ['salary', 'compensation', 'benefits'] },
      { type: 'leave', label: 'Leave & Holidays', keywords: ['leave', 'holiday', 'vacation'] },
      { type: 'termination', label: 'Termination', keywords: ['termination', 'notice period'] },
      { type: 'confidentiality', label: 'Confidentiality', keywords: ['confidential', 'non-disclosure'] }
    ]
  }
}

function getRuleSet(documentType) {
  return DOCUMENT_TYPE_RULES[documentType] || DOCUMENT_TYPE_RULES.service_agreement
}

function clausePresent(text, clauseRule) {
  const normalized = (text || '').toLowerCase()
  return clauseRule.keywords.some((keyword) => normalized.includes(keyword))
}

function buildLocalComplianceReport(draft) {
  const { documentType = 'service_agreement' } = draft || {}
  const text = draft?.bodyText ?? draft?.content ?? ''
  const ruleSet = getRuleSet(documentType)

  const missingClauses = []
  const detectedClauses = []

  for (const clauseRule of ruleSet.requiredClauses) {
    if (clausePresent(text, clauseRule)) {
      detectedClauses.push(clauseRule.label)
    } else {
      missingClauses.push(clauseRule.label)
    }
  }

  const requiredCount = ruleSet.requiredClauses.length
  const presentCount = detectedClauses.length
  const score = Math.round((presentCount / requiredCount) * 100)
  const warnings = missingClauses.map((label) => `${label} clause is missing.`)

  return {
    documentType,
    documentTypeLabel: ruleSet.label,
    requiredCount,
    presentCount,
    missingClauses,
    detectedClauses,
    warnings,
    isCompliant: missingClauses.length === 0,
    score,
    checkedAt: new Date().toISOString()
  }
}

function mapComplianceResult(result, draft) {
  const missingClauses = result?.missing_mandatory_clauses || []
  const warnings = result?.validation_warnings || []
  const incomingScore = typeof result?.compliance_score === 'number' ? result.compliance_score : 0
  const hasViolations =
    missingClauses.length > 0 ||
    (result?.missing_legal_terms || []).length > 0 ||
    (result?.prohibited_words_found || []).length > 0 ||
    (result?.structure_violations || []).length > 0 ||
    (result?.missing_values || []).length > 0 ||
    warnings.length > 0
  const score = hasViolations ? Math.min(incomingScore, 99) : incomingScore
  const documentTypeLabel = draft?.documentType || draft?.document_type || 'Unknown'

  return {
    documentType: documentTypeLabel,
    documentTypeLabel,
    missingClauses,
    warnings,
    score,
    missingLegalTerms: result?.missing_legal_terms || [],
    prohibitedWordsFound: result?.prohibited_words_found || [],
    structureViolations: result?.structure_violations || [],
    missingValues: result?.missing_values || [],
    detectedClauses: [],
    requiredCount: missingClauses.length,
    presentCount: 0,
    isCompliant: missingClauses.length === 0 && warnings.length === 0,
    checkedAt: new Date().toISOString()
  }
}

export async function fetchDocumentTypes() {
  const res = await api.get('/api/compliance/document-types/')
  return Array.isArray(res.data) ? res.data : []
}

export async function createDocumentType(name) {
  const res = await api.post('/api/compliance/document-types/', { name })
  return res.data
}

export async function validateDraft(draft) {
  if (!draft?.id) return buildLocalComplianceReport(draft)
  const res = await api.post(`/api/compliance/check/${draft.id}/`)
  return mapComplianceResult(res.data, draft)
}

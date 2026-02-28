const wait = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms))

export async function mockCreateDraft(payload) {
  await wait()
  return {
    id: crypto.randomUUID(),
    title: payload.title,
    documentType: payload.documentType,
    clauses: [],
    versions: [
      {
        id: crypto.randomUUID(),
        label: 'v1',
        savedAt: new Date().toISOString(),
        clauses: []
      }
    ],
    updatedAt: new Date().toISOString()
  }
}

export async function mockSaveDraftVersion(draft, clauses) {
  await wait(200)
  return {
    id: crypto.randomUUID(),
    label: `v${draft.versions.length + 1}`,
    savedAt: new Date().toISOString(),
    clauses: JSON.parse(JSON.stringify(clauses))
  }
}

const PRECEDENT_TEMPLATES = [
  {
    id: 'p1',
    documentType: 'NDA',
    clauseType: 'Confidentiality',
    snippet: 'Each party shall keep all Confidential Information strictly confidential...'
  },
  {
    id: 'p2',
    documentType: 'Employment Contract',
    clauseType: 'Termination',
    snippet: 'Either party may terminate this agreement by providing thirty (30) days notice...'
  },
  {
    id: 'p3',
    documentType: 'Service Agreement',
    clauseType: 'Payment Terms',
    snippet: 'Client shall pay all undisputed invoices within fifteen (15) business days...'
  },
  {
    id: 'p4',
    documentType: 'Lease Agreement',
    clauseType: 'Governing Law',
    snippet: 'This lease shall be governed by and construed under the laws of...'
  },
  {
    id: 'p5',
    documentType: 'NDA',
    clauseType: 'Dispute Resolution',
    snippet: 'Any dispute arising out of this agreement shall first be resolved through mediation...'
  }
]

export async function mockFetchPrecedents() {
  await wait(180)
  return PRECEDENT_TEMPLATES
}

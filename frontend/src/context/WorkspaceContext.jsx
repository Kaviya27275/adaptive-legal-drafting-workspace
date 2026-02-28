import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import * as authApi from '../api/authApi'
import * as clauseApi from '../api/clauseApi'
import * as complianceApi from '../api/complianceApi'
import * as draftApi from '../api/draftApi'
import * as precedentApi from '../api/precedentApi'
import * as versionApi from '../api/versionApi'
import { generateAISuggestions } from '../modules/aiSuggestionModule'

const WorkspaceContext = createContext(null)

const ROLE_LABELS = {
  admin: 'Admin',
  lawyer: 'Lawyer',
  law_student: 'Law Student'
}

const ROLE_API = {
  Admin: 'admin',
  Lawyer: 'lawyer',
  'Law Student': 'law_student'
}

const CLAUSE_TYPES = [
  'Parties',
  'Scope',
  'Payment Terms',
  'Confidentiality',
  'Term',
  'Termination',
  'Governing Law',
  'Dispute Resolution',
  'Liability',
  'Other'
]

const USER_STORAGE_KEY = 'lexora_current_user'
const TOKEN_STORAGE_KEY = 'token'

function toApiRole(label) {
  return ROLE_API[label] || 'lawyer'
}

function fromApiRole(value) {
  return ROLE_LABELS[value] || 'Lawyer'
}

function extractApiError(error, fallback) {
  const payload = error?.response?.data
  if (!payload) return fallback
  if (typeof payload === 'string') return payload
  if (payload.error && typeof payload.error === 'string') return payload.error
  for (const value of Object.values(payload)) {
    if (Array.isArray(value) && value.length) return String(value[0])
    if (typeof value === 'string') return value
  }
  return fallback
}

function generateUsername(fullName) {
  const base = (fullName || 'user')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
  const suffix = Math.floor(1000 + Math.random() * 9000)
  return `${base || 'user'}_${suffix}`
}

function toBackendClauseType(label) {
  const value = (label || '').toLowerCase()
  if (value.includes('other')) return 'OTHER'
  if (value.includes('payment')) return 'PAYMENT'
  if (value.includes('termination')) return 'TERMINATION'
  if (value.includes('confidential')) return 'CONFIDENTIALITY'
  if (value.includes('liability')) return 'LIABILITY'
  return 'OTHER'
}

function fromBackendClauseType(code) {
  switch (code) {
    case 'PAYMENT':
      return 'Payment Terms'
    case 'TERMINATION':
      return 'Termination'
    case 'CONFIDENTIALITY':
      return 'Confidentiality'
    case 'LIABILITY':
      return 'Liability'
    default:
      return 'Other'
  }
}

function mapDraftFromApi(draft, documentTypeById) {
  const documentType = documentTypeById.get(draft.document_type) || 'Unknown'
  return {
    id: String(draft.id),
    title: draft.title || 'Untitled Draft',
    documentType,
    documentTypeId: draft.document_type,
    createdById: draft.created_by,
    jurisdiction: draft.jurisdiction || '',
    bodyText: draft.content || '',
    clauses: [],
    versions: [],
    updatedAt: draft.updated_at || draft.updatedAt || new Date().toISOString(),
    createdAt: draft.created_at || draft.createdAt || new Date().toISOString()
  }
}

function mapClauseFromApi(clause) {
  return {
    id: String(clause.id),
    type: fromBackendClauseType(clause.clause_type),
    title: clause.title || '',
    text: clause.text || '',
    order: clause.position || 0
  }
}

function mapVersionFromApi(version) {
  return {
    id: String(version.id),
    label: `v${version.version_number}`,
    savedAt: version.created_at || new Date().toISOString(),
    bodyText: version.snapshot || ''
  }
}

function mapPrecedentFromApi(item) {
  return {
    id: String(item.id),
    documentType: item.document_type || 'Unknown',
    clauseType: item.document_type || 'Template',
    snippet: (item.content || '').slice(0, 220)
  }
}

export function WorkspaceProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    const raw = localStorage.getItem(USER_STORAGE_KEY)
    if (!raw) return null
    try {
      return JSON.parse(raw)
    } catch {
      return null
    }
  })
  const [selectedRole, setSelectedRoleState] = useState(currentUser?.role || 'Law Student')
  const [drafts, setDrafts] = useState([])
  const [precedentTemplates, setPrecedentTemplates] = useState([])
  const [documentTypes, setDocumentTypes] = useState([])
  const [documentTypeById, setDocumentTypeById] = useState(new Map())
  const [documentTypeByName, setDocumentTypeByName] = useState(new Map())
  const [complianceByDraft, setComplianceByDraft] = useState({})

  const persistUser = (user) => {
    if (user) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user))
    } else {
      localStorage.removeItem(USER_STORAGE_KEY)
    }
  }

  const persistToken = (token) => {
    if (token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token)
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY)
    }
  }

  const loadDocumentTypes = async () => {
    const items = await complianceApi.fetchDocumentTypes()
    let resolved = items
    if (!resolved.length) {
      const templates = await draftApi.fetchTemplates()
      resolved = templates.map((item) => ({
        id: item.document_type_id,
        name: item.document_type_name
      }))
    }
    const byId = new Map()
    const byName = new Map()
    resolved.forEach((item) => {
      if (!item?.id || !item?.name) return
      byId.set(item.id, item.name)
      byName.set(item.name, item.id)
    })
    setDocumentTypes(Array.from(byName.keys()))
    setDocumentTypeById(byId)
    setDocumentTypeByName(byName)
    return { byId, byName }
  }

  const loadDrafts = async (typeMap = documentTypeById) => {
    const apiDrafts = await draftApi.fetchDrafts()
    const mapped = apiDrafts.map((draft) => mapDraftFromApi(draft, typeMap))
    const withDetails = await Promise.all(
      mapped.map(async (draft) => {
        const [clauses, versions] = await Promise.all([
          clauseApi.fetchClauses({ draftId: draft.id }),
          versionApi.listVersions(draft.id)
        ])
        return {
          ...draft,
          clauses: clauses.map(mapClauseFromApi),
          versions: versions.map(mapVersionFromApi)
        }
      })
    )
    setDrafts(withDetails)
    return withDetails
  }

  const loadPrecedents = async () => {
    const items = await precedentApi.fetchPrecedents()
    setPrecedentTemplates(items.map(mapPrecedentFromApi))
  }

  useEffect(() => {
    const init = async () => {
      if (!currentUser) return
      try {
        const { byId } = await loadDocumentTypes()
        await Promise.all([loadDrafts(byId), loadPrecedents()])
      } catch (error) {
        // Ignore initial load errors until authenticated.
      }
    }
    init()
  }, [currentUser])

  const setSelectedRole = (role) => {
    setSelectedRoleState(role)
    if (currentUser) {
      const nextUser = { ...currentUser, role }
      setCurrentUser(nextUser)
      persistUser(nextUser)
    }
  }

  const loginUser = async ({ email, password }) => {
    if (!email?.trim() || !password?.trim()) {
      return { ok: false, error: 'Email and password are required.' }
    }
    try {
      const result = await authApi.login(email.trim(), password.trim())
      if (!result?.token) {
        return { ok: false, error: 'Login failed.' }
      }
      persistToken(result.token)
      const user = {
        id: result.user?.id,
        name: result.user?.username || result.user?.email,
        email: result.user?.email || email.trim(),
        role: fromApiRole(result.user?.role)
      }
      setCurrentUser(user)
      setSelectedRoleState(user.role)
      persistUser(user)
      return { ok: true, user }
    } catch (error) {
      return { ok: false, error: extractApiError(error, 'Login failed. Check your credentials.') }
    }
  }

  const registerUser = async ({ fullName, email, password, role }) => {
    if (!fullName?.trim() || !email?.trim() || !password?.trim() || !role) {
      return { ok: false, error: 'Please complete all required fields.' }
    }
    try {
      await authApi.register({
        name: generateUsername(fullName),
        email: email.trim(),
        password: password.trim(),
        role: toApiRole(role)
      })
      return await loginUser({ email, password })
    } catch (error) {
      return { ok: false, error: extractApiError(error, 'Registration failed. Check the details and try again.') }
    }
  }

  const logoutUser = async () => {
    try {
      await authApi.logout()
    } catch (error) {
      // Ignore logout failures
    }
    setCurrentUser(null)
    persistUser(null)
    persistToken(null)
    setDrafts([])
    setPrecedentTemplates([])
    setDocumentTypes([])
    setDocumentTypeById(new Map())
    setDocumentTypeByName(new Map())
    setComplianceByDraft({})
  }

  const getDraftById = (draftId) => drafts.find((draft) => draft.id === draftId) || null

  const deleteDraftById = async (draftId) => {
    await draftApi.deleteDraft(draftId)
    setDrafts((prev) => prev.filter((draft) => draft.id !== draftId))
  }

  const updateDraftInStore = (draftId, mapper) => {
    setDrafts((prev) => prev.map((draft) => (draft.id === draftId ? mapper(draft) : draft)))
  }

  const ensureDocumentTypeId = async (name) => {
    if (documentTypeByName.has(name)) return documentTypeByName.get(name)
    const created = await complianceApi.createDocumentType(name)
    const byId = new Map(documentTypeById)
    const byName = new Map(documentTypeByName)
    byId.set(created.id, created.name)
    byName.set(created.name, created.id)
    setDocumentTypeById(byId)
    setDocumentTypeByName(byName)
    setDocumentTypes(Array.from(byName.keys()))
    return created.id
  }

  const fetchTemplateContent = async (documentType, jurisdiction = 'India') => {
    const safeType = documentType || documentTypes[0] || 'Service Agreement'
    const documentTypeId = await ensureDocumentTypeId(safeType)
    try {
      const rendered = await draftApi.renderTemplate(documentTypeId, jurisdiction)
      return rendered?.template_content || ''
    } catch (error) {
      return ''
    }
  }

  const createDraft = async (title, documentType, templateContent) => {
    const safeType = documentType || documentTypes[0] || 'Service Agreement'
    const documentTypeId = await ensureDocumentTypeId(safeType)
    const content =
      templateContent !== undefined ? templateContent : await fetchTemplateContent(safeType)
    const created = await draftApi.createDraft({
      title,
      document_type: documentTypeId,
      jurisdiction: 'India',
      content
    })
    const mapped = {
      ...mapDraftFromApi(created, documentTypeById),
      documentType: safeType,
      documentTypeId
    }
    setDrafts((prev) => [mapped, ...prev])
    return mapped
  }

  const generateDraftFromAI = async (documentType, keyTerms, jurisdiction = 'India') => {
    const safeType = documentType || documentTypes[0] || 'Service Agreement'
    const documentTypeId = await ensureDocumentTypeId(safeType)
    const result = await draftApi.generateAIDraft(documentTypeId, keyTerms, jurisdiction)
    return result?.content || ''
  }

  const updateDraftMeta = async (draftId, payload) => {
    const draft = getDraftById(draftId)
    if (!draft) return

    const updatePayload = {}
    if (payload.title !== undefined) updatePayload.title = payload.title
    if (payload.bodyText !== undefined) updatePayload.content = payload.bodyText
    if (payload.documentType !== undefined) {
      updatePayload.document_type = await ensureDocumentTypeId(payload.documentType)
    }

    const updated = await draftApi.updateDraft(draftId, updatePayload)
    updateDraftInStore(draftId, (item) => ({
      ...item,
      title: updated.title,
      bodyText: updated.content || '',
      documentType: documentTypeById.get(updated.document_type) || item.documentType,
      updatedAt: updated.updated_at || new Date().toISOString()
    }))
  }

  const addClause = async (draftId, payload) => {
    const draft = getDraftById(draftId)
    if (!draft) return
    const clausePayload = {
      draft: draftId,
      title: payload?.title || '',
      text: payload?.text || '',
      clause_type: toBackendClauseType(payload?.type || CLAUSE_TYPES[0]),
      position: draft.clauses.length
    }
    const created = await clauseApi.createClause(clausePayload)
    updateDraftInStore(draftId, (item) => ({
      ...item,
      clauses: [...item.clauses, mapClauseFromApi(created)]
    }))
  }

  const updateClause = async (draftId, clauseId, payload) => {
    const draft = getDraftById(draftId)
    if (!draft) return
    const updatePayload = {}
    if (payload.title !== undefined) updatePayload.title = payload.title
    if (payload.text !== undefined) updatePayload.text = payload.text
    if (payload.type !== undefined) updatePayload.clause_type = toBackendClauseType(payload.type)
    if (payload.order !== undefined) updatePayload.position = payload.order

    const updated = await clauseApi.updateClause(clauseId, updatePayload)
    updateDraftInStore(draftId, (item) => ({
      ...item,
      clauses: item.clauses.map((clause) => (clause.id === clauseId ? mapClauseFromApi(updated) : clause))
    }))
  }

  const deleteClause = async (draftId, clauseId) => {
    await clauseApi.deleteClause(clauseId)
    updateDraftInStore(draftId, (item) => ({
      ...item,
      clauses: item.clauses.filter((clause) => clause.id !== clauseId)
    }))
  }

  const moveClause = async (draftId, clauseId, direction) => {
    const draft = getDraftById(draftId)
    if (!draft) return
    const index = draft.clauses.findIndex((clause) => clause.id === clauseId)
    if (index < 0) return
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= draft.clauses.length) return
    const nextClauses = [...draft.clauses]
    const [moved] = nextClauses.splice(index, 1)
    nextClauses.splice(targetIndex, 0, moved)
    await clauseApi.reorderClauses(draftId, nextClauses.map((item) => item.id))
    updateDraftInStore(draftId, (item) => ({
      ...item,
      clauses: nextClauses.map((clause, order) => ({ ...clause, order }))
    }))
  }

  const saveDraft = async (draftId) => {
    await versionApi.saveVersion(draftId)
    const versions = await versionApi.listVersions(draftId)
    updateDraftInStore(draftId, (draft) => ({
      ...draft,
      versions: versions.map(mapVersionFromApi)
    }))
  }

  const loadVersion = async (draftId, versionId) => {
    await versionApi.restoreVersion(versionId)
    const refreshed = await draftApi.getDraft(draftId)
    updateDraftInStore(draftId, (draft) => ({
      ...draft,
      bodyText: refreshed.content || '',
      updatedAt: refreshed.updated_at || new Date().toISOString()
    }))
  }

  const getDraftVersionById = (draft, versionId) => {
    if (!draft) return null
    return draft.versions.find((version) => version.id === versionId) || null
  }

  const getCompliance = (draft) => complianceByDraft[draft?.id] || {
    missingClauses: [],
    missingValues: [],
    warnings: [],
    score: 0
  }

  const runComplianceCheck = useCallback(async (draftId) => {
    const draft = getDraftById(draftId)
    if (!draft) return null
    const result = await complianceApi.validateDraft(draft)
    setComplianceByDraft((prev) => ({
      ...prev,
      [draftId]: result
    }))
    return result
  }, [drafts])

  const getSuggestions = (draft) => {
    const compliance = getCompliance(draft)
    return generateAISuggestions(draft, compliance)
  }

  const getSuggestion = (draft) => getSuggestions(draft)[0] || null

  const acceptSuggestion = async (draftId, suggestion) => {
    if (!suggestion || !suggestion.clauseType) return
    const clauseBlock = `${suggestion.title}\n${suggestion.text}`.trim()

    await addClause(draftId, {
      type: suggestion.clauseType,
      title: suggestion.title,
      text: suggestion.text
    })

    const draft = getDraftById(draftId)
    const currentBody = (draft?.bodyText || '').trim()
    const nextBody = currentBody ? `${currentBody}\n\n${clauseBlock}` : clauseBlock
    await updateDraftMeta(draftId, { bodyText: nextBody })
  }

  const insertPrecedentClause = async (draftId, template) => {
    await precedentApi.insertPrecedent(draftId, template.id)
    const refreshed = await draftApi.getDraft(draftId)
    updateDraftInStore(draftId, (draft) => ({
      ...draft,
      bodyText: refreshed.content || ''
    }))
  }

  const getVersionComparison = async (versionAId, versionBId) => {
    return versionApi.compareDraftVersions(versionAId, versionBId)
  }

  const value = useMemo(
    () => ({
      currentUser,
      isAuthenticated: Boolean(currentUser),
      availableRoles: Object.values(ROLE_LABELS),
      selectedRole,
      setSelectedRole,
      loginUser,
      registerUser,
      logoutUser,
      drafts,
      documentTypes,
      clauseTypes: CLAUSE_TYPES,
      precedentTemplates,
      createDraft,
      generateDraftFromAI,
      fetchTemplateContent,
      getDraftById,
      updateDraftMeta,
      deleteDraft: deleteDraftById,
      addClause,
      updateClause,
      deleteClause,
      moveClause,
      saveDraft,
      loadVersion,
      getDraftVersionById,
      getVersionComparison,
      getCompliance,
      runComplianceCheck,
      getSuggestions,
      getSuggestion,
      acceptSuggestion,
      insertPrecedentClause,
      refreshDrafts: loadDrafts
    }),
    [currentUser, selectedRole, drafts, documentTypes, precedentTemplates, complianceByDraft]
  )

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext)
  if (!ctx) {
    throw new Error('useWorkspace must be used within WorkspaceProvider')
  }
  return ctx
}

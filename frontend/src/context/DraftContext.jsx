import React, { createContext, useEffect, useMemo, useState } from 'react'
import * as draftApi from '../api/draftApi'
import * as complianceApi from '../api/complianceApi'

export const DraftContext = createContext(null)

export function DraftProvider({ children }) {
  const [drafts, setDrafts] = useState([])
  const [loading, setLoading] = useState(false)
  const [activeDraftId, setActiveDraftId] = useState(null)
  const [documentTypeById, setDocumentTypeById] = useState(new Map())
  const [documentTypeByName, setDocumentTypeByName] = useState(new Map())

  const ensureDocumentTypeId = async (name) => {
    if (!name) return null
    if (documentTypeByName.has(name)) return documentTypeByName.get(name)
    const created = await complianceApi.createDocumentType(name)
    const byId = new Map(documentTypeById)
    const byName = new Map(documentTypeByName)
    byId.set(created.id, created.name)
    byName.set(created.name, created.id)
    setDocumentTypeById(byId)
    setDocumentTypeByName(byName)
    return created.id
  }

  async function loadDrafts() {
    setLoading(true)
    try {
      const types = await complianceApi.fetchDocumentTypes()
      const byId = new Map()
      const byName = new Map()
      types.forEach((item) => {
        byId.set(item.id, item.name)
        byName.set(item.name, item.id)
      })
      setDocumentTypeById(byId)
      setDocumentTypeByName(byName)

      const list = await draftApi.fetchDrafts()
      const mapped = list.map((draft) => ({
        ...draft,
        documentType: byId.get(draft.document_type) || draft.document_type,
        text: draft.content || ''
      }))
      setDrafts(mapped)

      if (list.length === 0) {
        setActiveDraftId(null)
        return
      }

      setActiveDraftId((currentId) => {
        if (currentId && list.some((draft) => draft.id === currentId)) {
          return currentId
        }
        return list[0].id
      })
    } finally {
      setLoading(false)
    }
  }

  async function saveDraft(draft) {
    const payload = {
      content: draft.text || ''
    }
    if (draft.documentType) {
      payload.document_type = await ensureDocumentTypeId(draft.documentType)
    }
    if (!draft.id) {
      payload.title = draft.title
    }
    const res = draft.id
      ? await draftApi.updateDraft(draft.id, payload)
      : await draftApi.createDraft(payload)
    await loadDrafts()
    if (res?.id) {
      setActiveDraftId(res.id)
    }
    return res
  }

  async function removeDraft(id) {
    const ok = await draftApi.deleteDraft(id)
    await loadDrafts()
    return ok
  }

  const activeDraft = useMemo(
    () => drafts.find((draft) => draft.id === activeDraftId) || null,
    [drafts, activeDraftId]
  )

  useEffect(() => {
    loadDrafts()
  }, [])

  return (
    <DraftContext.Provider
      value={{
        drafts,
        loading,
        loadDrafts,
        saveDraft,
        removeDraft,
        activeDraftId,
        setActiveDraftId,
        activeDraft
      }}
    >
      {children}
    </DraftContext.Provider>
  )
}

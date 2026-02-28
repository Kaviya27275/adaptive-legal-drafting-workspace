import { useState } from 'react'
import { validateDraft } from '../api/complianceApi'

export default function useValidation() {
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const runValidation = async (draft) => {
    setLoading(true)
    setError('')
    try {
      const result = await validateDraft(draft)
      setReport(result)
      return result
    } catch (err) {
      setError('Compliance validation failed.')
      return null
    } finally {
      setLoading(false)
    }
  }

  return {
    report,
    loading,
    error,
    runValidation,
    setReport
  }
}

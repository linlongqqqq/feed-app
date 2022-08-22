import { useState, useCallback, useMemo } from 'react'
import { INotice } from '../libs/models'
import * as noticeService from '../services/notice'

export default function useNotice() {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [skip, setSkip] = useState(0)
  const [total, setTotal] = useState(0)
  const [notices, setNotices] = useState<INotice[]>([])

  const hasMore = useMemo(() => {
    return skip < total
  }, [skip, total])

  const listNotice = useCallback(async () => {
    try {
      setLoading(true)
      const { data, code, message } = await noticeService.getNotice()
      if (code === 0) {
        setNotices(data.notice)
        setSkip(data.notice.length)
        setTotal(data.total)
      } else {
        setError(message)
      }
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }, [])

  const loadMore = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const { code, message, data } = await noticeService.getNotice({
        skip,
      })
      if (code === 0) {
        setNotices(notices.concat(data.notice))
        setSkip(skip + data.notice.length)
        setTotal(data.total)
      } else {
        setError(message)
      }
    } catch (error: any) {
      setError(error.message)
      throw error
    } finally {
      setLoading(false)
    }
  }, [skip, notices])

  return {
    setNotices,
    total,
    notices,
    hasMore,
    loading,
    error,
    listNotice,
    loadMore,
  }
}

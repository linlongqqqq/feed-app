import { useCallback, useState } from 'react'
import { IMessage } from '../libs/models'
import * as messageService from '../services/message'

const useMessageDetail = (userId: string) => {
  const [list, setList] = useState<IMessage[]>()
  const [unreadId, setUnreadId] = useState('')
  const [hasPrev, setHasPrev] = useState(false)
  const [loading, setLoading] = useState(false)
  const [moreLoading, setMoreLoading] = useState(false)
  const [error, setError] = useState('')

  const listMessages = useCallback(async () => {
    try {
      setLoading(true)
      const res = await messageService.getMessages(userId)
      if (!res.code && res.data) {
        setList(res.data.messages)
        setHasPrev(res.data.hasPrev)
        setUnreadId(res.data.unreadId)
      }
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }, [userId])

  const listPrev = useCallback(async () => {
    try {
      setMoreLoading(true)
      const res = await messageService.getMessages(userId, list![0]._id)
      if (!res.code && res.data) {
        setList(res.data.messages.concat(list!))
        setHasPrev(res.data.hasPrev)
        setUnreadId(res.data.unreadId)
      }
    } catch (error: any) {
      setError(error.message)
    } finally {
      setMoreLoading(false)
    }
  }, [list, userId])

  return {
    error,
    moreLoading,
    loading,
    hasPrev,
    listPrev,
    unreadId,
    setUnreadId,
    list,
    setList,
    listMessages,
  }
}

export default useMessageDetail

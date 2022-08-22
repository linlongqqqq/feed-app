import { useCallback, useMemo, useState } from 'react'
import { IMessage, IUser } from '../libs/models'
import * as messageService from '../services/message'

const useMessage = () => {
  const [loading, setLoading] = useState(false)
  const [skip, setSkip] = useState(0)
  const [total, setTotal] = useState(0)
  const [list, setList] =
    useState<{ unread: number; latest: IMessage; user: IUser }[]>()
  const [error, setError] = useState('')
  const hasMore = useMemo(() => {
    return skip < total
  }, [skip, total])

  const listMessage = useCallback(async () => {
    try {
      setLoading(true)
      const res = await messageService.getConversations()
      if (!res.code) {
        setList(res.data.conversations)
        setSkip(res.data.conversations.length)
        setTotal(res.data.total)
      }
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }, [setList, setLoading, setSkip, setTotal])

  const loadMore = useCallback(async () => {
    try {
      setLoading(true)
      const res = await messageService.getConversations(skip)
      if (!res.code) {
        setList(res.data.conversations.concat(list!))
        setSkip(skip + res.data.conversations.length)
        setTotal(res.data.total)
      }
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }, [skip, list])

  return {
    error,
    list,
    setList,
    hasMore,
    loadMore,
    listMessage,
    loading,
  }
}

export default useMessage

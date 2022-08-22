import { useState, useCallback, useMemo } from 'react'
import { IUser } from '../libs/models'
import * as searchService from '../services/search'

export default function useSearchUser() {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [skip, setSkip] = useState(0)
  const [total, setTotal] = useState(0)
  const [msg, setMsg] = useState('')
  const [users, setUsers] = useState<
    {
      userInfo: Required<
        Pick<IUser, '_id' | 'avatar' | 'nickname' | 'account' | 'bio'>
      >
      followStatus: { isFollowing: boolean; isFollowed: boolean }
    }[]
  >([])

  const hasMoreUser = useMemo(() => {
    return skip < total
  }, [skip, total])

  const listSearchUser = useCallback(async (msg: string) => {
    setMsg(msg)
    try {
      setLoading(true)
      const { data, code, message } = await searchService.getSearchUser({ msg })
      if (code === 0) {
        setUsers(data.userResult)
        setSkip(data.userResult.length)
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

  const loadMoreUser = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const { code, message, data } = await searchService.getSearchUser({
        skip,
        msg,
      })
      if (code === 0) {
        setUsers(users.concat(data.userResult))
        setSkip(skip + data.userResult.length)
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
  }, [skip, users, msg])

  return {
    total,
    users,
    hasMoreUser,
    loading,
    error,
    listSearchUser,
    loadMoreUser,
  }
}

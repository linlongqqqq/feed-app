import { useState, useCallback, useMemo } from 'react'
import { IUser } from '../libs/models'
import * as likedService from '../services/likedAndReposted'

export default function useSearchUser() {
  const [error, setError] = useState('')
  const [skip, setSkip] = useState(0)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [type, setType] = useState(0)
  const [postId, setPostId] = useState('')
  const [users, setUsers] = useState<
    {
      userInfo: Required<
        Pick<IUser, '_id' | 'avatar' | 'nickname' | 'account' | 'bio'>
      >
      followStatus: { isFollowing: boolean; isFollowed: boolean }
    }[]
  >([])
  const hasMore = useMemo(() => {
    return skip < total
  }, [skip, total])

  const listLiked = useCallback(async (postId: string, type: number) => {
    try {
      setLoading(true)
      setType(type)
      setPostId(postId)
      const { data, code, message } = await likedService.getliked({
        postId: postId,
        type: type,
      })
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

  const loadMore = useCallback(async () => {
    try {
      setLoading(true)
      const { data, code, message } = await likedService.getliked({
        postId: postId,
        type: type,
        skip: skip,
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
  }, [skip, users, postId, type])
  return {
    users,
    loadMore,
    hasMore,
    loading,
    error,
    listLiked,
    setUsers,
  }
}

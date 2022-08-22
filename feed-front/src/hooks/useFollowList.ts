import { useCallback, useMemo, useState } from 'react'
import { IUser } from '../libs/models'
import * as followService from '../services/follow'

const useFollowList = (userId: string) => {
  const [followingLoading, setFollowingLoading] = useState(false)
  const [followingSkip, setFollowingSkip] = useState(0)
  const [followingTotal, setFollowingTotal] = useState(0)
  const [followingList, setFollowingList] = useState<
    {
      userInfo: Required<
        Pick<IUser, 'avatar' | 'nickname' | 'account' | 'bio' | '_id'>
      >
      followStatus: { isFollowing: boolean; isFollowed: boolean }
    }[]
  >()
  const [followedLoading, setFollowedLoading] = useState(false)
  const [followedSkip, setFollowedSkip] = useState(0)
  const [followedTotal, setFollowedTotal] = useState(0)
  const [followedList, setFollowedList] = useState<
    {
      userInfo: Required<
        Pick<IUser, 'avatar' | 'nickname' | 'account' | 'bio' | '_id'>
      >
      followStatus: { isFollowing: boolean; isFollowed: boolean }
    }[]
  >()
  const [error, setError] = useState('')
  const hasMoreFollowing = useMemo(() => {
    return followingSkip < followingTotal
  }, [followingSkip, followingTotal])

  const listFollowing = useCallback(async () => {
    try {
      setFollowingLoading(true)
      const res = await followService.getFollow(userId, 'following')
      if (!res.code) {
        setFollowingList(res.data.list)
        setFollowingSkip(res.data.list.length)
        setFollowingTotal(res.data.total)
      }
    } catch (error: any) {
      setError(error.message)
    } finally {
      setFollowingLoading(false)
    }
  }, [userId])

  const loadMoreFollowing = useCallback(async () => {
    try {
      const res = await followService.getFollow(
        userId,
        'following',
        followingSkip
      )
      if (!res.code) {
        setFollowingList(followingList!.concat(res.data.list))
        setFollowingSkip(followingSkip + res.data.list.length)
        setFollowingTotal(res.data.total)
      }
    } catch (error: any) {
      setError(error.message)
    } finally {
    }
  }, [followingList, followingSkip, userId])
  const hasMoreFollowed = useMemo(() => {
    return followedSkip < followedTotal
  }, [followedSkip, followedTotal])

  const listFollowed = useCallback(async () => {
    try {
      setFollowedLoading(true)
      const res = await followService.getFollow(userId, 'followed')
      if (!res.code) {
        setFollowedList(res.data.list)
        setFollowedSkip(res.data.list.length)
        setFollowedTotal(res.data.total)
      }
    } catch (error: any) {
      setError(error.message)
    } finally {
      setFollowedLoading(false)
    }
  }, [
    setFollowedList,
    setFollowedLoading,
    setFollowedSkip,
    setFollowedTotal,
    userId,
  ])

  const loadMoreFollowed = useCallback(async () => {
    try {
      setFollowedLoading(true)
      const res = await followService.getFollow(
        userId,
        'followed',
        followedSkip
      )
      if (!res.code) {
        setFollowedList(followedList!.concat(res.data.list))
        setFollowedSkip(followedSkip + res.data.list.length)
        setFollowedTotal(res.data.total)
      }
    } catch (error: any) {
      setError(error.message)
    } finally {
      setFollowedLoading(false)
    }
  }, [
    followedList,
    followedSkip,
    setFollowedList,
    setFollowedLoading,
    setFollowedSkip,
    setFollowedTotal,
    userId,
  ])

  return {
    error,
    followingList,
    setFollowingList,
    hasMoreFollowing,
    loadMoreFollowing,
    listFollowing,
    followingLoading,
    followedList,
    setFollowedList,
    hasMoreFollowed,
    loadMoreFollowed,
    listFollowed,
    followedLoading,
  }
}

export default useFollowList

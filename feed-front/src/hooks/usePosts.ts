import { Toast } from 'antd-mobile'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IPostItem } from '../libs/models'
import * as postService from '../services/post'

export default function usePosts() {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // 帖子列表
  const [posts, setPosts] = useState<IPostItem[]>([])
  const [next, setNext] = useState<string>('')
  const [hasNext, setHasNext] = useState(false)

  const limit = useMemo(() => 10, [])

  const navigate = useNavigate()

  // 如果出现错误
  useEffect(() => {
    if (error) {
      Toast.show({ content: error, icon: 'fail' })
      navigate('/500')
    }
  }, [error, navigate])

  // todo: 订阅消息、修改posts

  // 获取首页信息流
  const getFollingPosts = useCallback(async () => {
    try {
      const { data } = await postService.list(undefined, undefined, limit)
      setPosts(data.list)
      if (data.list.length > 0) {
        setNext(data.list[data.list.length - 1]._id)
      }
      setHasNext(data.hasNext)
    } catch (error: any) {
      setError(error.message)
    }
  }, [limit])

  // 首页加载更多
  const getMoreFollings = useCallback(async () => {
    try {
      const { data } = await postService.list(undefined, next, limit)
      setPosts([...posts, ...data.list])
      if (data.list.length > 0) setNext(data.list[data.list.length - 1]._id)
      setHasNext(data.hasNext)
    } catch (error: any) {
      setError(error.message)
    }
  }, [limit, next, posts])

  // 获取帖子详情
  const getPostDetail = useCallback(async (_id: string) => {
    try {
      const { data } = await postService.detail(_id)
      return data
    } catch (error: any) {
      setError(error.message)
    }
  }, [])

  // 获取帖子的回复
  const getComments = useCallback(
    async (_id: string) => {
      try {
        const { data } = await postService.comments(_id, undefined, limit)
        setPosts(data.list)
        if (data.list.length > 0) setNext(data.list[data.list.length - 1]._id)
        setHasNext(data.hasNext)
      } catch (error: any) {
        setError(error.message)
      }
    },
    [limit]
  )

  // 帖子评论加载更多
  const getMoreComments = useCallback(
    async (_id: string) => {
      try {
        const { data } = await postService.comments(_id, undefined, limit)
        setPosts(data.list)
        if (data.list.length > 0) setNext(data.list[data.list.length - 1]._id)
        setHasNext(data.hasNext)
      } catch (error: any) {
        setError(error.message)
      }
    },
    [limit]
  )

  // 获取用户所有的帖子
  const listUserPosts = useCallback(async (_id: string) => {
    try {
      const { data } = await postService.list(_id)
      setPosts(data.list)
      if (data.list.length > 0) setNext(data.list[data.list.length - 1]._id)
      setHasNext(data.hasNext)
    } catch (error: any) {
      setError(error.message)
    }
  }, [])

  const loadMoreUserPosts = useCallback(
    async (_id: string) => {
      try {
        const { data } = await postService.list(_id, next, limit)
        setPosts([...posts, ...data.list])
        if (data.list.length > 0) setNext(data.list[data.list.length - 1]._id)
        setHasNext(data.hasNext)
      } catch (error: any) {
        setError(error.message)
      }
    },
    [limit, next, posts]
  )

  // 获取用户所有带照片的帖子
  const listUserImgPosts = useCallback(
    async (_id: string) => {
      try {
        const { data } = await postService.list(_id, undefined, limit, true)
        setPosts(data.list)
        if (data.list.length > 0) setNext(data.list[data.list.length - 1]._id)
        setHasNext(data.hasNext)
      } catch (error: any) {
        setError(error.message)
      }
    },
    [limit]
  )

  const loadMoreImgPosts = useCallback(
    async (_id: string) => {
      try {
        const { data } = await postService.list(_id, next, limit, true)
        setPosts([...posts, ...data.list])
        if (data.list.length > 0) setNext(data.list[data.list.length - 1]._id)
        setHasNext(data.hasNext)
      } catch (error: any) {
        setError(error.message)
      }
    },
    [limit, next, posts]
  )

  // 获取用户所有喜欢的帖子
  const listUserLikePosts = useCallback(async (_id: string) => {
    try {
      const { data } = await postService.postLikes(_id)
      setPosts(data.list)
      if (data.list.length > 0) setNext(data.list[data.list.length - 1]._id)
      setHasNext(data.hasNext)
    } catch (error: any) {
      setError(error.message)
    }
  }, [])

  const loadMoreLikePosts = useCallback(
    async (_id: string) => {
      try {
        const { data } = await postService.postLikes(_id, next)
        setPosts([...posts, ...data.list])
        if (data.list.length > 0) setNext(data.list[data.list.length - 1]._id)
        setHasNext(data.hasNext)
      } catch (error: any) {
        setError(error.message)
      }
    },
    [next, posts]
  )

  return {
    loading,
    setLoading,
    error,
    getPostDetail,
    getComments,
    getMoreComments,
    posts,
    setPosts,
    next,
    hasNext,
    getFollingPosts,
    getMoreFollings,
    listUserPosts,
    loadMoreUserPosts,
    listUserImgPosts,
    loadMoreImgPosts,
    listUserLikePosts,
    loadMoreLikePosts,
  }
}

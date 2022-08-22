import { IPostItem } from './../libs/models'
import { useState, useCallback, useMemo } from 'react'
import * as searchService from '../services/search'

export default function useSearchPost() {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [posts, setPosts] = useState<IPostItem[]>([])
  const [skip, setSkip] = useState(0)
  const [total, setTotal] = useState(0)
  const [msg, setMsg] = useState('')

  const hasMorePost = useMemo(() => {
    return skip < total
  }, [skip, total])

  const listSearchPost = useCallback(async (msg: string) => {
    setMsg(msg)
    try {
      setLoading(true)
      const { data, code, message } = await searchService.getSearchPost({
        msg,
      })
      if (code === 0) {
        setPosts(data.post)
        setSkip(data.post.length)
        setTotal(data.total)
      } else {
        setError(message)
      }
    } catch (error: any) {
    } finally {
      setLoading(false)
    }
  }, [])

  const loadMorePost = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const { code, message, data } = await searchService.getSearchPost({
        msg,
        skip,
      })
      if (code === 0) {
        setPosts(posts.concat(data.post))
        setSkip(skip + data.post.length)
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
  }, [skip, posts, msg])
  return {
    posts,
    total,
    loading,
    error,
    hasMorePost,
    loadMorePost,
    listSearchPost,
  }
}

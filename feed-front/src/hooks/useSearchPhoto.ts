import { IPostItem } from './../libs/models'
import { useState, useCallback, useMemo } from 'react'
import * as searchService from '../services/search'

export default function useSearchPost() {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [postPhotos, setPostPhotos] = useState<IPostItem[]>([])
  const [skip, setSkip] = useState(0)
  const [total, setTotal] = useState(0)
  const [msg, setMsg] = useState('')

  const hasMorePhoto = useMemo(() => {
    return skip < total
  }, [skip, total])

  const listSearchPhoto = useCallback(async (msg: string) => {
    setMsg(msg)
    try {
      setLoading(true)
      const { data, code, message } = await searchService.getSearchPhoto({
        msg,
      })
      if (code === 0) {
        setPostPhotos(data.post)
        setSkip(data.post.length)
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

  const loadMorePhoto = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const { code, message, data } = await searchService.getSearchPhoto({
        skip,
        msg,
      })
      if (code === 0) {
        setPostPhotos(postPhotos.concat(data.post))
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
  }, [skip, postPhotos, msg])
  return {
    postPhotos,
    total,
    loading,
    error,
    hasMorePhoto,
    loadMorePhoto,
    listSearchPhoto,
  }
}

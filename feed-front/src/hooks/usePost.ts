import { Toast } from 'antd-mobile'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IPostItem } from '../libs/models'
import * as postService from '../services/post'

export default function usePost(_id: string) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [post, setPost] = useState<IPostItem>()

  const navigate = useNavigate()

  // 获取帖子详情
  const getPostDetail = useCallback(async (_id: string) => {
    try {
      setLoading(true)
      const { data } = await postService.detail(_id)
      setPost(data)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    getPostDetail(_id)
  }, [getPostDetail, _id])

  // 如果出现错误
  useEffect(() => {
    if (error) {
      Toast.show({ content: error, icon: 'fail' })
      navigate('/500')
    }
  }, [error, navigate])

  return {
    loading,
    setLoading,
    post,
  }
}

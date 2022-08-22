import { useCallback, useEffect, useState } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import * as userService from '../services/user'

const useMessageReceive = () => {
  const [userId, setUserId] = useState('')
  const [error, setError] = useState('')
  const path = useLocation().pathname
  const param = useParams().account

  /* 根据account获取userId */
  const getUserId = useCallback(async () => {
    try {
      const res = await userService.detail(undefined, param)
      if (!res.code && res.data) {
        setUserId(res.data._id)
      }
    } catch (error: any) {
      setError(error.message)
    }
  }, [param])

  /* 处于私信详情页面时获取uid */
  useEffect(() => {
    if (path.includes('/message-detail')) getUserId()
    else setUserId('')
  }, [getUserId, path])

  return { userId, error }
}
export default useMessageReceive

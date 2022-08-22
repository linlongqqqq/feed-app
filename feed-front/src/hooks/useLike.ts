import { useCallback, useState } from 'react'
import * as postService from '../services/post'

export default function useLike(postId: string, likes: number, liked: boolean) {
  const [tLikes, setTLikes] = useState(likes)
  const [tLiked, setTLiked] = useState(liked)

  const handleLikeClick = useCallback(async () => {
    if (tLiked) {
      setTLiked(false)
      setTLikes((preValue) => preValue - 1)
      await postService.dislike(postId)
    } else {
      setTLiked(true)
      setTLikes((preValue) => preValue + 1)
      await postService.like(postId)
    }
  }, [postId, tLiked])

  return {
    tLikes,
    setTLikes,
    tLiked,
    setTLiked,
    handleLikeClick,
  }
}

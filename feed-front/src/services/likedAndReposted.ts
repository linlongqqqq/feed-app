import { ApiResp, IUser } from '../libs/models'
import request from '../libs/request'

interface Data {
  userResult: {
    userInfo: Required<
      Pick<IUser, '_id' | 'avatar' | 'nickname' | 'account' | 'bio'>
    >
    followStatus: { isFollowing: boolean; isFollowed: boolean }
  }[]
  total: number
}

export async function getliked(
  params: {
    postId: string
    type: number
    skip?: number
    limit?: number
  } = {
    postId: '',
    type: 0,
  }
) {
  const query = new URLSearchParams({
    postId: params.postId,
    skip: (params.skip || 0).toString(),
    limit: (params.limit || 10).toString(),
  })

  if (params.type === 2) {
    const { data } = await request.get<ApiResp<Data>>(
      'likedlist/lists?' + query.toString()
    )
    return data
  } else {
    const { data } = await request.get<ApiResp<Data>>(
      'likedlist/repost?' + query.toString()
    )
    return data
  }
}

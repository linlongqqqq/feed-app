import { ApiResp, IUser, IPostItem } from '../libs/models'
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
interface Data2 {
  post: IPostItem[]
  total: number
}
// 获取用户列表
export async function getSearchUser(
  params: {
    msg: string
    skip?: number
    limit?: number
  } = {
    msg: '',
  }
) {
  const query = new URLSearchParams({
    skip: (params.skip || 0).toString(),
    limit: (params.limit || 10).toString(),
    message: params.msg || '',
  })

  const { data } = await request.get<ApiResp<Data>>(
    '/search/user?' + query.toString()
  )
  return data
}

// 获取帖子列表
export async function getSearchPost(
  params: {
    msg: string
    skip?: number
    limit?: number
  } = {
    msg: '',
  }
) {
  const query = new URLSearchParams({
    skip: (params.skip || 0).toString(),
    limit: (params.limit || 10).toString(),
    message: params.msg || '',
  })

  const { data } = await request.get<ApiResp<Data2>>(
    '/search/post?' + query.toString()
  )
  return data
}

// 获取带图片帖子列表
export async function getSearchPhoto(
  params: {
    msg: string
    skip?: number
    limit?: number
  } = {
    msg: '',
  }
) {
  const query = new URLSearchParams({
    skip: (params.skip || 0).toString(),
    limit: (params.limit || 10).toString(),
    message: params.msg || '',
  })

  const { data } = await request.get<ApiResp<Data2>>(
    '/search/postPhoto?' + query.toString()
  )
  return data
}

import { ApiResp, IUser } from '../libs/models'
import request from '../libs/request'

/**
 * 根据关注状态关注/取关
 * @param followingId
 * @returns
 */
export async function toggleFollow(followingId: string) {
  const res = await request.post<ApiResp<{ _id: string } | null>>(
    '/follow/toggleFollow',
    { followingId }
  )
  return res.data
}

/**
 * 查询用户间关注状态
 * @param followingId
 * @returns
 */
export async function checkFollow(followingId: string) {
  const res = await request.get<
    ApiResp<{ isFollowing: boolean; isFollowed: boolean }>
  >(`/follow/isFollow/${followingId}`)
  return res.data
}

/**
 * 分页查看用户正在关注列表\关注者列表
 * @param userId
 * @param type
 * @param skip
 * @param limit
 * @returns
 */
export async function getFollow(
  userId: string,
  type: 'following' | 'followed',
  skip = 0,
  limit = 10
) {
  const res = await request.get<
    ApiResp<{
      list: {
        userInfo: Required<
          Pick<IUser, 'avatar' | 'nickname' | 'account' | 'bio' | '_id'>
        >
        followStatus: { isFollowing: boolean; isFollowed: boolean }
      }[]

      total: number
    }>
  >(`/follow/getFollow/${userId}/${type}/${skip}/${limit}`)
  return res.data
}

/**
 * 计算关注数/关注者数
 * @param userId
 * @returns
 */
export async function countFollow(userId: string) {
  const res = await request.get<
    ApiResp<{ following: number; followed: number }>
  >(`/follow/countFollow/${userId}`)
  return res.data
}

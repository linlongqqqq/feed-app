import { friendId, openid, _id } from './configData'
import request from './request'

let headers: Record<string, string> = {}

interface ApiResp<T = any> {
  code: number
  message: string
  data: T
}

interface IUser {
  _id: string
  status: number
  openid: string
  account: string
  nickname: string
  createdAt: number
  bio: string
  avatar: string
  banner: string
  sex: number
}

/* 测试前获取cookie */
beforeAll(async () => {
  // 获取最新的cookie
  const { headers: tHeaders } = await request.post('/test/cookie', { openid })
  headers.cookie = tHeaders['set-cookie']!.reduce((pre, cur) => {
    return pre + cur.split(';')[0] + ';'
  })
})

/* 测试后删除cookie及测试数据 */
afterAll(async () => {
  // 删除cookie
  await request.delete('/test/cookie', { headers })
})

describe('关注模块', () => {
  test('根据关注状态关注/取关', async () => {
    // 关注/取关
    const { data: followData } = await request.post<
      ApiResp<{ _id: string } | null>
    >('/follow/toggleFollow', { followingId: friendId }, { headers })
    expect(followData.code).toBe(0)
    const { data: unfolowData } = await request.post<
      ApiResp<{ _id: string } | null>
    >('/follow/toggleFollow', { followingId: friendId }, { headers })
    expect(unfolowData.code).toBe(0)
    expect(followData.data === null || unfolowData.data === null).toBeTruthy()
    expect(followData.data !== null || unfolowData.data !== null).toBeTruthy()

    // 用户无法关注自己
    const { data: followSelfData } = await request.post<
      ApiResp<{ _id: string } | null>
    >('/follow/toggleFollow', { followingId: _id }, { headers })
    expect(followSelfData.code).toBe(20005)
    expect(followSelfData.message).toBe('非法关注')
  })

  test('查询用户间关注状态', async () => {
    // 查询关注后用户间关注状态
    const { data: followStatusData } = await request.get<
      ApiResp<{ isFollowing: boolean; isFollowed: boolean }>
    >(`/follow/isFollow/${friendId}`, { headers })
    expect(followStatusData.code).toBe(0)
    expect(typeof followStatusData.data.isFollowed === 'boolean').toBeTruthy()
    expect(typeof followStatusData.data.isFollowing === 'boolean').toBeTruthy()
  })

  test('分页查看用户正在关注列表关注者列表', async () => {
    // 分页查看用户正在关注列表
    const { data: followingListData } = await request.get<
      ApiResp<{
        list: {
          userInfo: Required<
            Pick<IUser, 'avatar' | 'nickname' | 'account' | 'bio' | '_id'>
          >
          followStatus: { isFollowing: boolean; isFollowed: boolean }
        }[]
        total: number
      }>
    >(`/follow/getFollow/${_id}/following/0/10`, { headers })
    expect(followingListData.code).toBe(0)
    expect(followingListData.data.total).toBeGreaterThanOrEqual(0)

    // 分页查看用户关注者列表
    const { data: followedListData } = await request.get<
      ApiResp<{
        list: {
          userInfo: Required<
            Pick<IUser, 'avatar' | 'nickname' | 'account' | 'bio' | '_id'>
          >
          followStatus: { isFollowing: boolean; isFollowed: boolean }
        }[]
        total: number
      }>
    >(`/follow/getFollow/${friendId}/followed/0/10`, { headers })
    expect(followedListData.code).toBe(0)
    expect(followedListData.data.total).toBeGreaterThanOrEqual(0)
  })

  test('计算关注数/关注者数', async () => {
    // 计算关注者和被关注者数
    const { data: followNumberData } = await request.get<
      ApiResp<{ following: number; followed: number }>
    >(`/follow/countFollow/${_id}`, { headers })
    expect(followNumberData.code).toBe(0)
    expect(followNumberData.data.following).toBeGreaterThanOrEqual(0)
    expect(followNumberData.data.followed).toBeGreaterThanOrEqual(0)
  })
})

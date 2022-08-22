import { ApiResp, IUser } from '../libs/models'
import request from '../libs/request'

type UserUpdateDto = {
  account?: string
  avatar?: string
  nickname?: string
  bio?: string
  banner?: string
}

/**
 * 修改用户信息
 * @param userUpdate
 * @returns
 */
export async function update(userUpdate: UserUpdateDto) {
  const res = await request.post<ApiResp>('/user/update', userUpdate)
  return res.data
}

/**
 * 获取用户详情
 * @param _id
 * @param account
 * @returns
 */
export async function detail(_id?: string, account?: string) {
  const params: { [key: string]: any } = {}
  if (_id !== undefined) params._id = _id
  if (account !== undefined) params.account = account
  const res = await request.get<ApiResp<IUser | null>>('/user/detail', {
    params,
  })
  return res.data
}

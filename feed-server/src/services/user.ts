import { Filter, ObjectId, WithId } from 'mongodb'
import * as db from '../db'
import { stats } from '../libs/stats'
import { IUser } from '../models/types'
import * as sessionService from '../services/session'

/**
 * 用户是否已经注册
 * @param openid
 * @returns
 */
export async function existUser(openid: string) {
  const user = await db.users.findOne({ openid })
  return user !== null
}

/**
 * 注册用户
 * @param openid
 * @param name
 * @param avatar
 * @param sex
 * @returns
 */
export async function create(
  openid: string,
  nickname: string,
  avatar: string,
  sex: number
) {
  const user: IUser = {
    status: 1,
    openid,
    account: '',
    nickname,
    createdAt: Date.now(),
    bio: '',
    avatar,
    banner: '',
    sex,
  }
  const res = await db.users.insertOne(user)
  return res.insertedId
}

/**
 * 获取用户详情
 * @param sid
 * @returns
 */
export async function getUserDetail(sid: string) {
  const session = await db.sessions.findOne({ sid })
  // 会话不存在抛出异常
  if (!session) throw stats.ErrorSessionNotExist
  const user = await db.users.findOne({ openid: session.openid })
  return user
}

/**
 * 根据id查询用户详情
 * @param _id
 * @returns
 */
export async function getUserDetailByFilter(_id?: string, account?: string) {
  const filterOption: Filter<WithId<IUser>> = {}
  if (_id !== undefined) filterOption._id = new ObjectId(_id)
  if (account !== undefined) filterOption.account = account
  const user = await db.users.findOne(filterOption)
  if (!user) throw stats.ErrorUserNotFound
  return user
}

type UpdateInfo = {
  account?: string
  avatar?: string
  nickname?: string
  bio?: string
  banner?: string
}

// 修改用户信息
export async function update(_id: ObjectId, updateInfo: UpdateInfo) {
  const user = await db.users.findOne({ _id })
  // at仅在注册用户时可以修改
  if (user?.account !== '' && updateInfo.account !== undefined)
    throw stats.ErrorUserAtHasEdited
  //
  if (updateInfo.account !== undefined) {
    // 查找at是否存在
    const flag =
      (await db.users.findOne({ account: updateInfo.account })) === null
    if (!flag) throw stats.ErrorUserAtHasExist
  }
  await db.users.findOneAndUpdate(
    { _id },
    {
      $set: updateInfo,
    }
  )
}

/**
 * 退出登录
 * @param sid
 */
export async function logout(sid: string) {
  await sessionService.deleteOne(sid)
}

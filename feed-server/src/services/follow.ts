import { Filter, ObjectId } from 'mongodb'
import * as db from '../db'
import { stats } from '../libs/stats'
import { IFollow } from '../models/types'
import * as noticeService from './notice'

/**
 * 关注某用户
 * @param followingId
 * @param userId
 * @returns
 */
export async function create(followingId: string, userId: ObjectId) {
  // 无法关注自己
  if (followingId === userId.toString()) throw stats.ErrorInvalidFollow
  // 检查用户是否存在
  const user = await db.users.findOne({ _id: new ObjectId(followingId) })
  if (user) {
    const res = await db.follows.insertOne({
      followingId: new ObjectId(followingId),
      userId,
      createdAt: Date.now(),
    })
    // 发送通知
    noticeService.create(
      { receiverId: followingId, type: 1 },
      userId.toString()
    )
    if (res.acknowledged) return res.insertedId
    throw stats.ErrorFollowFailed
  }
  throw stats.ErrorUserNotFound
}

/**
 * 取消关注某用户
 * @param followingId
 * @param userId
 * @returns
 */
export async function remove(followingId: string, userId: ObjectId) {
  // 检查用户是否存在
  const user = await db.users.findOne({ _id: new ObjectId(followingId) })
  if (!user) throw stats.ErrorUserNotFound
  const res = await db.follows.findOneAndDelete({
    followingId: new ObjectId(followingId),
    userId,
  })
  if (res.ok) {
    if (res.value) return res.value
    throw stats.ErrorNotFollowing
  }
  throw stats.ErrorUnfollowFailed
}

/**
 * 查看某用户是否关注另一用户
 * @param followingId
 * @param userId
 * @returns
 */
export async function isFollow(followingId: string, userId: string) {
  // 检查用户是否存在
  const user = await db.users.findOne({ _id: new ObjectId(followingId) })
  if (!user) throw stats.ErrorUserNotFound
  const res = await db.follows.findOne({
    followingId: new ObjectId(followingId),
    userId: new ObjectId(userId),
  })
  return res
}

/**
 * 查看用户正在关注列表\关注者列表
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
  let match: Filter<IFollow>
  let lookup
  let list
  let total: number
  // 关注列表
  if (type === 'following') {
    match = {
      userId: new ObjectId(userId),
    }
    lookup = {
      from: 'users',
      foreignField: '_id',
      localField: 'followingId',
      as: '_users',
    }
  }
  // 关注者列表
  if (type === 'followed') {
    match = {
      followingId: new ObjectId(userId),
    }
    lookup = {
      from: 'users',
      foreignField: '_id',
      localField: 'userId',
      as: '_users',
    }
  }

  list = await db.follows
    .aggregate([
      { $match: match! },
      { $lookup: lookup },
      { $unwind: { path: '$_users', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
        },
      },
      {
        $addFields: {
          avatar: '$_users.avatar',
          nickname: '$_users.nickname',
          account: '$_users.account',
          bio: '$_users.bio',
          _id: '$_users._id',
        },
      },
      {
        $project: {
          _users: 0,
          followingId: 0,
          userId: 0,
          createdAt: 0,
        },
      },
      { $skip: skip },
      { $limit: limit },
    ])
    .toArray()
  total = await db.follows.countDocuments(match!)
  return { list, total }
}

/**
 * 计算关注数/关注者数
 * @param userId
 * @returns
 */
export async function countFollow(userId: string) {
  // 检查用户是否存在
  const user = await db.users.findOne({ _id: new ObjectId(userId) })
  if (!user) throw stats.ErrorUserNotFound
  let match: Filter<IFollow>
  // 关注数
  match = {
    userId: new ObjectId(userId),
  }
  const following = await db.follows.countDocuments(match)
  // 关注者数
  match = {
    followingId: new ObjectId(userId),
  }
  const followed = await db.follows.countDocuments(match)
  return { following, followed }
}

/**
 * 获取全部关注者的_id
 * @param _id
 * @returns
 */
export async function getAllFollowed(_id: string) {
  const res = await db.follows
    .find({ followingId: new ObjectId(_id) })
    .toArray()
  return res.map((item) => item.userId)
}

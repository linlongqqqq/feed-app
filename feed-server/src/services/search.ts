import { Filter, ObjectId } from 'mongodb'
import * as db from '../db'
import { stats } from '../libs/stats'
import { IUser } from '../models/types'

// 查询用户
export async function searchUser(message: string, skip = 0, limit = 10) {
  if (message === '') return
  const match = {
    $or: [{ nickname: { $regex: message } }, { account: { $regex: message } }],
  }
  const user = await db.users
    .aggregate([
      {
        $match: match,
      },
      {
        $skip: skip,
      },
      {
        $limit: limit,
      },
      {
        $project: {
          _id: 1,
          avatar: 1,
          nickname: 1,
          account: 1,
          bio: 1,
        },
      },
    ])
    .toArray()
  const total = await db.users.countDocuments(match)
  return { user, total }
}

// 查询符合条件的所有用户
export async function searchUserAll(message: string) {
  if (message === '') return
  const match = {
    $or: [{ nickname: { $regex: message } }, { account: { $regex: message } }],
  }
  const user = await db.users
    .aggregate([
      {
        $match: match,
      },
      {
        $project: {
          _id: 1,
          account: 1,
        },
      },
    ])
    .toArray()

  const total = await db.users.countDocuments(match)
  return { user, total }
}

export async function searchPost(userId: ObjectId, message: string) {
  const likes = await db.likes.find({ userId }).toArray()

  const post = await db.posts
    .aggregate([
      {
        $match: { content: { $regex: message }, deleted: false },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: '_user',
        },
      },
      {
        $unwind: '$_user',
      },
      {
        $addFields: {
          account: '$_user.account',
          avatar: '$_user.avatar',
          nickname: '$_user.nickname',
        },
      },
      {
        $lookup: {
          from: 'posts',
          localField: 'relationId',
          foreignField: '_id',
          as: '_pposts',
        },
      },
      {
        $unwind: {
          path: '$_pposts',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          relationPost: '$_pposts',
          relationUserId: '$_pposts.userId',
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'relationUserId',
          foreignField: '_id',
          as: '_user2',
        },
      },
      {
        $sort: { createdAt: 1 },
      },
      {
        $unwind: {
          path: '$_user2',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          replyAccount: '$_user2.account',
          'relationPost.account': '$_user2.account',
          'relationPost.avatar': '$_user2.avatar',
          'relationPost.nickname': '$_user2.nickname',
          liked: {
            $in: ['$_id', likes.map((like) => like.postId)],
          },
        },
      },
      {
        $project: {
          _user: 0,
          _pposts: 0,
          _user2: 0,
          relationUserId: 0,
        },
      },
    ])
    .toArray()
  return post
}

export async function list(userId: ObjectId, account: string) {
  // 查询用户所有的喜欢的帖子
  const likes = await db.likes.find({ userId }).toArray()
  const res = await db.posts
    .aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: '_user',
        },
      },
      {
        $unwind: '$_user',
      },
      {
        $addFields: {
          account: '$_user.account',
          avatar: '$_user.avatar',
          nickname: '$_user.nickname',
        },
      },
      {
        $lookup: {
          from: 'posts',
          localField: 'relationId',
          foreignField: '_id',
          as: '_pposts',
        },
      },
      {
        $unwind: {
          path: '$_pposts',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          relationPost: '$_pposts',
          relationUserId: '$_pposts.userId',
        },
      },
      {
        $match: {
          account,
          deleted: false,
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'relationUserId',
          foreignField: '_id',
          as: '_user2',
        },
      },
      {
        $unwind: {
          path: '$_user2',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          replyAccount: '$_user2.account',
          'relationPost.account': '$_user2.account',
          'relationPost.avatar': '$_user2.avatar',
          'relationPost.nickname': '$_user2.nickname',
          liked: {
            $in: ['$_id', likes.map((like) => like.postId)],
          },
        },
      },
      {
        $project: {
          _user: 0,
          _pposts: 0,
          _user2: 0,
          relationUserId: 0,
        },
      },
    ])
    .toArray()
  const total = res.length
  return {
    total,
    list: res,
  }
}

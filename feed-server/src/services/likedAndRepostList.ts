import { _id } from './../../test/configData'
import { Document, ObjectId } from 'mongodb'
import * as db from '../db'

// 喜欢列表
export async function list(post: string, skip = 0, limit = 10) {
  const match = {
    postId: new ObjectId(post),
  }
  const pipeLine = [
    {
      $lookup: {
        from: 'likes',
        localField: '_id',
        foreignField: 'userId',
        as: '_likes',
      },
    },
    {
      $unwind: {
        path: '$_likes',
      },
    },
    {
      $addFields: {
        postId: '$_likes.postId',
      },
    },
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
        _likes: 0,
      },
    },
  ]
  const liked = await db.users.aggregate(pipeLine).toArray()

  const total = await db.likes.countDocuments(match)

  return { liked, total }
}

// 转发列表
export async function repost(post: string, skip = 0, limit = 10) {
  const match = {
    type: 3,
    relationId: new ObjectId(post),
  }
  const users = await db.users
    .aggregate([
      {
        $lookup: {
          from: 'posts',
          localField: '_id',
          foreignField: 'userId',
          as: '_posts',
        },
      },
      {
        $unwind: {
          path: '$_posts',
        },
      },
      {
        $addFields: {
          relationId: '$_posts.relationId',
          type: '$_posts.type',
          userId: '$_posts.userId',
        },
      },
      {
        $match: match,
      },
      { $group: { _id: '$_id' } },
      {
        $skip: skip,
      },
      {
        $limit: limit,
      },
      {
        $project: {
          _posts: 0,
          type: 0,
          relationId: 0,
        },
      },
    ])
    .toArray()
  let liked: Document[] = []
  for (const item of users) {
    const result = await db.users.findOne({
      _id: item._id,
    })
    liked.push(result!)
  }
  const total = liked.length

  return { liked, total }
}

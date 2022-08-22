import { ObjectId, UpdateFilter } from 'mongodb'
import * as db from '../db'
import * as followService from '../services/follow'
import * as noticeService from '../services/notice'
import { stats } from '../libs/stats'
import { IPost } from '../models/types'

type CreatePostDto = {
  content: string
  type: number
  imgs: string[]
  relationId?: string
}

/**
 * 创建帖子、转发、评论
 * @param userId
 * @param createPostDto
 * @returns
 */
export async function create(userId: ObjectId, createPostDto: CreatePostDto) {
  const relationId =
    createPostDto.relationId === undefined
      ? undefined
      : new ObjectId(createPostDto.relationId)
  const post = {
    ...createPostDto,
    relationId,
    comments: 0,
    reposts: 0,
    likes: 0,
    deleted: false,
    createdAt: Date.now(),
    userId,
  }
  const res = await db.posts.insertOne(post)
  // 修改关联帖子的评论数、转发数
  if (relationId) {
    const relation = await db.posts.findOne({ _id: relationId })
    if (!relation) throw stats.ErrorRelationPostNotExist
    const updateFilter: UpdateFilter<IPost> = {}
    // 如果是评论
    if (createPostDto.type === 2) {
      updateFilter.comments = relation.comments + 1
    } else if (createPostDto.type === 3) {
      updateFilter.reposts = relation.reposts + 1
    }
    await db.posts.findOneAndUpdate({ _id: relationId }, { $set: updateFilter })
    // 创建通知
    await noticeService.create(
      {
        receiverId: relation.userId.toString(),
        relationId: relation._id.toString(),
        type: createPostDto.type,
      },
      userId.toString()
    )
  }

  return res.insertedId
}

/**
 * 逻辑删除帖子
 * @param userId
 * @param _id
 */
export async function deletePost(userId: ObjectId, _id: string) {
  const post = await db.posts.findOne({ userId, _id: new ObjectId(_id) })
  // 判断_id是否是该用户的帖子
  if (!post) throw stats.ErrorIllegalDelPost
  await db.posts.findOneAndUpdate(
    { userId, _id: new ObjectId(_id) },
    {
      $set: {
        deleted: true,
      },
    }
  )
  if (post !== null && post.relationId) {
    const ppost = await db.posts.findOne({ _id: post.relationId })
    if (!ppost) throw stats.ErrorRelationPostNotExist
    const setOptions: { [key: string]: any } = {}
    if (post.type === 2) setOptions.comments = ppost.comments - 1
    if (post.type === 3) setOptions.reposts = ppost.reposts - 1
    await db.posts.findOneAndUpdate(
      { _id: post.relationId },
      {
        $set: setOptions,
      }
    )
  }
}

/**
 * 获取帖子详情
 * @param userId
 * @param _id
 * @returns
 */
export async function detail(userId: ObjectId, _id: string) {
  const likes = await db.likes.find({ userId }).toArray()
  const detail = await db.posts
    .aggregate([
      {
        $match: {
          _id: new ObjectId(_id),
        },
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
          liked: {
            $in: ['$_id', likes.map((like) => like.postId)],
          },
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
          relationUid: '$_pposts.userId',
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'relationUid',
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
          'relationPost.account': '$_user2.account',
          'relationPost.avatar': '$_user2.avatar',
          'relationPost.nickname': '$_user2.nickname',
        },
      },
      {
        $project: {
          _user: 0,
          _pposts: 0,
          _user2: 0,
          relationUid: 0,
        },
      },
    ])
    .next()
  return detail
}

/**
 * 查询该用户全部的帖子
 * @param userId 当前登录的用户
 * @param _id 查询用户的_id
 * @param next
 * @param limit
 * @returns
 */
export async function list(
  userId: ObjectId,
  _id: string,
  next?: string,
  onlyImgs?: boolean,
  limit?: number
) {
  // 查询用户所有的喜欢的帖子
  const likes = await db.likes.find({ userId }).toArray()
  const matchOptions: { [key: string]: any } = {
    userId: new ObjectId(_id),
    deleted: false,
  }
  if (onlyImgs) {
    matchOptions['imgs.0'] = {
      $exists: true,
    }
  }
  if (next) {
    matchOptions._id = {
      $lt: new ObjectId(next),
    }
  }

  const pipeLine = [
    {
      $match: matchOptions,
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
        relationUid: '$_pposts.userId',
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: 'relationUid',
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
        relationUid: 0,
      },
    },
    {
      $sort: {
        _id: -1,
      },
    },
    {
      $limit: limit,
    },
  ]

  const res = await db.posts.aggregate(pipeLine).toArray()
  let hasNext = false
  if (res.length > 0) {
    matchOptions._id = {
      $lt: new ObjectId(res[res.length - 1]._id),
    }
    pipeLine[0].$match = matchOptions
    const more = await db.posts.aggregate(pipeLine).toArray()
    if (more.length > 0) hasNext = true
  }

  return {
    hasNext,
    list: res,
  }
}

/**
 * 获取某个帖子的全部评论
 * @param userId
 * @param _id
 * @returns
 */
export async function comments(
  userId: ObjectId,
  _id: string,
  next?: string,
  limit = 10
) {
  // 查询用户所有的喜欢的帖子
  const likes = await db.likes.find({ userId }).toArray()
  const matchOptions: { [key: string]: any } = {
    relationId: new ObjectId(_id),
    type: 2,
    deleted: false,
  }
  if (next) {
    matchOptions._id = {
      $lt: new ObjectId(next),
    }
  }

  const pipeLine = [
    {
      $match: matchOptions,
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
        liked: {
          $in: ['$_id', likes.map((like) => like.postId)],
        },
      },
    },
    {
      $project: {
        _user: 0,
      },
    },
    {
      $sort: {
        _id: -1,
      },
    },
    {
      $limit: limit,
    },
  ]

  const res = await db.posts.aggregate(pipeLine).toArray()
  let hasNext = false
  if (res.length > 0) {
    matchOptions._id = {
      $lt: new ObjectId(res[res.length - 1]._id),
    }
    pipeLine[0].$match = matchOptions
    const more = await db.posts.aggregate(pipeLine).toArray()
    if (more.length > 0) hasNext = true
  }

  return {
    hasNext,
    list: res,
  }
}

/**
 * 获取当前登录用户首页信息流(关注者的帖子、包括他自己)
 * @param userId
 * @param next
 * @param limit
 * @returns
 */
export async function listFollingPosts(
  userId: ObjectId,
  next?: string,
  limit = 10
) {
  // 查询用户所有的喜欢的帖子
  const likes = await db.likes.find({ userId }).toArray()

  // 获取关注列表
  const followings = await followService.getFollow(
    userId.toString(),
    'following'
  )

  const matchOptions: { [key: string]: any } = {
    userId: {
      $in: [...followings.list.map((x) => x._id), userId],
    },
    type: {
      $in: [1, 3],
    },
    deleted: false,
  }
  if (next) {
    matchOptions._id = {
      $lt: new ObjectId(next),
    }
  }

  const pipeLine = [
    {
      $match: matchOptions,
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
        liked: {
          $in: ['$_id', likes.map((like) => like.postId)],
        },
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
        relationUid: '$_pposts.userId',
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: 'relationUid',
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
        'relationPost.account': '$_user2.account',
        'relationPost.avatar': '$_user2.avatar',
        'relationPost.nickname': '$_user2.nickname',
      },
    },
    {
      $project: {
        _user: 0,
        _pposts: 0,
        relationUid: 0,
        _user2: 0,
      },
    },
    {
      $sort: {
        _id: -1,
      },
    },
    {
      $limit: limit,
    },
  ]

  const res = await db.posts.aggregate(pipeLine).toArray()

  // 判断是否有更多
  let hasNext = false
  if (res.length > 0) {
    matchOptions._id = {
      $lt: new ObjectId(res[res.length - 1]._id),
    }
    pipeLine[0].$match = matchOptions
    const more = await db.posts.aggregate(pipeLine).toArray()
    if (more.length > 0) hasNext = true
  }

  return {
    hasNext,
    list: res,
  }
}

/**
 * 获取用户所有喜欢的帖子
 * @param _id
 */
export async function listLikedPosts(
  userId: ObjectId,
  _id: string,
  next?: string,
  limit = 10
) {
  // 查询用户所有的喜欢的帖子
  const likes = await db.likes.find({ userId }).toArray()

  const matchOptions: { [key: string]: any } = {
    uid: new ObjectId(_id),
    deleted: false,
  }
  if (next) {
    matchOptions._id = {
      $lt: new ObjectId(next),
    }
  }

  const pipeLine = [
    {
      $lookup: {
        from: 'likes',
        localField: '_id',
        foreignField: 'postId',
        as: '_likes',
      },
    },
    {
      $unwind: '$_likes',
    },
    {
      $addFields: {
        uid: '$_likes.userId',
      },
    },
    {
      $match: matchOptions,
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
        liked: {
          $in: ['$_id', likes.map((like) => like.postId)],
        },
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
        relationUid: '$_pposts.userId',
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: 'relationUid',
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
        'relationPost.account': '$_user2.account',
        'relationPost.avatar': '$_user2.avatar',
        'relationPost.nickname': '$_user2.nickname',
      },
    },
    {
      $project: {
        _likes: 0,
        uid: 0,
        _user: 0,
        _pposts: 0,
        _user2: 0,
        relationUid: 0,
      },
    },
    {
      $sort: {
        _id: -1,
      },
    },
    {
      $limit: limit,
    },
  ]

  // 查询用户所有的喜欢的帖子
  const res = await db.posts.aggregate(pipeLine).toArray()
  // 判断是否有更多
  let hasNext = false
  if (res.length > 0) {
    matchOptions._id = {
      $lt: new ObjectId(res[res.length - 1]._id),
    }
    pipeLine[3].$match = matchOptions
    const more = await db.posts.aggregate(pipeLine).toArray()
    if (more.length > 0) hasNext = true
  }

  return {
    hasNext,
    list: res,
  }
}

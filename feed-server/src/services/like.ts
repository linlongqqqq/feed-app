import { Filter, ObjectId } from 'mongodb'
import * as db from '../db'
import { ILike, IPostDetail } from '../models/types'
import * as postService from './post'
import * as noticeService from './notice'
import { stats } from '../libs/stats'

/**
 * 创建Like
 * @param userId
 * @param _id 帖子的_id
 * @returns
 */
export async function like(userId: ObjectId, _id: string) {
  const postId = new ObjectId(_id)

  // 判断帖子是否存在
  const post = await db.posts.findOne({ _id: postId })
  if (!post) throw stats.ErrorPostNotExist

  const like = await db.likes.findOne({ postId, userId })
  if (like === null) {
    await db.likes.insertOne({
      postId,
      userId,
      createdAt: Date.now(),
    })
    const post = await postService.detail(userId, _id)
    if (post) {
      await db.posts.findOneAndUpdate(
        { _id: post._id },
        {
          $set: {
            likes: post.likes + 1,
          },
        }
      )
    }
  }

  try {
    const receiver = await db.posts.findOne({
      _id: postId,
    })
    const receiverId = receiver?.userId
    // 发送通知
    noticeService.create(
      { receiverId: receiverId!.toString(), type: 4 },
      userId.toString()
    )
  } catch (error: any) {}
}

/**
 * 取消喜欢
 * @param userId
 * @param _id
 */
export async function dislike(userId: ObjectId, _id: string) {
  const postId = new ObjectId(_id)
  await db.likes.findOneAndDelete({ postId, userId })
  const post = await postService.detail(userId, _id)
  if (post) {
    await db.posts.findOneAndUpdate(
      { _id: post._id },
      {
        $set: {
          likes: post.likes - 1,
        },
      }
    )
  }
}

/**
 * 获取用户的喜欢列表
 * @param userId
 * @returns
 */
export async function getLikePosts(userId: string) {
  const match: Filter<ILike> = { userId: new ObjectId(userId) }
  const likes = await db.likes
    .aggregate([{ $match: match }, { $sort: { createdAt: -1 } }])
    .toArray()
  const likedPosts: IPostDetail[] = []
  await Promise.all(
    likes.map(async (obj) => {
      likedPosts.push(
        (await postService.detail(
          new ObjectId(userId),
          obj.postId.toString()
        )) as IPostDetail
      )
    })
  )
  return { likedPosts }
}

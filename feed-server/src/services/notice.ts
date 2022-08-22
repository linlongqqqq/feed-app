import { Filter, ObjectId } from 'mongodb'
import * as db from '../db'
import { stats } from '../libs/stats'
import { INotice } from '../models/types'
import * as sentNoticeService from './sendNotice'

/**
 * 创建通知 (传当前用户的_id)
 * @param record
 * @returns
 */

interface IProps {
  receiverId: string
  relationId?: string
  type: number
}
export async function create(msg: IProps, _id: string) {
  const record = {} as INotice
  record.senderId = new ObjectId(_id)
  record.createdAt = Date.now()
  record.isread = false
  record.type = msg.type
  msg.relationId
    ? (record.relationId = msg.relationId)
    : (record.relationId = '')
  record.receiverId = new ObjectId(msg.receiverId)
  const user = await db.users.findOne({
    _id: new ObjectId(_id),
  })
  if (!user) throw stats.ErrorUserNotFound
  if (msg.type === 1) {
    record.content = '关注了你'
  } else if (msg.type === 2) {
    record.content = '评论了你的帖子'
  } else if (msg.type === 3) {
    record.content = '转发了你的帖子'
  } else if (msg.type === 4) {
    record.content = '点赞了你'
  }
  record.sendUrl = user.avatar
  record.sendaccount = user.account
  record.sendName = user.nickname
  // websokit 向前端发送请求
  const message = {
    type: 'creatNotice',
    data: record,
  }
  sentNoticeService.sentNotice(record.receiverId.toString(), message)
  const result = await db.notices.insertOne(record)
  return result.insertedId
}

// 删除通知 (传notice的_id)
export async function remove(_id: string) {
  const id = new ObjectId(_id)
  await db.notices.deleteOne({
    _id: id,
  })
}

// 批量删除通知 (传当前用户的_id)
export async function removeAll(_id: string) {
  await db.notices.deleteMany({
    receiverId: new ObjectId(_id),
  })
}

// 标记已读 (传notice的_id)
export async function read(_id: string) {
  await db.notices.updateOne(
    {
      _id: new ObjectId(_id),
    },
    {
      $set: { isread: true },
    }
  )
}

// 全部标记已读 (传用户的_id)
export async function readAll(_id: string) {
  await db.notices.updateMany(
    {
      receiverId: new ObjectId(_id),
    },
    {
      $set: { isread: true },
    }
  )
}

// 查询通知列表 (传入接收者_id as userId)
export async function list(userId: ObjectId, skip = 0, limit = 10) {
  const match: Filter<INotice> = {
    receiverId: userId,
  }
  const notice = await db.notices
    .aggregate([
      {
        $match: match,
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $skip: skip,
      },
      {
        $limit: limit,
      },
    ])
    .toArray()
  const total = await db.notices.countDocuments(match)
  return { notice, total }
}

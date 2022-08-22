import { Filter, ObjectId, WithId } from 'mongodb'
import * as db from '../db'
import { stats } from '../libs/stats'
import { IMessage } from '../models/types'

/**
 * 发送私信
 * @param message
 * @param userId
 * @returns
 */
export async function create(
  message: Required<Pick<IMessage, 'content' | 'friendId' | 'type'>>,
  userId: string
) {
  const user = await db.users.findOne({ _id: new ObjectId(message.friendId) })
  if (!user) throw stats.ErrorUserNotFound
  const defaultInfo = {
    deleted: false,
    createdAt: Date.now(),
  }
  const res = await db.messages.insertOne({
    ...defaultInfo,
    ...message,
    userId: new ObjectId(userId),
    friendId: new ObjectId(message.friendId),
    senderId: new ObjectId(userId),
    receiverId: new ObjectId(message.friendId),
    isread: true,
  })
  // 对方收到的私信记录
  const resRev = await db.messages.insertOne({
    ...defaultInfo,
    ...message,
    userId: new ObjectId(message.friendId),
    friendId: new ObjectId(userId),
    senderId: new ObjectId(userId),
    receiverId: new ObjectId(message.friendId),
    isread: false,
  })
  if (res.acknowledged && resRev.acknowledged) {
    const newRes = await db.messages.findOne(res.insertedId)
    return { message: newRes, messageId: resRev.insertedId }
  }
  // 插入异常回滚
  if (res.acknowledged)
    await db.messages.findOneAndDelete({ _id: res.insertedId })
  if (resRev.acknowledged)
    await db.messages.findOneAndDelete({ _id: resRev.insertedId })
  throw stats.ErrorFailToSendMessage
}

/**
 * 私信信息
 * @param _id
 * @returns
 */
export async function detail(_id: string) {
  const res = await db.messages.findOne({ _id: new ObjectId(_id) })
  if (res) return res
  throw stats.ErrorMessageNotFound
}

/**
 * 单方面逻辑删除私信
 * @param _id
 * @returns
 */
export async function remove(_id: string) {
  const check = await db.messages.findOne({ _id: new ObjectId(_id) })
  if (check) {
    if (check.deleted) throw stats.ErrorMessageAlreadyDeleted
  } else throw stats.ErrorMessageNotFound
  const res = await db.messages.findOneAndUpdate(
    { _id: new ObjectId(_id) },
    { $set: { deleted: true } }
  )
  if (res.ok) return null
  throw stats.ErrorFailToDeleteMessage
}

/**
 * 单方面逻辑删除对话
 * @param userId
 * @param friendId
 * @returns
 */
export async function removeConversation(userId: string, friendId: string) {
  const match = {
    userId: new ObjectId(userId),
    friendId: new ObjectId(friendId),
    deleted: false,
  }
  const res = await db.messages.updateMany(match, { $set: { deleted: true } })
  if (!res.acknowledged) throw stats.ErrorFailToDeleteConversation
}

/**
 * 获取收到某用户私信的未读数 & 最新私信内容
 * @param userId
 * @param friendId
 * @returns
 */
export async function calcUnreadAndGetLatestWithUser(
  userId: string,
  friendId: string
) {
  const userCheck = await db.users.findOne({ _id: new ObjectId(friendId) })
  if (!userCheck) throw stats.ErrorUserNotFound
  const match: Filter<IMessage> = {
    userId: new ObjectId(userId),
    friendId: new ObjectId(friendId),
    senderId: new ObjectId(friendId),
    receiverId: new ObjectId(userId),
    deleted: false,
  }
  const unread = await db.messages.countDocuments({ ...match, isread: false })
  const latest = (
    await db.messages
      .find({
        userId: new ObjectId(userId),
        friendId: new ObjectId(friendId),
        deleted: false,
      })
      .sort({ createdAt: -1 })
      .toArray()
  )[0]
  const user = await db.users.findOne({ _id: new ObjectId(friendId) })
  if (!user) throw stats.ErrorUserNotFound
  return { unread, latest, user }
}

/**
 * 获取用户私信对话的发送者id列表
 * @param userId
 * @param skip
 * @param limit
 * @returns
 */
export async function getConversations(userId: string, skip = 0, limit = 10) {
  const match: Filter<IMessage> = {
    userId: new ObjectId(userId),
    deleted: false,
  }
  const senderIds = await db.messages
    .aggregate([
      { $match: match },
      { $group: { _id: '$friendId' } },
      { $skip: skip },
      { $limit: limit },
    ])
    .toArray()
  const count = await db.messages
    .aggregate([
      { $match: match },
      { $group: { _id: '$friendId' } },
      { $count: 'total' },
    ])
    .toArray()
  let total
  if (count.length) {
    total = count[0].total
  } else total = 0
  return { senderIds, total }
}

/**
 * 获取对话私信详情，并将未读值为已读
 * @param userId
 * @param friendId
 * @param prev
 * @param limit
 * @returns
 */
export async function getMessages(
  userId: string,
  friendId: string,
  prev = 'first',
  limit = 10
) {
  const user = await db.users.findOne({ _id: new ObjectId(friendId) })
  if (!user) throw stats.ErrorUserNotFound
  const match: Filter<IMessage> = {
    userId: new ObjectId(userId),
    friendId: new ObjectId(friendId),
    deleted: false,
  }
  let messages: WithId<IMessage>[] = []
  let hasPrev = false
  if (prev !== 'first') {
    // 查询上一页
    messages = await db.messages
      .find({
        _id: {
          $lt: new ObjectId(prev),
        },
        ...match,
      })
      .sort({ _id: -1 })
      .limit(limit)
      .toArray()
    messages.reverse()
  } else {
    // 查询第一页
    messages = await db.messages
      .find(match)
      .sort({ _id: -1 })
      .limit(limit)
      .toArray()
    messages.reverse()
  }
  if (messages.length > 0) {
    // 是否还有上一页
    const prev = await db.messages.findOne(
      {
        _id: {
          $lt: new ObjectId(messages[0]._id),
        },
      },
      {
        sort: {
          _id: -1,
        },
      }
    )
    if (prev) hasPrev = true
  }
  // 查找第一条未读私信id
  match['isread'] = false
  const unread = await db.messages
    .aggregate([{ $match: match }, { $sort: { createdAt: 1 } }])
    .toArray()
  let unreadId
  if (unread.length) {
    unreadId = unread[0]._id
  } else {
    unreadId = ''
  }
  //未读置为已读
  db.messages.updateMany(match, [{ $set: { isread: true } }])
  return { messages, hasPrev, unreadId }
}

/**
 * 标记对话已读
 * @param userId
 * @param friendId
 * @returns
 */
export async function setConversationRead(userId: string, friendId: string) {
  const user = await db.users.findOne({ _id: new ObjectId(friendId) })
  if (!user) throw stats.ErrorUserNotFound
  const match: Filter<IMessage> = {
    userId: new ObjectId(userId),
    friendId: new ObjectId(friendId),
    deleted: false,
    isread: false,
  }
  //未读置为已读
  const res = await db.messages.updateMany(match, [{ $set: { isread: true } }])
  if (!res.acknowledged) throw stats.ErrorFailToSetRead
}

/**
 * 计算未读
 * @param userId
 * @returns
 */
export async function countUnread(userId: string) {
  const userCheck = await db.users.findOne({ _id: new ObjectId(userId) })
  if (!userCheck) throw stats.ErrorUserNotFound
  const match: Filter<IMessage> = {
    userId: new ObjectId(userId),
    receiverId: new ObjectId(userId),
    deleted: false,
    isread: false,
  }
  const unread = await db.messages.countDocuments(match)
  return unread
}

/**
 * 单条置为已读
 * @param userId
 * @param messageId
 */
export async function setRead(userId: ObjectId, messageId: string) {
  const match = { _id: new ObjectId(messageId) }
  const message = await db.messages.findOne(match)
  if (!message) throw stats.ErrorMessageNotFound
  // 权限判断
  if (message.userId.toString() !== userId.toString())
    throw stats.ErrorMessageUnauthorized
  //未读置为已读
  const res = await db.messages.updateOne(match, [{ $set: { isread: true } }])
  if (!res.acknowledged) stats.ErrorFailToSetRead
}

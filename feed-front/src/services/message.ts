import { ApiResp, IMessage, IUser, MessageType } from '../libs/models'
import request from '../libs/request'

/**
 * 发送私信
 * @param content
 * @param friendId
 * @param type
 * @returns
 */
export async function create(
  content: string,
  friendId: string,
  type: MessageType
) {
  const res = await request.post<
    ApiResp<{ message: IMessage; messageId: string }>
  >('/message/create', { content, friendId, type })
  return res.data
}

/**
 * 删除私信
 * @param _id
 * @returns
 */
export async function remove(_id: string) {
  const res = await request.post<ApiResp<null>>('/message/delete', { _id })
  return res.data
}

/**
 * 获取用户私信对话的未读数 & 最新私信内容列表
 * @param skip
 * @param limit
 * @returns
 */
export async function getConversations(skip = 0, limit = 10) {
  const res = await request.get<
    ApiResp<{
      conversations: { unread: number; latest: IMessage; user: IUser }[]
      total: number
    }>
  >(`/message/getConversations/${skip}/${limit}`)
  return res.data
}

/**
 * 获取对话私信详情
 * @param friendId
 * @param prev
 * @param limit
 * @returns
 */
export async function getMessages(
  friendId: string,
  prev = 'first',
  limit = 10
) {
  const res = await request.get<
    ApiResp<{ messages: IMessage[]; hasPrev: boolean; unreadId: string }>
  >(`/message/getMessages/${friendId}/${limit}/${prev}`)
  return res.data
}

/**
 * 单方面逻辑删除对话
 * @param friendId
 * @returns
 */
export async function deleteConversation(friendId: string) {
  const res = await request.post<ApiResp<null>>('/message/deleteConversation', {
    friendId,
  })
  return res.data
}

/**
 * 对话置为已读
 * @param friendId
 * @returns
 */
export async function setConversationRead(friendId: string) {
  const res = await request.post<ApiResp<null>>(
    '/message/setConversationRead',
    {
      friendId,
    }
  )
  return res.data
}

/**
 * 一键已读
 * @returns
 */
export async function setAllRead() {
  const res = await request.post<ApiResp<null>>('/message/setAllRead')
  return res.data
}

/**
 * 获取单条私信详情
 * @param messageId
 * @returns
 */
export async function detail(messageId: string) {
  const res = await request.get<ApiResp<{ message: IMessage }>>(
    `/message/detail/${messageId}`
  )
  return res.data
}

/**
 * 获取单条对话详情
 * @param friendId
 * @returns
 */
export async function conversationDetail(friendId: string) {
  const res = await request.get<
    ApiResp<{ unread: number; latest: IMessage; user: IUser }>
  >(`/message/conversationDetail/${friendId}`)
  return res.data
}

/**
 * 计算未读总数
 * @returns
 */
export async function countUnread() {
  const res = await request.get<ApiResp<{ unread: number }>>(
    `/message/countUnread`
  )
  return res.data
}

/**
 * 单条私信置为已读
 * @param messageId
 * @returns
 */
export async function setRead(messageId: string) {
  const res = await request.post<ApiResp<null>>('/message/setRead', {
    messageId,
  })
  return res.data
}

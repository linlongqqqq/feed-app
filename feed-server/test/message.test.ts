import { friendId, openid, _id } from './configData'
import request from './request'

let headers: Record<string, string> = {}

interface ApiResp<T = any> {
  code: number
  message: string
  data: T
}

interface IUser {
  _id: string
  status: number
  openid: string
  account: string
  nickname: string
  createdAt: number
  bio: string
  avatar: string
  banner: string
  sex: number
}

interface IMessage {
  _id: string
  content: string
  userId: string
  friendId: string
  senderId: string
  receiverId: string
  isread: boolean
  type: number
  deleted: boolean
  createdAt: number
}

/* 测试前获取cookie */
beforeAll(async () => {
  // 获取最新的cookie
  const { headers: tHeaders } = await request.post('/test/cookie', { openid })
  headers.cookie = tHeaders['set-cookie']!.reduce((pre, cur) => {
    return pre + cur.split(';')[0] + ';'
  })
})

/* 测试后删除cookie及测试数据 */
afterAll(async () => {
  // 删除cookie
  await request.delete('/test/cookie', { headers })
})

describe('私信模块', () => {
  let messageId: string
  let ownedMessageId: string
  test('发送私信', async () => {
    const { data } = await request.post<
      ApiResp<{ message: IMessage; messageId: string }>
    >(
      '/message/create',
      { content: 'teeeeeest', friendId, type: 1 },
      { headers }
    )
    expect(data.code).toBe(0)
    expect(data.data.message.content).toBe('teeeeeest')
    expect(data.data.message.friendId).toBe(friendId)
    expect(data.data.message.type).toBe(1)
    expect(data.data.messageId).toBeDefined()
    messageId = data.data.messageId
    ownedMessageId = data.data.message._id
  })

  test('获取单条私信详情', async () => {
    const { data } = await request.get<ApiResp<{ message: IMessage }>>(
      `/message/detail/${messageId}`,
      { headers }
    )
    expect(data.code).toBe(0)
    expect(data.data.message.content).toBe('teeeeeest')
    expect(data.data.message.friendId).toBe(_id)
    expect(data.data.message.type).toBe(1)
  })

  test('获取单条对话详情', async () => {
    const { data } = await request.get<
      ApiResp<{ unread: number; latest: IMessage; user: IUser }>
    >(`/message/conversationDetail/${friendId}`, { headers })
    expect(data.code).toBe(0)
    expect(data.data.unread).toBeGreaterThanOrEqual(0)
    expect(data.data.latest.content).toBe('teeeeeest')
    expect(data.data.user._id).toBe(friendId)
  })

  test('获取用户私信对话的未读数 & 最新私信内容列表', async () => {
    const { data } = await request.get<
      ApiResp<{
        conversations: { unread: number; latest: IMessage; user: IUser }[]
        total: number
      }>
    >(`/message/getConversations/0/10`, { headers })
    expect(data.code).toBe(0)
    expect(data.data.total).toBeGreaterThanOrEqual(0)
  })

  test('计算未读总数', async () => {
    const { data } = await request.get<ApiResp<{ unread: number }>>(
      `/message/countUnread`,
      { headers }
    )
    expect(data.code).toBe(0)
    expect(data.data.unread).toBeGreaterThanOrEqual(0)
  })

  test('单条置为已读', async () => {
    const { data } = await request.post<ApiResp<null>>(
      '/message/setRead',
      { messageId: ownedMessageId },
      { headers }
    )
    expect(data.code).toBe(0)
    expect(data.data).toBeNull()
    // 无权限已读不属于自己的私信
    const { data: unauthorizedData } = await request.post<ApiResp<null>>(
      '/message/setRead',
      { messageId },
      { headers }
    )
    expect(unauthorizedData.code).toBe(50004)
    expect(unauthorizedData.message).toBe('无权限操作私信')
  })

  test('获取对话私信详情', async () => {
    const { data } = await request.get<
      ApiResp<{ messages: IMessage[]; hasPrev: boolean; unreadId: string }>
    >(`/message/getMessages/${friendId}/10/first`, { headers })
    expect(data.code).toBe(0)
    expect(data.data.messages.length).toBeGreaterThanOrEqual(0)
    expect(typeof data.data.hasPrev === 'boolean').toBeTruthy()
  })

  test('对话置为已读', async () => {
    const { data } = await request.post<ApiResp<null>>(
      '/message/setConversationRead',
      { friendId },
      { headers }
    )
    expect(data.code).toBe(0)
    expect(data.data).toBeNull()
  })

  test('一键已读', async () => {
    const { data } = await request.post<ApiResp<null>>(
      '/message/setAllRead',
      null,
      {
        headers,
      }
    )
    expect(data.code).toBe(0)
    expect(data.data).toBeNull()
  })

  test('删除私信', async () => {
    const { data } = await request.post<ApiResp<null>>(
      '/message/delete',
      { _id: ownedMessageId },
      { headers }
    )
    expect(data.code).toBe(0)
    expect(data.data).toBeNull()

    // 无权限删除不属于自己的私信
    const { data: unauthorizedData } = await request.post<ApiResp<null>>(
      '/message/delete',
      { _id: messageId },
      { headers }
    )
    expect(unauthorizedData.code).toBe(50004)
    expect(unauthorizedData.message).toBe('无权限操作私信')
  })

  test('单方面逻辑删除对话', async () => {
    const { data } = await request.post<ApiResp<null>>(
      '/message/deleteConversation',
      { friendId },
      { headers }
    )
    expect(data.code).toBe(0)
    expect(data.data).toBeNull()
  })
})

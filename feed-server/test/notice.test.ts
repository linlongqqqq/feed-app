import request from './request'
import { openid, _id, postid } from './configData'

let headers: Record<string, string> = {}

// 所有测试之前、先得到cookie
beforeAll(async () => {
  // 获取最新的cookie
  const { headers: tHeaders } = await request.post('/test/cookie', { openid })
  headers.cookie = tHeaders['set-cookie']!.reduce((pre, cur) => {
    return pre + cur.split(';')[0] + ';'
  })
})

// 测试之后删除cookie
afterAll(async () => {
  await request.delete('/test/cookie', { headers })
})

describe('通知模块', () => {
  let createId1 = ''
  let createId2 = ''

  test('创建关注通知', async () => {
    const { data } = await request.post(
      '/notice/create',
      {
        receiverId: _id,
        type: 1,
      },
      { headers }
    )
    expect(data.code).toBe(0)
    expect(data.data._id.length).toBeGreaterThanOrEqual(0)
    createId1 = data.data._id
  })

  test('创建回复帖子通知', async () => {
    const { data } = await request.post(
      '/notice/create',
      {
        receiverId: _id,
        relationId: postid,
        type: 2,
      },
      { headers }
    )
    createId2 = data.data._id
    expect(data.code).toBe(0)
    expect(data.data._id.length).toBeGreaterThanOrEqual(0)
  })

  test('删除通知', async () => {
    const { data } = await request.post(
      '/notice/remove',
      {
        _id: createId1,
      },
      { headers }
    )
    expect(data.code).toBe(0)
  })

  test('批量删除通知', async () => {
    const { data } = await request.get('/notice/removeAll', { headers })
    expect(data.code).toBe(0)
  })

  test('标记已读', async () => {
    const { data } = await request.post(
      '/notice/read',
      {
        _id: createId2,
      },
      { headers }
    )

    expect(data.code).toBe(0)
  })

  test('全部标记已读', async () => {
    const { data } = await request.get('/notice/readAll', { headers })
    expect(data.code).toBe(0)
  })

  test('获取通知列表', async () => {
    const { data } = await request.get('/notice/lists', { headers })

    expect(data.code).toBe(0)
    expect(data.data.notice.length).toBeGreaterThanOrEqual(0)
  })
})

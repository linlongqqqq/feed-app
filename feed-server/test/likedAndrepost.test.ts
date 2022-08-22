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

describe('被喜欢被转推模块', () => {
  const params = {
    postId: postid,
  }
  test('被喜欢', async () => {
    const { data } = await request.get('/likedlist/lists', {
      params,
      headers,
    })
    expect(data.code).toBe(0)
    expect(data.data.total).toBeGreaterThanOrEqual(0)
  })

  test('被转推', async () => {
    const { data } = await request.get('/likedlist/repost', { params, headers })
    expect(data.code).toBe(0)
    expect(data.data.total).toBeGreaterThanOrEqual(0)
  })
})

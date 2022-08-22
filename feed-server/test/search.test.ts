import request from './request'
import { openid, _id, search_message } from './configData'

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

describe('查找模块', () => {
  const params = {
    message: search_message,
  }
  test('查找用户', async () => {
    const { data } = await request.get('/search/user', {
      params,
      headers,
    })
    expect(data.code).toBe(0)
    expect(data.data.total).toBeGreaterThanOrEqual(0)
  })

  test('查找帖子', async () => {
    const { data } = await request.get('/search/post', { params, headers })
    expect(data.code).toBe(0)
    expect(data.data.post.length).toBeGreaterThanOrEqual(0)
  })

  test('查找带图片的帖子', async () => {
    const { data } = await request.get('/search/postPhoto', {
      params,
      headers,
    })
    expect(data.code).toBe(0)
    expect(data.data.post.length).toBeGreaterThanOrEqual(0)
    if (data.data.post.length !== 0) {
      expect(data.data.post.imgs.length).toBeGreaterThanOrEqual(0)
    }
  })
})

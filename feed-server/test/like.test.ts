import request from './request'
import { openid } from './configData'

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

describe('喜欢帖子模块', () => {
  test('喜欢帖子、取消喜欢帖子', async () => {
    // 创建一个帖子
    const data = {
      content: 'hello',
      type: 1,
      imgs: [],
    }
    const { data: resPost } = await request.post('/post/create', data, {
      headers,
    })
    expect(resPost.code).toBe(0)

    const postId = resPost.data.post._id

    // 喜欢帖子
    const { data: resLikePost } = await request.post(
      '/like/create',
      { postId },
      { headers }
    )
    expect(resLikePost.code).toBe(0)

    // 关联帖子的喜欢数+1、liked变为true
    const { data: afterLikedPost } = await request.get(
      `/post/detail?_id=${postId}`,
      { headers }
    )
    expect(afterLikedPost.data.liked).toBe(true)
    expect(afterLikedPost.data.likes).toBe(resPost.data.post.likes + 1)

    // 取消喜欢帖子
    const { data: resDisLikePost } = await request.post(
      '/like/delete',
      {
        postId,
      },
      { headers }
    )
    expect(resDisLikePost.code).toBe(0)

    // 关联帖子的喜欢数-1、liked变为false
    const { data: afterDisLikedPost } = await request.get(
      `/post/detail?_id=${postId}`,
      { headers }
    )
    expect(afterDisLikedPost.data.liked).toBe(false)
    expect(afterDisLikedPost.data.likes).toBe(afterLikedPost.data.likes - 1)
    // 和最初的喜欢数一样
    expect(afterDisLikedPost.data.likes).toBe(resPost.data.post.likes)

    // 删除帖子
    const { data: resDelPost } = await request.post(
      '/post/delete',
      {
        _id: resPost.data.post._id,
      },
      { headers }
    )
    expect(resDelPost.code).toBe(0)
  })

  test('喜欢的帖子不存在', async () => {
    const { data } = await request.post<{ code: number; message: string }>(
      '/like/create',
      { postId: '62ebe9f229bd98a4185228ea' },
      { headers }
    )
    expect(data.code).toBe(30003)
    expect(data.message).toBe('帖子不存在')
  })

  // 参数不合法参考file.test.ts， 返回的status均为405
})

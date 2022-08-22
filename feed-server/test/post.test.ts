import request from './request'
import { openid, _id } from './configData'

let headers: Record<string, string> = {}

// 帖子、评论、转发的_id、用于之后删除
let postId: string
let commentId: string
let repostId: string

// 所有测试之前、先得到cookie
beforeAll(async () => {
  // 获取最新的cookie
  const { headers: tHeaders } = await request.post('/test/cookie', { openid })
  headers.cookie = tHeaders['set-cookie']!.reduce((pre, cur) => {
    return pre + cur.split(';')[0] + ';'
  })
})

// 测试之后删除cookie、删除帖子、评论、转发
afterAll(async () => {
  // 获取帖子详情
  const { data: resPost } = await request.get<{
    code: number
    data: IPostItem
  }>(`/post/detail?_id=${postId}`, { headers })
  expect(resPost.code).toBe(0)

  // 删除评论
  const { data: res2 } = await request.post<{ code: number }>(
    '/post/delete',
    { _id: commentId },
    { headers }
  )
  expect(res2.code).toBe(0)

  // 关联帖子的评论数减一
  const { data: resPostAfterDelComment } = await request.get<{
    code: number
    data: IPostItem
  }>(`/post/detail?_id=${postId}`, { headers })
  expect(resPostAfterDelComment.data.comments).toBe(resPost.data.comments - 1)

  // 删除转发
  const { data: res3 } = await request.post<{ code: number }>(
    '/post/delete',
    { _id: repostId },
    { headers }
  )
  expect(res3.code).toBe(0)

  // 关联帖子的转发数减一
  const { data: resPostAfterDelRepost } = await request.get<{
    code: number
    data: IPostItem
  }>(`/post/detail?_id=${postId}`, { headers })
  expect(resPostAfterDelRepost.data.reposts).toBe(resPost.data.reposts - 1)

  // 删除帖子
  const { data: res1 } = await request.post<{ code: number }>(
    '/post/delete',
    { _id: postId },
    { headers }
  )
  expect(res1.code).toBe(0)

  // 删除cookie
  await request.delete('/test/cookie', { headers })
})

type createPostDto = {
  content: string
  type: 1 | 2 | 3
  imgs: string[]
  relationId?: string
}

type IPost = {
  _id: string
  content: string
  type: 1 | 2 | 3
  imgs: string[]
  relationId?: string
  comments: number
  reposts: number
  likes: number
  deleted: boolean
  createdAt: number
  userId: string
}

type IPostDetail = IPost & {
  account: string
  avatar: string
  nickname: string
  liked: false
}

type IPostItem = IPostDetail & {
  relationPost?: IPostDetail
}

type listPostDto = {
  _id?: string
  next?: string
  limit?: number
  onlyImgs?: boolean
}

describe('帖子模块', () => {
  test('创建帖子、评论、转发、获取帖子详情', async () => {
    // 创建帖子
    const postDto: createPostDto = {
      content: 'hello',
      type: 1,
      imgs: [],
    }
    const { data: resPost } = await request.post<{
      code: number
      data: { post: IPostItem }
    }>('/post/create', postDto, { headers })
    const {
      comments: initComments,
      likes: initLikes,
      reposts: initReposts,
    } = resPost.data.post
    expect(resPost.code).toBe(0)
    expect(initComments).toBe(0)
    expect(initLikes).toBe(0)
    expect(initReposts).toBe(0)
    postId = resPost.data.post._id

    const relationId = resPost.data.post._id

    // 创建评论
    const commentDto: createPostDto = {
      content: '评论',
      type: 2,
      imgs: [],
      relationId,
    }
    const { data: resComment } = await request.post<{
      code: number
      data: { post: IPostItem }
    }>('/post/create', commentDto, { headers })
    expect(resComment.code).toBe(0)
    expect(resComment.data.post.relationId).toBe(relationId)
    commentId = resComment.data.post._id

    // 获取帖子详情、关联帖子的评论数加一
    const { data: resPostAfterComment } = await request.get<{
      code: number
      data: IPostItem
    }>(`/post/detail?_id=${resPost.data.post._id}`, { headers })
    expect(resPostAfterComment.data.comments).toBe(
      resPost.data.post.comments + 1
    )

    // 创建转发
    const repostDto: createPostDto = {
      content: '转发',
      type: 3,
      imgs: [],
      relationId,
    }
    const { data: resRepost } = await request.post<{
      code: number
      data: { post: IPostItem }
    }>('/post/create', repostDto, { headers })
    expect(resRepost.code).toBe(0)
    expect(resRepost.data.post.relationId).toBe(relationId)
    repostId = resRepost.data.post._id

    // 关联帖子的转发数加一
    const { data: resPostAfterRepost } = await request.get<{
      code: number
      data: IPostItem
    }>(`/post/detail?_id=${resPost.data.post._id}`, { headers })
    expect(resPostAfterRepost.data.reposts).toBe(resPost.data.post.reposts + 1)
  })

  // 传_id获取该用户的帖子
  test('获取某用户全部的帖子', async () => {
    const limit = 10
    let next: string | undefined = undefined
    let onlyImgs = false
    let hasNext = false
    const params: listPostDto = {
      _id,
      next,
      limit,
      onlyImgs,
    }
    let res = await request.get<{
      code: number
      data: {
        hasNext: boolean
        list: IPostItem[]
      }
    }>('/post/list', {
      params,
      headers,
    })
    expect(res.data.code).toBe(0)
    expect(res.data.data.list.length).toBeGreaterThanOrEqual(0)
    hasNext = res.data.data.hasNext
    // 加载更多
    // while (hasNext) {
    //   params.next = res.data.data.list[res.data.data.list.length - 1]._id
    //   res = await request.get<{
    //     code: number
    //     data: {
    //       hasNext: boolean
    //       list: IPostItem[]
    //     }
    //   }>('/post/list', {
    //     params,
    //     headers,
    //   })
    //   hasNext = res.data.data.hasNext
    //   expect(res.data.code).toBe(0)
    //   expect(res.data.data.list.length).toBeGreaterThanOrEqual(0)
    // }
  })

  // 不传_id获取首页的帖子
  test('获取首页信息流', async () => {
    const limit = 10
    let next: string | undefined = undefined
    let onlyImgs = false
    let hasNext = false
    const params: listPostDto = {
      next,
      limit,
      onlyImgs,
    }
    let res = await request.get<{
      code: number
      data: {
        hasNext: boolean
        list: IPostItem[]
      }
    }>('/post/list', {
      params,
      headers,
    })
    expect(res.data.code).toBe(0)
    expect(res.data.data.list.length).toBeGreaterThanOrEqual(0)
    // 加载更多，同上
  })

  test('获取某个帖子下的全部评论', async () => {
    const limit = 10
    let next: string | undefined = undefined
    let hasNext = false
    const params: listPostDto = {
      _id,
      next,
      limit,
    }
    let res = await request.get<{
      code: number
      data: {
        hasNext: boolean
        list: IPostItem[]
      }
    }>('/post/comments', {
      params,
      headers,
    })
    expect(res.data.code).toBe(0)
    expect(res.data.data.list.length).toBeGreaterThanOrEqual(0)
    // 加载更多...同上
  })

  test('获取用户全部喜欢的帖子', async () => {
    const limit = 10
    let next: string | undefined = undefined
    let hasNext = false
    const params: listPostDto = {
      _id,
      next,
      limit,
    }
    let res = await request.get<{
      code: number
      data: {
        hasNext: boolean
        list: IPostItem[]
      }
    }>('/post/likes', {
      params,
      headers,
    })
    expect(res.data.code).toBe(0)
    expect(res.data.data.list.length).toBeGreaterThanOrEqual(0)
    for (let item of res.data.data.list) {
      expect(item.liked).toBe(true)
    }
    // 加载更多...同上
  })

  test('获取用户全部带照片的帖子', async () => {
    const limit = 10
    let next: string | undefined = undefined
    const onlyImgs = true
    let hasNext = false
    const params: listPostDto = {
      _id,
      next,
      limit,
      onlyImgs,
    }
    let res = await request.get<{
      code: number
      data: {
        hasNext: boolean
        list: IPostItem[]
      }
    }>('/post/list', {
      params,
      headers,
    })
    expect(res.data.code).toBe(0)
    expect(res.data.data.list.length).toBeGreaterThanOrEqual(0)
    for (let item of res.data.data.list) {
      expect(item.imgs.length).toBeGreaterThan(0)
    }
    // 加载更多...同上
  })

  test('帖子不存在', async () => {
    const nonePostId = '92f05408bf17d336907fee68'
    const { data } = await request.get<{
      code: number
      data: IPostItem
    }>(`/post/detail?_id=${nonePostId}`, { headers })
    expect(data.data).toBeNull()
  })

  test('删除帖子不合法', async () => {
    const noneId = '92f05408bf17d336907fee68'
    const { data } = await request.post<{ code: number; message: string }>(
      '/post/delete',
      { _id: noneId },
      { headers }
    )
    expect(data.code).toBe(30002)
    expect(data.message).toBe('非法删除帖子')
  })

  // 参数不合法参考file.test.ts， 返回的status均为405
})

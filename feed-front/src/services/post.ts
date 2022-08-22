import { ApiResp, ICreatePostDto, IPostItem } from '../libs/models'
import request from '../libs/request'
import { IPostDetail } from '../libs/models'

// 发布帖子
export async function create(createPostDto: ICreatePostDto) {
  const res = await request.post('/post/create', createPostDto)
  return res.data
}

// 删除帖子
export async function deletePost(_id: string) {
  const res = await request.post('/post/delete', { _id })
  return res.data
}

// 获取帖子详情
export async function detail(_id: string) {
  const res = await request.get<ApiResp<IPostDetail>>(`/post/detail?_id=${_id}`)
  return res.data
}

// 喜欢帖子
export async function like(postId: string) {
  const res = await request.post('/like/create', { postId })
  return res.data
}

// 取消喜欢帖子
export async function dislike(postId: string) {
  const res = await request.post('/like/delete', { postId })
  return res.data
}

type ResList = ApiResp<{
  hasNext: boolean
  list: IPostItem[]
}>

/**
 * 获取全部评论
 * @param _id
 * @param next
 * @param limit
 * @returns
 */
export async function comments(_id: string, next?: string, limit = 10) {
  const params: { [key: string]: any } = { limit, _id }
  if (next) params.next = next
  const res = await request.get<ResList>('/post/comments', { params })
  return res.data
}

/**
 * 获取首页信息流 _id=undefined
 * 获取某用户全部的帖子 _id
 * @returns
 */
export async function list(
  _id?: string,
  next?: string,
  limit = 10,
  onlyImgs = false
) {
  const params: { [key: string]: any } = { limit, onlyImgs }
  if (_id !== undefined) params._id = _id
  if (next) params.next = next
  const { data } = await request.get<ResList>('/post/list', { params })
  return data
}

/**
 * 获取用户全部喜欢的帖子
 * @param _id
 * @returns
 */
export async function postLikes(_id: string, next?: string, limit = 10) {
  const params: { [key: string]: any } = { limit, _id }
  if (next) params.next = next
  const res = await request.get('/post/likes', { params })
  return res.data
}

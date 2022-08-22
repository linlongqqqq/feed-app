import Joi from 'joi'
import Router from 'koa-router'
import { JsonResp } from '../libs/stats'
import validate from '../libs/validate'
import * as postService from '../services/post'

const router = new Router({
  prefix: `${process.env.URL_PREFIX}/post`,
})

// 创建帖子、回复、转发
router.post('/create', async (ctx) => {
  const postDto = validate(
    ctx.request.body,
    Joi.object({
      content: Joi.string().default('').max(280),
      type: Joi.number().required(),
      imgs: Joi.array().max(4),
      relationId: Joi.string().hex().length(24),
    })
  )
  const _id = await postService.create(ctx.state.user._id, postDto)
  const post = await postService.detail(ctx.state.user._id, _id.toString())
  ctx.body = new JsonResp({ post })
})

// 删除帖子、回复、转发
router.post('/delete', async (ctx) => {
  const { _id } = validate(
    ctx.request.body,
    Joi.object({
      _id: Joi.string().hex().length(24).required(),
    })
  )
  await postService.deletePost(ctx.state.user._id, _id)
  ctx.body = new JsonResp()
})

// 获取帖子详情
router.get('/detail', async (ctx) => {
  const { _id } = validate(
    ctx.query,
    Joi.object({
      _id: Joi.string().hex().length(24).required(),
    })
  )
  const detail = await postService.detail(ctx.state.user._id, _id)
  ctx.body = new JsonResp(detail)
})

// 获取某用户的所有的帖子
// 如果不传，则返回首页信息流的部分
// onlyImgs: true, 仅获取某用户带照片的帖子
router.get('/list', async (ctx) => {
  const { _id, next, limit, onlyImgs } = validate(
    ctx.query,
    Joi.object({
      _id: Joi.string().hex().length(24),
      next: Joi.string().hex().length(24),
      limit: Joi.number().integer().min(5).max(20).default(10),
      onlyImgs: Joi.boolean().default(false),
    })
  )
  const resObj =
    _id === undefined
      ? await postService.listFollingPosts(ctx.state.user._id, next, limit)
      : await postService.list(ctx.state.user._id, _id, next, onlyImgs, limit)
  ctx.body = new JsonResp(resObj)
})

// 获取某个帖子的全部评论
router.get('/comments', async (ctx) => {
  const { _id, next, limit } = validate(
    ctx.query,
    Joi.object({
      _id: Joi.string().hex().length(24).required(),
      next: Joi.string().hex().length(24),
      limit: Joi.number().integer().min(5).max(20).default(10),
    })
  )
  const resObj = await postService.comments(
    ctx.state.user._id,
    _id,
    next,
    limit
  )
  ctx.body = new JsonResp(resObj)
})

// 获取用户全部喜欢的帖子
router.get('/likes', async (ctx) => {
  const { _id, next, limit } = validate(
    ctx.query,
    Joi.object({
      _id: Joi.string().hex().length(24).required(),
      next: Joi.string().hex().length(24),
      limit: Joi.number().integer().min(5).max(20).default(10),
    })
  )
  const resObj = await postService.listLikedPosts(
    ctx.state.user._id,
    _id,
    next,
    limit
  )
  ctx.body = new JsonResp(resObj)
})

export default router.routes()

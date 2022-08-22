import Joi from 'joi'
import Router from 'koa-router'
import { JsonResp } from '../libs/stats'
import validate from '../libs/validate'
import * as likeService from '../services/like'

const router = new Router({
  prefix: `${process.env.URL_PREFIX}/like`,
})

// 喜欢帖子
router.post('/create', async (ctx) => {
  const { postId } = validate(
    ctx.request.body,
    Joi.object({
      postId: Joi.string().hex().length(24).required(),
    })
  )
  await likeService.like(ctx.state.user._id, postId)
  ctx.body = new JsonResp()
})

// 取消喜欢帖子
router.post('/delete', async (ctx) => {
  const { postId } = validate(
    ctx.request.body,
    Joi.object({
      postId: Joi.string().hex().length(24).required(),
    })
  )
  await likeService.dislike(ctx.state.user._id, postId)
  ctx.body = new JsonResp()
})

/* 获取喜欢帖子列表 */
router.get('/list/:userId', async (ctx) => {
  const value = validate(
    ctx.params,
    Joi.object({
      userId: Joi.string().hex().length(24).required(),
    })
  )
  const res = await likeService.getLikePosts(value.userId)
  ctx.body = new JsonResp(res)
})

export default router.routes()

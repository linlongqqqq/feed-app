import Joi from 'joi'
import Router from 'koa-router'
import { JsonResp } from '../libs/stats'
import validate from '../libs/validate'
import * as likedListService from '../services/likedAndRepostList'
import { checkFollow } from './follow'

const router = new Router({
  prefix: `${process.env.URL_PREFIX}/likedlist`,
})

router.get('/lists', async (ctx) => {
  const { postId, next, limit } = validate(
    ctx.query,
    Joi.object({
      postId: Joi.string().length(24).required(),
      next: Joi.string().length(24),
      limit: Joi.number().integer().min(1).max(20).default(10),
    })
  )
  const result = await likedListService.list(postId, next, limit)
  const userResult: {
    userInfo: Object
    followStatus: { isFollowing: boolean; isFollowed: boolean }
  }[] = []

  await Promise.all(
    result!.liked.map(async (obj) => {
      userResult.push({
        userInfo: obj,
        followStatus: await checkFollow(obj._id, ctx.state.user._id),
      })
    })
  )

  ctx.body = new JsonResp({ userResult, total: result?.total })
})

router.get('/repost', async (ctx) => {
  const { postId, skip, limit } = validate(
    ctx.query,
    Joi.object({
      postId: Joi.string().length(24).required(),
      skip: Joi.number().integer().min(0).default(0),
      limit: Joi.number().integer().min(1).max(20).default(10),
    })
  )
  const result = await likedListService.repost(postId, skip, limit)
  const userResult: {
    userInfo: Object
    followStatus: { isFollowing: boolean; isFollowed: boolean }
  }[] = []

  await Promise.all(
    result!.liked.map(async (obj) => {
      userResult.push({
        userInfo: obj,
        followStatus: await checkFollow(obj._id, ctx.state.user._id),
      })
    })
  )

  ctx.body = new JsonResp({ userResult, total: result?.total })
})

export default router.routes()

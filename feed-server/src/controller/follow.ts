import Joi from 'joi'
import Router from 'koa-router'
import { JsonResp } from '../libs/stats'
import validate from '../libs/validate'
import * as followService from '../services/follow'

const router = new Router({
  prefix: `${process.env.URL_PREFIX}/follow`,
})

const followSchema = Joi.object({
  followingId: Joi.string()
    .hex()
    .length(24)
    .required()
    .messages({ 'any.required': 'followingId字段缺失' }),
})

/**
 * 根据关注状态关注/取关
 */
router.post('/toggleFollow', async (ctx) => {
  const value = validate(ctx.request.body, followSchema)
  // 是否正在关注
  const isFollowing =
    (await followService.isFollow(value.followingId, ctx.state.user._id)) ===
    null
      ? false
      : true
  // 取关
  if (isFollowing) {
    await followService.remove(value.followingId, ctx.state.user._id)
    return (ctx.body = new JsonResp(null))
  }
  // 关注
  const _id = await followService.create(value.followingId, ctx.state.user._id)
  ctx.body = new JsonResp({ _id })
})

/**
 * 获取用户间关注状态
 * @param followingId
 * @param userId
 * @returns
 */
export const checkFollow = async (followingId: string, userId: string) => {
  // 是否正在关注
  const isFollowing =
    (await followService.isFollow(followingId, userId)) === null ? false : true
  // 是否被关注
  const isFollowed =
    (await followService.isFollow(userId, followingId)) === null ? false : true
  return { isFollowing, isFollowed }
}

/**
 * 查询用户间关注状态
 */
router.get('/isFollow/:followingId', async (ctx) => {
  const value = validate(ctx.params, followSchema)
  // 是否正在关注
  const res = await checkFollow(value.followingId, ctx.state.user._id)
  ctx.body = new JsonResp(res)
})

/**
 * 分页查看用户正在关注列表\关注者列表
 */
router.get('/getFollow/:userId/:type/:skip/:limit', async (ctx) => {
  const value = validate(
    ctx.params,
    Joi.object({
      userId: Joi.string()
        .hex()
        .length(24)
        .required()
        .messages({ 'any.required': 'followingId字段缺失' }),
      type: Joi.string().valid('following', 'followed').required().messages({
        'any.required': 'type字段缺失',
        'any.invalid': '无效type参数',
      }),
      skip: Joi.number()
        .integer()
        .min(0)
        .default(0)
        .messages({ 'any.default': 'skip值应为正整数' }),
      limit: Joi.number()
        .integer()
        .min(1)
        .max(20)
        .default(10)
        .messages({ 'any.default': 'limit值应为1-20间整数' }),
    })
  )

  const { list, total } = await followService.getFollow(
    value.userId,
    value.type,
    value.skip,
    value.limit
  )
  const follow: {
    userInfo: Object
    followStatus: { isFollowing: boolean; isFollowed: boolean }
  }[] = []

  await Promise.all(
    list.map(async (obj) => {
      follow.push({
        userInfo: obj,
        followStatus: await checkFollow(obj._id, ctx.state.user._id),
      })
    })
  )
  ctx.body = new JsonResp({ list: follow, total })
})

/**
 * 计算关注数/关注者数
 */
router.get('/countFollow/:userId', async (ctx) => {
  const value = validate(
    ctx.params,
    Joi.object({
      userId: Joi.string()
        .hex()
        .length(24)
        .required()
        .messages({ 'any.required': 'userId字段缺失' }),
    })
  )
  const res = await followService.countFollow(value.userId)
  ctx.body = new JsonResp(res)
})

export default router.routes()

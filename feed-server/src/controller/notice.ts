import Joi from 'joi'
import Router from 'koa-router'
import { JsonResp } from '../libs/stats'
import validate from '../libs/validate'
import * as noticeService from '../services/notice'

const router = new Router({
  prefix: `${process.env.URL_PREFIX}/notice`,
})

// 添加通知
router.post('/create', async (ctx) => {
  const value = validate(
    ctx.request.body,
    Joi.object({
      receiverId: Joi.string().required(),
      relationId: Joi.string(),
      type: Joi.number(),
    })
  )
  const _id = await noticeService.create(value, ctx.state.user._id)
  ctx.body = new JsonResp({
    _id,
  })
})

// 删除通知
router.post('/remove', async (ctx) => {
  const { _id } = validate(
    ctx.request.body,
    Joi.object({
      _id: Joi.string().required(),
    })
  )
  await noticeService.remove(_id)
  ctx.body = new JsonResp()
})

// 批量删除通知
router.get('/removeAll', async (ctx) => {
  await noticeService.removeAll(ctx.state.user._id)
  ctx.body = new JsonResp()
})

// 标记已读
router.post('/read', async (ctx) => {
  const { _id } = validate(
    ctx.request.body,
    Joi.object({
      _id: Joi.string().required(),
    })
  )
  await noticeService.read(_id)
  ctx.body = new JsonResp()
})

// 全部标记已读
router.get('/readAll', async (ctx) => {
  await noticeService.readAll(ctx.state.user._id)
  ctx.body = new JsonResp()
})

//通知列表
router.get('/lists', async (ctx) => {
  const { skip, limit } = validate(
    ctx.query,
    Joi.object({
      skip: Joi.number().integer().min(0).default(0),
      limit: Joi.number().integer().min(1).max(20).default(10),
    })
  )
  const result = await noticeService.list(ctx.state.user._id, skip, limit)
  ctx.body = new JsonResp(result)
})

export default router.routes()

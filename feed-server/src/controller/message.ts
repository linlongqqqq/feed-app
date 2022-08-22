import Joi from 'joi'
import Router from 'koa-router'
import { WithId } from 'mongodb'
import { JsonResp, stats } from '../libs/stats'
import validate from '../libs/validate'
import { IMessage, IUser } from '../models/types'
import * as messageService from '../services/message'

const router = new Router({
  prefix: `${process.env.URL_PREFIX}/message`,
})

/**
 * 发送私信
 */
router.post('/create', async (ctx) => {
  const value = validate(
    ctx.request.body,
    Joi.object({
      content: Joi.string()
        .trim()
        .max(140)
        .required()
        .messages({ 'any.required': 'content字段缺失' }),
      friendId: Joi.string()
        .hex()
        .length(24)
        .required()
        .messages({ 'any.required': 'friendId字段缺失' }),
      type: Joi.number()
        .integer()
        .min(1)
        .max(2)
        .required()
        .messages({ 'any.required': 'type字段缺失' }),
    })
  )
  const res = await messageService.create(value, ctx.state.user._id)
  ctx.body = new JsonResp(res)
})

/**
 * 删除私信
 */
router.post('/delete', async (ctx) => {
  const value = validate(
    ctx.request.body,
    Joi.object({
      _id: Joi.string()
        .hex()
        .length(24)
        .required()
        .messages({ 'any.required': '_id字段缺失' }),
    })
  )
  const message = await messageService.detail(value._id)
  // 权限检测
  if (String(ctx.state.user._id) !== message.userId.toString())
    throw stats.ErrorMessageUnauthorized
  await messageService.remove(value._id)
  ctx.body = new JsonResp(null)
})

/**
 * 获取用户私信对话的未读数 & 最新私信内容列表
 */
router.get('/getConversations/:skip/:limit', async (ctx) => {
  const value = validate(
    ctx.params,
    Joi.object({
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
  const { senderIds, total } = await messageService.getConversations(
    ctx.state.user._id,
    value.skip,
    value.limit
  )
  let conversations: {
    unread: number
    latest: WithId<IMessage>
    user: IUser
  }[] = []

  await Promise.all(
    senderIds.map(async (obj) => {
      conversations.push(
        await messageService.calcUnreadAndGetLatestWithUser(
          ctx.state.user._id,
          obj._id
        )
      )
    })
  )
  // 时间逆序排序
  conversations.sort((objA, objB) => {
    return objA.latest.createdAt < objB.latest.createdAt ? 1 : -1
  })
  ctx.body = new JsonResp({ conversations, total })
})

/**
 * 获取对话私信详情
 */
router.get('/getMessages/:friendId/:limit/:prev', async (ctx) => {
  const value = validate(
    ctx.params,
    Joi.object({
      friendId: Joi.string()
        .hex()
        .length(24)
        .required()
        .messages({ 'any.required': 'friendId字段缺失' }),
      limit: Joi.number()
        .integer()
        .min(1)
        .max(20)
        .default(10)
        .messages({ 'any.default': 'limit值应为1-20间整数' }),
      prev: Joi.string().default('first'),
    })
  )

  const res = await messageService.getMessages(
    ctx.state.user._id,
    value.friendId,
    value.prev,
    value.limit
  )
  ctx.body = new JsonResp(res)
})

/**
 * 单方面逻辑删除对话
 */
router.post('/deleteConversation', async (ctx) => {
  const value = validate(
    ctx.request.body,
    Joi.object({
      friendId: Joi.string()
        .hex()
        .length(24)
        .required()
        .messages({ 'any.required': 'friendId字段缺失' }),
    })
  )
  await messageService.removeConversation(ctx.state.user._id, value.friendId)
  ctx.body = new JsonResp(null)
})

/**
 * 对话置为已读
 */
router.post('/setConversationRead', async (ctx) => {
  const value = validate(
    ctx.request.body,
    Joi.object({
      friendId: Joi.string()
        .length(24)
        .hex()
        .required()
        .messages({ 'any.required': 'friendId字段缺失' }),
    })
  )
  await messageService.setConversationRead(ctx.state.user._id, value.friendId)
  ctx.body = new JsonResp(null)
})

/**
 * 一键已读
 */
router.post('/setAllRead', async (ctx) => {
  const { senderIds } = await messageService.getConversations(
    ctx.state.user._id
  )
  await Promise.all(
    senderIds.map(async (obj) => {
      await messageService.setConversationRead(ctx.state.user._id, obj._id)
    })
  )
  ctx.body = new JsonResp(null)
})

/**
 * 获取单条私信详情
 */
router.get('/detail/:meaasgeId', async (ctx) => {
  const value = validate(
    ctx.params,
    Joi.object({
      meaasgeId: Joi.string()
        .hex()
        .length(24)
        .required()
        .messages({ 'any.required': 'meaasgeId字段缺失' }),
    })
  )
  const message = await messageService.detail(value.meaasgeId)
  ctx.body = new JsonResp({ message })
})

/**
 * 获取单条对话详情
 */
router.get('/conversationDetail/:friendId', async (ctx) => {
  const value = validate(
    ctx.params,
    Joi.object({
      friendId: Joi.string()
        .hex()
        .length(24)
        .required()
        .messages({ 'any.required': 'friendId字段缺失' }),
    })
  )
  const res = await messageService.calcUnreadAndGetLatestWithUser(
    ctx.state.user._id,
    value.friendId
  )
  ctx.body = new JsonResp(res)
})

/**
 * 计算未读总数
 */
router.get('/countUnread', async (ctx) => {
  const unread = await messageService.countUnread(ctx.state.user._id)
  ctx.body = new JsonResp({ unread })
})

/**
 * 单条置为已读
 */
router.post('/setRead', async (ctx) => {
  const value = validate(
    ctx.request.body,
    Joi.object({
      messageId: Joi.string()
        .hex()
        .length(24)
        .required()
        .messages({ 'any.required': 'messageId字段缺失' }),
    })
  )
  await messageService.setRead(ctx.state.user._id, value.messageId)
  ctx.body = new JsonResp(null)
})

export default router.routes()

import Router from 'koa-router'
import { JsonResp } from '../libs/stats'
import * as sessionService from '../services/session'

/**
 * 用于测试生成session、解决权限问题
 */
const router = new Router({
  prefix: `${process.env.URL_PREFIX}/test/cookie`,
})

// 创建cookie
router.post('/', async (ctx) => {
  const { openid } = ctx.request.body
  const sid = await sessionService.create(openid, '127.0.0.1')
  ctx.body = new JsonResp({ sid })

  const expireTime = 1000 * 3600 * 24 * 14
  ctx.cookies.set('sessionId', sid, {
    path: '/',
    signed: true,
    maxAge: expireTime,
    expires: new Date(Date.now() + expireTime),
  })
})

// 删除cookie
router.delete('/', async (ctx) => {
  const sid = ctx.cookies.get('sessionId')
  await sessionService.deleteOne(sid || '')
  ctx.body = new JsonResp()
})

export default router.routes()

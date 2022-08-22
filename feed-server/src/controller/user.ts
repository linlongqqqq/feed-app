import Joi, { string } from 'joi'
import Router from 'koa-router'
import { JsonResp } from '../libs/stats'
import validate from '../libs/validate'
import * as wechatService from '../services/wechat'
import * as userService from '../services/user'
import * as sessionService from '../services/session'

const router = new Router({
  prefix: `${process.env.URL_PREFIX}/user`,
})

// 微信的跳转回调、返回code
router.get('/wxlogin', async (ctx) => {
  const { echostr, code } = validate(
    ctx.query,
    Joi.object({
      echostr: Joi.string(),
      code: Joi.string(),
    })
  )
  ctx.body = echostr === undefined ? code : echostr
  // 如果认证成功
  if (code) {
    const { access_token, openid } = await wechatService.getAccessToken(code)
    const flag = await userService.existUser(openid)
    // 如果用户未注册
    if (!flag) {
      const { headimgurl, nickname, sex } = await wechatService.getUserDetail(
        access_token,
        openid
      )
      // 创建新用户
      await userService.create(openid, nickname, headimgurl, sex)
    }
    // 过期时间、默认为14天
    const expireTime = 1000 * 3600 * 24 * 14
    const sid = await sessionService.create(openid, ctx.request.ip)
    ctx.cookies.set('sessionId', sid, {
      path: '/',
      signed: true,
      maxAge: expireTime,
      expires: new Date(Date.now() + expireTime),
    })
    ctx.redirect('/')
  }
})

// 获取用户详情
router.get('/detail', async (ctx) => {
  const { _id, account } = validate(
    ctx.query,
    Joi.object({
      _id: Joi.string().hex().length(24),
      account: Joi.string().pattern(new RegExp('^[a-zA-Z0-9]{3,10}$')),
    })
  )
  // _id和account都不传，则返回当前登录的用户
  if (_id === undefined && account === undefined)
    ctx.body = new JsonResp(ctx.state.user)
  else {
    const user = await userService.getUserDetailByFilter(_id, account)
    ctx.body = new JsonResp(user)
  }
})

// 修改用户信息
router.post('/update', async (ctx) => {
  const updateInfo = validate(
    ctx.request.body,
    Joi.object({
      account: Joi.string().pattern(new RegExp('^[a-zA-Z0-9]{3,10}$')),
      avatar: Joi.string(),
      nickname: Joi.string().max(10),
      bio: Joi.string().allow(''),
      banner: Joi.string(),
    })
  )
  await userService.update(ctx.state.user._id, updateInfo)
  ctx.body = new JsonResp()
})

// 退出登录
router.post('/logout', async (ctx) => {
  const sid = ctx.cookies.get('sessionId')
  await userService.logout(sid!)
  ctx.cookies.set('sessionId', null, { expires: new Date() })
  ctx.body = new JsonResp()
})

export default router.routes()

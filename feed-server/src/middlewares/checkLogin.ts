import { Middleware } from 'koa'
import { stats } from '../libs/stats'
import * as sessionService from '../services/session'
import * as userService from '../services/user'

// 接口请求的白名单
const allowUrls: string[] = ['/api/v1/test/cookie']

/**
 * 验证请求头中的cookie是否有效
 * @param ctx
 * @param next
 */
const checkLogin: Middleware = async (ctx, next) => {
  // 如果请求路径是登录或者注册，直接放行
  if (
    allowUrls.includes(ctx.url) ||
    ctx.url.startsWith('/api/v1/user/wxlogin')
  ) {
    await next()
    return
  }
  const sid = ctx.cookies.get('sessionId')
  // 如果未登录
  if (!sid) {
    throw stats.ErrorSessionNotExist
  }
  // 验证会话是否合法、合法则放行，不合法抛出异常
  const valid = await sessionService.validSid(sid)
  if (valid) {
    // 登录成功设置用户信息
    const user = await userService.getUserDetail(sid)
    ctx.state.user = user
    await next()
  } else {
    // 清除浏览器中的cookie
    ctx.cookies.set('sessionId', null, { expires: new Date() })
    throw stats.ErrorSessionNotExist
  }
}

export default checkLogin

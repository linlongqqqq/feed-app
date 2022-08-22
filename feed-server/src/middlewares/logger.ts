import dayjs from 'dayjs'
import { Middleware } from 'koa'
import * as fs from 'fs'
import * as path from 'path'
import { ErrorStat, JsonResp } from '../libs/stats'

// 日志输出的路径（process.env.NODE_ENV === 'prod'）
const logDir = path.join(__dirname, '../../logs')

const initData = async () => {
  try {
    await fs.promises.access(logDir)
  } catch (error) {
    fs.promises.mkdir(logDir)
    console.log('创建日志文件夹成功')
  }
}

// 如果不存在文件夹则创建
initData()

/**
 * 请求日志中间件
 * @param ctx
 * @param next
 */
const logger: Middleware = async (ctx, next) => {
  const startTime = Date.now()
  await next()
  const endTime = Date.now()
  const logs = ctx.state.logs || {}
  const info: any = {
    time: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    method: ctx.method,
    url: ctx.url,
    ip: ctx.request.ip,
    status: ctx.status,
    cost: endTime - startTime,
    ...logs,
  }
  if (ctx.body instanceof JsonResp) info.code = ctx.body.code
  if (ctx.body instanceof ErrorStat) info.message = ctx.body.message
  if (process.env.NODE_ENV === 'dev') console.log(JSON.stringify(info))
  else if (process.env.NODE_ENV === 'prod') {
    fs.promises.appendFile(
      path.join(logDir, 'data.log'),
      `${JSON.stringify(info)}\n`
    )
  }
}

export default logger

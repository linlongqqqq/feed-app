import 'dotenv/config'
import Koa from 'koa'
import websockify from 'koa-websocket'
import user from './controller/user'
import follow from './controller/follow'
import file from './controller/file'
import post from './controller/post'
import message from './controller/message'
import search from './controller/search'
import like from './controller/like'
import notice from './controller/notice'
import ws from './controller/ws'
import likedAndRepostedList from './controller/likedAndRepostedList'
// test用于测试时候生成session
import test from './controller/testCookie'
import checkLogin from './middlewares/checkLogin'
import checkError from './middlewares/checkError'
import logger from './middlewares/logger'
import koabody from './middlewares/koabody'
import * as db from './db'

const app = websockify(
  new Koa({
    keys: JSON.parse(process.env.KEYS!),
  })
)

app.use(logger)
app.use(checkError)
app.use(checkLogin)
app.use(koabody)
app.use(user)
app.use(notice)
app.use(follow)
app.use(message)
app.use(file)
app.use(post)
app.use(search)
app.use(like)
app.use(likedAndRepostedList)
// 测试环境下添加test接口
if (process.env.NODE_ENV === 'test') app.use(test)
// 挂载websocket
app.ws.use(ws.routes() as any).use(ws.allowedMethods() as any)

async function run() {
  await db.init()
  app.listen(process.env.PORT)
}

run()

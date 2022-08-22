import Router from 'koa-router'
import Koa from 'koa'
import * as ws from 'ws'
import * as followService from '../services/follow'
import * as userService from '../services/user'
import * as sessionService from '../services/session'

const wsRouter = new Router<Koa.DefaultState, any>()

// 一个_id对应多个websocket实例
// _id: websocket[]
export const clients = new Map<string, ws.WebSocket[]>()

wsRouter.get('/', async (ctx, next) => {
  // 验证session
  const sid = ctx.cookies.get('sessionId')
  if (!sid || !(await sessionService.validSid(sid))) return

  // 获取连接用户的信息
  const user = await userService.getUserDetail(sid)

  if (!user) return

  const websocket: ws = ctx.websocket

  // 添加用户
  clients.set(user._id.toString(), [
    ...(clients.get(user._id.toString()) || []),
    websocket,
  ])

  // 收到消息, msg.data必须为json格式字符串
  websocket.onmessage = async (msg) => {
    const data = JSON.parse(msg.data.toString())
    switch (data.type) {
      // 关注的人发送了帖子或者转发
      case 'createPost':
        // 获取所有关注着的_id
        const followedIds = await followService.getAllFollowed(data._id)
        const user = await userService.getUserDetailByFilter(data._id)
        for (let uid of followedIds) {
          if (clients.has(uid.toString())) {
            const resData = {
              type: 'newPost',
              user,
            }
            const wss = clients.get(uid.toString())
            if (!wss) return
            // 给所有_id的人发送消息
            for (const ws of wss) {
              ws.send(JSON.stringify(resData))
            }
          }
        }
        break
      // 发送私信
      case 'sendMessage':
        const resData = {
          type: 'receiveMessage',
          message: {
            messageId: data.messageId,
            senderId: data.senderId,
            receiverId: data.receiverId,
          },
        }
        const wss = clients.get(data.receiverId.toString())
        if (!wss) return
        for (const ws of wss) {
          ws.send(JSON.stringify(resData))
        }
        break
      default:
        break
    }
  }

  // 前端关闭了连接
  websocket.onclose = (e) => {
    const wss = clients.get(user._id.toString())
    if (!wss) return
    let idx = wss.findIndex((x) => x === e.target)
    // 删除数组中的该ws对象
    if (idx !== -1) wss.splice(idx, 1)
  }

  return next
})

export default wsRouter

import * as db from '../db'
import crypto from 'crypto'

/**
 * 验证sessionId是否有效
 * @param sid
 * @returns boolean
 */
export async function validSid(sid: string) {
  const session = await db.sessions.findOne({ sid })
  return session !== null
}

/**
 * 创建session
 * @param openid
 * @param ip
 * @returns sid
 */
export async function create(openid: string, ip: string) {
  const sid = crypto.randomUUID()
  await db.sessions.insertOne({
    sid,
    openid,
    ip,
    createdAt: new Date(),
  })
  return sid
}

/**
 * 清除数据库中该用户的全部session
 * @param openid
 */
export async function clearAll(openid: string) {
  await db.sessions.deleteMany({ openid })
}

/**
 * 删除某一个session
 * @param sid
 */
export async function deleteOne(sid: string) {
  await db.sessions.findOneAndDelete({ sid })
}

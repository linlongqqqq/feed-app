import { MongoClient, Collection } from 'mongodb'
import {
  IUser,
  ISession,
  INotice,
  IPost,
  ILike,
  IFollow,
  IMessage,
} from './models/types'

export let users: Collection<IUser>
export let sessions: Collection<ISession>
export let notices: Collection<INotice>
export let posts: Collection<IPost>
export let likes: Collection<ILike>
export let messages: Collection<IMessage>
export let follows: Collection<IFollow>

export async function init() {
  const client = new MongoClient(process.env.MONGO_URL!)
  await client.connect()
  const db = client.db()
  users = db.collection('users')
  sessions = db.collection('sessions')
  notices = db.collection('notices')
  posts = db.collection('posts')
  likes = db.collection('likes')
  messages = db.collection('messages')
  follows = db.collection('follows')

  // 用户
  users.createIndex(
    {
      openid: 1,
    },
    {
      unique: true,
    }
  )

  // 通过设置TTL索引实现自动清除，过期时间：2周
  sessions.createIndex(
    {
      createAt: 1,
    },
    {
      expireAfterSeconds: 14 * 24 * 3600,
    }
  )
}

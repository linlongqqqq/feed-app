const { MongoClient } = require('mongodb')
const userRows = require('./users.json')
const fs = require('fs')
const path = require('path')

async function start () {
  const client = new MongoClient('mongodb://127.0.0.1/feed-server')
  await client.connect()
  const db = client.db()
  const users = db.collection('users')
  const posts = db.collection('posts')
  let firstUid
  let secondUid
  let idx = 0
  // 创建用户
  for (const user of userRows.RECORDS) {
    const res = await users.insertOne(user)
    if (idx === 0) firstUid = res.insertedId
    else if (idx === 1) secondUid = res.insertedId
    idx++
  }
  // 创建帖子
  const resPost = await posts.insertOne({
    content: 'hello1',
    type: 1,
    imgs: [],
    relationId: null,
    comments: 0,
    likes: 0,
    reposts: 0,
    deleted: false,
    createdAt: Date.now(),
    userId: secondUid,
  })

  // 生成的配置文件
  const template = `
  // 登录用户的openid
  export const openid = 'oEb5c5oOEPXo-AnEUhg0xX2oBixx'
  // 登录用户的_id
  export const _id = '${firstUid.toString()}'

  // 其他用户的id
  export const friendId = '${secondUid.toString()}'

  // 上面登录用户所拥有的帖子Id
  export const postid = '${resPost.insertedId.toString()}'

  // 查找的字符
  export const search_message = 'n'

  `

  fs.writeFileSync(
    path.join(__dirname, '../test/configData.ts'),
    template,
    (err) => {
      if (err) {
        console.error('配置写入失败')
      } else {
        console.log('配置写入成功')
      }
    }
  )

  // 生成configData.ts
  client.close()
}

start()

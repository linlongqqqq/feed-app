import { _id } from './../../test/configData'
import Joi from 'joi'
import Router from 'koa-router'
import { Document } from 'mongodb'
import { JsonResp } from '../libs/stats'
import validate from '../libs/validate'
import * as searchService from '../services/search'
import { checkFollow } from './follow'

const router = new Router({
  prefix: `${process.env.URL_PREFIX}/search`,
})

// 查找用户
router.get('/user', async (ctx) => {
  const { message, skip, limit } = validate(
    ctx.query,
    Joi.object({
      message: Joi.string(),
      skip: Joi.number().integer().min(0).default(0),
      limit: Joi.number().integer().min(1).max(20).default(10),
    })
  )

  const result = await searchService.searchUser(message, skip, limit)
  const userResult: {
    userInfo: Object
    followStatus: { isFollowing: boolean; isFollowed: boolean }
  }[] = []

  await Promise.all(
    result!.user.map(async (obj) => {
      userResult.push({
        userInfo: obj,
        followStatus: await checkFollow(obj._id, ctx.state.user._id),
      })
    })
  )

  ctx.body = new JsonResp({ userResult, total: result?.total })
})

// 查找帖子
router.get('/post', async (ctx) => {
  const { message, skip, limit } = validate(
    ctx.query,
    Joi.object({
      message: Joi.string(),
      skip: Joi.number().integer().min(0).default(0),
      limit: Joi.number().integer().min(1).max(20).default(10),
    })
  )
  const users = await searchService.searchUserAll(message) // 查找用户
  let total = 0
  let newArr: Document[] = []
  for (const item of users!.user) {
    if (newArr.length <= skip + limit) {
      const post = await searchService.list(ctx.state.user._id, item.account)
      newArr.push(...post.list)
      total += post.total
    } else break
  }
  const content = await searchService.searchPost(ctx.state.user._id, message)

  total += content.length
  newArr.push(...content)
  let temp: string[] = []
  let newArr2: Document[] = []

  for (const item of newArr) {
    if (temp.includes(String(item._id)) === false) {
      newArr2.push(item)
      temp.push(String(item._id))
    }
  }

  newArr2 = newArr2.slice(skip, skip + limit)

  let result = {
    post: newArr2,
    total: total,
  }
  ctx.body = new JsonResp(result)
})

// 查找带图片帖子
router.get('/postPhoto', async (ctx) => {
  const { message, skip, limit } = validate(
    ctx.query,
    Joi.object({
      message: Joi.string(),
      skip: Joi.number().integer().min(0).default(0),
      limit: Joi.number().integer().min(1).max(20).default(10),
    })
  )
  const users = await searchService.searchUserAll(message) // 查找用户
  let total = 0
  let newArr: Document[] = []
  for (const item of users!.user) {
    if (newArr.length <= skip + limit) {
      const post = await searchService.list(ctx.state.user._id, item.account)
      const post2 = post.list.filter((item) => {
        return item.imgs.length !== 0
      })
      newArr.push(...post2)
      total += post2.length
    } else break
  }
  // 查找内容
  const content = await searchService.searchPost(ctx.state.user._id, message)
  const item = content.filter((it) => {
    return it.imgs.length !== 0
  })
  total += item.length
  newArr.push(...item)
  let temp: string[] = []
  let newArr2: Document[] = []

  for (const item of newArr) {
    if (temp.includes(String(item._id)) === false) {
      newArr2.push(item)
      temp.push(String(item._id))
    }
  }

  newArr2 = newArr2.slice(skip, skip + limit)
  let result = {
    post: newArr2,
    total: total,
  }
  ctx.body = new JsonResp(result)
})

export default router.routes()

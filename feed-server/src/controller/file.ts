import Joi from 'joi'
import Router from 'koa-router'
import { JsonResp } from '../libs/stats'
import * as ossService from '../services/oss'
import validate from '../libs/validate'

const router = new Router({
  prefix: `${process.env.URL_PREFIX}/file`,
})

// 获取上传单个文件的url签名链接
router.get('/signUrl', async (ctx) => {
  const { fileName, contentType } = validate(
    ctx.query,
    Joi.object({
      fileName: Joi.string().required(),
      contentType: Joi.string().required(),
    })
  )
  const url = await ossService.getSignUploadUrl(fileName, contentType)
  ctx.body = new JsonResp({ url })
})

// 删除文件
router.post('/delete', async (ctx) => {
  const { fileName } = validate(
    ctx.request.body,
    Joi.object({
      fileName: Joi.string(),
    })
  )
  await ossService.deleteFile(fileName)
  ctx.body = new JsonResp()
})

export default router.routes()

import { AxiosError } from 'axios'
import request from './request'
import { openid } from './configData'

let headers: Record<string, string> = {}

// 所有测试之前、先得到cookie
beforeAll(async () => {
  // 获取最新的cookie
  const { headers: tHeaders } = await request.post('/test/cookie', { openid })
  headers.cookie = tHeaders['set-cookie']!.reduce((pre, cur) => {
    return pre + cur.split(';')[0] + ';'
  })
})

// 测试之后删除cookie
afterAll(async () => {
  await request.delete('/test/cookie', { headers })
})

describe('文件模块', () => {
  test('获取文件上传签名url', async () => {
    const params = {
      fileName: 'hello.jpg',
      contentType: 'image/jpg',
    }
    const {
      data: {
        data: { url },
        code,
      },
    } = await request.get('/file/signUrl', { params, headers })
    expect(code).toBe(0)
    //  http://feed-app-wps.oss-cn-shanghai.aliyuncs.com/21166080-d6d5-4dc0-b704-b9f49f3b0a41.jpg?OSSAccessKeyId=LTAI5tCju12BUD9PvvJUTgAk&Expires=1660548293&Signature=e9zXwQ9TJew%2FinRyhz95U9upvVY%3D
    expect(url).toContain('?OSSAccessKeyId=')
  })

  test('参数缺失', async () => {
    await request
      .get('/file/signUrl', { headers })
      .catch((e: AxiosError<{ code: number }>) => {
        const { status, data } = e.response!
        expect(status).toBe(405)
        expect(data.code).toBe(40005)
      })
  })
})

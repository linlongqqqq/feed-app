import { AxiosError } from 'axios'
import request from './request'
import { openid } from './configData'

describe('权限认证模块', () => {
  // 认证失败、请求不包含cookie的请求头
  test('headers中不包含session或者session失效', async () => {
    await request
      .get('/user/detail')
      .catch((e: AxiosError<{ code: number; message: string }>) => {
        expect(e.message).toBe('Request failed with status code 401')
        const {
          status,
          data: { code, message },
        } = e.response!
        expect(status).toBe(401)
        expect(code).toBe(40001)
        expect(message).toBe('会话不存在')
      })
  })

  // 认证成功
  test('session有效', async () => {
    // 获取最新的cookie
    const { headers } = await request.post('/test/cookie', { openid })
    let cookie = headers['set-cookie']!.reduce((pre, cur) => {
      return pre + cur.split(';')[0] + ';'
    })

    const {
      data: { code },
    } = await request.get('/user/detail', { headers: { cookie } })
    expect(code).toBe(0)
  })
})

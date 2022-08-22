import { AxiosError } from 'axios'
import request from './request'
import { openid, _id } from './configData'

let headers: Record<string, string> = {}

// 返回的user类型
type IUser = {
  _id: string
  status: number
  openid: string
  account: string
  nickname: string
  createdAt: number
  bio: string
  avatar: string
  banner: string
  sex: number
}

type ResUser = {
  code: number
  data: IUser
}

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
  const { data } = await request.post('/user/logout', null, { headers })
  expect(data.code).toBe(0)
})

describe('用户模块', () => {
  test('获取用户详情', async () => {
    // 当不传参数时、返回当前登录的用户
    const { data: res1 } = await request.get<ResUser>('/user/detail', {
      headers,
    })
    expect(res1.code).toBe(0)
    expect(res1.data._id).toBe(_id)

    // 当传入_id时，返回_id的用户信息
    const params: { _id?: string; account?: string } = { _id }
    const { data: res2 } = await request.get<ResUser>('/user/detail', {
      params,
      headers,
    })
    expect(res2).toEqual(res1)

    // 根据account查询用户
    delete params._id
    params.account = res2.data.account
    const { data: res3 } = await request.get<ResUser>('/user/detail', {
      params,
      headers,
    })
    expect(res3).toEqual(res2)
  })

  test('修改用户信息', async () => {
    // 获取当前登录的用户
    const { data: res } = await request.get<ResUser>('/user/detail', {
      headers,
    })
    expect(res.code).toBe(0)

    // 记录修改前的nickname
    const beforeName = res.data.nickname

    const data = { nickname: 'aftername' }
    await request.post('/user/update', data, { headers })

    // 获取修改后的用户信息
    const { data: resAfter } = await request.get<ResUser>('/user/detail', {
      headers,
    })
    expect(resAfter.code).toBe(0)
    expect(resAfter.data.nickname).toBe(data.nickname)

    // account仅支持在注册时进行修改、且符合 /^[a-zA-Z0-9]{3,10}$/
    const {
      data: { code, message },
    } = await request.post('/user/update', { account: 'hello' }, { headers })
    if (res.data.account !== '') {
      expect(code).toBe(10001)
      expect(message).toBe('用户已注册')
    }

    // 复原nickname
    data.nickname = beforeName
    await request.post('/user/update', data, { headers })
  })

  test('注册的account不合法', async () => {
    await request
      .post('/user/update', { account: '非法的字符@' }, { headers })
      .catch((e: AxiosError<{ code: number }>) => {
        const { status, data } = e.response!
        expect(status).toBe(405)
        expect(data.code).toBe(40005)
      })
  })

  test('用户不存在', async () => {
    const noneId = '92f05408bf17d336907fee68'
    const { data } = await request.get<{ code: number; message: string }>(
      `/user/detail?_id=${noneId}`,
      {
        headers,
      }
    )
    expect(data.code).toBe(10003)
    expect(data.message).toBe('用户未找到')
  })

  // 参数不合法参考file.test.ts， 返回的status均为405
})

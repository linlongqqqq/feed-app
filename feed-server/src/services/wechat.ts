import axios from 'axios'
import { stats } from '../libs/stats'

type AccessTokenRes = {
  access_token: string
  expires_in: number
  refresh_token: string
  openid: string
  scope: string
  errcode?: number
}

/**
 * 通过code 获取access_token
 * @param code
 * @returns
 */
export async function getAccessToken(code: string) {
  const params = {
    appid: process.env.APPID,
    secret: process.env.SECRET,
    grant_type: 'authorization_code',
    code,
  }
  const { data } = await axios.get<AccessTokenRes>(
    'https://api.weixin.qq.com/sns/oauth2/access_token',
    {
      params,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  )
  // code失效则抛出异常
  if (data.errcode) throw stats.ErrorSessionNotExist
  return data
}

/*
 * 刷新token  errcode: 40030 refresh_token无效
 * @param refresh_token
 * @returns AccessTokenRes
 */
export async function refreshToken(refresh_token: string) {
  const params = {
    appid: process.env.APPID,
    grant_type: 'refresh_token',
    refresh_token,
  }
  const { data } = await axios.get<AccessTokenRes>(
    'https://api.weixin.qq.com/sns/oauth2/refresh_token',
    {
      params,
    }
  )
  // 如果refresh_token失效则抛出异常
  if (data.errcode) throw stats.ErrorSessionNotExist
  return data
}

type UserInfoRes = {
  openid: string
  nickname: string
  sex: number
  headimgurl: string
  errcode?: number
}

/**
 * 获取用户详情
 * @param access_token
 * @param openid
 * @returns
 */
export async function getUserDetail(access_token: string, openid: string) {
  const params = {
    lang: 'zh_CN',
    openid,
    access_token,
  }
  const { data } = await axios.get<UserInfoRes>(
    'https://api.weixin.qq.com/sns/userinfo',
    {
      params,
    }
  )
  if (data.errcode) throw stats.ErrorSessionNotExist
  return data
}

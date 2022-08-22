import { ApiResp, INotice } from '../libs/models'
import request from '../libs/request'

interface Data {
  notice: INotice[]
  total: number
}
// 获取通知列表
export async function getNotice(
  params: {
    skip?: number
    limit?: number
  } = {}
) {
  const query = new URLSearchParams({
    skip: (params.skip || 0).toString(),
    limit: (params.limit || 10).toString(),
  })

  const { data } = await request.get<ApiResp<Data>>(
    '/notice/lists?' + query.toString()
  )
  return data
}

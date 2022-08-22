import * as wsService from '../controller/ws'
import { INotice } from '../models/types'

export async function sentNotice(
  uid: string,
  msg: { type: string; data: INotice }
) {
  const client = wsService.clients.get(uid)
  if (!client) return
  for (const ws of client) {
    ws.send(JSON.stringify(msg))
  }
  return
}

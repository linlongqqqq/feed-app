import { createContext } from 'react'
import { IUser } from '../libs/models'

interface StoreContext {
  user: IUser | null
  setUser: (user: IUser | null) => void
  ws: WebSocket | null
  setWs: (websocket: WebSocket) => void
}

// 存储用户信息
const context = createContext<StoreContext>({
  user: null,
  setUser: () => {},
  ws: null,
  setWs: () => {},
})
const StoreProvider = context.Provider

export { context, StoreProvider }

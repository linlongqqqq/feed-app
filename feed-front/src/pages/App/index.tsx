import { useCallback, useEffect, useRef, useState } from 'react'
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import PubSub from 'pubsub-js'
import { NEW_POST, MESSAGE_RECEIVE, NOTICE_CREATE } from '../../events'
import Main from '../Main'
import Notice from '../Notice'
import Home from '../Home'
import Search from '../Search'
import SearchResult from '../SearchResult'
import Message from '../Message'
import Login from '../Login'
import Register from '../Register'
import LikedList from '../LikedList'
import RepostedList from '../RepostedList'
import MessageDetail from '../MessageDetail'
import Post from '../Post'
import UserCenter from '../UserCenter'
import UserEdit from '../UserEdit'
import Follow from '../Follow'
import NotFound from '../NotFound'
import ServerDown from '../ServerDown'
import { StoreProvider } from '../../hooks/store'
import { IUser } from '../../libs/models'
import * as userService from '../../services/user'

function App() {
  // 保存全局的用户信息、未登录时为null
  const [user, setUser] = useState<IUser | null>(null)
  // 判断setUser是否已经初始化执行完毕
  const flag = useRef(false)
  const location = useLocation()
  const navigate = useNavigate()

  // 获取用户详情
  useEffect(() => {
    const initData = async () => {
      const res = await userService.detail()
      const tmpUser = res !== undefined ? res.data : null
      setUser(() => {
        flag.current = true
        return tmpUser
      })
      // 如果用户未登录，则跳转到登录界面
      if (tmpUser === null && location.pathname !== '/login') navigate('/login')
    }
    if (location.pathname !== '/404' && location.pathname !== '/500') initData()
  }, [location.pathname, navigate])

  // 路由导航守卫
  useEffect(() => {
    const pathName = location.pathname
    // setUser初始化时如果未执行完，直接返回
    if (!flag.current) return
    // 未登录
    if (!user) {
      if (pathName === '/404' || pathName === '/500') return
      // 如果不在登录界面则跳转至登录界面
      if (pathName !== 'login') navigate('/login', { replace: true })
    } else {
      if (pathName === '/login') {
        if (user.account === '') navigate('/register', { replace: true })
        else navigate('/', { replace: true })
      } else if (pathName === '/register') {
        if (user.account !== '') navigate('/', { replace: true })
      } else {
        if (user.account === '') navigate('/register', { replace: true })
      }
    }
  }, [location.pathname, user, navigate])

  const [ws, setWs] = useState<WebSocket | null>(null)

  // 获取websocket实例
  const getWebSocket = useCallback(() => {
    // 如果用户已经登录并且为创建ws实例
    if (user && !ws) {
      // const websocket = new WebSocket(`ws://10.227.10.163:4014`)
      // const websocket = new WebSocket(`ws://127.0.0.1:4014`)
      const websocket = new WebSocket(
        `ws://${window.location.hostname}:${process.env.REACT_APP_SERVER_PORT}`
      )

      // websocket.onopen = (e) => {
      // }

      // 监听消息
      websocket.onmessage = (msg) => {
        const data = JSON.parse(msg.data)
        switch (data.type) {
          // 关注的人发送了新的帖子
          case 'newPost':
            PubSub.publish(NEW_POST, data.user)
            break
          case 'receiveMessage':
            PubSub.publish(MESSAGE_RECEIVE, data.message)
            break
          case 'creatNotice':
            if (data.data !== '')
              PubSub.publish(NOTICE_CREATE, {
                num: true,
              })
            break
          default:
            break
        }
      }
      // 断线重连
      websocket.onclose = (e) => {
        getWebSocket()
      }
      setWs(websocket)
    }
  }, [user, ws])

  // 获取ws
  useEffect(() => {
    getWebSocket()
  }, [getWebSocket])

  return (
    <StoreProvider value={{ user, setUser, ws, setWs }}>
      <Routes>
        <Route path="/" element={<Main />}>
          <Route index element={<Home />} />
          <Route path="search" element={<Search />}>
            <Route path="result/:message" element={<SearchResult />} />
          </Route>
          <Route path="notice" element={<Notice />} />
          <Route path="message" element={<Message />} />
          <Route path="post/:_id" element={<Post />} />
          <Route path="follow/:account/:type" element={<Follow />} />
          <Route path="message-detail/:account" element={<MessageDetail />} />
          <Route path="user-center/:account" element={<UserCenter />} />
          <Route path="user-edit" element={<UserEdit />} />
        </Route>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/liked/:_id" element={<LikedList />} />
        <Route path="/reposted/:_id" element={<RepostedList />} />
        <Route path="404" element={<NotFound />} />
        <Route path="500" element={<ServerDown />} />
      </Routes>
    </StoreProvider>
  )
}

export default App

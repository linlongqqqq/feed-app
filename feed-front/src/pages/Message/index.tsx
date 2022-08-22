import { useCallback, useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Avatar,
  Button,
  Dialog,
  InfiniteScroll,
  NavBar,
  PullToRefresh,
  SpinLoading,
  Toast,
} from 'antd-mobile'
import {
  CONVERSATION_DELETE,
  MESSAGE_READ,
  MESSAGE_RECEIVE,
} from '../../events'
import { IMessage, IUser } from '../../libs/models'
import * as messageService from '../../services/message'
import { context } from '../../hooks/store'
import useMessage from '../../hooks/useMessage'
import LoadingCircle from '../../components/LoadingCircle'
import MessageItem from '../../components/MessageItem'
import PropuLayout from '../../components/PropuLayout'
import { ReactComponent as IconClean } from '../../assets/imgs/clean.svg'
import style from './style.module.scss'

const Message = () => {
  const { user } = useContext(context)
  const navigate = useNavigate()
  const [sidebarVisibility, setSidebarVisibility] = useState(false)
  const [error, setError] = useState('')
  const { list, hasMore, loadMore, listMessage, setList, loading } =
    useMessage()

  useEffect(() => {
    if (error) {
      Toast.show({ content: error, icon: 'fail' })
      navigate('/500')
    }
  }, [error, navigate])

  /* 获取消息列表 */
  useEffect(() => {
    listMessage()
  }, [hasMore, listMessage])

  /* 订阅收到私信，更新对话列表 */
  useEffect(() => {
    const token = PubSub.subscribe(
      MESSAGE_RECEIVE,
      async (
        msg: string,
        data: {
          messageId: string
          senderId: string
          receiverId: string
        }
      ) => {
        const res = await messageService.detail(data.messageId)
        let findFlag = false
        for (let index = 0; index < list!.length; index++) {
          if (list![index].user._id === data.senderId) {
            const newObj = {
              ...list![index],
              unread: list![index].unread + 1,
              latest: res.data.message,
            }
            list!.splice(index, 1)
            // 接受新消息置顶
            setList([newObj, ...list!])
            findFlag = true
            break
          }
        }
        // 原对话不存在时
        if (!findFlag) {
          try {
            const newConversation = await messageService.conversationDetail(
              data.senderId
            )
            if (!newConversation.code) {
              setList([newConversation.data, ...list!])
            }
          } catch (error: any) {
            setError(error.message)
          }
        }
      }
    )
    return () => {
      PubSub.unsubscribe(token)
    }
  }, [list, setList])

  /* 订阅已读，更新已读 */
  useEffect(() => {
    const token = PubSub.subscribe(
      MESSAGE_READ,
      async (msg: string, data: any) => {
        // 未读全部置零
        if (typeof data === 'boolean') {
          const newList: {
            unread: number
            latest: IMessage
            user: IUser
          }[] = []
          list!.forEach((obj) => {
            newList.push({ ...obj, unread: 0 })
          })
          setList(newList)
          // 单一对话未读置零
        } else if (typeof data === 'object') {
          const newObj = {
            ...list![data.index],
            unread: 0,
          }
          list!.splice(data.index, 1, newObj)
          setList([...list!])
        }
      }
    )
    return () => {
      PubSub.unsubscribe(token)
    }
  }, [list, setList])

  /* 订阅对话删除，更新对话列表 */
  useEffect(() => {
    const token = PubSub.subscribe(
      CONVERSATION_DELETE,
      async (
        msg: string,
        data: {
          unread: number
          index: number
        }
      ) => {
        list!.splice(data.index, 1)
        setList([...list!])
      }
    )
    return () => {
      PubSub.unsubscribe(token)
    }
  }, [list, setList])

  const setAllRead = useCallback(async () => {
    Dialog.show({
      closeOnMaskClick: true,
      content: '确认要清除全部未读吗？',
      closeOnAction: true,
      actions: [
        [
          {
            key: 'cancel',
            text: '取消',
          },
          {
            key: 'clean',
            text: '确认',
            bold: true,
            danger: true,
            onClick: async () => {
              try {
                const res = await messageService.setAllRead()
                if (!res.code) {
                  Toast.show({
                    content: '清除未读成功',
                    position: 'bottom',
                    duration: 800,
                  })
                  PubSub.publish(MESSAGE_READ, true)
                }
              } catch (error: any) {
                setError(error.message)
              }
            },
          },
        ],
      ],
    })
  }, [])

  if (!user) return null

  return (
    <div className={style.container}>
      <NavBar
        className={style.nav}
        back={null}
        left={
          <Avatar
            className={style.avatar}
            src={user.avatar}
            onClick={() => setSidebarVisibility(true)}
          />
        }
        right={
          list && list.length ? (
            <IconClean width={25} fill={'#a9a9a9'} onClick={setAllRead} />
          ) : null
        }
      >
        私信
      </NavBar>
      <main className={style.main}>
        {loading ? (
          <div style={{ marginTop: '40vh' }}>
            <LoadingCircle />
          </div>
        ) : list ? (
          list.length ? (
            <PullToRefresh
              canReleaseText={<SpinLoading color="primary" />}
              onRefresh={async () => {
                listMessage()
              }}
            >
              {list.map((obj, index) => (
                <MessageItem
                  key={obj.user._id}
                  conversation={obj}
                  index={index}
                />
              ))}
              <InfiniteScroll
                hasMore={hasMore}
                loadMore={loadMore}
                threshold={600}
              >
                {list.length ? <div>全部加载完毕</div> : null}
              </InfiniteScroll>
            </PullToRefresh>
          ) : (
            <div className={style.center}>
              <div className={style.left}>
                <div className={style.title}>欢迎来到你的收件箱</div>
                <div className={style.description}>
                  在FEED上和别人进行私密对话，大家互发私信、分享动态等。
                </div>
                <Button
                  color="primary"
                  shape="rounded"
                  className={style.button}
                  onClick={() => {
                    navigate('/search')
                  }}
                >
                  搜索用户
                </Button>
              </div>
            </div>
          )
        ) : null}
      </main>
      <PropuLayout
        visible1={sidebarVisibility}
        setvisible1={setSidebarVisibility}
      />
    </div>
  )
}

export default Message

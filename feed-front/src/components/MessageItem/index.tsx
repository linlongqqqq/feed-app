import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Avatar, Badge, Dialog, SwipeAction, Toast } from 'antd-mobile'
import dayjs from 'dayjs'
import { IMessage, IUser } from '../../libs/models'
import * as messageService from '../../services/message'
import { CONVERSATION_DELETE, MESSAGE_READ } from '../../events'
import style from './style.module.scss'

const MessageItem = (props: {
  conversation: { unread: number; latest: IMessage; user: IUser }
  index: number
}) => {
  const { user, latest, unread } = props.conversation

  const navigate = useNavigate()
  const [unreadNum, setUnreadNum] = useState(0)
  const [error, setError] = useState('')

  useEffect(() => {
    if (error) {
      Toast.show({ content: error, icon: 'fail' })
      navigate('/500')
    }
  }, [error, navigate])

  /* 初始化未读数 */
  useEffect(() => {
    setUnreadNum(unread)
  }, [unread])

  /* 发出已读事件 */
  const emitRead = useCallback(() => {
    PubSub.publish(MESSAGE_READ, { unread: unreadNum, index: props.index })
  }, [props.index, unreadNum])

  /* 删除对话 */
  const handleDelete = useCallback(async () => {
    Dialog.show({
      closeOnMaskClick: true,
      content: '确认要删除吗？',
      closeOnAction: true,
      actions: [
        [
          {
            key: 'cancel',
            text: '取消',
          },
          {
            key: 'delete',
            text: '删除',
            bold: true,
            danger: true,
            onClick: async () => {
              try {
                const res = await messageService.deleteConversation(
                  props.conversation.user._id
                )
                if (!res.code) {
                  Toast.show({
                    content: '删除成功',
                    position: 'bottom',
                    duration: 800,
                  })
                  PubSub.publish(CONVERSATION_DELETE, {
                    unread: unreadNum,
                    index: props.index,
                  })
                }
              } catch (error: any) {
                setError(error.message)
              }
            },
          },
        ],
      ],
    })
  }, [props.conversation.user._id, props.index, unreadNum])

  /* 清除对话未读 */
  const handleRead = useCallback(async () => {
    try {
      const res = await messageService.setConversationRead(
        props.conversation.user._id
      )
      if (!res.code) {
        Toast.show({
          content: '清除成功',
          position: 'bottom',
          duration: 800,
        })
        emitRead()
      }
    } catch (error: any) {
      setError(error.message)
    }
  }, [emitRead, props.conversation.user._id])

  return (
    <SwipeAction
      rightActions={[
        {
          key: 'delete',
          text: '删除',
          color: 'danger',
          onClick: handleDelete,
        },
        {
          key: 'read',
          text: '标记已读',
          color: 'warning',
          onClick: handleRead,
        },
      ]}
    >
      <div className={style.container}>
        <Link to={`/user-center/${user.account}`}>
          <Avatar className={style.avatar} src={user.avatar} />
        </Link>
        <div className={style.right}>
          <Link
            to={`/message-detail/${user.account}`}
            onClick={() => {
              emitRead()
            }}
          >
            <div className={style.top}>
              <span className={style.sender}>{user.nickname}</span>
              <span className={style.time}>
                {Date.now() - latest.createdAt >= 7 * 24 * 3600 * 1000
                  ? dayjs(latest.createdAt).format('YYYY-MM-DD')
                  : dayjs(latest.createdAt).local().fromNow()}
              </span>
            </div>
            <div className={style.bottom}>
              <span className={style.message}>
                {latest.type === 1 ? latest.content : '[图片]'}
              </span>
              <Badge
                className={style.badge}
                content={unreadNum ? unreadNum : null}
              />
            </div>
          </Link>
        </div>
      </div>
    </SwipeAction>
  )
}

export default MessageItem

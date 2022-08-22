import { Badge, TabBar, Toast } from 'antd-mobile'
import { FC, useCallback, useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import * as messageService from '../../services/message'
import useMessageReceive from '../../hooks/useMessageReceive'
import useNotice from '../../hooks/useNotice'
import {
  CONVERSATION_DELETE,
  MESSAGE_READ,
  MESSAGE_RECEIVE,
  NOTICE_CREATE,
} from '../../events'
import { ReactComponent as IconHome } from '../../assets/imgs/menu/home.svg'
import { ReactComponent as IconSearch } from '../../assets/imgs/menu/search.svg'
import { ReactComponent as IconNotice } from '../../assets/imgs/menu/notice.svg'
import { ReactComponent as IconMessage } from '../../assets/imgs/menu/message.svg'
import styles from './styles.module.scss'

const MainLayout: FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [noticeNum, setNoticeNum] = useState(false)
  const [error, setError] = useState('')
  const { notices, listNotice } = useNotice()
  const { pathname } = location

  useEffect(() => {
    if (error) {
      Toast.show({ content: error, icon: 'fail' })
      navigate('/500')
    }
  }, [error, navigate])

  const setRouteActive = (value: string) => {
    navigate(value, { replace: true })
  }
  useEffect(() => {
    const token = PubSub.subscribe(
      CONVERSATION_DELETE,
      async (msg: string, data: any) => {
        setUnread((preValue) => {
          return preValue - data.unread
        })
      }
    )
    return () => {
      PubSub.unsubscribe(token)
    }
  }, [])

  // 通知订阅
  useEffect(() => {
    const NOTICE_NUM = PubSub.subscribe(
      NOTICE_CREATE,
      (msg: string, data: any) => {
        setNoticeNum(data.num)
      }
    )
    return () => {
      PubSub.unsubscribe(NOTICE_NUM)
    }
  }, [])

  /* 计算未读数 */
  const [unread, setUnread] = useState(0)
  const { userId } = useMessageReceive()

  const countUnread = useCallback(async () => {
    try {
      const { code, data } = await messageService.countUnread()
      if (!code) {
        setUnread(data.unread)
      }
    } catch (error: any) {
      setError(error.message)
    }
  }, [])

  useEffect(() => {
    listNotice()
  }, [listNotice])
  // 判断通知是否有未读
  const getNoticeNum = useCallback(() => {
    const tem = notices.find((item, index) => {
      return item.isread === false
    })
    if (tem === undefined) {
      setNoticeNum(false)
    } else {
      setNoticeNum(true)
    }
  }, [notices])

  useEffect(() => {
    countUnread()
  }, [countUnread])

  useEffect(() => {
    getNoticeNum()
  }, [getNoticeNum])

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
        /* 位于非私信发送者私信详情页面时，未读才更新 */
        if (userId !== data.senderId)
          setUnread((preValue) => {
            return ++preValue
          })
      }
    )
    return () => {
      PubSub.unsubscribe(token)
    }
  }, [userId])

  /* 更新已读 */
  useEffect(() => {
    const token = PubSub.subscribe(
      MESSAGE_READ,
      async (msg: string, data: any) => {
        if (typeof data === 'boolean') {
          setUnread(0)
        } else if (typeof data === 'object') {
          if (unread - data.unread < 0) {
            countUnread()
          } else {
            setUnread((preValue) => {
              return preValue - data.unread
            })
          }
        }
      }
    )
    return () => {
      PubSub.unsubscribe(token)
    }
  }, [countUnread, unread])

  /* 更新对话删除 */
  useEffect(() => {
    const token = PubSub.subscribe(
      CONVERSATION_DELETE,
      async (msg: string, data: any) => {
        if (unread - data.unread < 0) {
          countUnread()
        } else {
          setUnread((preValue) => {
            return preValue - data.unread
          })
        }
      }
    )
    return () => {
      PubSub.unsubscribe(token)
    }
  }, [countUnread, unread])

  const tabs = [
    {
      key: '/',
      title: '首页',
      icon: <IconHome />,
      badge: '',
    },
    {
      key: '/search',
      title: '我的待办',
      icon: <IconSearch />,
    },
    {
      key: '/notice',
      title: '我的消息',
      icon: <IconNotice />,
      badge: noticeNum ? Badge.dot : '', // 更改这里显示徽标
    },
    {
      key: '/message',
      title: '个人中心',
      icon: <IconMessage />,
      badge: unread ? unread : null,
    },
  ]

  return (
    <div className={styles.mainLayout}>
      <div className="tabar">
        <TabBar
          activeKey={pathname}
          onChange={(value) => {
            setRouteActive(value)
          }}
        >
          {tabs.map((item) => (
            <TabBar.Item key={item.key} icon={item.icon} badge={item.badge} />
          ))}
        </TabBar>
      </div>
    </div>
  )
}

export default MainLayout

import { useCallback, useContext, useEffect, useState } from 'react'
import {
  ActionSheet,
  Avatar,
  Empty,
  InfiniteScroll,
  NavBar,
  PullToRefresh,
  Toast,
} from 'antd-mobile'
import { Action } from 'antd-mobile/es/components/action-sheet'
import { context } from '../../hooks/store'
import useNotice from '../../hooks/useNotice'
import request from '../../libs/request'
import NoticeItem from '../../components/NoticeItem'
import PropuLayout from '../../components/PropuLayout'
import { NOTICE_CREATE } from '../../events'
import { ReactComponent as IconMenu } from '../../assets/imgs/menu/menu.svg'
import styles from './styles.module.scss'

export default function Notice() {
  const [visible1, setvisible1] = useState(false)
  const { user } = useContext(context)
  const { notices, hasMore, error, listNotice, loadMore } = useNotice()
  const [visible, setVisible] = useState(false)
  const [emptyNotice, setEmptyNotice] = useState(true)

  // 监测posts是否为空
  useEffect(() => {
    if (notices.length === 0) setEmptyNotice(true)
    else setEmptyNotice(false)
  }, [setEmptyNotice, notices.length])
  const isEmpty = (
    <Empty
      style={{ padding: '64px 0' }}
      imageStyle={{ width: 128 }}
      description="暂无数据"
    />
  )

  const getNoticeNum = useCallback(() => {
    const tem = notices.find((item, index) => {
      return item.isread === false
    })
    if (tem === undefined) {
      PubSub.publish(NOTICE_CREATE, {
        num: false,
      })
    } else {
      PubSub.publish(NOTICE_CREATE, {
        num: true,
      })
    }
  }, [notices])
  useEffect(() => {
    getNoticeNum()
  }, [getNoticeNum])

  useEffect(() => {
    if (error) {
      Toast.show({
        content: error,
      })
    }
    listNotice()
  }, [error, listNotice])
  if (!user) return <></>

  const actions: Action[] = [
    {
      text: '全部标记为已读',
      key: 'readAll',
      onClick: async () => {
        await request.get('/notice/readAll').then((res) => {
          if (res.status === 200) {
            listNotice()
            PubSub.publish(NOTICE_CREATE, {
              num: false,
            })
          }
        })
      },
    },
    {
      text: '全部删除',
      key: 'deleteAll',
      onClick: async () => {
        await request.get('/notice/removeAll').then((res) => {
          if (res.status === 200) {
            listNotice()
          }
        })
      },
    },
  ]
  return (
    <div className={styles.notice}>
      <NavBar
        className={styles.nav}
        back={null}
        left={
          <Avatar
            className={styles.avatar}
            src={user!.avatar}
            onClick={() => setvisible1(true)}
          />
        }
        right={
          <IconMenu
            onClick={() => {
              setVisible(true)
            }}
          />
        }
      >
        通知
      </NavBar>
      {emptyNotice ? (
        isEmpty
      ) : (
        <div className={styles.body}>
          <PullToRefresh
            onRefresh={async () => {
              listNotice()
            }}
          >
            {notices.map((item) => (
              <NoticeItem
                notice={item}
                key={item._id}
                id={item._id}
                listNotice={listNotice}
              />
            ))}
            <InfiniteScroll hasMore={hasMore} loadMore={loadMore} />
          </PullToRefresh>
        </div>
      )}
      <PropuLayout visible1={visible1} setvisible1={setvisible1} />
      <ActionSheet
        extra="请选择你要进行的操作"
        cancelText="取消"
        closeOnAction={true}
        visible={visible}
        actions={actions}
        onClose={() => setVisible(false)}
      />
    </div>
  )
}

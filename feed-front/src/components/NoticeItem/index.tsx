import { List, Dialog, Avatar, Badge } from 'antd-mobile'
import { useNavigate } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import dayjs from 'dayjs'
import SwipeAction, {
  SwipeActionRef,
} from 'antd-mobile/es/components/swipe-action'
import request from '../../libs/request'
import { INotice } from '../../libs/models'
import styles from './styles.module.scss'

interface Props {
  notice: INotice
  id: string
  listNotice: () => Promise<void>
}

export default function NoticeItem({ notice, id, listNotice }: Props) {
  const navigate = useNavigate()
  const ref = useRef<SwipeActionRef>(null)
  // 用于对后面的红点进行判断（已读未读）
  const [judge, setJudge] = useState(false)
  const badge = (
    <div className={styles.badge}>
      <Badge content={Badge.dot}>
        <div className={styles.box} />
      </Badge>
    </div>
  )
  useEffect(() => setJudge(!notice.isread), [notice])
  return (
    <div>
      <List>
        <SwipeAction
          ref={ref}
          closeOnAction={true}
          closeOnTouchOutside={true}
          rightActions={[
            {
              key: 'setting',
              text: '设为已读',
              color: 'warning',
              onClick: async () => {
                await request
                  .post('/notice/read', {
                    _id: id,
                  })
                  .then((res) => {
                    if (res.status === 200) {
                      setJudge(false)
                      listNotice()
                    }
                  })
              },
            },
            {
              key: 'delete',
              text: '删除',
              color: 'danger',
              onClick: async () => {
                const result = await Dialog.confirm({
                  content: '确定要删除吗？',
                })
                if (result) {
                  await request
                    .post('/notice/remove', {
                      _id: id,
                    })
                    .then((res) => {
                      listNotice()
                    })
                }
              },
            },
          ]}
        >
          <div
            className={styles.ListItem}
            onClick={async () => {
              await request
                .post('/notice/read', {
                  _id: id,
                })
                .then((res) => {
                  if (res.status === 200) {
                    setJudge(false)
                    listNotice()
                    if (notice.relationId !== '') {
                      navigate(`/post/${notice.relationId}`)
                    } else {
                      navigate(`/user-center/${notice.sendaccount}`)
                    }
                  }
                })
            }}
          >
            {/* 改图片 */}
            <Avatar src={notice.sendUrl} className={styles.avatar} />
            <div className={styles.ListItem_content}>
              <div className={styles.ListItem_content_title}>
                {/* 改名字 */}
                <span className={styles.name}>{notice.sendName}</span>
                <span className={styles.notice}>{notice.content}</span>
              </div>
              <div className={styles.ListItem_content_time}>
                {/* 修改时间按 */}
                {dayjs(notice.createdAt).format('YYYY/MM/DD HH:mm')}
              </div>
            </div>
            {judge ? badge : ''}
          </div>
        </SwipeAction>
      </List>
    </div>
  )
}

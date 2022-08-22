import { useEffect, useState } from 'react'
import styles from './styles.module.scss'
import { ReactComponent as IconGoback } from '../../assets/imgs/goback.svg'
import useLikedList from '../../hooks/useLikedList'
import { useNavigate, useParams } from 'react-router-dom'
import UserItem from '../../components/UserItem'
import { Empty, InfiniteScroll, PullToRefresh } from 'antd-mobile'

export default function LikedList() {
  const { users, listLiked, hasMore, loadMore } = useLikedList()
  const navigate = useNavigate()
  const [emptyUsers, setEmptyUsers] = useState(true)
  const { _id } = useParams()
  const isEmpty = (
    <Empty
      style={{ padding: '64px 0' }}
      imageStyle={{ width: 128 }}
      description="暂无数据"
    />
  )
  useEffect(() => {
    listLiked(_id!, 1)
  }, [_id, listLiked])

  useEffect(() => {
    if (users.length === 0) setEmptyUsers(true)
    else setEmptyUsers(false)
  }, [setEmptyUsers, users.length])

  return (
    <div className={styles.repostList}>
      <header className="header">
        <IconGoback className="back" onClick={() => navigate(-1)} />
        <span className="title">被转推</span>
      </header>
      <main className="content">
        <PullToRefresh
          onRefresh={async () => {
            listLiked(_id!, 1)
          }}
        >
          {emptyUsers ? isEmpty : ''}
          {users.map((item) => (
            <UserItem
              key={item.userInfo._id}
              userInfo={item.userInfo}
              followStatus={item.followStatus}
            />
          ))}
          <InfiniteScroll hasMore={hasMore} loadMore={loadMore} />
        </PullToRefresh>
      </main>
    </div>
  )
}

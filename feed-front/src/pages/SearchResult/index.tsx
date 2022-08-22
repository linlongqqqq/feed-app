import {
  ActionSheet,
  Empty,
  InfiniteScroll,
  PullToRefresh,
  Swiper,
  Tabs,
} from 'antd-mobile'
import { SwiperRef } from 'antd-mobile/es/components/swiper'
import React, { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import PopupPost from '../../components/PopupPost'
import PostItem from '../../components/PostItem'
import UserItem from '../../components/UserItem'
import useCurPost from '../../hooks/useCurPost'
import useSearchPhoto from '../../hooks/useSearchPhoto'
import useSearchPost from '../../hooks/useSearchPost'
import useSearchUser from '../../hooks/useSearchUser'
import styles from './styles.module.scss'

export default function SearchResult() {
  const { message } = useParams() // 接收路由参数
  const swiperRef = useRef<SwiperRef>(null)
  const [emptyPosts, setEmptyPosts] = useState(true)
  const [emptyUsers, setEmptyUsers] = useState(true)
  const [emptyPhotos, setEmptyPhotos] = useState(true)
  const [activeIndex, setActiveIndex] = useState(0)
  let ref = useRef<HTMLInputElement>(null)

  // 评论、转发弹出层显示与隐藏
  const {
    popupPostVisible,
    setPopupPostVisible,
    curPostId,
    popupType,
    handleCommentReportClick,
    deleteActionVisible,
    setDeleteActionVisible,
    actions,
    handleDeleteClick,
    curPost,
  } = useCurPost()
  const { users, hasMoreUser, listSearchUser, loadMoreUser } = useSearchUser()
  const { posts, loadMorePost, hasMorePost, listSearchPost } = useSearchPost()
  const { postPhotos, loadMorePhoto, hasMorePhoto, listSearchPhoto } =
    useSearchPhoto()
  const [msg, setMsg] = useState('')
  useEffect(() => {
    setMsg(message!)
  }, [message])

  useEffect(() => {
    if (msg === '') return
    if (activeIndex === 0) {
      listSearchPost(msg)
      ref.current?.scrollTo(0, 0)
    }
    if (activeIndex === 1) {
      listSearchUser(msg)
      ref.current?.scrollTo(0, 0)
    }
    if (activeIndex === 2) {
      listSearchPhoto(msg)
      ref.current?.scrollTo(0, 0)
    }
  }, [listSearchUser, listSearchPost, listSearchPhoto, msg, activeIndex])

  // 监测posts是否为空
  useEffect(() => {
    if (posts.length === 0) setEmptyPosts(true)
    else setEmptyPosts(false)
  }, [setEmptyPosts, posts.length])
  // 监测users是否为空
  useEffect(() => {
    if (users.length === 0) setEmptyUsers(true)
    else setEmptyUsers(false)
  }, [setEmptyUsers, users.length])
  // 监测postPhotos是否为空
  useEffect(() => {
    if (postPhotos.length === 0) setEmptyPhotos(true)
    else setEmptyPhotos(false)
  }, [setEmptyPhotos, postPhotos.length])

  const isEmpty = (
    <Empty
      style={{ padding: '64px 0' }}
      imageStyle={{ width: 128 }}
      description="暂无数据"
    />
  )
  const tabItems = [
    { key: 'posts', title: '帖子' },
    { key: 'users', title: '用户' },
    { key: 'photos', title: '照片' },
  ]
  return (
    <div className={styles.result}>
      <div className={styles.sticky}>
        <Tabs
          className={styles.tabs}
          activeKey={tabItems[activeIndex].key}
          onChange={(key) => {
            const index = tabItems.findIndex((item) => item.key === key)
            setActiveIndex(index)
            swiperRef.current?.swipeTo(index)
          }}
        >
          {tabItems.map((item) => (
            <Tabs.Tab title={item.title} key={item.key} />
          ))}
        </Tabs>
      </div>
      <div className={styles.allcontent} ref={ref}>
        <Swiper
          direction="horizontal"
          loop
          indicator={() => null}
          ref={swiperRef}
          defaultIndex={activeIndex}
          onIndexChange={(index) => {
            setActiveIndex(index)
          }}
        >
          <Swiper.Item>
            {emptyPosts ? (
              isEmpty
            ) : (
              <div className={styles.content}>
                <PullToRefresh
                  onRefresh={async () => {
                    listSearchPost(msg)
                  }}
                >
                  {posts.map((item) => (
                    <PostItem
                      key={item._id}
                      {...item}
                      handleDeleteClick={handleDeleteClick}
                      handleCommentReportClick={handleCommentReportClick}
                    />
                  ))}
                  <InfiniteScroll
                    hasMore={hasMorePost}
                    loadMore={loadMorePost}
                  />
                </PullToRefresh>
              </div>
            )}
          </Swiper.Item>
          <Swiper.Item>
            {emptyUsers ? (
              isEmpty
            ) : (
              <div className={styles.content}>
                <PullToRefresh
                  onRefresh={async () => {
                    listSearchUser(msg)
                  }}
                >
                  {users.map((item) => (
                    <UserItem
                      key={item.userInfo._id}
                      userInfo={item.userInfo}
                      followStatus={item.followStatus}
                    />
                  ))}
                  <InfiniteScroll
                    hasMore={hasMoreUser}
                    loadMore={loadMoreUser}
                  />
                </PullToRefresh>
              </div>
            )}
          </Swiper.Item>
          <Swiper.Item>
            {emptyPhotos ? (
              isEmpty
            ) : (
              <div className={styles.content}>
                <PullToRefresh
                  onRefresh={async () => {
                    listSearchPhoto(msg)
                  }}
                >
                  {postPhotos.map((item) => (
                    <PostItem
                      key={item._id}
                      {...item}
                      handleCommentReportClick={handleCommentReportClick}
                    />
                  ))}
                  <InfiniteScroll
                    hasMore={hasMorePhoto}
                    loadMore={loadMorePhoto}
                  />
                </PullToRefresh>
              </div>
            )}
          </Swiper.Item>
        </Swiper>
      </div>
      <PopupPost
        visible={popupPostVisible}
        setVisible={setPopupPostVisible}
        type={popupType}
        relationId={curPostId}
        relationPost={curPost}
      />
      <ActionSheet
        extra="请选择要执行的操作"
        closeOnAction={true}
        cancelText="取消"
        actions={actions}
        visible={deleteActionVisible}
        onClose={() => {
          setDeleteActionVisible(false)
          listSearchPost(msg)
          listSearchPhoto(msg)
        }}
      />
    </div>
  )
}

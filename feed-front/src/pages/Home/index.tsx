import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  NavBar,
  Avatar,
  ActionSheet,
  PullToRefresh,
  InfiniteScroll,
  SpinLoading,
  Empty,
  Button,
} from 'antd-mobile'
import classNames from 'classnames'
import { FingerdownOutline } from 'antd-mobile-icons'
import { useNavigate } from 'react-router-dom'
import PropuLayout from '../../components/PropuLayout'
import PopupPost from '../../components/PopupPost'
import PostItem from '../../components/PostItem'
import InfiniteScrollContent from '../../components/InfiniteScrollContent'
import LoadingCircle from '../../components/LoadingCircle'
import { context } from '../../hooks/store'
import usePosts from '../../hooks/usePosts'
import useCurPost from '../../hooks/useCurPost'
import { NEW_POST, POST_CREATE, POST_DELETE } from '../../events'
import { ReactComponent as IconSharp } from '../../assets/imgs/sharp.svg'
import { ReactComponent as IconNotice } from '../../assets/imgs/blank_notice.svg'
import styles from './styles.module.scss'

export default function Home() {
  const navigate = useNavigate()
  // 点击头像显示的抽屉的弹出层的显示与隐藏
  const [drawerVisible, setDrawerVisible] = useState(false)

  const { user } = useContext(context)

  // 列表数据
  const {
    loading,
    setLoading,
    posts,
    setPosts,
    hasNext,
    getFollingPosts,
    getMoreFollings,
  } = usePosts()

  // 关注的人发了新的帖子的下滑按钮是否可见
  const [follingNewPostVisible, setFollingNewPostVisible] = useState(false)

  // 当前操作的帖子
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

  // 数据初始化
  const loadOnce = useCallback(async () => {
    if (!user) return
    setLoading(true)
    await getFollingPosts()
    setLoading(false)
  }, [getFollingPosts, setLoading, user])

  useEffect(() => {
    loadOnce()
  }, [loadOnce])

  // 消息订阅、监听发帖、删帖
  useEffect(() => {
    const tokenPostDetete = PubSub.subscribe(POST_DELETE, (msg, data) => {
      setPosts(
        posts
          .filter((post) => post._id !== data.postId)
          .map((post) => {
            return post.relationId &&
              post.relationId === data.postId &&
              post.relationPost
              ? {
                  ...post,
                  relationPost: { ...post.relationPost, deleted: true },
                }
              : post
          })
      )
    })

    const tokenPostCreate = PubSub.subscribe(POST_CREATE, (msg, data) => {
      if (data.type !== 2) {
        setPosts([data.newPost, ...posts])
        if (preTopHeight.current > 0) {
          preTopHeight.current = Number.MAX_VALUE
          setTopVisible(true)
          setFollingNewPostVisible(true)
        }
      }
    })

    return () => {
      PubSub.unsubscribe(tokenPostDetete)
      PubSub.unsubscribe(tokenPostCreate)
    }
  }, [posts, setPosts])

  // 关注的用户发了新的帖子、或者转发了帖子
  useEffect(() => {
    const tokenFollingNewPost = PubSub.subscribe(NEW_POST, (msg, data) => {
      setTopVisible(true)
      setFollingNewPostVisible(true)
    })
    return () => {
      PubSub.unsubscribe(tokenFollingNewPost)
    }
  }, [])

  // 下拉刷新自定义文本
  const statusRecores = useMemo(() => {
    return {
      pulling: '下拉刷新',
      canRelease: <SpinLoading color="primary" />,
      refreshing: <SpinLoading color="primary" />,
      complete: '加载完毕',
    }
  }, [])

  // 滚动条回到顶部
  const topBtnClick = useCallback(async () => {
    setFollingNewPostVisible(false)
    await getFollingPosts()
    scrollDiv.current?.scrollTo(0, 0)
  }, [getFollingPosts])

  // 滚动条
  const scrollDiv = useRef<HTMLDivElement>(null)

  // 滚动条距离顶部的距离
  const preTopHeight = useRef(0)

  // 是否显示导航栏
  const [topVisible, setTopVisible] = useState(true)

  if (!user) return <></>

  return (
    <div className={styles.home}>
      <NavBar
        className={classNames(styles.nav, {
          [styles.hidden]: !topVisible,
        })}
        back={null}
        left={
          <Avatar
            className={styles.avatar}
            onClick={() => {
              setDrawerVisible(true)
            }}
            src={user.avatar}
          />
        }
        right={
          <IconNotice onClick={() => navigate('/notice', { replace: true })} />
        }
      >
        <IconSharp />
      </NavBar>
      <Button
        block
        color="primary"
        size="small"
        onClick={topBtnClick}
        className={classNames(styles.topBtn, {
          [styles.visible]: follingNewPostVisible,
          [styles.topHidden]: !topVisible,
        })}
      >
        <FingerdownOutline />
        <span>查看新推文</span>
      </Button>
      {loading ? (
        <LoadingCircle />
      ) : (
        <>
          {posts.length > 0 ? (
            <div
              className={styles.body}
              ref={scrollDiv}
              onScroll={(e) => {
                if (e.currentTarget.scrollTop > preTopHeight.current)
                  setTopVisible(false)
                else setTopVisible(true)
                preTopHeight.current = e.currentTarget.scrollTop
              }}
            >
              <PullToRefresh
                onRefresh={async () => {
                  setFollingNewPostVisible(false)
                  await getFollingPosts()
                }}
                renderText={(status) => {
                  return <div>{statusRecores[status]}</div>
                }}
              >
                {posts.map((post) => (
                  <PostItem
                    key={post._id}
                    {...post}
                    handleCommentReportClick={handleCommentReportClick}
                    handleDeleteClick={handleDeleteClick}
                  />
                ))}
                <InfiniteScroll loadMore={getMoreFollings} hasMore={hasNext}>
                  <InfiniteScrollContent hasMore={hasNext} />
                </InfiniteScroll>
              </PullToRefresh>
            </div>
          ) : (
            <Empty description="暂无数据" className={styles.empty} />
          )}
        </>
      )}
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
        onClose={() => setDeleteActionVisible(false)}
      />
      <PropuLayout visible1={drawerVisible} setvisible1={setDrawerVisible} />
    </div>
  )
}

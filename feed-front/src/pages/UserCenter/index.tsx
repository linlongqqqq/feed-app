import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import classNames from 'classnames'
import dayjs from 'dayjs'
import {
  ActionSheet,
  Avatar,
  Button,
  Image,
  ImageViewer,
  InfiniteScroll,
  PullToRefresh,
  Swiper,
  Tabs,
  Toast,
} from 'antd-mobile'
import { SwiperRef } from 'antd-mobile/es/components/swiper'
import * as followService from '../../services/follow'
import * as userService from '../../services/user'
import { context } from '../../hooks/store'
import useCurPost from '../../hooks/useCurPost'
import usePosts from '../../hooks/usePosts'
import { IUser } from '../../libs/models'
import { LIKE_POST, POST_CREATE, POST_DELETE } from '../../events'
import LoadingCircle from '../../components/LoadingCircle'
import PostItem from '../../components/PostItem'
import PopupPost from '../../components/PopupPost'
import UserCenterSkeleton from '../../components/UserCenterSkeleton'
import { ReactComponent as IconDate } from '../../assets/imgs/date.svg'
import style from './style.module.scss'

const UserCenter = () => {
  const navigate = useNavigate()
  const params = useParams()
  const { user } = useContext(context)
  const swiperRef = useRef<SwiperRef>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [userId, setUserId] = useState('')
  const [follow, setFollow] = useState<{
    following: number
    followed: number
  }>()
  const [followStatus, setFollowStatus] = useState<{
    isFollowing: boolean
    isFollowed: boolean
  }>()
  const [info, setInfo] = useState<IUser>()
  const [error, setError] = useState('')
  const tabItems = useMemo(
    () => [
      { key: 'posts', title: '帖子' },
      { key: 'photos', title: '照片' },
      { key: 'likes', title: '喜欢' },
    ],
    []
  )
  // 列表信息
  const {
    loading,
    setLoading,
    hasNext,
    posts,
    setPosts,
    listUserPosts,
    loadMoreUserPosts,
    listUserImgPosts,
    loadMoreImgPosts,
    listUserLikePosts,
    loadMoreLikePosts,
  } = usePosts()

  useEffect(() => {
    if (error) {
      Toast.show({ content: error, icon: 'fail' })
      navigate('/500')
    }
  }, [error, navigate])

  // 数据初始化
  const listPosts = useCallback(async () => {
    if (!info?._id) return
    setLoading(true)
    if (activeIndex === 0) await listUserPosts(info._id)
    else if (activeIndex === 1) await listUserImgPosts(info._id)
    else await listUserLikePosts(info._id)
    setLoading(false)
  }, [
    activeIndex,
    info?._id,
    listUserImgPosts,
    listUserLikePosts,
    listUserPosts,
    setLoading,
  ])

  useEffect(() => {
    listPosts()
  }, [listPosts, setLoading])

  // 订阅删除的消息
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
    return () => {
      PubSub.unsubscribe(tokenPostDetete)
    }
  }, [posts, setPosts])

  // 订阅喜欢的消息
  useEffect(() => {
    const tokenPostLike = PubSub.subscribe(LIKE_POST, (msg, data) => {
      if (activeIndex === 2 && info?.account === user?.account)
        setPosts(posts.filter((post) => post._id !== data._id))
    })
    return () => {
      PubSub.unsubscribe(tokenPostLike)
    }
  }, [activeIndex, info?.account, posts, setPosts, user?.account])

  // 订阅创建帖子的消息
  useEffect(() => {
    const tokenPostCreate = PubSub.subscribe(POST_CREATE, (msg, data) => {
      if (info?._id === user?._id) {
        if (data.type === 1 && activeIndex === 0) {
          setPosts([data.newPost, ...posts])
        } else if (data.type === 1 && activeIndex === 1) {
          if (data.newPost.imgs.length > 0) {
            setPosts([data.newPost, ...posts])
          }
        }
      }
    })
    return () => {
      PubSub.unsubscribe(tokenPostCreate)
    }
  }, [activeIndex, info?._id, posts, setPosts, user?._id])

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

  /* 计算关注数 */
  const countFollow = useCallback(async () => {
    try {
      const res = await followService.countFollow(userId)
      if (!res.code) {
        setFollow({
          following: res.data.following,
          followed: res.data.followed,
        })
      }
    } catch (error: any) {
      setError(error.message)
    }
  }, [userId])

  /* 获取其他用户信息 */
  const getInfo = useCallback(async () => {
    try {
      const res = await userService.detail(undefined, params.account)
      if (!res.code) {
        const userInfo = res.data
        setInfo(userInfo!)
        setUserId(userInfo!._id)
      }
    } catch (error: any) {
      setError(error.message)
    }
  }, [params.account])

  /* 检查用户间关注关系 */
  const checkFollow = useCallback(async () => {
    if (userId) {
      try {
        const res = await followService.checkFollow(userId)
        if (!res.code) {
          const { isFollowing, isFollowed } = res.data
          setFollowStatus({ isFollowing, isFollowed })
        }
      } catch (error: any) {
        setError(error.message)
      }
    }
  }, [userId])

  /* 获取当前账户信息 */
  useEffect(() => {
    if (params.account) {
      setActiveIndex(0)
      if (user) {
        if (user.account === params.account) {
          setUserId(user._id)
          setInfo(user)
        } else {
          getInfo()
          checkFollow()
        }
        if (userId) {
          countFollow()
        }
      }
    }
  }, [checkFollow, countFollow, getInfo, params.account, user, userId])

  /* 点击关注按钮 */
  const toggleFollow = useCallback(async () => {
    try {
      const res = await followService.toggleFollow(userId)
      if (!res.code) {
        if (!res.data) {
          Toast.show({
            content: '取关成功',
            position: 'bottom',
            duration: 800,
          })
          setFollowStatus({ ...followStatus!, isFollowing: false })
          setFollow({ ...follow!, followed: --follow!.followed })
        } else {
          Toast.show({
            content: '关注成功',
            position: 'bottom',
            duration: 800,
          })
          setFollowStatus({ ...followStatus!, isFollowing: true })
          setFollow({ ...follow!, followed: ++follow!.followed })
        }
      }
    } catch (error: any) {
      setError(error.message)
    }
  }, [follow, followStatus, userId])

  /* 关注按钮 */
  const FollowButton = useMemo(() => {
    if (followStatus) {
      let buttonString
      if (followStatus.isFollowing) buttonString = '正在关注'
      else if (followStatus.isFollowed) buttonString = '回关'
      else buttonString = '关注'
      return (
        <Button
          className={classNames(style.button, {
            [style.followed]:
              followStatus.isFollowed && !followStatus.isFollowing,
          })}
          shape="rounded"
          color={followStatus.isFollowing ? 'default' : 'primary'}
          onClick={toggleFollow}
        >
          {buttonString}
        </Button>
      )
    }
    return (
      <Link to={'/user-edit'}>
        <Button
          className={classNames(style.button)}
          shape="rounded"
          color={'default'}
        >
          {'编辑个人资料'}
        </Button>
      </Link>
    )
  }, [followStatus, toggleFollow])

  return user &&
    info &&
    ((userId !== user!._id && followStatus && follow) ||
      (userId === user!._id && follow)) ? (
    <div className={style.conatiner}>
      <div className={style.topBox}>
        <Image
          src={
            info.banner ? info.banner : require('../../assets/imgs/banner.jpeg')
          }
          className={style.background}
          fit="cover"
          onClick={() => {
            ImageViewer.show({
              image: info.banner
                ? info.banner
                : require('../../assets/imgs/banner.jpeg'),
            })
          }}
        />
        <div className={style.top}>
          <div
            className={style.left}
            onClick={() => {
              navigate(-1)
            }}
          />
          {user && userId !== user!._id && (
            <Link to={`/message-detail/${params.account}`}>
              <div className={style.right} />
            </Link>
          )}
        </div>
      </div>
      <div className={style.bottomBox}>
        <div className={style.border}>
          <Avatar
            src={info.avatar}
            className={style.avatar}
            onClick={() => {
              ImageViewer.show({ image: info.avatar })
            }}
          />
        </div>
        {user && FollowButton}
      </div>
      <div className={style.user}>
        <div className={style.name}>{info.nickname}</div>
        <div className={style.info}>
          <span>{`@${info.account}`}</span>
          <IconDate className={style.calendar} />
          <span>{`${dayjs(info.createdAt)
            .add(8, 'hour')
            .format('YYYY/MM/DD')}加入`}</span>
        </div>
        <div className={style.bio}>{info.bio}</div>
        <div className={style.follow}>
          <Link to={`/follow/${params.account}/following`}>
            <span className={style.number}>{follow!.following}</span>
            <span className={style.suffix}>正在关注</span>
          </Link>
          <Link to={`/follow/${params.account}/followed`}>
            <span className={style.number}>{follow!.followed}</span>
            <span className={style.suffix}>关注者</span>
          </Link>
        </div>
      </div>
      <div className={style.sticky}>
        <Tabs
          className={style.tabs}
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
      <Swiper
        direction="horizontal"
        loop
        indicator={() => null}
        ref={swiperRef}
        defaultIndex={activeIndex}
        onIndexChange={(index) => {
          setActiveIndex(index)
        }}
        className={style.content}
      >
        <Swiper.Item>
          <div key={'posts'} className={style.content}>
            {loading ? (
              <div className={style.center}>
                <LoadingCircle />
              </div>
            ) : (
              <PullToRefresh onRefresh={listPosts}>
                {posts.length > 0 &&
                  posts.map((obj) => (
                    <PostItem
                      key={obj._id}
                      handleCommentReportClick={handleCommentReportClick}
                      handleDeleteClick={handleDeleteClick}
                      {...obj}
                    />
                  ))}
                <InfiniteScroll
                  loadMore={async () => await loadMoreUserPosts(info._id)}
                  hasMore={hasNext && activeIndex === 0}
                >
                  {posts.length !== 0 ? (
                    <div>全部加载完毕</div>
                  ) : (
                    <div className={style.empty}>
                      <div className={style.onLeft}>
                        <div className={style.title}>
                          {user && params.account === user.account
                            ? `你还没发过动态`
                            : `@${params.account} 还没发过动态`}
                        </div>
                        <div className={style.description}>
                          {user && params.account === user.account
                            ? `当你发布动态后，就会出现在这里。`
                            : `当 @${params.account} 发布动态后，就会出现在这里。`}
                        </div>
                      </div>
                    </div>
                  )}
                </InfiniteScroll>
              </PullToRefresh>
            )}
          </div>
        </Swiper.Item>
        <Swiper.Item>
          <div key={'photos'} className={style.content}>
            {loading ? (
              <div className={style.center}>
                <LoadingCircle />
              </div>
            ) : (
              <PullToRefresh onRefresh={listPosts}>
                {posts.length > 0 &&
                  posts.map((obj) => (
                    <PostItem
                      key={obj._id}
                      handleCommentReportClick={handleCommentReportClick}
                      handleDeleteClick={handleDeleteClick}
                      {...obj}
                    />
                  ))}
                <InfiniteScroll
                  loadMore={async () => await loadMoreImgPosts(info._id)}
                  hasMore={hasNext && activeIndex === 1}
                >
                  {posts.length ? (
                    <div>全部加载完毕</div>
                  ) : (
                    <div className={style.empty}>
                      <Image
                        src={require('../../assets/imgs/photo_empty.jpg')}
                        height={150}
                        width={300}
                      />
                      <div className={style.left}>
                        <div className={style.title}>
                          {user && params.account !== user.account
                            ? `@${params.account} 没有发表照片动态`
                            : '灯光、相机...附件！'}
                        </div>
                        <div className={style.description}>
                          {user && params.account !== user.account
                            ? '一旦完成，那些动态就会出现在这里'
                            : '你的照片动态将显示在这里。'}
                        </div>
                      </div>
                    </div>
                  )}
                </InfiniteScroll>
              </PullToRefresh>
            )}
          </div>
        </Swiper.Item>
        <Swiper.Item>
          <div key={'likes'} className={style.content}>
            {loading ? (
              <div className={style.center}>
                <LoadingCircle />
              </div>
            ) : (
              <PullToRefresh onRefresh={listPosts}>
                {posts.length > 0 &&
                  posts.map((obj) => (
                    <PostItem
                      key={obj._id}
                      handleCommentReportClick={handleCommentReportClick}
                      handleDeleteClick={handleDeleteClick}
                      {...obj}
                    />
                  ))}
                <InfiniteScroll
                  loadMore={async () => await loadMoreLikePosts(info._id)}
                  hasMore={hasNext && activeIndex === 2}
                >
                  {posts.length ? (
                    <div>全部加载完毕</div>
                  ) : (
                    <div className={style.empty}>
                      <div className={style.left}>
                        <div className={style.title}>
                          {user && params.account === user.account
                            ? '喜欢一些动态'
                            : `@${params.account} 还没有喜欢的动态`}
                        </div>
                        <div className={style.description}>
                          {user && params.account === user.account
                            ? '点击任何动态的心形图标以表支持。当你这么做时，它就会出现在这里。'
                            : `当 @${params.account} 有喜欢的动态后，就会出现在这里。`}
                        </div>
                      </div>
                    </div>
                  )}
                </InfiniteScroll>
              </PullToRefresh>
            )}
          </div>
        </Swiper.Item>
      </Swiper>
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
    </div>
  ) : (
    <UserCenterSkeleton />
  )
}

export default UserCenter

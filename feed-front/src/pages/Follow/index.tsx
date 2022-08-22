import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Image,
  InfiniteScroll,
  NavBar,
  PullToRefresh,
  SpinLoading,
  Swiper,
  Tabs,
  Toast,
} from 'antd-mobile'
import { SwiperRef } from 'antd-mobile/es/components/swiper'
import useFollowList from '../../hooks/useFollowList'
import * as userService from '../../services/user'
import { context } from '../../hooks/store'
import UserItem from '../../components/UserItem'
import LoadingCircle from '../../components/LoadingCircle'
import { ReactComponent as IconBack } from '../../assets/imgs/back.svg'
import style from './style.module.scss'

enum FollowType {
  following = 1,
  followed = 0,
}

const Follow = () => {
  const params = useParams()
  const type = params.type as 'following' | 'followed'
  const navigate = useNavigate()
  const { user } = useContext(context)
  const tabItems = useMemo(
    () => [
      { key: 'followed', title: '关注者' },
      { key: 'following', title: '正在关注' },
    ],
    []
  )
  const swiperRef = useRef<SwiperRef>(null)
  const [activeIndex, setActiveIndex] = useState(FollowType[type])
  const [userId, setUserId] = useState('')
  const [nickname, setNickname] = useState('')
  const {
    followedLoading,
    followingLoading,
    hasMoreFollowed,
    loadMoreFollowed,
    listFollowed,
    followedList,
    hasMoreFollowing,
    loadMoreFollowing,
    listFollowing,
    followingList,
  } = useFollowList(userId)
  const [error, setError] = useState('')

  useEffect(() => {
    if (error) {
      Toast.show({ content: error, icon: 'fail' })
      navigate('/500')
    }
  }, [error, navigate])

  /* 获取用户名 */
  const getNickname = useCallback(async () => {
    try {
      const res = await userService.detail(undefined, params.account)
      if (!res.code) {
        if (res.data) {
          setNickname(res.data.nickname)
          setUserId(res.data._id)
        }
      }
    } catch (error: any) {
      setError(error.message)
    }
  }, [params.account])

  useEffect(() => {
    if (params.account) {
      if (user && params.account === user.account) {
        setUserId(user._id)
        setNickname(user.nickname)
      } else {
        getNickname()
      }
    }
  }, [getNickname, params.account, user, userId])

  /* 获取关注/被关注列表 */
  useEffect(() => {
    if (userId) {
      if (!activeIndex) {
        listFollowed()
      } else {
        listFollowing()
      }
    }
  }, [activeIndex, listFollowed, listFollowing, userId])

  return (
    <div className={style.container}>
      <NavBar
        className={style.nav}
        back={null}
        left={
          <IconBack
            className={style.back}
            onClick={() => {
              navigate(-1)
            }}
          />
        }
      >
        {nickname}
      </NavBar>
      <Tabs
        className={style.tabs}
        activeKey={tabItems[activeIndex].key}
        onChange={(key) => {
          const index = tabItems.findIndex((obj) => obj.key === key)
          setActiveIndex(index)
          swiperRef.current?.swipeTo(index)
        }}
      >
        {tabItems.map((obj) => (
          <Tabs.Tab title={obj.title} key={obj.key} />
        ))}
      </Tabs>
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
          <div key={'followed'} className={style.content}>
            {followedLoading ? (
              <div className={style.center}>
                <LoadingCircle />
              </div>
            ) : (
              <PullToRefresh
                canReleaseText={<SpinLoading color="primary" />}
                onRefresh={async () => {
                  listFollowed()
                }}
              >
                {followedList &&
                  followedList.map((obj) => (
                    <UserItem
                      key={obj.userInfo._id}
                      userInfo={obj.userInfo}
                      followStatus={obj.followStatus}
                    />
                  ))}
                <InfiniteScroll
                  hasMore={hasMoreFollowed}
                  loadMore={loadMoreFollowed}
                >
                  {followedList && !followedList.length ? (
                    <div className={style.empty}>
                      <Image
                        src={require('../../assets/imgs/follow_empty.jpg')}
                        height={150}
                        width={300}
                      />
                      <div className={style.left}>
                        <div className={style.title}>{`${
                          user && params.account !== user.account
                            ? `@${params.account} `
                            : '你'
                        }没有关注任何人`}</div>
                        <div
                          className={style.description}
                        >{`但是这不会持续很久！${
                          user && params.account !== user.account
                            ? '他们'
                            : '你'
                        }关注的人会出现在这里。`}</div>
                      </div>
                    </div>
                  ) : followedList ? (
                    <div>全部加载完毕</div>
                  ) : null}
                </InfiniteScroll>
              </PullToRefresh>
            )}
          </div>
        </Swiper.Item>
        <Swiper.Item>
          <div key={'following'} className={style.content}>
            {followingLoading ? (
              <div className={style.center}>
                <LoadingCircle />
              </div>
            ) : (
              <PullToRefresh
                canReleaseText={<SpinLoading color="primary" />}
                onRefresh={async () => {
                  listFollowing()
                }}
              >
                {followingList &&
                  followingList.map((obj) => (
                    <UserItem
                      key={obj.userInfo._id}
                      userInfo={obj.userInfo}
                      followStatus={obj.followStatus}
                    />
                  ))}
                <InfiniteScroll
                  hasMore={hasMoreFollowing}
                  loadMore={loadMoreFollowing}
                >
                  {followingList && !followingList.length ? (
                    <div className={style.empty}>
                      <Image
                        src={require('../../assets/imgs/follow_empty.jpg')}
                        height={150}
                        width={300}
                      />
                      <div className={style.left}>
                        <div className={style.title}>{`寻找关注者`}</div>
                        <div
                          className={style.description}
                        >{`如果有人关注这个账号，他们就会显示在这里。发布动态和与别人互动都有助于吸引更多关注者。`}</div>
                      </div>
                    </div>
                  ) : followingList ? (
                    <div>全部加载完毕</div>
                  ) : null}
                </InfiniteScroll>
              </PullToRefresh>
            )}
          </div>
        </Swiper.Item>
      </Swiper>
    </div>
  )
}

export default Follow

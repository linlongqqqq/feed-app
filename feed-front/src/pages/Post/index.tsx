import {
  ActionSheet,
  Empty,
  Image,
  InfiniteScroll,
  NavBar,
  Skeleton,
  Toast,
} from 'antd-mobile'
import { useCallback, useEffect, useState } from 'react'
import classNames from 'classnames'
import { useNavigate, useParams } from 'react-router-dom'
import useLike from '../../hooks/useLike'
import useCurPost from '../../hooks/useCurPost'
import usePosts from '../../hooks/usePosts'
import { POST_CREATE, POST_DELETE } from '../../events'
import { IPostItem } from '../../libs/models'
import dayjs from '../../utils/dayjsUtil'
import ImageList from '../../components/ImageList'
import InfiniteScrollContent from '../../components/InfiniteScrollContent'
import SkeletonItem from '../../components/SkeletonItem'
import PopupPost from '../../components/PopupPost'
import PostItem from '../../components/PostItem'
import PostItemView from '../../components/PostItemView'
import { ReactComponent as IconBack } from '../../assets/imgs/goback.svg'
import { ReactComponent as IconComment } from '../../assets/imgs/post/comments.svg'
import { ReactComponent as IconReport } from '../../assets/imgs/post/forwarding.svg'
import { ReactComponent as IconLike } from '../../assets/imgs/post/like.svg'
import styles from './index.module.scss'

export default function Post() {
  const navigate = useNavigate()
  const { _id } = useParams()

  // 列表数据
  const {
    loading,
    setLoading,
    getPostDetail,
    getComments,
    getMoreComments,
    posts,
    setPosts,
    hasNext,
  } = usePosts()

  // 帖子详情
  const [postDetail, setPostDetail] = useState<IPostItem>()

  // 转发数、喜欢数
  const [tReports, setTReports] = useState(0)

  const { tLikes, setTLikes, setTLiked, tLiked, handleLikeClick } = useLike(
    _id!,
    0,
    false
  )

  // 初始化数据
  const init = useCallback(async () => {
    setLoading(true)
    if (_id && _id.length === 24) {
      const [detail] = await Promise.all([getPostDetail(_id), getComments(_id)])
      if (!detail || detail.deleted) {
        navigate('/404')
        Toast.show('未找到该帖子！')
        return
      }
      setTLikes(detail.likes)
      setTLiked(detail.liked)
      setTReports(detail.reposts)
      setPostDetail(detail)
    } else {
      navigate('/404')
      Toast.show('未找到该帖子！')
    }
    setLoading(false)
  }, [
    _id,
    getComments,
    getPostDetail,
    navigate,
    setLoading,
    setTLiked,
    setTLikes,
  ])

  useEffect(() => {
    init()
  }, [init])

  // 订阅评论和转发的消息
  useEffect(() => {
    const token = PubSub.subscribe(POST_CREATE, (msg: string, data) => {
      if (data.type === 2 && data.postId === _id) {
        setPosts([data.newPost, ...posts])
      } else if (data.type === 3 && data.postId === _id) {
        setTReports((preValue) => preValue! + 1)
      }
    })
    return () => {
      PubSub.unsubscribe(token)
    }
  }, [_id, posts, postDetail?.account, setPosts])

  // 订阅删除帖子的消息
  useEffect(() => {
    const token = PubSub.subscribe(POST_DELETE, (msg, data) => {
      setPosts(posts.filter((comment) => comment._id !== data.postId))
    })
    return () => {
      PubSub.unsubscribe(token)
    }
  }, [posts, setPosts])

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

  const [normal, setNormal] = useState(true)

  return (
    <div
      className={classNames(styles.container, {
        [styles.gray]: loading,
      })}
    >
      <NavBar
        onBack={() => navigate(-1)}
        backArrow={<IconBack />}
        className={styles.nav}
      >
        <span className={styles.headerTitle}>主题帖</span>
      </NavBar>
      {loading ? (
        <div className={styles.skeletonWrap}>
          <div className={styles.skeleton}>
            <div className={styles.header}>
              <Skeleton.Title animated className={styles.avatar} />
              <Skeleton.Paragraph
                lineCount={2}
                animated
                className={styles.info}
              />
            </div>
            <Skeleton.Paragraph lineCount={2} animated />
          </div>
          <div className={styles.split} style={{ width: '100vw' }}></div>
          <div className={styles.sList}>
            <SkeletonItem />
            <SkeletonItem />
          </div>
        </div>
      ) : (
        <div className={styles.main}>
          <div className={styles.mainInner}>
            {postDetail &&
              postDetail.type === 2 &&
              postDetail.relationPost &&
              (postDetail.relationPost.deleted ? (
                <div className={styles.deleted}>帖子被删除</div>
              ) : (
                <div
                  className={styles.viewWrap}
                  onClick={() => {
                    navigate(`/post/${postDetail.relationPost?._id}`)
                  }}
                >
                  <PostItemView
                    {...postDetail.relationPost}
                    type={2}
                    showFooter={true}
                  />
                </div>
              ))}
            {postDetail && (
              <div className={styles.viewWrap}>
                <div className={styles.repPostInner}>
                  <Image
                    src={postDetail.avatar}
                    className={classNames(styles.avatar)}
                    onClick={() =>
                      navigate(`/user-center/${postDetail.account}`)
                    }
                  />
                  <div className={styles.info}>
                    <div
                      className={styles.nickname}
                      onClick={() =>
                        navigate(`/user-center/${postDetail.account}`)
                      }
                    >
                      {postDetail.nickname}
                    </div>
                    <div
                      className={styles.account}
                      onClick={() =>
                        navigate(`/user-center/${postDetail.account}`)
                      }
                    >
                      @{postDetail.account}
                    </div>
                  </div>
                </div>
                {postDetail.relationPost && postDetail.type === 2 && (
                  <div className={styles.repParent}>
                    回复
                    <span
                      onClick={() =>
                        navigate(
                          `/user-center/${postDetail.relationPost?.account}`
                        )
                      }
                    >
                      @{postDetail.relationPost.account}
                    </span>
                  </div>
                )}
                <div className={styles.content}>{postDetail.content}</div>
                {postDetail.imgs.length > 0 && (
                  <ImageList imgs={postDetail.imgs} />
                )}
              </div>
            )}
          </div>
          {postDetail && (
            <>
              {postDetail.relationPost &&
                postDetail.type === 3 &&
                (postDetail.relationPost.deleted ? (
                  <div className={classNames(styles.deleted, styles.p20)}>
                    帖子被删除
                  </div>
                ) : (
                  <div
                    className={styles.repPost}
                    onClick={() => {
                      navigate(`/post/${postDetail.relationPost?._id}`)
                    }}
                  >
                    <PostItemView
                      {...postDetail.relationPost}
                      type={3}
                      showFooter={true}
                    />
                  </div>
                ))}
              <div className={styles.time}>
                {dayjs(postDetail.createdAt).format('YYYY/MM/DD hh:mm')}
              </div>
              <div className={styles.rlData}>
                <a href={`/reposted/${_id}`}>
                  <span className={styles.strong}>{tReports}</span>
                  转发
                </a>
                <a href={`/liked/${_id}`}>
                  <span className={styles.strong}>{tLikes}</span>
                  喜欢
                </a>
              </div>
              <div className={styles.actions}>
                <div
                  className={styles['action-item']}
                  onClick={() => handleCommentReportClick(_id!, 2, postDetail)}
                >
                  <IconComment />
                </div>
                <div
                  className={styles['action-item']}
                  onClick={() => handleCommentReportClick(_id!, 3, postDetail)}
                >
                  <IconReport />
                </div>
                <div className={styles['action-item']}>
                  <IconLike
                    onClick={async (e) => {
                      e.stopPropagation()
                      setNormal(false)
                      await handleLikeClick()
                      setTimeout(() => {
                        setNormal(true)
                      }, 2000)
                    }}
                    className={classNames(styles.basic, {
                      [styles.unlike]: !tLiked,
                      [styles.liked]: tLiked,
                      [styles.normal]: normal,
                    })}
                  />
                </div>
              </div>
            </>
          )}
          <div className={styles.split}></div>
          {posts && posts.length > 0 ? (
            <>
              {posts.map((comment) => (
                <PostItem
                  key={comment._id}
                  relationPost={{ account: postDetail?.account } as IPostItem}
                  {...comment}
                  handleCommentReportClick={handleCommentReportClick}
                  handleDeleteClick={handleDeleteClick}
                />
              ))}
              <InfiniteScroll
                loadMore={() => getMoreComments(_id!)}
                hasMore={hasNext}
              >
                <InfiniteScrollContent hasMore={hasNext} />
              </InfiniteScroll>
            </>
          ) : (
            <Empty description="暂无数据" />
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
        </div>
      )}
    </div>
  )
}

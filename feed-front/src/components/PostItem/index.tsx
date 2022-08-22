import { useContext, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Image } from 'antd-mobile'
import classNames from 'classnames'
import PostItemView from '../PostItemView'
import ImageList from '../ImageList'
import { IPostDetail, IPostItem } from '../../libs/models'
import useLike from '../../hooks/useLike'
import { context } from '../../hooks/store'
import dayjs from '../../utils/dayjsUtil'
import { LIKE_POST, POST_CREATE, POST_DELETE } from '../../events'
import { ReactComponent as IconComment } from '../../assets/imgs/post/comments.svg'
import { ReactComponent as IconReport } from '../../assets/imgs/post/forwarding.svg'
import { ReactComponent as IconLike } from '../../assets/imgs/post/like.svg'
import styles from './index.module.scss'

type Props = IPostItem & {
  handleCommentReportClick: (
    _id: string,
    popupType: number,
    post: IPostDetail
  ) => void
  handleDeleteClick?: (_id: string, post: IPostDetail) => void
}

// 查看帖子、不可进行操作
export default function PostItem({
  _id,
  avatar,
  imgs,
  content,
  nickname,
  account,
  createdAt,
  type,
  comments,
  reposts,
  likes,
  liked,
  handleCommentReportClick,
  relationPost,
  handleDeleteClick,
  userId,
  deleted,
  relationId,
}: Props) {
  const navigate = useNavigate()

  const { tLikes, tLiked, handleLikeClick } = useLike(_id, likes, liked)

  const [tComments, setTComments] = useState(comments)
  const [tReposts, setTreposts] = useState(reposts)
  const { user } = useContext(context)

  // todo: 不应该在数组里面（PostItems）订阅消息、应该在页面层级
  useEffect(() => {
    // 订阅帖子创建的消息
    const token = PubSub.subscribe(POST_CREATE, (msg: string, data: any) => {
      if (data.type === 2 && data.postId === _id) {
        setTComments(tComments + 1)
        setCommentsBig(true)
        setTimeout(() => {
          setCommentsBig(false)
        }, 1000)
      } else if (data.type === 3 && data.postId === _id) {
        setTreposts(tReposts + 1)
        setRepostsBig(true)
        setTimeout(() => {
          setRepostsBig(false)
        }, 1000)
      }
    })

    // 订阅帖子删除的消息
    const tokenDelete = PubSub.subscribe(
      POST_DELETE,
      (msg: string, data: any) => {
        // 如果被删除的帖子的关联帖子是这个帖子
        if (data.curPost.relationId === _id) {
          if (data.curPost.type === 2) {
            setTComments(tComments - 1)
            setCommentsBig(true)
            setTimeout(() => {
              setCommentsBig(false)
            }, 1000)
          } else if (data.curPost.type === 3) {
            setTreposts(tReposts - 1)
            setRepostsBig(true)
            setTimeout(() => {
              setRepostsBig(false)
            }, 1000)
          }
        }
      }
    )

    return () => {
      PubSub.unsubscribe(token)
      PubSub.unsubscribe(tokenDelete)
    }
  }, [_id, tComments, tReposts])

  const [commentsBig, setCommentsBig] = useState(false)
  const [repostsBig, setRepostsBig] = useState(false)

  const curPost: IPostDetail = useMemo(() => {
    return {
      userId,
      avatar,
      nickname,
      account,
      liked,
      imgs,
      _id,
      content,
      createdAt,
      type,
      comments,
      reposts,
      likes,
      deleted,
      relationId,
    }
  }, [
    _id,
    account,
    avatar,
    comments,
    content,
    createdAt,
    deleted,
    imgs,
    liked,
    likes,
    nickname,
    relationId,
    reposts,
    type,
    userId,
  ])

  const [normal, setNormal] = useState(true)

  return (
    <div
      className={classNames(styles.container, {
        [styles.gray]: commentsBig || repostsBig,
      })}
      onClick={() => navigate(`/post/${_id}`)}
    >
      <Image
        src={avatar}
        className={styles.avatar}
        onClick={(e) => {
          e.stopPropagation()
          navigate(`/user-center/${account}`)
        }}
      />
      <div className={styles.main}>
        <div className={styles.info}>
          <span className={styles.nickname}>{nickname}</span>
          <span className={styles.account}>{`@${account} · `}</span>
          <span className={styles.createdAt}>
            {Date.now() - createdAt >= 14 * 24 * 3600 * 1000
              ? dayjs(createdAt).format('YYYY-MM-DD')
              : dayjs(createdAt).local().fromNow()}
          </span>
          <span
            className={classNames(styles.none, {
              [styles.actionDelete]: userId === user?._id,
            })}
            onClick={(e) => {
              e.stopPropagation()
              handleDeleteClick && handleDeleteClick(_id, curPost)
            }}
          >
            ···
          </span>
        </div>
        {type === 2 && relationPost && (
          <div className={styles.reply}>
            回复
            <span
              onClick={(e) => {
                e.stopPropagation()
                navigate(`/user-center/${relationPost.account}`)
              }}
            >
              @{relationPost.account}
            </span>
          </div>
        )}
        <div className={styles.content}>{content}</div>
        {imgs.length > 0 && <ImageList imgs={imgs} />}
        {type === 3 &&
          relationPost &&
          (relationPost.deleted ? (
            <div className={styles.deletedPost}>帖子被删除</div>
          ) : (
            <div
              className={styles.relationRePost}
              onClick={(e) => {
                navigate(`/post/${relationPost._id}`)
                e.stopPropagation()
              }}
            >
              <PostItemView {...relationPost} type={3} />
            </div>
          ))}
        <div className={styles.actions}>
          <div
            className={styles['action-item']}
            onClick={(e) => {
              e.stopPropagation()
              handleCommentReportClick(_id, 2, curPost)
            }}
          >
            <IconComment />
            <span
              className={classNames({
                [styles.big]: commentsBig,
              })}
            >
              {tComments}
            </span>
          </div>
          <div
            className={styles['action-item']}
            onClick={(e) => {
              e.stopPropagation()
              handleCommentReportClick(_id, 3, curPost)
            }}
          >
            <IconReport />
            <span
              className={classNames({
                [styles.big]: repostsBig,
              })}
            >
              {tReposts}
            </span>
          </div>
          <div className={styles['action-item']}>
            <IconLike
              onClick={async (e) => {
                e.stopPropagation()
                setNormal(false)
                PubSub.publish(LIKE_POST, { _id })
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
            <span>{tLikes}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

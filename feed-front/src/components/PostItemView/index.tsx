import { Image } from 'antd-mobile'
import classNames from 'classnames'
import ImageList from '../ImageList'
import { IPostDetail } from '../../libs/models'
import dayjs from '../../utils/dayjsUtil'
import { ReactComponent as IconComment } from '../../assets/imgs/post/comments.svg'
import { ReactComponent as IconReport } from '../../assets/imgs/post/forwarding.svg'
import { ReactComponent as IconLike } from '../../assets/imgs/post/like.svg'
import styles from './index.module.scss'

type Props = IPostDetail & {
  showFooter?: boolean
}

// 查看帖子、不可进行操作
export default function PostItemView({
  avatar,
  imgs,
  content,
  nickname,
  account,
  createdAt,
  type,
  comments,
  likes,
  reposts,
  showFooter = false,
}: Props) {
  return (
    <div
      className={classNames(styles.me, {
        [styles.meWrap]: type === 3,
      })}
    >
      <Image
        src={avatar}
        className={classNames(styles.avatar, {
          [styles.link]: type === 2,
        })}
      />
      <div className={styles.info}>
        <span className={styles.nickname}>{nickname}</span>
        <span className={styles.account}>{`@${account} · `}</span>
        <span className={styles.createdAt}>
          {Date.now() - createdAt >= 14 * 24 * 3600 * 1000
            ? dayjs(createdAt).format('YYYY-MM-DD')
            : dayjs(createdAt).local().fromNow()}
        </span>
      </div>
      <div className={styles.mainContent}>
        <div className={styles.content}>{content}</div>
        {imgs.length > 0 && <ImageList imgs={imgs} />}
        {showFooter && (
          <div className={styles.actions}>
            <div className={styles['action-item']}>
              <IconComment />
              <span>{comments}</span>
            </div>
            <div className={styles['action-item']}>
              <IconReport />
              <span>{reposts}</span>
            </div>
            <div className={styles['action-item']}>
              <IconLike
                className={classNames({
                  [styles.unlike]: true,
                })}
              />
              <span>{likes}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

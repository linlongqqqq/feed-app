import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Avatar, Button, Ellipsis, Toast } from 'antd-mobile'
import classNames from 'classnames'
import { IUser } from '../../libs/models'
import * as followService from '../../services/follow'
import { context } from '../../hooks/store'
import style from './style.module.scss'

const UserItem = (props: {
  userInfo: Required<
    Pick<IUser, 'avatar' | 'nickname' | 'account' | 'bio' | '_id'>
  >
  followStatus: { isFollowing: boolean; isFollowed: boolean }
}) => {
  const { userInfo } = props

  const navigate = useNavigate()
  const { user } = useContext(context)
  const [followStatus, setFollowStatus] = useState<{
    isFollowing: boolean
    isFollowed: boolean
  }>()
  const [error, setError] = useState('')

  useEffect(() => {
    if (error) {
      Toast.show({ content: error, icon: 'fail' })
      navigate('/500')
    }
  }, [error, navigate])

  /* 检查关注状态 */
  useEffect(() => {
    setFollowStatus({
      isFollowing: props.followStatus.isFollowing,
      isFollowed: props.followStatus.isFollowed,
    })
  }, [props.followStatus.isFollowed, props.followStatus.isFollowing])

  /* 关注\取关 */
  const toggleFollow = useCallback(async () => {
    try {
      const res = await followService.toggleFollow(userInfo._id)
      if (!res.code) {
        if (!res.data) {
          Toast.show({
            content: '取关成功',
            position: 'bottom',
            duration: 800,
          })
          setFollowStatus({ ...followStatus!, isFollowing: false })
        } else {
          Toast.show({
            content: '关注成功',
            position: 'bottom',
            duration: 800,
          })
          setFollowStatus({ ...followStatus!, isFollowing: true })
        }
      }
    } catch (error: any) {
      setError(error.message)
    }
  }, [followStatus, userInfo._id])

  /* 关注按钮 */
  const FollowButton = useMemo(() => {
    let buttonString
    if (followStatus) {
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
          onClick={() => {
            toggleFollow()
          }}
        >
          {buttonString}
        </Button>
      )
    }
  }, [followStatus, toggleFollow])

  return (
    <div className={style.container}>
      <Link to={`/user-center/${userInfo.account}`}>
        <Avatar className={style.avatar} src={userInfo.avatar} />
      </Link>
      <div className={style.right}>
        <div className={style.user}>
          <Link to={`/user-center/${userInfo.account}`}>
            <div className={style.left}>
              <div className={style.name}>{userInfo.nickname}</div>
              <div className={style.uid}>{`@${userInfo.account}`}</div>
            </div>
          </Link>
          {user && user.account !== userInfo.account && FollowButton}
        </div>
        <Link to={`/user-center/${userInfo.account}`}>
          <Ellipsis className={style.bio} rows={3} content={userInfo.bio} />
        </Link>
      </div>
    </div>
  )
}

export default UserItem

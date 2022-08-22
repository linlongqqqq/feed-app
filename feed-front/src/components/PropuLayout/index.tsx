import { Popup, Avatar, Button, Toast, Dialog } from 'antd-mobile'
import React, { useCallback, useContext, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import * as serviceFollow from '../../services/follow'
import request from '../../libs/request'
import { context } from '../../hooks/store'
import { ReactComponent as IconPersonal } from '../../assets/imgs/personal.svg'
import { ReactComponent as IconHome } from '../../assets/imgs/menu/home.svg'
import styles from './styles.module.scss'

interface Props {
  visible1: boolean
  setvisible1: (value: React.SetStateAction<boolean>) => void
}

export default function PropuLayout({ visible1, setvisible1 }: Props) {
  const { user } = useContext(context)
  const [data, setData] = useState<{ following: number; followed: number }>()
  const navigate = useNavigate()
  const getData = useCallback(async () => {
    const { data } = await serviceFollow.countFollow(user!._id)
    setData(data)
  }, [user])

  useEffect(() => {
    getData()
  }, [getData])

  return (
    <div>
      <Popup
        visible={visible1}
        onMaskClick={() => {
          setvisible1(false)
        }}
        position="left"
        bodyStyle={{ minWidth: '60vw' }}
      >
        <div className={styles.popup}>
          <div className={styles.content}>
            <Avatar
              className={styles.avatar}
              onClick={() => {
                setvisible1(true)
                navigate(`/user-center/${user?.account}`)
              }}
              src={user!.avatar}
            />
            <a href={`/user-center/${user?.account}`}>
              <div className={styles.name}>{user?.nickname}</div>
            </a>
            <a href={`/user-center/${user?.account}`}>
              <div className={styles.at}>{'@' + user?.account}</div>
            </a>
            <div className={styles.num}>
              <a href={`/follow/${user?.account}/following`}>
                <span className={styles.count}>{data?.following}</span> 正在关注
              </a>
              &nbsp;&nbsp;&nbsp;
              <a href={`/follow/${user?.account}/followed`}>
                <span className={styles.count}>{data?.followed}</span> 关注者
              </a>
            </div>
            <div className={styles.link}>
              <div className={styles.linkItem}>
                <IconHome />
                &nbsp;
                <Link to={`/user-center/${user?.account}`}>
                  <span> 个人主页 </span>
                </Link>
              </div>
              <div className={styles.linkItem}>
                <IconPersonal />
                &nbsp;
                <Link to="/user-edit">
                  <span> 个人资料 </span>
                </Link>
              </div>
            </div>
          </div>
          <div className={styles.buttom}>
            <Button
              block
              color="danger"
              size="middle"
              onClick={async () => {
                Dialog.confirm({
                  content: '确定要退出登陆吗？',
                  onConfirm: async () => {
                    Toast.show({
                      icon: 'success',
                      content: '退出成功',
                      position: 'bottom',
                    })
                    await request.post('/user/logout').then((res) => {
                      Toast.show({
                        icon: 'success',
                        content: '退出登录成功',
                      })
                      navigate('/login')
                      localStorage.setItem('list', JSON.stringify(''))
                    })
                  },
                })
              }}
            >
              退出登录
            </Button>
          </div>
        </div>
      </Popup>
    </div>
  )
}

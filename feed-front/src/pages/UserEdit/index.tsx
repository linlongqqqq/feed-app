import { useCallback, useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import classNames from 'classnames'
import { Avatar, Image, Input, NavBar, TextArea, Toast } from 'antd-mobile'
import { ImageUploadItem } from 'antd-mobile/es/components/image-uploader'
import { context } from '../../hooks/store'
import useFile from '../../hooks/useFile'
import { usePrompt } from '../../hooks/usePrompt'
import * as userService from '../../services/user'
import { IUser } from '../../libs/models'
import { getStringLength } from '../../utils'
import FileUploader from '../../components/FileUploader'
import { ReactComponent as IconBack } from '../../assets/imgs/back.svg'
import { ReactComponent as IconCamera } from '../../assets/imgs/camera.svg'
import style from './style.module.scss'

const UserEdit = () => {
  const navigate = useNavigate()
  const { user, setUser } = useContext(context)
  const [nickname, setNickname] = useState<string>('')
  const [bio, setBio] = useState<string>('')
  const [oldBanner, setOldBanner] = useState<string>('')
  const [oldAvatar, setOldAvatar] = useState<string>('')
  const [saveFlag, setSaveFlag] = useState(true)
  const [banner, setBanner] = useState<ImageUploadItem[]>([])
  const [avatar, setAvatar] = useState<ImageUploadItem[]>([])
  const [error, setError] = useState('')
  const { upload } = useFile()

  useEffect(() => {
    if (error) {
      Toast.show({ content: error, icon: 'fail' })
      navigate('/500')
    }
  }, [error, navigate])

  /* 获取用户信息 */
  useEffect(() => {
    if (user) {
      setNickname(user.nickname)
      setBio(user.bio)
      if (!banner[0]) setOldBanner(user.banner)
      if (!avatar[0]) setOldAvatar(user.avatar)
    }
  }, [avatar, banner, user])

  /* 更新背景图 */
  useEffect(() => {
    if (banner.length > 1) {
      setBanner([banner[1]])
    }
  }, [banner])

  /* 更新头像 */
  useEffect(() => {
    if (avatar.length > 1) {
      setAvatar([avatar[1]])
    }
  }, [avatar])

  useEffect(() => {
    if (
      getStringLength(nickname) === 10 &&
      nickname &&
      user &&
      nickname !== user.nickname
    )
      Toast.show({
        content: '达到昵称最长10字符',
        position: 'bottom',
        duration: 800,
      })
  }, [nickname, user])

  /* 监控变更是否保存 */
  useEffect(() => {
    if (
      user &&
      ((avatar.length && avatar[0].url !== oldAvatar) ||
        (banner.length && banner[0].url === oldBanner) ||
        (nickname && nickname !== user.nickname) ||
        bio !== user.bio)
    )
      setSaveFlag(false)
    else setSaveFlag(true)
  }, [avatar, banner, bio, nickname, oldAvatar, oldBanner, user])

  /* 保存修改 */
  const handleSave = useCallback(async () => {
    let newInfo: Partial<IUser> = {
      bio,
      nickname,
    }
    if (nickname === user?.nickname || !nickname.trim()) {
      delete newInfo.nickname
    } else {
      // 考虑原微信名超10字符的情况
      if (getStringLength(nickname) > 10) {
        return Toast.show({
          icon: 'fail',
          content: '昵称最大长度10字符',
          position: 'bottom',
          duration: 800,
        })
      }
    }
    if (bio === user?.bio) {
      delete newInfo.bio
    }
    if (avatar.length) {
      newInfo.avatar = avatar[0].url
    }
    if (banner.length) {
      newInfo.banner = banner[0].url
    }
    if (Object.keys(newInfo).length) {
      try {
        const res = await userService.update(newInfo)
        if (!res.code) {
          Toast.show({
            content: '更新成功',
            position: 'bottom',
            duration: 800,
          })
          // 更新context
          setUser({ ...user!, ...newInfo })
          setSaveFlag(true)
          // 清空
          setAvatar([])
          setBanner([])
        }
      } catch (error: any) {
        setError(error.message)
      }
    } else {
      Toast.show({
        content: '资料无变更',
        position: 'bottom',
        duration: 800,
      })
    }
  }, [avatar, banner, bio, nickname, setUser, user])

  /* 路由转跳前判断更改是否保存 */
  usePrompt('信息修改尚未保存，是否离开页面？', !saveFlag)

  return (
    <div className={style.conatiner}>
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
        right={
          <div
            style={{ fontWeight: 'normal', fontSize: 16 }}
            onClick={handleSave}
          >
            保存
          </div>
        }
      >
        编辑个人资料
      </NavBar>
      <main className={style.main}>
        <Image
          src={
            banner.length
              ? banner[0].url + '?x-oss-process=image/resize,w_300'
              : oldBanner
              ? oldBanner
              : require('../../assets/imgs/banner.jpeg')
          }
          className={style.background}
          fit="cover"
        />
        <IconCamera className={style.bannerCamera} />
        <div className={style.backgroundMask}>
          <FileUploader files={banner} setFiles={setBanner} upload={upload}>
            <div className={style.backgroundMask} />
          </FileUploader>
        </div>
        <Avatar
          src={
            avatar.length
              ? avatar[0].url + '?x-oss-process=image/resize,w_200'
              : oldAvatar
          }
          className={style.avatar}
        />
        <IconCamera className={style.avatarCamera} />
        <div className={style.avatarMask}>
          <FileUploader files={avatar} setFiles={setAvatar} upload={upload}>
            <div className={style.avatarMask} />
          </FileUploader>
        </div>
        <div className={style.info}>
          <div className={style.item}>
            <span className={style.title}>姓名</span>
            <Input
              className={style.input}
              value={nickname}
              onChange={(value) => {
                setNickname(value)
              }}
              maxLength={10}
            />
          </div>
          <div className={classNames(style.item, style.flex)}>
            <span className={style.title}>简介</span>
            <TextArea
              className={style.input}
              value={bio}
              onChange={(value) => {
                setBio(value)
                console.log(getStringLength(value))
              }}
              showCount
              maxLength={100}
              autoSize
            />
          </div>
        </div>
      </main>
    </div>
  )
}

export default UserEdit

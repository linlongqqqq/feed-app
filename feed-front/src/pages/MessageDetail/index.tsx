import { useNavigate, useParams } from 'react-router-dom'
import {
  Fragment,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import classNames from 'classnames'
import { Button, NavBar, Popover, Toast, Image, TextArea } from 'antd-mobile'
import { ImageUploadItem } from 'antd-mobile/es/components/image-uploader'
import { TextAreaRef } from 'antd-mobile/es/components/text-area'
import { CloseOutline } from 'antd-mobile-icons'
import * as messageService from '../../services/message'
import * as userService from '../../services/user'
import { deleteFile } from '../../services/file'
import useFile from '../../hooks/useFile'
import useMessageDetail from '../../hooks/useMessageDetail'
import { context } from '../../hooks/store'
import { usePrompt } from '../../hooks/usePrompt'
import { MESSAGE_RECEIVE } from '../../events'
import { getStringLength } from '../../utils'
import MessageBox from '../../components/MessageBox'
import FileUploader from '../../components/FileUploader'
import LoadingCircle from '../../components/LoadingCircle'
import { ReactComponent as IconBack } from '../../assets/imgs/back.svg'
import { ReactComponent as IconPhoto } from '../../assets/imgs/photo.svg'
import style from './style.module.scss'

const MessageDetail = () => {
  const params = useParams()
  const navigate = useNavigate()
  const { user, ws } = useContext(context)
  const [nickname, setNickname] = useState('')
  const [userId, setUserId] = useState('')
  const [messageType, setMessageType] = useState(1)
  const [photo, setPhoto] = useState<ImageUploadItem[]>([])
  const [preview, setPreview] = useState(false)
  const [unread, setUnread] = useState(0)
  const [bottomFlag, setBottomFlag] = useState(false)
  const [initFlag, setInitFlag] = useState(false)
  const [scrollFlag, setScrollFlag] = useState(false)
  const [clickFlag, setClickFlag] = useState(false)
  const [currentHeight, setCurrentHeight] = useState(0)
  const [refreshFlag, setRefreshFlag] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [input, setInput] = useState('')
  const [error, setError] = useState('')
  const unreadRef = useRef<HTMLDivElement>(null)
  const mainRef = useRef<HTMLDivElement>(null)
  const lastRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<TextAreaRef>(null)
  const textRef = useRef('')
  const agents = useMemo(
    () => ['iphone', 'ipad', 'ipod', 'android', 'linux', 'windows phone'],
    []
  )
  const { upload } = useFile()
  const {
    loading,
    unreadId,
    setUnreadId,
    list,
    listMessages,
    setList,
    listPrev,
    hasPrev,
  } = useMessageDetail(userId)

  /* ??????????????????????????????????????? */
  usePrompt('?????????????????????????????????????????????', input !== '')

  useEffect(() => {
    if (error) {
      Toast.show({ content: error, icon: 'fail' })
      navigate('/500')
    }
  }, [error, navigate])

  /* ???????????????????????? */
  const checkIsMobile = useCallback(() => {
    // ??????ua
    setTimeout(() => {
      let flag = false
      for (let i = 0; i < agents.length; i++) {
        if (navigator.userAgent.toLowerCase().indexOf(agents[i]) !== -1) {
          setIsMobile(true)
          flag = true
        }
      }
      if (!flag) {
        setIsMobile(false)
      }
    }, 1)
  }, [agents])

  useEffect(() => {
    checkIsMobile()
    window.addEventListener('resize', checkIsMobile)
    // ??????
    return () => {
      window.removeEventListener('resize', checkIsMobile)
    }
  }, [checkIsMobile])

  /* ???????????????????????? */
  useEffect(() => {
    if (userId) listMessages()
  }, [listMessages, userId])

  /* ?????????????????? */
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
      getNickname()
    }
  }, [getNickname, params.account])

  /* ???????????? */
  useEffect(() => {
    if (photo.length > 1) {
      setPhoto([photo[1]])
    }
    if (photo.length) {
      setMessageType(2)
      setPreview(true)
    } else {
      setMessageType(1)
      setPreview(false)
    }
  }, [photo])

  /* ???????????????????????????????????????????????? */
  useEffect(() => {
    const token = PubSub.subscribe(
      MESSAGE_RECEIVE,
      async (
        msg: string,
        data: {
          messageId: string
          senderId: string
          receiverId: string
        }
      ) => {
        if (data.senderId === userId) {
          // ??????????????????????????????????????????????????????
          if (!bottomFlag && !unread) {
            setUnreadId(data.messageId)
          } else if (!unread) {
            setUnreadId('')
          }
          await messageService.setRead(data.messageId)
          const res = await messageService.detail(data.messageId)
          setList((pre) => [...pre!, res.data.message])
          if (!bottomFlag)
            setUnread((preValue) => {
              return ++preValue
            })
          if (bottomFlag) {
            // ???????????????
            setTimeout(() => {
              if (mainRef.current) {
                mainRef.current.scrollTo({
                  top: mainRef.current.scrollHeight,
                })
              }
            }, 150)
          }
        }
      }
    )
    return () => {
      PubSub.unsubscribe(token)
    }
  }, [bottomFlag, list, setList, setUnreadId, unread, userId])

  /* ???????????? */
  useEffect(() => {
    if (getStringLength(input) === 140)
      Toast.show({
        content: '??????????????????140??????',
        position: 'bottom',
        duration: 800,
      })
  }, [input])

  const sendMessage = useCallback(async () => {
    try {
      let content = ''
      if (messageType === 1) {
        content = textRef.current
      }
      if (messageType === 2) {
        content = photo[0].url
      }
      if (content.trim() && user) {
        const res = await messageService.create(content, userId, messageType)
        const reqData = {
          messageId: res.data.messageId,
          senderId: user._id,
          receiverId: userId,
          type: 'sendMessage',
        }
        ws?.send(JSON.stringify(reqData))
        setList([...list!, res.data.message])
        if (messageType === 2 && textRef.current.trim()) {
          const text = await messageService.create(textRef.current, userId, 1)
          const textData = {
            messageId: text.data.messageId,
            senderId: user._id,
            receiverId: userId,
            type: 'sendMessage',
          }
          setTimeout(() => {
            ws?.send(JSON.stringify(textData))
            setList((pre) => [...pre!, text.data.message])
          }, 50)
        }
        if (!res.code) {
          Toast.show({
            content: '????????????',
            position: 'bottom',
            duration: 800,
          })
          // ????????????
          setInput('')
          textRef.current = ''
          setPhoto([])
          // ???????????????
          setTimeout(() => {
            if (mainRef.current) {
              mainRef.current.scrollTo({
                top: mainRef.current.scrollHeight,
              })
            }
          }, 200)
        }
      } else {
        Toast.show({
          icon: 'fail',
          content: '????????????????????????',
          duration: 800,
        })
      }
    } catch (error: any) {
      setError(error.message)
    }
  }, [list, messageType, photo, setList, user, userId, ws])

  /* ?????????????????? */
  const handleMessageDelete = useCallback(
    async (messageId: string, index: number) => {
      try {
        const res = await messageService.remove(messageId)
        if (!res.code) {
          Toast.show({
            content: '????????????',
            position: 'bottom',
            duration: 800,
          })
          list!.splice(index, 1)
          setList([...list!])
        }
      } catch (error: any) {
        setError(error.message)
      }
    },
    [list, setList]
  )

  /* ?????????????????????????????????????????????????????????????????????????????????????????????????????? */
  /* ????????????main?????? */
  useEffect(() => {
    if (mainRef.current && !initFlag && list && list.length) {
      if (unreadRef.current) {
        mainRef.current!.scrollTo(0, unreadRef.current.offsetTop - 70)
      } else {
        mainRef.current.scrollTo({
          top: mainRef.current.scrollHeight,
        })
        setInitFlag(true)
      }
      setCurrentHeight(mainRef.current.scrollHeight)
    }
  }, [initFlag, list])

  /* ??????????????????????????? */
  useEffect(() => {
    if (bottomFlag) {
      setUnread(0)
    }
  }, [bottomFlag])

  /* ???????????????????????????????????? */
  useEffect(() => {
    if (
      list &&
      lastRef.current &&
      mainRef.current &&
      lastRef.current.offsetTop - mainRef.current.scrollTop <=
        mainRef.current.clientHeight + 100
    ) {
      setBottomFlag(true)
    } else {
      setBottomFlag(false)
    }
  }, [list])

  /* ???????????????????????????????????? */
  useEffect(() => {
    setTimeout(() => {
      if (refreshFlag && mainRef.current) {
        const newHeight = mainRef.current!.scrollHeight
        mainRef.current.scrollTo({
          top: newHeight - currentHeight + 10,
        })
        setCurrentHeight(newHeight)
        setRefreshFlag(false)
      }
    }, 50) //????????????????????????????????????
  }, [currentHeight, refreshFlag])

  /* ?????????????????? */
  const handleScroll = useCallback(() => {
    setScrollFlag(true)
    // ????????????
    if (
      lastRef.current &&
      mainRef.current &&
      lastRef.current.offsetTop - mainRef.current!.scrollTop <=
        mainRef.current.clientHeight + 100
    ) {
      setBottomFlag(true)
    } else {
      setBottomFlag(false)
    }
    /* ???????????????????????? */
    if (mainRef.current && hasPrev && mainRef.current.scrollTop <= 100) {
      listPrev()
      setRefreshFlag(true)
    }
  }, [hasPrev, listPrev])

  /* PC????????????????????? */
  const handleInput = useCallback(
    (value: string) => {
      textRef.current = value
      setInput(textRef.current)
      if (inputRef.current && inputRef.current.nativeElement) {
        inputRef.current.nativeElement.onkeydown = (e) => {
          // ctrl+enter??????
          if (e.key === 'Enter' && e.ctrlKey) {
            textRef.current = value + '\n'
            setInput(textRef.current)
            // enter
          } else if (e.key === 'Enter') {
            // PC???enter??????
            if (!isMobile) {
              e.preventDefault()
              sendMessage()
            } else {
              // ???????????????
              textRef.current = value
              setInput(textRef.current)
            }
          }
          return
        }
      }
    },
    [isMobile, sendMessage]
  )

  return (
    <div
      className={style.conatiner}
      // ????????????????????????
      onMouseDownCapture={() => {
        setClickFlag(true)
      }}
      // ??????????????????
      onTouchStartCapture={() => {
        setClickFlag(true)
      }}
    >
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

      <main
        /* ?????????????????????????????? */
        className={classNames(style.main, {
          [style.initScroll]: !initFlag || refreshFlag,
        })}
        ref={mainRef}
        onScroll={handleScroll}
      >
        {!hasPrev && list && list.length ? (
          <div className={style.loadAll}>????????????????????????</div>
        ) : null}
        {loading ? (
          <div style={{ marginTop: '30vh' }}>
            <LoadingCircle />
          </div>
        ) : (
          <Fragment>
            {list &&
              list.map((obj, index) => {
                if (obj._id === unreadId) {
                  return (
                    <Fragment>
                      <div
                        className={style.unread}
                        key={`unread${obj._id}`}
                        ref={unreadRef}
                      >
                        ??????
                      </div>
                      {index === list.length - 1 ? (
                        <div
                          ref={lastRef}
                          style={{ marginBottom: '20px' }}
                          key={`last${obj._id}`}
                        >
                          <MessageBox
                            key={obj._id}
                            index={index}
                            message={obj}
                            onMessageDelete={(
                              messageId: string,
                              index: number
                            ) => handleMessageDelete(messageId, index)}
                            scrollFlag={scrollFlag}
                            setScrollFlag={() => setScrollFlag(false)}
                            clickFlag={clickFlag}
                            setClickFlag={() => setClickFlag(false)}
                          />
                        </div>
                      ) : (
                        <MessageBox
                          key={obj._id}
                          index={index}
                          message={obj}
                          onMessageDelete={(messageId: string, index: number) =>
                            handleMessageDelete(messageId, index)
                          }
                          scrollFlag={scrollFlag}
                          setScrollFlag={() => setScrollFlag(false)}
                          clickFlag={clickFlag}
                          setClickFlag={() => setClickFlag(false)}
                        />
                      )}
                    </Fragment>
                  )
                }
                if (index === list.length - 1)
                  return (
                    <div
                      ref={lastRef}
                      style={{ marginBottom: '20px' }}
                      key={`last${obj._id}`}
                    >
                      <MessageBox
                        key={obj._id}
                        index={index}
                        message={obj}
                        onMessageDelete={(messageId: string, index: number) =>
                          handleMessageDelete(messageId, index)
                        }
                        scrollFlag={scrollFlag}
                        setScrollFlag={setScrollFlag}
                        clickFlag={clickFlag}
                        setClickFlag={() => setClickFlag(false)}
                      />
                    </div>
                  )
                return (
                  <MessageBox
                    key={obj._id}
                    index={index}
                    message={obj}
                    onMessageDelete={(messageId: string, index: number) =>
                      handleMessageDelete(messageId, index)
                    }
                    scrollFlag={scrollFlag}
                    setScrollFlag={setScrollFlag}
                    clickFlag={clickFlag}
                    setClickFlag={() => setClickFlag(false)}
                  />
                )
              })}
          </Fragment>
        )}
      </main>
      <Popover
        content={
          <div
            // ????????????????????????
            onClick={() => {
              if (unreadRef.current) {
                mainRef.current!.scrollTo(
                  0,
                  unreadRef.current.offsetTop - 70 || 0
                )
              } else {
                mainRef.current!.scrollTo({
                  top: mainRef.current!.scrollHeight,
                })
              }
              setUnread(0)
            }}
          >
            {unread}
          </div>
        }
        placement="top-end"
        visible={unread !== 0}
        className={style.unreadPopup}
      >
        <Popover
          className={style.popover}
          content={
            <div className={style.preview}>
              {photo.length && (
                <Image
                  className={style.image}
                  src={photo[0].url + '?x-oss-process=image/resize,w_150'}
                  fit="cover"
                />
              )}
              <CloseOutline
                className={style.close}
                onClick={() => {
                  deleteFile(photo[0].url.split('/')[3])
                  setPhoto([])
                  setPreview(false)
                }}
              />
            </div>
          }
          placement="top-start"
          visible={preview}
        >
          <div className={style.bar}>
            <div className={style.end}>
              <FileUploader files={photo} setFiles={setPhoto} upload={upload}>
                <IconPhoto className={style.photo} />
              </FileUploader>
            </div>
            <div className={style.textBox}>
              <TextArea
                autoSize={{ maxRows: 3 }}
                className={style.textarea}
                placeholder="???????????????"
                value={input}
                onChange={(value) => {
                  handleInput(value)
                }}
                rows={1}
                maxLength={140}
                ref={inputRef}
              />
            </div>
            <div className={style.end}>
              <Button
                color="primary"
                shape="rounded"
                size="small"
                className={style.button}
                onClick={sendMessage}
              >
                ??????
              </Button>
            </div>
          </div>
        </Popover>
      </Popover>
    </div>
  )
}

export default MessageDetail

import { useCallback, useContext, useEffect, useState } from 'react'
import dayjs from 'dayjs'
import classNames from 'classnames'
import { Popover, Image, ImageViewer } from 'antd-mobile'
import { IMessage } from '../../libs/models'
import { context } from '../../hooks/store'
import style from './style.module.scss'

const MessageBox = (props: {
  message: IMessage
  onMessageDelete: (messageId: string, index: number) => void
  index: number
  scrollFlag: boolean
  setScrollFlag: (scrollFlag: boolean) => void
  clickFlag: boolean
  setClickFlag: (clickFlag: boolean) => void
}) => {
  const { message, onMessageDelete, index } = props
  const { user } = useContext(context)
  const [popFlag, setPopFlag] = useState(false)
  const [duration, setDuration] = useState({ start: 0, end: 0 })
  const [clickDelete, setClickDelete] = useState(false)

  /* 滚动关闭删除弹窗 */
  useEffect(() => {
    if (props.scrollFlag) {
      setPopFlag(false)
    }
  }, [popFlag, props.scrollFlag])
  /* 点击其他位置关闭删除弹窗 */
  useEffect(() => {
    if (props.clickFlag && !clickDelete) {
      setPopFlag(false)
    }
  }, [clickDelete, props.clickFlag])

  /* 长按0.3s弹出删除 */
  useEffect(() => {
    if (duration.end - duration.start >= 300) {
      setPopFlag(true)
    }
  }, [duration.end, duration.start])

  const handleImageClick = useCallback(() => {
    ImageViewer.show({
      image: message.content,
      renderFooter: () => (
        <div className={style.close} onClick={() => ImageViewer.clear()}>
          x
        </div>
      ),
    })
  }, [message.content])

  return (
    <Popover
      className={style.popover}
      content={
        <div
          onClick={async () => {
            onMessageDelete(message._id, index)
            setPopFlag(false)
          }}
          // 监控鼠标点击事件
          onMouseDownCapture={() => {
            setClickDelete(true)
          }}
          // 监控触控事件
          onTouchStartCapture={() => {
            setClickDelete(true)
          }}
        >
          删除
        </div>
      }
      placement="top"
      mode="dark"
      visible={popFlag}
      onVisibleChange={() => {
        props.setScrollFlag(false)
        props.setClickFlag(false)
        setClickDelete(false)
      }}
      trigger="click"
    >
      <div
        className={classNames(
          style.box,
          message.senderId === user?._id ? style.reply : style.receive
        )}
        // 鼠标长按
        onMouseDown={(e) => {
          setDuration({ ...duration, start: e.timeStamp })
        }}
        onMouseUp={(e) => {
          setDuration({ ...duration, end: e.timeStamp })
        }}
        // 触摸长按
        onTouchStart={(e) => {
          setDuration({ ...duration, start: e.timeStamp })
        }}
        onTouchEnd={(e) => {
          setDuration({ ...duration, end: e.timeStamp })
        }}
      >
        <div className={style.message}>
          {message.type === 1 ? (
            message.content
          ) : (
            <div>
              <Image
                className={classNames(style.image)}
                src={`${message.content}?x-oss-process=image/resize,w_100`}
                onClick={() => handleImageClick()}
                fit="cover"
              />
            </div>
          )}
        </div>
        <div className={style.time}>{`${
          Date.now() - message.createdAt >= 3600 * 1000
            ? dayjs(message.createdAt).format('YYYY-MM-DD')
            : dayjs(message.createdAt).local().fromNow()
        }`}</div>
      </div>
    </Popover>
  )
}

export default MessageBox

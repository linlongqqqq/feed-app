import {
  Button,
  Dialog,
  Image,
  ImageViewer,
  Popup,
  TextArea,
  Toast,
} from 'antd-mobile'
import { useCallback, useContext, useMemo, useState } from 'react'
import classNames from 'classnames'
import PubSub from 'pubsub-js'
import { ImageUploadItem } from 'antd-mobile/es/components/image-uploader'
import PostItemView from '../PostItemView'
import PopupUserDetail from '../PopupUserDetail'
import FileUploader from '../FileUploader'
import * as utils from '../../utils'
import * as postService from '../../services/post'
import { POST_CREATE } from '../../events'
import { context } from '../../hooks/store'
import useFile from '../../hooks/useFile'
import { ICreatePostDto, IPostItem } from '../../libs/models'
import { ReactComponent as IconPicture } from '../../assets/imgs/photo.svg'
import { ReactComponent as IconFork } from '../../assets/imgs/fork.svg'
import styles from './index.module.scss'

type Props = {
  visible: boolean
  setVisible: (flag: boolean) => void
  // 类型
  type: number
  relationId?: string
  relationPost?: IPostItem
}

// 弹出层
export default function PopupPost({
  visible,
  setVisible,
  type,
  relationId,
  relationPost,
}: Props) {
  const { user, ws } = useContext(context)

  // 帖子内容、输入框
  const [content, setContent] = useState('')

  // 上传的图片列表
  const [files, setFiles] = useState<ImageUploadItem[]>([])

  const { upload, deleteFile } = useFile()

  // 发布
  const handleSubmitClick = useCallback(async () => {
    if (content.trim().length === 0) {
      Toast.show('内容不可为空!')
      return
    }
    const createPostDto: ICreatePostDto = {
      content,
      type,
      imgs: files.map((file) => file.url),
    }
    if (relationId !== undefined) createPostDto.relationId = relationId
    const res = await postService.create(createPostDto)
    if (res.code === 0) {
      setVisible(false)
      Toast.show(
        type === 1 ? '发布成功!' : type === 2 ? '回复成功' : '转发成功'
      )
      // 创建了帖子或者分享
      if (type !== 2) {
        const reqData = {
          _id: user?._id,
          type: 'createPost',
        }
        ws?.send(JSON.stringify(reqData))
      }

      // 创建了帖子
      PubSub.publish(POST_CREATE, {
        postId: relationId,
        type,
        newPost: res.data.post,
      })
    }
  }, [content, type, files, relationId, setVisible, user?._id, ws])

  // 取消
  const handleCancel = useCallback(async () => {
    if (content.length > 0 || files.length > 0) {
      const result = await Dialog.confirm({
        content: '确定要取消发布吗?',
      })
      if (result) {
        setVisible(false)
        for (let file of files) {
          deleteFile(file.url.split('/')[3])
        }
      }
    } else {
      setVisible(false)
      for (let file of files) {
        deleteFile(file.url.split('/')[3])
      }
    }
  }, [content.length, deleteFile, files, setVisible])

  // 查看大图
  const handleImageClick = useCallback((image: string) => {
    ImageViewer.show({
      image,
      renderFooter: () => (
        <div className={styles.close} onClick={() => ImageViewer.clear()}>
          x
        </div>
      ),
    })
  }, [])

  const [meDetailVisible, setMeDetailVisible] = useState(false)

  const me = useMemo(() => {
    return (
      <div className={styles.me}>
        <Image
          src={user?.avatar}
          className={styles.avatar}
          onClick={() => setMeDetailVisible(true)}
        />
        <div className={styles.info}>
          <div className={styles.at}>
            {type === 2 && (
              <>
                回复
                <span className={styles.text}>@{relationPost?.account}</span>
              </>
            )}
          </div>
          <TextArea
            autoFocus
            placeholder={
              type === 1
                ? '有什么新鲜事?'
                : type === 2
                ? '发布回复'
                : '转发内容'
            }
            value={content}
            onChange={(val) => {
              const tLength = utils.getStringLength(val)
              if (tLength <= 280) setContent(val)
            }}
            autoSize
            showCount={() => {
              const tLength = utils.getStringLength(content)
              return (
                <span style={{ float: 'right' }}>
                  {tLength}/{280}
                </span>
              )
            }}
          />
          <div
            className={classNames(styles.imgs, {
              [styles.even]: (files.length & 1) === 0,
              [styles.three]: files.length === 3,
            })}
          >
            {files.map((item) => {
              return (
                <div
                  key={item.url}
                  className={styles['img-item']}
                  style={{
                    backgroundImage: `url(${
                      item.url + '?x-oss-process=image/resize,w_100'
                    })`,
                    backgroundSize: 'cover',
                  }}
                  onClick={() => handleImageClick(item.url)}
                >
                  <div
                    className={styles['fork-wrap']}
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteFile(item.url.split('/')[3])
                      setFiles(files.filter((file) => file.url !== item.url))
                    }}
                  >
                    <IconFork />
                  </div>
                </div>
              )
            })}
          </div>
          {type === 3 && relationPost !== undefined && (
            <div className={styles.trans}>
              <PostItemView {...relationPost} type={3} />
            </div>
          )}
        </div>
      </div>
    )
  }, [
    content,
    deleteFile,
    files,
    handleImageClick,
    relationPost,
    type,
    user?.avatar,
  ])

  return (
    <Popup
      visible={visible}
      position="bottom"
      bodyStyle={{ height: '100vh' }}
      destroyOnClose
      afterClose={() => {
        setContent('')
        setFiles([])
      }}
    >
      <div className={styles.container}>
        <div className={styles.header}>
          <span className={styles.cancel} onClick={handleCancel}>
            取消
          </span>
          <Button
            className={classNames(styles.submit, {
              [styles.disable]: content.length === 0,
            })}
            disabled={content.length === 0}
            shape="rounded"
            color="primary"
            size="mini"
            onClick={handleSubmitClick}
          >
            发布
          </Button>
        </div>
        <div className={styles.main}>
          {type === 2 && relationPost !== undefined && (
            <PostItemView {...relationPost} type={2} />
          )}
          {me}
        </div>
        <div className={styles.fileupload}>
          <FileUploader
            files={files}
            setFiles={setFiles}
            upload={upload}
            maxSize={100}
          >
            <IconPicture />
          </FileUploader>
        </div>
        <PopupUserDetail
          visible={meDetailVisible}
          setVisible={setMeDetailVisible}
        />
      </div>
    </Popup>
  )
}

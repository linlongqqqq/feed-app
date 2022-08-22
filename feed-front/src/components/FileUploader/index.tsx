import { ReactNode, useCallback } from 'react'
import { ImageUploader, Toast } from 'antd-mobile'
import { ImageUploadItem } from 'antd-mobile/es/components/image-uploader'
import styles from './index.module.scss'

type Props = {
  files: ImageUploadItem[]
  setFiles: (files: ImageUploadItem[]) => void
  upload: (file: File) => Promise<{ url: any }>
  children?: ReactNode
  max?: number
  maxSize?: number
}

// 文件上传
export default function FileUploader({
  files,
  setFiles,
  upload,
  children,
  max = 4,
  maxSize = 10,
}: Props) {
  // 上传文件的校验
  const beforeUpload = useCallback(
    (file: File) => {
      // 仅支持png, jpg, gif文件
      if (files.length === max) {
        Toast.show(`最多上传${max}张图片`)
        return null
      }
      if (
        file.name.endsWith('.png') ||
        file.name.endsWith('.jpg') ||
        file.name.endsWith('.gif')
      ) {
        if (file.size > maxSize * 1024 * 1024) {
          Toast.show(`请选择小于 ${maxSize}M 的图片`)
          return null
        }
        return file
      }
      Toast.show('只支持.jpg, .png, .gif的图片')
      return null
    },
    [files.length, max, maxSize]
  )

  return (
    <div className={styles.footer}>
      <ImageUploader
        preview={false}
        value={files}
        beforeUpload={beforeUpload}
        onChange={setFiles}
        upload={upload}
      >
        {children}
      </ImageUploader>
    </div>
  )
}

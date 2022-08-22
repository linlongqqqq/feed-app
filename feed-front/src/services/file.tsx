import { Toast } from 'antd-mobile'
import axios from 'axios'
import FileUploadProcessBar from '../components/FileUploadProcessBar'
import request from '../libs/request'

/**
 * 获取上传文件的signUrl
 * 后续请求方式为post
 * @param fileName
 * @returns
 */
export async function signUrl(fileName: string, contentType: string) {
  const res = await request.get('/file/signUrl', {
    params: { fileName, contentType },
  })
  return res.data
}

/**
 * 上传文件
 * @param url
 * @param file
 * @returns
 */
export async function upload(url: string, file: File, contentType: string) {
  const res = await axios.put('/api/v2/' + url, file, {
    headers: {
      'Content-Type': contentType,
    },
    onUploadProgress: (process) => {
      let percent = Math.ceil((process.loaded / process.total) * 100)
      Toast.show({
        content: <div style={{ color: 'black' }}>{`已上传${percent}%`}</div>,
        icon: <FileUploadProcessBar percent={percent} />,
        maskClassName: 'toastMask',
        duration: 0,
      })
      if (percent === 100) {
        setTimeout(() => {
          Toast.show('上传完成!')
        }, 2500)
      }
    },
  })
  return res.data
}

/**
 * 删除文件
 * @param fileName
 * @returns
 */
export async function deleteFile(fileName: string) {
  const res = await request.post('/file/delete', { fileName })
  return res.data
}

import { useCallback, useState } from 'react'
import * as fileService from '../services/file'

export default function useFile() {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // 上传文件
  const upload = useCallback(async (file: File) => {
    try {
      setLoading(true)
      const contentType = file.name.endsWith('.jpg')
        ? 'image/jpg'
        : file.name.endsWith('.png')
        ? 'image/png'
        : 'image/gif'
      const signRes = await fileService.signUrl(file.name, contentType)
      const url = signRes.data.url
      await fileService.upload(url.split('/')[3], file, contentType)
      return {
        url: url.split('?')[0],
      }
    } catch (error: any) {
      setError(error.message)
      return {
        url: '',
      }
    } finally {
      setLoading(false)
    }
  }, [])

  // 删除文件
  const deleteFile = useCallback(async (fileName: string) => {
    try {
      await fileService.deleteFile(fileName)
    } catch (error: any) {}
  }, [])

  return {
    error,
    loading,
    upload,
    deleteFile,
  }
}

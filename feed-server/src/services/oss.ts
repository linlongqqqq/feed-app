import OSS from 'ali-oss'
import crypto from 'crypto'
import * as path from 'path'

const client = new OSS({
  region: `${process.env.REGION}`,
  accessKeyId: `${process.env.ACCESSKEYID}`,
  accessKeySecret: `${process.env.ACCESSKEYSECRET}`,
  bucket: `${process.env.BUCKET}`,
})

/**
 * 获取上传文件的url地址
 * @param originName
 * @param contentType
 * @returns
 */
export async function getSignUploadUrl(
  originName: string,
  contentType: string
) {
  const fileName = `${crypto.randomUUID()}${path.extname(originName)}`
  return client.signatureUrl(fileName, {
    expires: 3600,
    method: 'PUT',
    'Content-Type': contentType,
  })
}

/**
 * 删除文件
 * @param fileName
 */
export async function deleteFile(fileName: string) {
  try {
    await client.delete(fileName)
  } catch {}
}

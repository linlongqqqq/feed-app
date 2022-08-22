import KoaBody from 'koa-body'
// import * as path from 'path'
// import * as fs from 'fs'

// 文件输出的路径（process.env.NODE_ENV === 'prod'）
// const tmpDir = path.join(__dirname, '../../tmp')

// const initData = async () => {
//   try {
//     await fs.promises.access(tmpDir)
//   } catch (error) {
//     fs.promises.mkdir(tmpDir)
//     console.log('创建临时文件夹成功')
//   }
// }

// initData()

// const options = {
//   multipart: true,
//   formidable: {
//     uploadDir: tmpDir,
//     keepExtensions: true,
//   },
// }

export default KoaBody()

const { createProxyMiddleware } = require('http-proxy-middleware')

module.exports = function (app) {
  app.use(
    '/api/v1',
    createProxyMiddleware({
      target: 'http://localhost:4014',
      changeOrigin: true,
    })
  )
  app.use(
    '/api/v2',
    createProxyMiddleware({
      target: 'http://feed-app-wps.oss-cn-shanghai.aliyuncs.com',
      changeOrigin: true,
      pathRewrite: {
        '^/api/v2': '/',
      },
    })
  )
}

# feed-front

## 一. 修改配置文件

为了保证在微信开发者工具、或者真机能够连接上后端的服务器，需要将其设置为内网的地址，此外，**在微信测试号管理中，也需要将回调接口地址设置为内网的地址**（ip + 前端的端口号），否则无法连接。

### `.env`文件

```shell
# 默认打开的端口号和Ip地址
# 前端的端口号
PORT=3000
# 内网ip地址，用于websocket连接（在微信开发者工具、或者真机中，不能使用127.0.0.1进行连接）
# HOST=127.0.0.1
HOST=10.227.10.163

# 微信的APPID
REACT_APP_APPID=wx62d253796bd29cfd
# 服务端端口号
REACT_APP_SERVER_PORT=4014

```

### `setupProxy.js`文件

修改targat的代理地址，`/api/v1`对应的是后端服务器，`/api/v2`对应OSS的上传服务器的域名

```js
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

```

## 二. 项目启动

```shell
npm install
npm run start
```

额外说明：如果是在开发模式的网页端下，下拉刷新可能会出现warning, 请在global.scss中，添加touch-action:none;属性

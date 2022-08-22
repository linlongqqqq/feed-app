## feed-server

### **修改配置文件**

创建`.env`文件参考如下，请修改补充微信对接的APPID与SECRET、阿里云OSS的bucket的相关信息

```shell
# dev: 开发环境  prod: 生产环境   test: 测试环境
NODE_ENV=test
# 路由请求前缀
URL_PREFIX=/api/v1
# 后端端口
PORT=4014
# MONGODB的服务器地址
MONGO_URL=mongodb://127.0.0.1/feed-server
KEYS=["1aba0a6cd04f1a58f904bfc55c6d46b1a4105fed23e7643a0b40992737d55ecc"]
# 微信对接
APPID=填写微信公众号的APPID
SECRET=填写微信公众号的SECRET
# 阿里云OSS
REGION='填写对应的region'
ACCESSKEYID='填写ACCESSKEYID'
ACCESSKEYSECRET='填写ACCESSKEYSECRET'
BUCKET='填写bucket的名字'

```

### 项目启动

```shell
cd feed-server
npm install
npm run start

```

### **运行测试**

```shell
node .\scripts\init.js
npm run test
```


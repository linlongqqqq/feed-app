import { Toast } from 'antd-mobile'
import axios from 'axios'

const request = axios.create({
  baseURL: '/api/v1',
  timeout: 6000,
  headers: {
    'content-type': 'application/json',
  },
})

// 响应拦截器
request.interceptors.response.use(
  function (response) {
    // Any status code that lie within the range of 2xx cause this function to trigger
    // Do something with response data
    const { data } = response
    if (data.code !== 0) {
      Toast.show({
        icon: 'fail',
        content: data.message,
      })
      return Promise.resolve(response)
    } else {
      return Promise.resolve(response)
    }
  },
  function (error) {
    // 如果发生了错误，判断是否是401
    const { status, data } = error.response
    // 未登录、跳转至首页
    if (status === 401) {
      // window.location.href = '/login'
      return Promise.resolve(error.response)
    } else if (status === 405) {
      // 参数不符合要求
      Toast.show({
        icon: 'fail',
        content: data.message,
      })
      return Promise.resolve(error.response)
    } else {
      Toast.show({
        icon: 'fail',
        content: '服务器繁忙!',
      })
      window.location.href = '/500'
      return Promise.resolve(error.response)
    }
  }
)

export default request

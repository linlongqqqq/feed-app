import { useCallback, useMemo } from 'react'
import { Button, Dialog, ImageViewer } from 'antd-mobile'
import { ReactComponent as IconCharp } from '../../assets/imgs/sharp.svg'
import { ReactComponent as IconWeixin } from '../../assets/imgs/weixin.svg'
import styles from './index.module.scss'

// 代理的Url
const proxy_url = encodeURIComponent(
  `http://${window.location.host}/api/v1/user/wxlogin`
  // `http://${process.env.REACT_APP_HOST}:${process.env.REACT_APP_PORT}/api/v1/user/wxlogin`
  // 如果需要手机测试，则需要改为内网的地址
  // 'http://10.227.10.163:3000/api/v1/user/wxlogin'
)

function Login() {
  // 微信授权的url
  const url = useMemo(() => {
    return `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${process.env.REACT_APP_APPID}&response_type=code&scope=snsapi_userinfo&redirect_uri=${proxy_url}#wechat_redirect`
  }, [])

  const handleBtnClick = useCallback(async () => {
    const result = await Dialog.confirm({
      content: '授权需先关注公众号',
      confirmText: '已关注',
      cancelText: '去关注',
    })
    if (result) {
      window.location.href = url
    } else {
      ImageViewer.show({
        image: '/qrcode.jpg',
      })
    }
  }, [url])

  return (
    <div className={styles.container}>
      <IconCharp className={styles.logo} />
      <Button className={styles.button} onClick={handleBtnClick}>
        <div className={styles.wrap}>
          <IconWeixin className={styles.weixin} />
          <span className={styles.text}>微信授权登录</span>
        </div>
      </Button>
    </div>
  )
}

export default Login

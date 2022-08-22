import { useNavigate } from 'react-router-dom'
import { Button, Image } from 'antd-mobile'
import { RedoOutline } from 'antd-mobile-icons'
import style from './style.module.scss'

const ServerDown = () => {
  const navigate = useNavigate()

  return (
    <div className={style.container}>
      <main className={style.main}>
        <Image
          className={style.image}
          src={require('../../assets/imgs/500.jpg')}
        />
        <div className={style.notice}>服务器没有响应，请稍后重试。</div>
        <Button
          color="primary"
          shape="rounded"
          className={style.button}
          onClick={() => {
            navigate('/')
          }}
        >
          <div className={style.btn}>
            <RedoOutline />
            <span>回到首页</span>
          </div>
        </Button>
      </main>
    </div>
  )
}

export default ServerDown

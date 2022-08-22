import { Link, useNavigate } from 'react-router-dom'
import { Button, Image, NavBar } from 'antd-mobile'
import { ReactComponent as IconBack } from '../../assets/imgs/back.svg'
import style from './style.module.scss'

const NotFound = () => {
  const navigate = useNavigate()

  return (
    <div className={style.container}>
      <NavBar
        className={style.nav}
        back={null}
        left={
          <IconBack
            className={style.back}
            onClick={() => {
              navigate('/')
            }}
          />
        }
      >
        未找到
      </NavBar>
      <main className={style.main}>
        <Image
          className={style.image}
          src={require('../../assets/imgs/404.jpg')}
        />
        <div className={style.notice}>
          该页面不存在，请检查地址或尝试搜索其他内容。
        </div>
        <Link to="/search">
          <Button color="primary" shape="rounded" className={style.button}>
            搜索
          </Button>
        </Link>
      </main>
    </div>
  )
}

export default NotFound

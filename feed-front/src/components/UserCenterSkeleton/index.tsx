import { Skeleton } from 'antd-mobile'
import style from './index.module.scss'

export default function UserCenterSkeleton() {
  return (
    <div className={style.conatiner}>
      <div className={style.topBox}>
        <Skeleton animated className={style.background} />
        <div className={style.top}>
          <div className={style.left} />
        </div>
      </div>
      <div className={style.bottomBox}>
        <div className={style.border}>
          <Skeleton animated className={style.avatar} />
        </div>
        <Skeleton animated className={style.button} />
      </div>
      <div className={style.user}>
        <Skeleton animated className={style.name} />
        <Skeleton animated className={style.info} />
        <Skeleton animated className={style.bio} />
        <Skeleton animated className={style.follow} />
      </div>
    </div>
  )
}

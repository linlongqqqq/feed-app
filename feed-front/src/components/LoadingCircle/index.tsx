import styles from './index.module.scss'
import { SpinLoading } from 'antd-mobile'

export default function LoadingCircle() {
  return (
    <div className={styles.loading}>
      <SpinLoading style={{ '--size': '48px' }} color="primary" />
      <span>正在加载...</span>
    </div>
  )
}

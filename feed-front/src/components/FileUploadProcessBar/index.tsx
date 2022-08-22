import { ProgressCircle } from 'antd-mobile'
import styles from './index.module.scss'

type Props = {
  percent: number
  text?: boolean
}

export default function FileUploadProcessBar({ percent }: Props) {
  return (
    <div className={styles.progressBar} id="processBar">
      <ProgressCircle percent={percent}>{percent}%</ProgressCircle>
    </div>
  )
}

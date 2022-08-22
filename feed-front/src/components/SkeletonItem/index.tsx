import { Skeleton } from 'antd-mobile'
import styles from './index.module.scss'

export default function SkeletonItem() {
  return (
    <div className={styles.container}>
      <Skeleton.Title animated className={styles.avatar} />
      <div className={styles.main}>
        <Skeleton.Paragraph animated className={styles.info} lineCount={2} />
        <Skeleton.Paragraph animated className={styles.content} lineCount={3} />
        <div className={styles.footer}>
          <Skeleton.Paragraph animated className={styles.fItem} lineCount={2} />
          <Skeleton.Paragraph animated className={styles.fItem} lineCount={2} />
          <Skeleton.Paragraph animated className={styles.fItem} lineCount={2} />
        </div>
      </div>
    </div>
  )
}

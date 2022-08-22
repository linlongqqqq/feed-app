import { ImageViewer } from 'antd-mobile'
import classNames from 'classnames'
import { useCallback } from 'react'
import styles from './index.module.scss'

type Props = {
  imgs: string[]
}

export default function ImageList({ imgs }: Props) {
  const handleImageClick = useCallback(
    (idx: number) => {
      ImageViewer.Multi.show({
        images: imgs,
        defaultIndex: idx,
        renderFooter: () => (
          <div className={styles.close} onClick={() => ImageViewer.clear()}>
            x
          </div>
        ),
      })
    },
    [imgs]
  )

  return (
    <div
      className={classNames(styles.imgs, {
        [styles.even]: (imgs.length & 1) === 0,
        [styles.three]: imgs.length === 3,
      })}
      onClick={(e) => e.stopPropagation()}
    >
      {imgs.map((item, idx) => {
        return (
          <div
            key={item}
            className={styles['img-item']}
            style={{
              backgroundImage: `url(${
                item + '?x-oss-process=image/resize,w_100'
              })`,
              backgroundSize: 'cover',
            }}
            onClick={() => handleImageClick(idx)}
          ></div>
        )
      })}
    </div>
  )
}

import { useState } from 'react'
import { FloatingBubble } from 'antd-mobile'
import PopupPost from '../PopupPost'
import { ReactComponent as IconAdd } from '../../assets/imgs/add.svg'
import styles from './index.module.scss'

export default function AddPostButton() {
  const [postVisible, setPostVisible] = useState(false)

  return (
    <FloatingBubble
      className={styles.floatBubble}
      style={{
        '--initial-position-bottom': '80px',
        '--initial-position-right': '30px',
        '--edge-distance': '30px',
      }}
    >
      <div className={styles.container} onClick={() => setPostVisible(true)}>
        <IconAdd />
        <PopupPost visible={postVisible} setVisible={setPostVisible} type={1} />
      </div>
    </FloatingBubble>
  )
}

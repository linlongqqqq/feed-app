import { CenterPopup, Image } from 'antd-mobile'
import { CheckOutline } from 'antd-mobile-icons'
import { useContext } from 'react'
import { context } from '../../hooks/store'
import styles from './index.module.scss'

type Props = {
  visible: boolean
  setVisible: (flag: boolean) => void
}

export default function PopupUserDetail({ visible, setVisible }: Props) {
  const { user } = useContext(context)

  return (
    <CenterPopup visible={visible} onMaskClick={() => setVisible(false)}>
      <div className={styles.meDetail}>
        <Image src={user?.avatar} className={styles.avatar} />
        <div className={styles.meInfo}>
          <div className={styles.nickname}>{user?.nickname}</div>
          <div className={styles.account}>{user?.account}</div>
        </div>
        <CheckOutline />
      </div>
    </CenterPopup>
  )
}

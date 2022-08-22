import { Outlet, useLocation } from 'react-router-dom'
import AddPostButton from '../../components/AddPostButton'
import MainLayout from '../../components/MainLayout'
import styles from './index.module.scss'

export default function Main() {
  const location = useLocation()

  return (
    <div className={styles.app}>
      <div className={styles.body}>
        <Outlet />
      </div>
      <div className={styles.bottom}>
        {!(
          location.pathname.startsWith('/message') ||
          location.pathname.startsWith('/user-edit') ||
          location.pathname.startsWith('/follow/')
        ) && (
          <div className={styles.addIcon}>
            <AddPostButton />
          </div>
        )}
        <MainLayout />
      </div>
    </div>
  )
}

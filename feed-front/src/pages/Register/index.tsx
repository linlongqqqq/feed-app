import { Button, Image, Input, Toast } from 'antd-mobile'
import { useCallback, useContext, useState } from 'react'
import { context } from '../../hooks/store'
import * as userService from '../../services/user'
import { ReactComponent as IconCharp } from '../../assets/imgs/sharp.svg'
import styles from './index.module.scss'

function Register() {
  const { user, setUser } = useContext(context)

  const [account, setAccount] = useState('')

  const handleInputChange = useCallback((val: string) => {
    const tAccount = val.trim()
    if (tAccount.length > 10) {
      return Toast.show('最大长度为10')
    }
    setAccount(tAccount.slice(0, 10))
  }, [])

  // 修改account
  const handleSubmitClick = useCallback(async () => {
    const length = account.length
    if (length === 0) {
      Toast.show('Account不可为空')
      return
    }
    if (/^[a-zA-Z0-9]{3,10}$/.test(account)) {
      const res = await userService.update({ account })
      if (res.code === 0) {
        setUser({ ...user!, account: `${account}` })
        Toast.show('注册成功!')
      }
    } else {
      Toast.show('只支持3~10位字母与数字')
    }
  }, [account, setUser, user])

  return (
    <div className={styles.container}>
      <IconCharp className={styles.logo} />
      <div className={styles.main}>
        <Image src={user?.avatar} className={styles.avatar} />
        <span className={styles.name}>{user?.nickname}</span>
        <div className={styles.input_wrap}>
          <div className={styles.at}>@</div>
          <Input value={account} onChange={(val) => handleInputChange(val)} />
        </div>
        <Button
          block
          color="primary"
          className={styles.submit}
          onClick={handleSubmitClick}
        >
          注册
        </Button>
      </div>
    </div>
  )
}

export default Register

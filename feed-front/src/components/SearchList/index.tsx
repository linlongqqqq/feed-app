import { useNavigate } from 'react-router-dom'
import { Dialog } from 'antd-mobile'
import { ReactComponent as IconDele } from '../../assets/imgs/black_dele.svg'
import { ReactComponent as IconUparrow } from '../../assets/imgs/up_arrow.svg'
import styles from './styles.module.scss'

interface Props {
  lst: string[]
  setList: React.Dispatch<React.SetStateAction<string[]>>
  setIsResult: React.Dispatch<React.SetStateAction<boolean>>
  setControlBack: React.Dispatch<React.SetStateAction<boolean>>
}
export default function SearchList({
  lst,
  setList,
  setIsResult,
  setControlBack,
}: Props) {
  const navigate = useNavigate()
  return (
    <div>
      <div className={styles.list}>
        <div className="listTitle">
          <span className="recent">最近搜索</span>
          <span
            className="dele"
            onClick={async () => {
              const result = await Dialog.confirm({
                content: '确定要清空历史记录吗？',
              })
              if (result) {
                setList([])
              }
            }}
          >
            <IconDele />
          </span>
        </div>
        {lst.map((item, index) => {
          return (
            <div
              className={styles.recentSearch}
              key={index}
              onClick={() => {
                navigate(`/search/result/${item}`)
                setIsResult(true)
                setControlBack(true)
              }}
            >
              <span className={styles.list_name}>{item}</span>
              <IconUparrow />
            </div>
          )
        })}
      </div>
    </div>
  )
}

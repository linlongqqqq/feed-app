import SearchBar, { SearchBarRef } from 'antd-mobile/es/components/search-bar'
import { Outlet, useNavigate, useParams } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import SearchList from '../../components/SearchList'
import { ReactComponent as IconGoback } from '../../assets/imgs/goback.svg'
import styles from './styles.module.scss'

export default function Search() {
  const params = useParams()
  const navigate = useNavigate()
  const searchRef = useRef<SearchBarRef>(null)
  const [controlBack, setControlBack] = useState(false) // 箭头
  const [isResult, setIsResult] = useState(false)

  const [searchresult, setSearchresult] = useState('')

  useEffect(() => {
    setSearchresult(params.message!)
  }, [params.message])

  const back = (
    <span className="back">
      <IconGoback
        onClick={() => {
          navigate(-1)
          setIsResult(false)
          setControlBack(false)
          setSearchresult('')
        }}
      />
    </span>
  )
  // 初始化List
  const [list, setList] = useState(() => {
    let newLst = localStorage.getItem('list')
    if (newLst !== null && newLst !== '') {
      const tmp = JSON.parse(newLst) as string[]
      return tmp
    } else return [] as string[]
  })

  // 浏览器存储
  useEffect(() => {
    localStorage.setItem('list', JSON.stringify(list))
  }, [list])

  useEffect(() => {
    let url = window.location.href
    url = url.split('/')[4]
    if (url === undefined) {
      setIsResult(false)
      setControlBack(false)
    } else {
      setIsResult(true)
    }
  }, [setIsResult])

  return (
    <div className={styles.search}>
      <div className="header">
        {controlBack ? back : ''}
        <SearchBar
          ref={searchRef}
          placeholder="搜索"
          showCancelButton
          value={searchresult}
          className={styles.search}
          style={{
            '--border-radius': '15px',
          }}
          onChange={(val) => {
            setSearchresult(val)
          }}
          onSearch={(val) => {
            navigate(`/search/result/${val}`)
            setSearchresult(val)
            const tem = list.findIndex((item) => item === val)
            if (tem === -1) {
              setList([val, ...list])
            } else {
              let newList = list
              newList.splice(tem, 1)
              setList([val, ...newList])
            }
            setControlBack(true) //back 箭头
            setIsResult(true)
          }}
          onClear={() => {
            setSearchresult('')
          }}
        />
      </div>
      {isResult ? (
        <Outlet />
      ) : (
        <SearchList
          lst={list}
          setList={setList}
          setIsResult={setIsResult}
          setControlBack={setControlBack}
        />
      )}
    </div>
  )
}

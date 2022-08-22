import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'

// 配置utc的插件
dayjs.locale('zh-cn')
dayjs.extend(utc)
dayjs.extend(relativeTime)

export default dayjs

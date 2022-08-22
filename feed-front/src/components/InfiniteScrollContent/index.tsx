import { SpinLoading } from 'antd-mobile'

type Props = {
  hasMore?: boolean
}

// 加载更多的内容区域
export default function InfiniteScrollContent({ hasMore }: Props) {
  return (
    <div>
      {hasMore ? <SpinLoading color="primary" /> : <span>没有更多了</span>}
    </div>
  )
}

import { Dialog, Toast } from 'antd-mobile'
import { Action } from 'antd-mobile/es/components/action-sheet'
import { useCallback, useMemo, useState } from 'react'
import { POST_DELETE } from '../events'
import { IPostDetail } from '../libs/models'
import * as postService from '../services/post'

export default function useCurPost() {
  // 评论转发弹出层显示与显示
  const [popupPostVisible, setPopupPostVisible] = useState(false)
  // 弹出层类型， 2：评论， 3：转发
  const [popupType, setPopupType] = useState(0)
  // 操作的post的_id
  const [curPostId, setCurPostId] = useState('')

  const [curPost, setCurPost] = useState<IPostDetail>()

  // 点击评论、点击转发
  const handleCommentReportClick = useCallback(
    (_id: string, popupType: number, post: IPostDetail) => {
      setCurPostId(_id)
      setCurPost(post)
      setPopupType(popupType)
      setPopupPostVisible(true)
    },
    []
  )

  // 删除帖子
  const [deleteActionVisible, setDeleteActionVisible] = useState(false)

  const actions: Action[] = useMemo(() => {
    return [
      {
        text: '删除帖子',
        key: 'delete',
        danger: true,
        onClick: async () => {
          const flag = await Dialog.confirm({ content: '确定要删除吗？' })
          if (flag) {
            const res = await postService.deletePost(curPostId)
            if (res.code === 0) {
              PubSub.publish(POST_DELETE, {
                postId: curPostId,
                curPost,
              })
              Toast.show('删除成功!')
            }
          }
        },
      },
    ]
  }, [curPost, curPostId])

  const handleDeleteClick = useCallback((_id: string, post: IPostDetail) => {
    setCurPostId(_id)
    setCurPost(post)
    setDeleteActionVisible(true)
  }, [])

  return {
    popupPostVisible,
    setPopupPostVisible,
    curPostId,
    curPost,
    popupType,
    handleCommentReportClick,
    deleteActionVisible,
    setDeleteActionVisible,
    actions,
    handleDeleteClick,
  }
}

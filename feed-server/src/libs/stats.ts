/**
 * 统一JSON返回封装类
 */
export class JsonResp {
  code: number
  data?: any

  // code=0默认返回成功
  constructor(data?: any, code = 0) {
    this.data = data
    this.code = code
  }
}

/**
 * 错误状态
 */
export class ErrorStat extends JsonResp {
  message: string
  status: number

  constructor(code: number, message: string, status = 200) {
    super(undefined, code)
    this.message = message
    this.status = status
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
    }
  }
}

/**
 * 业务状态错误码
 */
export const stats = {
  // 用户已经注册过、account不为''
  ErrorUserAtHasEdited: new ErrorStat(10001, '用户已注册'),
  // 输入的account已经有用户在使用
  ErrorUserAtHasExist: new ErrorStat(10002, 'account已被使用'),
  ErrorUserNotFound: new ErrorStat(10003, '用户未找到'),
  ErrorSessionNotExist: new ErrorStat(40001, '会话不存在', 401),
  /* 关注 */
  ErrorFollowFailed: new ErrorStat(20001, '关注失败'),
  ErrorUnfollowFailed: new ErrorStat(20002, '取关失败'),
  ErrorNotFollowing: new ErrorStat(20004, '尚未关注'),
  ErrorInvalidFollow: new ErrorStat(20005, '非法关注'),
  /* 帖子 3xxxx */
  ErrorRelationPostNotExist: new ErrorStat(30001, '关联的帖子不存在'),
  ErrorIllegalDelPost: new ErrorStat(30002, '非法删除帖子'),
  ErrorPostNotExist: new ErrorStat(30003, '帖子不存在'),
  /* 私信 */
  ErrorFailToSendMessage: new ErrorStat(50001, '发送失败'),
  ErrorFailToDeleteMessage: new ErrorStat(50002, '删除失败'),
  ErrorMessageNotFound: new ErrorStat(50003, '私信不存在'),
  ErrorMessageUnauthorized: new ErrorStat(50004, '无权限操作私信'),
  ErrorMessageAlreadyDeleted: new ErrorStat(50005, '私信已被删除'),
  ErrorFailToSetRead: new ErrorStat(50006, '置为已读失败'),
  ErrorFailToDeleteConversation: new ErrorStat(50007, '删除对话失败'),
}

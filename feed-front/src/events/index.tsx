// 自己创建了帖子、评论、转发
export const POST_CREATE = Symbol('post_create')
// 发布通知
export const NOTICE_CREATE = Symbol('notice_create')
// 删除帖子
export const POST_DELETE = Symbol('post_delete')
// 收到私信
export const MESSAGE_RECEIVE = Symbol('message_receive')
// 清除私信未读
export const MESSAGE_READ = Symbol('message_read')
// 删除对话
export const CONVERSATION_DELETE = Symbol('conversation_delete')
// 关注的人发送了新的帖子
export const NEW_POST = Symbol('new_post')
// 喜欢帖子
export const LIKE_POST = Symbol('like_post')

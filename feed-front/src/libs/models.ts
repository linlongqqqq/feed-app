export interface ApiResp<T = any> {
  code: number
  message: string
  data: T
}

enum UserStatus {
  // 正常
  Normal = 1,
  // 被禁用
  Disabled = 2,
}

export interface IUser {
  _id: string
  // 用户状态
  status: UserStatus
  // 用户标识、对应微信的openid
  openid: string
  // 用户账号
  account: string
  // 用户昵称
  nickname: string
  // 创建时间
  createdAt: number
  // 用户简介
  bio: string
  // 性别
  sex: number
  // 用户头像
  avatar: string
  // 背景图
  banner: string
  // 手机号
  phone?: number
  // 邮箱
  email?: string
}

export interface IFollow {
  // 被关注的用户
  followingId: string
  // 用户_id
  userId: string
  // 创建时间
  createdAt: number
}

// 消息类型
export enum MessageType {
  Text = 1,
  Image = 2,
}

// 消息状态
export interface IMessage {
  _id: string
  // 私信内容
  content: string
  // 当前用户_id
  userId: string
  // 对方用户_id
  friendId: string
  // 实际发送者_id
  senderId: string
  // 实际接收者_id
  receiverId: string
  // 是否已读
  isread: boolean
  // 消息类型
  type: MessageType
  // 是否已删除
  deleted: boolean
  // 创建时间
  createdAt: number
}
export interface IPost {
  _id: string
  // 帖子内容
  content: string
  // 图片列表
  imgs: string[]
  // 关联帖子_id
  relationId?: string
  // 用户id
  userId: string
  // 帖子类型
  type: number
  // 回帖数
  comments: number
  // 转发数
  reposts: number
  // 喜欢数
  likes: number
  // 是否删除
  deleted: boolean
  // 创建时间
  createdAt: number
}

export type ICreatePostDto = {
  content: string
  type: number
  imgs: string[]
  relationId?: string
}

export type IPostDetail = IPost & {
  account: string
  avatar: string
  nickname: string
  liked: boolean
}

// 每一个可操作帖子的类型
export type IPostItem = IPostDetail & {
  relationPost?: IPostDetail
}

// 通知类型
enum NoticeType {
  Follow = 1,
  Comment = 2,
  Repost = 3,
}

export interface INotice {
  _id: string
  // 消息内容
  content: string
  // 接收者_id
  receiverId: string
  // 发送者_id
  senderId: string
  // 发送者姓名
  sendName: string
  // 发送者头像
  sendUrl: string
  // 发送者account
  sendaccount: string
  // 关联数据_id
  relationId: string
  // 通知类型
  type: NoticeType
  // 是否已读(true:已读，false：未读)
  isread: boolean
  // 创建时间
  createdAt: number
}

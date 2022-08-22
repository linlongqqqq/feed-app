import { ObjectId } from 'mongodb'

// 用户状态
export enum UserStatus {
  // 正常
  Normal = 1,
  // 被禁用
  Disabled = 2,
}

// 用户
export interface IUser {
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

// 会话
export interface ISession {
  // session id
  sid: string
  // 关联的用户openid
  openid: string
  // 登录的ip地址
  ip: string
  // 创建时间
  createdAt: Date
}
// 通知类型
enum NoticeType {
  Follow = 1,
  Comment = 2,
  Repost = 3,
  Praise = 4,
}

export interface INotice {
  // 消息内容
  content: string
  // 接收者_id
  receiverId: ObjectId
  // 发送者_id
  senderId: ObjectId
  // 发送者姓名
  sendName: string
  // 发送者头像
  sendUrl: string
  // 发送者昵称
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

// 关注
export interface IFollow {
  // 被关注的用户
  followingId: ObjectId
  // 用户_id
  userId: ObjectId
  // 创建时间
  createdAt: number
}

// 帖子类型
enum PostType {
  Default = 1,
  Comment = 2,
  Repost = 3,
}

// 帖子
export interface IPost {
  // 帖子内容
  content: string
  // 图片列表
  imgs: string[]
  // 用户_id
  userId: ObjectId
  // 关联帖子_id
  relationId?: ObjectId
  // 帖子类型
  type: PostType
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

// 喜欢帖子
export interface ILike {
  // 帖子_id
  postId: ObjectId
  // 用户_id
  userId: ObjectId
  // 创建时间
  createdAt: number
}

// 消息类型
enum MessageType {
  Text = 1,
  Image = 2,
}

// 消息状态
export interface IMessage {
  // 私信内容
  content: string
  // 当前用户_id
  userId: ObjectId
  // 对方用户_id
  friendId: ObjectId
  // 实际发送者_id
  senderId: ObjectId
  // 实际接收者_id
  receiverId: ObjectId
  // 是否已读
  isread: boolean
  // 消息类型
  type: MessageType
  // 是否已删除
  deleted: boolean
  // 创建时间
  createdAt: number
}

export type IPostDetail = IPost & {
  account: string
  avatar: string
  nickname: string
  liked?: boolean
}

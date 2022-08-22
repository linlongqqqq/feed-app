// 计算字符串的长度，中文和Emoji算两个字符
export const getStringLength = (str: string) => {
  let len = 0
  for (let i = 0; i < str.length; i++) {
    if (str.charAt(i).match(/[\u4e00-\u9fa5]/g) != null) len += 2
    else len += 1
  }
  return len
}

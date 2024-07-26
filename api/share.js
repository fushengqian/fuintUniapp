import request from '@/utils/request'

// api地址
const api = {
  list: 'clientApi/share/list',
}

// 分享列表
export const list = (param) => {
  return request.post(api.list, param)
}

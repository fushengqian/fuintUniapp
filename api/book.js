import request from '@/utils/request'

// api地址
const api = {
  list: 'clientApi/book/list',
  detail: 'clientApi/book/detail',
  cate: 'clientApi/book/cateList',
}

// 预约项目列表
export const list = (param) => {
  return request.post(api.list, param)
}

// 预约详情
export const detail = (bookId) => {
  return request.post(api.detail, { bookId })
}

// 预约分类列表
export const cateList = (param) => {
  return request.post(api.cate, param)
}
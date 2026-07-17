import request from '@/utils/request'

const api = {
  list: 'merchantApi/stockCheck/list',
  detail: 'merchantApi/stockCheck/detail',
  create: 'merchantApi/stockCheck/create',
  submit: 'merchantApi/stockCheck/submit',
  delete: 'merchantApi/stockCheck/delete'
}

// 盘点记录列表
export function stockCheckList(param) {
  return request.post(api.list, param)
}

// 盘点详情
export function stockCheckDetail(param) {
  return request.post(api.detail, param)
}

// 创建盘点
export function createStockCheck(param) {
  return request.post(api.create, param)
}

// 提交盘点结果
export function submitStockCheck(param) {
  return request.post(api.submit, param)
}

// 删除盘点记录
export function deleteStockCheck(param) {
  return request.post(api.delete, param)
}

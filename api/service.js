import request from '@/utils/request'

const api = {
  list: 'clientApi/service/list',
}

/**
 * 获取我的服务列表
 */
export const list = () => request.post(api.list)

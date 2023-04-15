import { post } from '@/utils/request'

export function orderSubmit(data: any) {
  return post({
    url: '/pay/order/submit',
    data,
  })
}

export function orderCreate(data: any) {
  return post({
    url: '/pay/order/create',
    data,
  })
}

export function queryOrderInfo(orderId: number) {
  return post({
    url: '/pay/order/queryOrderInfo',
    data: { orderId },
  })
}

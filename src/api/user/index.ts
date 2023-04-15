import { get, post } from '@/utils/request'

export function getUserInfo() {
  return get({
    url: '/member/user/get',
  })
}

export function getUserChatInfo() {
  return get({
    url: '/member/user/get-chat-info',
  })
}

export function checkChat() {
  return get({
    url: '/member/user/check-chat',
  })
}

export function getSpuList(data: any) {
  return post({
    url: '/member/spu/list',
    data,
  })
}

import { post } from '@/utils/request'

export function sendSmsCode(scene: number, mobile: string) {
  return post({
    url: '/member/auth/send-sms-code',
    data: { mobile, scene },
  })
}

export function smsLogin(mobile: string, code: string) {
  return post({
    url: '/member/auth/sms-login',
    data: { mobile, code },
  })
}

export function refreshToken(refreshToken: string) {
  return post({
    url: '/member/auth/refresh-token',
    data: { refreshToken },
  })
}

export function logout(token: string) {
  return post({
    url: '/member/auth/logout',
    data: { token },
  })
}

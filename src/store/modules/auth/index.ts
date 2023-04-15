import { defineStore } from 'pinia'
import { getRefreshToken, getToken, removeToken, setToken } from './helper'
import { store } from '@/store'
import { logout, smsLogin } from '@/api/auth'
import { getUserInfo } from '@/api/user'
import { useUserStore } from '@/store/modules/user'

export interface AuthState {
  token: string | undefined
  refreshToken: string | undefined
}

export const useAuthStore = defineStore('auth-store', {
  state: (): AuthState => ({
    token: getToken(),
    refreshToken: getRefreshToken(),
  }),

  actions: {
    setToken(token: string, userId: string, refreshToken: string, expiresIn: number) {
      this.token = token
      setToken(token, refreshToken, userId, expiresIn)
    },

    removeToken() {
      this.token = undefined
      removeToken()
    },
  },
})

export function useAuthStoreWithout() {
  return useAuthStore(store)
}

export async function login(type: string, data: any) {
  let res

  switch (type) {
    case 'sms':
      res = await smsLogin(data.mobile, data.code)
      break
    case 'wechat':
      // 调用微信登录接口
      break
    case 'password':
      // 调用账号密码登录接口
      break
    default:
      throw new Error('未知登录类型')
  }

  return res
}

export async function getUserInfoAndStore() {
  try {
    const useUser = useUserStore()
    const res = await getUserInfo()
    if (res && res.code === 0)
      useUser.updateUserInfo(res.data)

    return res
  }
  catch (error: any) {
    console.error(error)
    throw error
  }
}

export async function logouts() {
  try {
    const useUser = useUserStore()
    const token = getToken()
    const res = await logout(token)
    removeToken()
    useUser.recordState()

    return res
  }
  catch (error: any) {
    console.error(error)
    throw error
  }
}

import type { AxiosProgressEvent, AxiosResponse, GenericAbortSignal } from 'axios'
import { router } from '../../router/index'
import request from './axios'
import { useAuthStore } from '@/store'

export interface HttpOption {
  url: string
  data?: any
  method?: string
  headers?: any
  onDownloadProgress?: (progressEvent: AxiosProgressEvent) => void
  signal?: GenericAbortSignal
  beforeRequest?: () => void
  afterRequest?: () => void
}

export interface Response<T = any> {
  data: T
  message: string | null
  status: string
  code?: number
  accessToken?: string
  msg?: string | null
}

function http<T = any>(
  { url, data, method, headers, onDownloadProgress, signal, beforeRequest, afterRequest }: HttpOption,
) {
  const successHandler = (res: AxiosResponse<Response<T>>) => {
    const authStore = useAuthStore()
    // 未登录
    if (res.data.status === 'Unauthorized' || res?.data?.code === 401) {
      authStore.removeToken()
      window.$dialog.warning({
        title: '提示',
        content: '您尚未登录，是否前往登录？',
        positiveText: '是',
        negativeText: '否',
        onPositiveClick: () => {
          router.push('/login')
          // message.success('确定')
        },
        onNegativeClick: () => {
          // message.error('不确定')
        },
      })
    }
    else if (res?.data?.code === 1002013003) {
    // 账户余额不足
      window.$dialog.warning({
        title: '提示',
        content: '您账户余额不足，是否进行充值？',
        positiveText: '是',
        negativeText: '否',
        onPositiveClick: () => {
          // window.$message.success('确定')
        },
        onNegativeClick: () => {
          // message.error('不确定')
        },
      })
    }
    else if (res.data.status === 'Success' || res.data.data || res?.data?.code !== 401)
    // 成功返回
    { return res.data }

    else {
      window.$message.error(res?.data.msg)
      return Promise.reject(res.data)
    }
  }

  const failHandler = (error: Response<Error>) => {
    afterRequest?.()
    throw new Error(error?.message || 'Error')
  }

  beforeRequest?.()

  method = method || 'GET'

  const params = Object.assign(typeof data === 'function' ? data() : data ?? {}, {})

  return method === 'GET'
    ? request.get(url, { params, signal, onDownloadProgress }).then(successHandler, failHandler)
    : request.post(url, params, { headers, signal, onDownloadProgress }).then(successHandler, failHandler)
}

export function get<T = any>(
  { url, data, method = 'GET', onDownloadProgress, signal, beforeRequest, afterRequest }: HttpOption,
): Promise<Response<T>> {
  return http<T>({
    url,
    method,
    data,
    onDownloadProgress,
    signal,
    beforeRequest,
    afterRequest,
  })
}

export function post<T = any>(
  { url, data, method = 'POST', headers, onDownloadProgress, signal, beforeRequest, afterRequest }: HttpOption,
): Promise<Response<T>> {
  return http<T>({
    url,
    method,
    data,
    headers,
    onDownloadProgress,
    signal,
    beforeRequest,
    afterRequest,
  })
}

export default post

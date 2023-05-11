import type { AxiosProgressEvent } from 'axios'
import { post } from '@/utils/request'
import { useAuthStore } from '@/store'
const base = {
  model: import.meta.env.VITE_GLOB_API_MODEL,
  baseUrl: import.meta.env.VITE_GLOB_API_URL,
}
export function fetchChatConfig<T = any>() {
  return post<T>({
    url: '/gpt/config',
  })
}

export async function fetchChatAPIProcess<T = any>(
  params: {
    prompt?: string
    options?: { conversationId?: string; parentMessageId?: string }
    signal?: AbortSignal
    onDownloadProgress?: (progressEvent: AxiosProgressEvent) => void
    model?: string
    stream?: boolean
    messages?: any[]
    myProp: any[]
  },
) {
  try {
    const token = useAuthStore().token || ''
    const url = `${base.baseUrl}/gpt/index/chat/sse`
    const data = {
      method: 'POST',
      body: JSON.stringify({
        model: base.model,
        messages: params.myProp,
        prompt: params.prompt,
      }),
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'tenant-id': import.meta.env.VITE_GLOB_TENANT_ID,
      },
      signal: params.signal,
    }

    const response = await fetch(
      url, data,
    )

    if (!response.ok) {
      // 检查响应状态，如果不是 200 OK，解析错误消息并通过 onDownloadProgress 回调返回
      const errorResponse = await response.json()
      const errorMessage = errorResponse.error?.message || '发生了未知错误'
      throw new Error(errorMessage)
    }

    if (params.onDownloadProgress) {
      if (response.headers.get('Content-Type')?.startsWith('text/event-stream')) {
        const readStream = async (reader: ReadableStreamDefaultReader<Uint8Array>) => {
          let partialData = ''
          let jsonMessage = ''

          while (true) {
            const { done, value } = await reader.read()
            if (done)
              break

            partialData += new TextDecoder('utf-8').decode(value)
            if (partialData === 'data:[DONE]')
              return

            for (let i = 0; i < partialData.length; i++) {
              const char = partialData[i]

              if (char === '{')
                jsonMessage = ''

              jsonMessage += char

              if (char === '}') {
                try {
                  const data = JSON.parse(jsonMessage)

                  // 检查 data.error 是否存在
                  if (data.error) {
                    // 通过 onDownloadProgress 回调返回错误消息
                    const errorMessage = data.error.message || '发生了未知错误'
                    const progressEvent = {
                      id: null,
                      text: `错误：${errorMessage}`,
                      role: 'assistant',
                      conversationId: undefined,
                      error: true,
                    }
                    params.onDownloadProgress?.({ event: progressEvent } as AxiosProgressEvent)
                    return
                  }

                  // 对SSE消息进行处理
                  const progressEvent = {
                    id: data.id,
                    text: data.message,
                    role: 'assistant',
                    conversationId: undefined,
                  }
                  params.onDownloadProgress?.({ event: progressEvent } as AxiosProgressEvent)
                }
                catch (e) {
                  // console.error('JSON解析错误：', e)
                }
              }
            }

            partialData = ''
          }
        }

        await readStream(response.body!.getReader())
      }
      else {
        const errorResponse = await response.json()
        const errorMessage = (errorResponse.msg || errorResponse.error?.message) || '发生了未知错误'
        throw new Error(errorMessage)
      }
    }
  }
  catch (error: any) {
    // 捕获到异常，通过 onDownloadProgress 回调返回异常消息
    const errorMessage = error.message || '发生了未知错误'
    const progressEvent = {
      id: null,
      text: `错误：${errorMessage}`,
      role: 'assistant',
      conversationId: undefined,
      error: true,
    }
    params.onDownloadProgress?.({ event: progressEvent } as AxiosProgressEvent)
  }
}

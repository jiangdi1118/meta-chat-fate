import type { AxiosProgressEvent } from 'axios'
import { post } from '@/utils/request'

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
  const base = {
    apiKey: import.meta.env.VITE_GLOB_OPENAI_API_KEY,
    model: import.meta.env.VITE_GLOB_API_MODEL,
    baseUrl: import.meta.env.VITE_GLOB_OPENAI_API_URL,
  }

  try {
    const response = await fetch(
      `${base.baseUrl}/v1/chat/completions`, {
        method: 'POST',
        body: JSON.stringify({
          max_tokens: 1000,
          model: base.model,
          temperature: 0.8,
          top_p: 1,
          presence_penalty: 1,
          messages: params.myProp,
          stream: params.stream,
        }),
        headers: {
          'Authorization': `Bearer ${base.apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        signal: params.signal,
      },
    )

    if (!response.ok) {
      // 检查响应状态，如果不是 200 OK，解析错误消息并通过 onDownloadProgress 回调返回
      const errorResponse = await response.json()
      const errorMessage = errorResponse.error?.message || '发生了未知错误'
      const progressEvent = {
        id: null,
        text: `错误：${errorMessage}`,
        role: 'assistant',
        conversationId: undefined,
        error: true,
        isError: true,
      }
      params.onDownloadProgress?.({ event: progressEvent } as AxiosProgressEvent)
      return
    }

    if (params.onDownloadProgress) {
      const reader = response.body!.getReader()

      const readStream = async (reader: any) => {
        let partialData = ''
        while (true) {
          const { done, value } = await reader.read()
          if (done)
            break

          partialData += new TextDecoder('utf-8').decode(value)
          const lines = partialData.split('data: ')

          for (let i = 0; i < lines.length - 1; i++) {
            const line = lines[i].trim()
            if (line === '[DONE]') {
              return
            }
            else if (line !== '') {
              // 将解析后的JSON对象赋值给data变量
              const data = JSON.parse(line)

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
              }
              // 检查 data.choices[0].delta 是否存在，以及 content 字段是否存在
              // eslint-disable-next-line no-prototype-builtins
              else if (data.choices && data.choices[0].delta && data.choices[0].delta.hasOwnProperty('content')) {
                const content = data.choices[0].delta.content || ''
                if (content) {
                  const progressEvent = {
                    id: data.id,
                    text: content,
                    role: 'assistant',
                    conversationId: undefined,
                  }
                  params.onDownloadProgress?.({ event: progressEvent } as AxiosProgressEvent)
                }
              }
            }
          }
          partialData = lines[lines.length - 1]
        }
      }

      await readStream(reader)
      return response
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

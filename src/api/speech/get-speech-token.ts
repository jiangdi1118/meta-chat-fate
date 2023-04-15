import axios from 'axios'

export interface AzureData {
  status: string
  data: { region: string; token: string } | null
  message: string
}

// let azureDataCache: AzureData | PromiseLike<AzureData> | null = null

export const getAzureSubscriptionKey = async (): Promise<AzureData> => {
  // if (azureDataCache !== null) {
  //   // 如果结果已经存在，直接返回结果，不再发起请求
  //   return azureDataCache
  // }

  const speechKey = import.meta.env.VITE_GLOB_AZURE_SUBSCRIPTION_KEY
  const speechRegion = import.meta.env.VITE_GLOB_AZURE_SPEECH_REGION

  if (!speechKey || !speechRegion) {
    return {
      status: 'noSpeechKey',
      data: null,
      message: 'You forgot to add your speech key or region to the .env file.',
    }
  }
  else {
    const headers = {
      headers: {
        'Ocp-Apim-Subscription-Key': speechKey,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }

    try {
      const tokenResponse = await axios.post(
        `https://${speechRegion}.api.cognitive.microsoft.com/sts/v1.0/issueToken`,
        null,
        headers,
      )
      const result = {
        data: { token: tokenResponse.data, region: speechRegion },
        status: 'Success',
        message: 'Get token successfully',
      }
      // azureDataCache = result
      return result
    }
    catch (err: any) {
      return {
        status: 'Fail',
        data: null,
        message: err.toString(),
      }
    }
  }
}

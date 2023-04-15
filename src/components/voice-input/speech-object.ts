import createPonyfill from 'web-speech-cognitive-services'
import type { Ref } from 'vue'
import { computed, ref, shallowRef, watch } from 'vue'
import langJson from './lang.json'
import { createLocalStorage } from '@/utils/storage'
import { getAzureSubscriptionKey } from '@/api/speech/get-speech-token'
import { useSpeechStore } from '@/store/modules/speech'
import { debounce } from '@/utils/functions/debounce'

interface SpeechTokenType {
  token: string
  region: string
  loaded: boolean
}

export interface VoiceDataType {
  lang: string
  label: string
  voices: { value: string; label: string }[]
  source: Record<string, SpeechSynthesisVoice>
}

const LOCAL_NAME = 'speechToken'
const ss = createLocalStorage({ expire: 120 * 1 })
const cachedResult: Ref<any> = ref(null)

// let debouncedUseSpeechObject

const defaultToken = (): SpeechTokenType => ({ token: '', region: '', loaded: false })

const getToken = (): SpeechTokenType => {
  const localState = ss.get(LOCAL_NAME)
  return { ...defaultToken(), ...localState }
}

const setToken = (data: Partial<SpeechTokenType>) => {
  const localState = ss.get(LOCAL_NAME)
  const newData: SpeechTokenType = { ...localState, ...data }
  ss.set(LOCAL_NAME, newData)
}

let tokenPromise: Promise<any>

const uploadToken = async () => {
  if (tokenPromise)
    return await tokenPromise

  try {
    tokenPromise = getAzureSubscriptionKey()
    const { data, status } = await tokenPromise
    if (status === 'Success' && data)
      setToken({ ...data, loaded: true })
    else
      setToken({ loaded: true })
  }
  catch (_e) {
    console.error(_e)
    setToken({ loaded: true })
  }
}

export const NativeSpeechRecognition = typeof window !== 'undefined' && (
  window.SpeechRecognition || window.webkitSpeechRecognition || window.mozSpeechRecognition || window.msSpeechRecognition || window.oSpeechRecognition
)

interface SpeechObjectType {
  SpeechRecognition?: any
  speechSynthesis?: SpeechSynthesis
  SpeechSynthesisUtterance?: {
    prototype: SpeechSynthesisUtterance
    new(text?: string): SpeechSynthesisUtterance
  }

  isAzure?: boolean
}
let speechObj: SpeechObjectType

export const useSpeechObject = () => {
  // 如果 cachedResult 已经设置了值，直接返回它。
  // if (cachedResult.value)
  //   return cachedResult.value

  const isInit = ref(false)
  const isReady = ref(false)
  const allVoices = shallowRef<SpeechSynthesisVoice[]>([])
  const speechStore = useSpeechStore()
  const isVoicesUpdated = ref(false)

  const usedVoices = computed(() => {
    if (!isReady.value || !allVoices.value.length)
      return []

    const isAzure = speechObj?.isAzure
    const baseOptions = isAzure ? langJson.auzre : langJson.default
    const voices = allVoices.value

    const findEqualVoice = (lang: string, value: string, sameVoices: SpeechSynthesisVoice[]) => {
      if (isAzure) {
        return sameVoices.find((item) => {
          return item.name.includes(value.replace(`${lang}-`, ''))
        })
      }
      else { return sameVoices.find(item => item.name === value) }
    }

    const data: VoiceDataType[] = baseOptions.map((item) => {
      const sameLangVoices = voices.filter(voice => voice.lang === item.lang) || []
      const sameNameVoices = item.voices.filter(voice => findEqualVoice(item.lang, voice.value, sameLangVoices)) || []

      if (sameLangVoices.length && sameNameVoices.length) {
        return {
          lang: item.lang,
          label: item.label,
          voices: sameNameVoices,
          source: sameNameVoices.reduce((prev, cur) => {
            prev[cur.value] = findEqualVoice(item.lang, cur.value, sameLangVoices) as SpeechSynthesisVoice
            return prev
          }, {} as Record<string, SpeechSynthesisVoice>),
        }
      }

      return null as unknown as VoiceDataType
    }).filter(item => !!item)

    return data
  })

  const awaitReady = async () => {
    let loadLangCount = 0

    const checkFn = (cb: () => void) => {
      const voices = usedVoices.value || []
      if (!voices.length && loadLangCount < 4) {
        loadLangCount++
        setTimeout(() => {
          checkFn(cb)
        }, 2000)
      }
      else {
        cb()
      }
    }

    return new Promise(resolve => checkFn(() => resolve(true)))
  }
  let isUpdatingVoices = false

  const updateVoices = debounce(() => {
    if (isVoicesUpdated.value || isUpdatingVoices)
      return

    isUpdatingVoices = true

    if (speechObj.speechSynthesis) {
      const voices = speechObj.speechSynthesis.getVoices() || []
      if (voices.length) {
        allVoices.value = voices
        isVoicesUpdated.value = true
        isReady.value = true
      }
      else {
        speechObj.speechSynthesis.onvoiceschanged = () => {
          allVoices.value = speechObj.speechSynthesis?.getVoices() || []
          isVoicesUpdated.value = true
          isReady.value = true
        }
      }
    }
    isUpdatingVoices = false
  }, 2000) // 设置防抖时间为 1000 毫秒

  async function getSpeechObject(): Promise<SpeechObjectType> {
    if (!getToken().loaded) {
      await uploadToken()
    }
    else if (speechObj) {
      updateVoices()
      return speechObj
    }

    const speechToken = getToken()

    if (speechToken.token && speechToken.region) {
      const {
        SpeechRecognition,
        speechSynthesis,
        SpeechSynthesisUtterance,
      } = createPonyfill({
        credentials: {
          region: speechToken.region,
          authorizationToken: speechToken.token,
        },
      })

      speechObj = {
        SpeechRecognition,
        speechSynthesis,
        SpeechSynthesisUtterance,
        isAzure: true,
      }
    }
    else {
      speechObj = {
        SpeechRecognition: NativeSpeechRecognition,
        speechSynthesis: window.speechSynthesis,
        SpeechSynthesisUtterance: window.SpeechSynthesisUtterance,
      }
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    window.__speechObj = speechObj

    updateVoices()

    return speechObj
  }

  const updateUsedVoices = debounce(
    ([newUsedVoicesLength, newIsInit]) => {
      if (!newUsedVoicesLength || newIsInit)
        return
      isInit.value = true
      const setting = speechStore.speechSetting
      let sound = setting.sound || ''
      const langOption
        = usedVoices.value.find(item => item.lang === setting.lang)
        || { voices: [], source: {} as VoiceDataType['source'] }

      if (!langOption.voices.some(item => item.value === setting.sound))
        sound = langOption?.voices[0]?.value

      speechStore.updateStore({
        speechSetting: {
          ...setting,
          sound,
          voice: langOption.source[sound],
        },
      })
    },
    2000, // 2000毫秒的防抖延迟
  )

  watch([() => usedVoices.value.length, () => isInit.value], updateUsedVoices)
  // debouncedUseSpeechObject = debounce(getSpeechObject, 10000)

  // auto init
  getSpeechObject()

  const result = {
    getSpeechObject,
    awaitReady,
    usedVoices,
    isReady,
  }

  // 将结果存储在 cachedResult 中，以便将来使用。
  cachedResult.value = result

  return result
}

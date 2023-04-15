import { onUnmounted, ref } from 'vue'
import { useMessage } from 'naive-ui'
import { useSpeechStore } from '@/store/modules/speech'
import { useSpeechObject } from '@/components/voice-input/speech-object'
import { logger } from '@/components/voice-input/utils'

let synth: SpeechSynthesis | undefined
const useSpeak = () => {
  const message = useMessage()
  const { getSpeechObject, awaitReady } = useSpeechObject()
  let voiceSynthesis: SpeechSynthesisUtterance | null = null
  const ttsStore = useSpeechStore()

  const isSpeaking = ref(false)

  const onstart = () => (isSpeaking.value = true)
  const onend = () => (isSpeaking.value = false)

  const cleanVoice = () => {
    if (voiceSynthesis) {
      voiceSynthesis.onstart = null
      voiceSynthesis.onend = null
      voiceSynthesis.onerror = null
      voiceSynthesis = null
    }
  }

  const cancelSpeak = () => {
    onend()
    synth?.cancel()
  }

  const getVoice = async (text: string) => {
    const { SpeechSynthesisUtterance, speechSynthesis } = await getSpeechObject()
    await awaitReady()
    if (!voiceSynthesis) {
      if (!SpeechSynthesisUtterance || !speechSynthesis)
        return

      synth = speechSynthesis
      voiceSynthesis = new SpeechSynthesisUtterance(text)
      if (voiceSynthesis) {
        voiceSynthesis.onstart = onstart
        voiceSynthesis.onend = onend
        voiceSynthesis.onerror = (e) => {
          cancelSpeak()
          cleanVoice()
          logger(e.error.toString())
        }
      }
    }
    if (voiceSynthesis) {
      voiceSynthesis.text = text
      if (ttsStore.speechSetting.voice?.name)
        voiceSynthesis.voice = ttsStore.speechSetting.voice

      voiceSynthesis.pitch = ttsStore.speechSetting.pitch
      voiceSynthesis.rate = ttsStore.speechSetting.rate
    }

    return voiceSynthesis
  }

  let speakTimeout: ReturnType<typeof setTimeout> | null = null

  const debounceSpeak = async (text?: string) => {
    if (!text)
      return

    if (speakTimeout)
      clearTimeout(speakTimeout)

    speakTimeout = setTimeout(async () => {
      if (synth?.speaking && !ttsStore.autoSpeak)
        cancelSpeak()

      const utterance = await getVoice(text)
      if (!utterance || !synth) {
        message.warning('当前浏览器不支持语音功能！')
        return
      }
      synth?.speak(utterance)
    }, 300)
  }

  onUnmounted(() => {
    cancelSpeak()
    cleanVoice()
  })

  return {
    isSpeaking,
    speak: debounceSpeak,
    cancelSpeak,
  }
}

const useSpeakDebounced = () => {
  const { speak, isSpeaking, cancelSpeak } = useSpeak()
  let debounceTimeout: ReturnType<typeof setTimeout> | null = null

  const speakDebounced = async (text?: string) => {
    if (!text)
      return

    if (debounceTimeout) {
      clearTimeout(debounceTimeout)
      cancelSpeak()
    }

    debounceTimeout = setTimeout(async () => {
      await speak(text)
    }, 300)
  }

  return {
    isSpeaking,
    speak: speakDebounced,
    cancelSpeak,
  }
}

export {
  // useSpeak,
  useSpeakDebounced,
}

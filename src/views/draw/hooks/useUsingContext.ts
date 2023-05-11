import { computed } from 'vue'
import { useMessage } from 'naive-ui'
import { t } from '@/locales'
import { useDrawStore } from '@/store'

export function useUsingContext() {
  const ms = useMessage()
  const chatStore = useDrawStore()
  const usingContext = computed<boolean>(() => chatStore.usingContext)

  function toggleUsingContext() {
    chatStore.setUsingContext(!usingContext.value)
    if (usingContext.value)
      ms.success(t('chat.turnOnContext'))
    else
      ms.warning(t('chat.turnOffContext'))
  }

  return {
    usingContext,
    toggleUsingContext,
  }
}

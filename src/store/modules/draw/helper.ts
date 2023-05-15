import { ss } from '@/utils/storage'

const LOCAL_NAME = 'drawStorage'

export function defaultState(): Chat.ChatState {
  const uuid = 2001
  return {
    img: '',
    taskId: '',
    vipExpires: undefined,
    vipType: '',
    active: uuid,
    usingContext: true,
    history: [{ uuid, title: 'New Chat', isEdit: false }],
    chat: [{ uuid, data: [] }],
    remainingMessages: 0,
  }
}

export function getLocalState(): Chat.ChatState {
  const localState = ss.get(LOCAL_NAME)
  return { ...defaultState(), ...localState }
}

export function setLocalState(state: Chat.ChatState) {
  ss.set(LOCAL_NAME, state)
}

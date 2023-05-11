import { get, post } from '@/utils/request'

export function submit(data: any) {
  return post({
    url: '/trigger/submit',
    data,
  })
}

export function taskCall(data: any) {
  return post({
    url: '/task/callback',
    data,
  })
}

export function getTaskInfo(id: string) {
  return get({
    url: `/task/${id}/fetch`,
  })
}

export function getTaskList() {
  return get({
    url: '/task/list',
  })
}

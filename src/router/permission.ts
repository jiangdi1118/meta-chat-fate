import type { Router } from 'vue-router'
import { useAuthStoreWithout } from '@/store/modules/auth'

export function setupPageGuard(router: Router) {
  router.beforeEach(async (to, from, next) => {
    const authStore = useAuthStoreWithout()

    if (to.name === 'Login' && authStore.token)
      next({ name: 'Root' })
    else if (to.name !== 'Login' && !authStore.token)
      next({ name: 'Login' })
    else
      next()
  })
}

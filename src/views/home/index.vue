<script setup lang="ts">
// import type { Ref } from 'vue'
// import { computed, onMounted, onUnmounted, ref } from 'vue'
import { computed, onMounted, reactive, ref } from 'vue'
// import { router } from '@/router'
import { useRouter } from 'vue-router'
import { Diamond, SettingsSharp } from '@vicons/ionicons5'
import Layout from '../chat/layout/Layout.vue'
import { useUserStore } from '@/store'
import { websiteConfig } from '@/config/website.config'
import Setting from '@/components/common/Setting/index.vue'
import Vip from '@/components/common/Vip/index.vue'

// import { storeToRefs } from 'pinia'
// import { NAutoComplete, NButton, NInput, useDialog, useMessage } from 'naive-ui'
const router = useRouter()
const userStore = useUserStore()
const userInfo = computed(() => userStore.userInfo)
const showSetting = ref(false)
const showVip = ref(false)
const navList = reactive([
  {
    name: '聊天',
    linkUrl: 'chat',
  },
  {
    name: '写作',
    linkUrl: 'write',
  },
  {
    name: '绘图',
    linkUrl: 'draw',
  },
])
const change = (val: any) => {
  navList.forEach((item) => {
    if (item.name === val)
      router.push(`/${item.linkUrl}`)
  })
}
const login = () => {
  router.push({ name: 'Login' })
}
onMounted(() => {
})
</script>

<template>
  <div class="flex flex-col w-full h-full p-2">
    <n-tabs :bar-width="28" type="line" justify-content="center" class="nav" @update:value="change">
      <template #prefix>
        <img class="logo" :src="websiteConfig.logo" alt="">
      </template>
      <template v-for="(item, index) in navList" :key="index">
        <n-tab-pane :name="item.name" :tab="item.name" />
      </template>
      <template #suffix>
        <n-button v-if="!userInfo.mobile" type="info" @click="login">
          登录
        </n-button>
        <div v-else class="user-info">
          <n-button type="primary" class="mr-1" @click="showVip = true">
            <template #icon>
              <n-icon color="#ffec00">
                <Diamond />
              </n-icon>
            </template>
            <span>充值</span>
          </n-button>
          <n-button type="primary" class="mr-1" @click="showSetting = true">
            <template #icon>
              <n-icon>
                <SettingsSharp />
              </n-icon>
            </template>
            <span>设置</span>
          </n-button>
          <n-avatar class="mr-1" round size="large" :src="userInfo.avatar" />
          <span>{{ userInfo.nickname || '' }}</span>
        </div>
      </template>
    </n-tabs>
    <div class="content">
      <Layout />
      <!-- <router-view /> -->
    </div>
    <Setting v-if="showSetting" v-model:visible="showSetting" />
    <Vip v-if="showVip" v-model:visible="showVip" />
  </div>
</template>

<style scoped lang="less">
.nav{
height: 3rem;
padding: 0 .5rem;
}
.content{
height: calc(100% - 3rem);
}
.user-info{
display: inline-flex;
align-items: center;
>img{
width: 30px;
height: 30px;
border-radius: 50%;
margin-right: .5rem;
}
}
.logo{
height: 40px;
}
.mr-1{
margin-right: 1rem;
}
</style>

<script setup lang="ts">
import type { Ref } from 'vue'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { NButton, NCard, NModal, NSpace, useMessage } from 'naive-ui'
import QRCode from 'qrcode.vue'
import { orderCreate, orderSubmit, queryOrderInfo } from '@/api/pay'
import { getSpuList } from '@/api/user'
import { generateShortUrl } from '@/api/dwz'
import { useBasicLayout } from '@/hooks/useBasicLayout'
import { useChatStore } from '@/store'

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  (e: 'update:visible', visible: boolean): void
}>()

const message = useMessage()
const chatStore = useChatStore()
const selectedPaymentMethod = ref('')
const qrcodeUrl = ref('')
const spuInfo: Ref<any> = ref(null)
const pollingTimer: Ref<any> = ref(null)
// 移动端自适应相关
const { isMobile } = useBasicLayout()
const selectedSpuName = ref('')

async function fetchSpuInfo() {
  try {
    const data = null
    const response = await getSpuList(data)
    if (response && response.code === 0 && Array.isArray(response.data) && response.data.length > 0) {
      spuInfo.value = response.data.map((item: any) => {
        return {
          ...item,
          info: JSON.parse(item.info),
        }
      })
    }
    else {
      // 处理错误
      message.error('暂无会员信息')
      console.error('Error fetching spu info:', response)
      handleClose()
    }
  }
  catch (error) {
    console.error('Error fetching spu info:', error)
  }
}

function generateMerchantOrderId(spuId: number) {
  return `Order_${spuId}_${Date.now()}`
}

async function purchase(spuId: number, paymentMethod: string) {
  if (paymentMethod === 'wechat') {
    message.error('暂不支持微信支付')
    return
  }

  const appId = import.meta.env.VITE_GLOB_APP_ID
  selectedPaymentMethod.value = paymentMethod

  // 创建订单
  const channelCode = paymentMethod === 'alipay' ? 'alipay_wap' : 'wx_pub'
  const displayMode = (isMobile.value && paymentMethod) === 'alipay' ? 'url' : 'qrcode'

  // 根据商品ID获取商品信息
  const spu = spuInfo.value.find((item: any) => item.id === spuId)
  if (!spu) {
    message.error('商品信息不存在。', { duration: 3000 })
    return
  }
  selectedSpuName.value = spu.name

  const merchantOrderId = generateMerchantOrderId(spuId)

  const orderCreateResult = await orderCreate({
    appId,
    spuId,
    merchantOrderId,
  })

  if (!orderCreateResult.data || orderCreateResult.code !== 0) {
    if (typeof orderCreateResult.msg === 'string')
      message.error(orderCreateResult.msg, { duration: 3000 })
    else
      message.error('An error occurred.', { duration: 3000 })
    qrcodeUrl.value = ''
    return
  }
  const channelExtras = { spuId }

  const data = {
    id: orderCreateResult.data,
    channelCode,
    channelExtras,
    displayMode: isMobile.value ? 'url' : 'qrcode',
  }

  const orderSubmitResult = await orderSubmit(data)
  if (!orderSubmitResult.data || orderSubmitResult.code !== 0) {
    if (typeof orderSubmitResult.msg === 'string')
      message.error(orderSubmitResult.msg, { duration: 3000 })
    else
      message.error('An error occurred.', { duration: 3000 })
    qrcodeUrl.value = ''
    return
  }

  if (displayMode === 'url') {
    window.location.href = orderSubmitResult.data.displayContent
  }
  else {
    const shortUrl = await generateShortUrl(orderSubmitResult.data.displayContent)
    if (shortUrl) {
      qrcodeUrl.value = shortUrl
    }
    else {
      message.error('生成短链接失败')
      qrcodeUrl.value = ''
    }
  }

  startPolling(orderCreateResult.data)
}

async function startPolling(orderId: number) {
  pollingTimer.value = setInterval(async () => {
    const response = await queryOrderInfo(orderId)
    if (response && response.code === 0 && response.data && response.data.status === 10) {
      clearInterval(pollingTimer.value) // 清除轮询器
      message.success('支付成功！')
      handleClose()
      // 更新 remainingMessages
      await chatStore.updateRemainingMessages()
    }
  }, 2000) // 轮询间隔为 2000 毫秒（2 秒）
}

function resetSelection() {
  clearInterval(pollingTimer.value)
  qrcodeUrl.value = ''
  selectedPaymentMethod.value = ''
}

const show = computed({
  get() {
    return props.visible
  },
  set(value) {
    emit('update:visible', value)
  },
})

function handleClose() {
  emit('update:visible', false)
}
onMounted(() => {
  fetchSpuInfo()
})

onBeforeUnmount(() => {
  if (pollingTimer.value)
    clearInterval(pollingTimer.value)
})
</script>

<template>
  <NModal v-model:show="show" preset="card" style="width: 95%; max-width: 650px" @update:show="handleClose">
    <NSpace v-if="!qrcodeUrl" class="card-container">
      <NCard
        v-for="(spu) in spuInfo"
        :key="spu.id"
        class="mr-10"
      >
        <template #header>
          <div class="text-2xl">
            {{ spu.name }}
          </div>
        </template>
        <div class="text-lg mb-4">
          价格: ¥{{ spu.price / 100 }}
        </div>
        <ul class="list-disc list-inside mb-4 ul-min-height">
          <li v-for="(infoItem, infoIndex) in spu.info" :key="infoIndex">
            {{ infoItem.name }}
          </li>
        </ul>
        <div class="payment-buttons">
          <NButton
            class="mb-2"
            type="primary"
            @click="purchase(spu.id, 'alipay')"
          >
            支付宝支付
          </NButton>
          <NButton type="primary" @click="purchase(spu.id, 'wechat')">
            微信支付
          </NButton>
        </div>
      </NCard>
    </NSpace>
    <div v-if="qrcodeUrl" class="qrcode-container">
      <h3>{{ selectedSpuName }}</h3>
      <div class="payment-tip">
        打开{{ selectedPaymentMethod === 'alipay' ? '支付宝' : '微信' }}扫一扫
      </div>
      <div class="qrcode payment-tip">
        <QRCode :value="qrcodeUrl" :options="{ size: 200 }" />
      </div>
      <NButton class="mt-4" type="primary" @click="resetSelection">
        重新选择
      </NButton>
    </div>
  </NModal>
</template>

<style scoped>
.card-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 1rem;
}
.ul-min-height {
  min-height: 120px;
}
.mb-2 {
  margin-bottom: 1rem;
}
.payment-buttons {
  display: flex;
  justify-content: space-between;
}
.qrcode-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.payment-tip {
  margin: 0.5rem 0;
  font-weight: bold;
}
</style>

<script lang="ts" setup>
import { computed, reactive, ref } from 'vue'
import MarkdownIt from 'markdown-it'
import mdKatex from '@traptitech/markdown-it-katex'
import mila from 'markdown-it-link-attributes'
import hljs from 'highlight.js'
import { NImage } from 'naive-ui'
import { useBasicLayout } from '@/hooks/useBasicLayout'
import { t } from '@/locales'
import mittService from '@/utils/mitt/mitt'

interface Props {
  inversion?: boolean
  error?: boolean
  text?: string
  img?: string
  taskId?: string
  loading?: boolean
  asRawText?: boolean
}

const props = defineProps<Props>()

const { isMobile } = useBasicLayout()

const textRef = ref<HTMLElement>()

const mdi = new MarkdownIt({
  linkify: true,
  highlight(code, language) {
    const validLang = !!(language && hljs.getLanguage(language))
    if (validLang) {
      const lang = language ?? ''
      return highlightBlock(hljs.highlight(code, { language: lang }).value, lang)
    }
    return highlightBlock(hljs.highlightAuto(code).value, '')
  },
})

mdi.use(mila, { attrs: { target: '_blank', rel: 'noopener' } })
mdi.use(mdKatex, { blockClass: 'katexmath-block rounded-md p-[10px]', errorColor: ' #cc0000' })

const wrapClass = computed(() => {
  return [
    'text-wrap',
    'min-w-[20px]',
    'rounded-md',
    isMobile.value ? 'p-2' : 'px-3 py-2',
    props.inversion ? 'bg-[#d2f9d1]' : 'bg-[#f4f6f8]',
    props.inversion ? 'dark:bg-[#a1dc95]' : 'dark:bg-[#1e1e20]',
    props.inversion ? 'message-request' : 'message-reply',
    { 'text-red-500': props.error },
  ]
})

const img = computed(() => {
  const value = props.img || ''
  // if (!props.asRawText)
  //   return mdi.render(value)
  return value
})

const btnList = reactive([
  {
    name: '左上放大',
    value: 'U1',
  },
  {
    name: '右上放大',
    value: 'U2',
  },
  {
    name: '左下放大',
    value: 'U3',
  },
  {
    name: '右下放大',
    value: 'U4',
  },
  {
    name: '左上相似',
    value: 'V1',
  },
  {
    name: '右上相似',
    value: 'V2',
  },
  {
    name: '左下相似',
    value: 'V3',
  },
  {
    name: '右下相似',
    value: 'V4',
  },
])

function highlightBlock(str: string, lang?: string) {
  return `<pre class="code-block-wrapper"><div class="code-block-header"><span class="code-block-header__lang">${lang}</span><span class="code-block-header__copy">${t('chat.copyCode')}</span></div><code class="hljs code-block-body ${lang}">${str}</code></pre>`
}

const handleImg = (item) => {
  mittService.emit('sendImg', props.taskId + item.value)
}

defineExpose({ textRef })
</script>

<template>
  <div class="text-black w-50" :class="wrapClass">
    <div>
      <NImage
        :src="img"
      />
    </div>
    <div>
      <template v-for="(item, index) in btnList" :key="item.value">
        <n-button class="btn" strong secondary :type="index > 3 ? 'info' : 'primary'" @click="handleImg(item)">
          {{ item.name }}
        </n-button>
        <template v-if="index === 3">
          <br>
        </template>
      </template>
    </div>
  </div>
  <!-- <div class="text-black" :class="wrapClass">
    <div ref="textRef" class="leading-relaxed break-words">
      <div v-if="!inversion" class="flex items-end">
        <div v-if="!asRawText" class="w-full markdown-body" v-html="text" />
        <div v-else class="w-full whitespace-pre-wrap" v-text="text" />
        <span v-if="loading" class="dark:text-white w-[4px] h-[20px] block animate-blink" />
      </div>
      <div v-else class="whitespace-pre-wrap" v-text="text" />
    </div>
  </div> -->
</template>

<style lang="less" scoped>
@import url(./style.less);
.w-50{
width: 50%;
}
.btn{
margin: 0 .5rem .5rem;
}
</style>

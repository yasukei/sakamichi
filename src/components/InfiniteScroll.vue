<script setup lang="ts">
import { ref, useTemplateRef, onMounted, onUnmounted } from 'vue'
import IconSpinner from './icons/IconSpinner.vue'

interface Emits {
  (event: 'fetch', resolve: (hasMoreData: boolean) => void): void
}
const emits = defineEmits<Emits>()

const loading = ref(false)
const hasMoreData = ref(true)
const scrollTrigger = useTemplateRef('scrollTrigger')

let observer: IntersectionObserver | null = null

const fetchItems = async () => {
  if (!hasMoreData.value || loading.value) {
    return
  }

  loading.value = true

  try {
    hasMoreData.value = await new Promise((resolve) => {
      emits('fetch', resolve)
    })
  } catch (error) {
    console.error('Failed to fetch items:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && hasMoreData.value && !loading.value) {
        fetchItems()
      }
    },
    {
      root: null, // ビューポートをルートとして監視
      rootMargin: '0px', // ルートのマージン（ビューポートの端に到達したときにトリガー）
      threshold: 0.1, // ターゲットの10%が見えたらトリガー
    },
  )

  if (scrollTrigger.value) {
    observer.observe(scrollTrigger.value)
  }
})

onUnmounted(() => {
  if (observer) {
    observer.disconnect()
  }
})
</script>

<template>
  <div>
    <slot />

    <div ref="scrollTrigger" class="pb-24">
      <p v-if="loading" class="p-4 text-center">
        <IconSpinner class="inline-block" />
        <span class="ml-2">Loading…</span>
      </p>
      <p v-else-if="!hasMoreData">すべての項目を表示しました。</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { videos } from '@/data/videos'
import TagFilter from '@/components/TagFilter.vue'
import VideoList from '@/components/VideoList.vue'
import IconFunnel from '@/components/icons/IconFunnel.vue'
import MetaInfo from '@/components/MetaInfo.vue'
import { useSelectedTagsStore } from '@/stores/selectedTags'

const showModal = ref(false)
const onFunnelClicked = () => {
  showModal.value = !showModal.value
}
const { selectedTags } = useSelectedTagsStore()
</script>

<template>
  <div class="">
    <main class="">
      <VideoList :videos="Object.values(videos)" class="" />
    </main>

    <!-- funnel-modal -->
    <Transition name="funnel-modal">
      <div
        class="fixed bottom-12 left-0 right-0 z-10 max-h-4/5 p-2 overflow-y-auto overscroll-y-contain funnel-modal"
        v-if="showModal"
      >
        <TagFilter />
      </div>
    </Transition>

    <!-- footer-menu -->
    <div
      class="fixed bottom-0 left-0 right-0 z-20 flex justify-center items-center border-t h-12 footer-menu"
    >
      <button @click="onFunnelClicked">
        <IconFunnel :solid-icon="selectedTags.size > 0" />
      </button>
    </div>

    <MetaInfo title="Home" />
  </div>
</template>

<style lang="postcss" scoped>
@reference "../assets/main.css";

.funnel-modal-enter-active,
.funnel-modal-leave-active {
  @apply transition;
}

.funnel-modal-enter-from {
  @apply transition translate-y-full ease-in;
}

.funnel-modal-leave-to {
  @apply transition translate-y-full ease-out;
}
</style>

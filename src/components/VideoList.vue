<script setup lang="ts">
import type { Video } from '../../types/youtube.d.ts'
import { useJsonDataStore } from '@/stores/jsonData'
import { useSelectedTagsStore } from '@/stores/selectedTags.ts'
import VideoListItem from './VideoListItem.vue'
import InfiniteScroll from './InfiniteScroll.vue'
import { ref } from 'vue'

interface Props {
  videos: Video[]
}
const props = defineProps<Props>()

const jsonDataStore = useJsonDataStore()
const selectedTagsStore = useSelectedTagsStore()

function contain(superset: Set<string>, subset: Set<string>): boolean {
  if (subset.size > superset.size) {
    return false
  }

  for (const elem of subset) {
    if (!superset.has(elem)) {
      return false
    }
  }
  return true
}

const containSelectedTags = (video: Video) => {
  const tagsOfTheVideo = jsonDataStore.tagsSetDict[video.id].tags

  return contain(tagsOfTheVideo, selectedTagsStore.selectedTags)
}

const perPage = 20
const lastItemIndex = ref(perPage)
const videoItems = ref<Video[]>(props.videos.slice(0, lastItemIndex.value))

const fetchItems = (resolve: (hasMoreData: boolean) => void) => {
  setTimeout(() => {
    let actuallyAdded = 0
    while (true) {
      const newItems = props.videos.slice(lastItemIndex.value, lastItemIndex.value + perPage)
      videoItems.value.push(...newItems)
      lastItemIndex.value += newItems.length

      actuallyAdded += newItems.filter((item) => containSelectedTags(item)).length
      if (actuallyAdded >= perPage || lastItemIndex.value >= props.videos.length) {
        break
      }
    }

    const hasMoreItems = lastItemIndex.value < props.videos.length
    resolve(hasMoreItems)
  }, 0.1 * 1000)
}
</script>

<template>
  <InfiniteScroll @fetch="fetchItems">
    <TransitionGroup
      name="list"
      tag="ul"
      class="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
    >
      <template v-for="video in videoItems" :key="video.id">
        <li v-show="containSelectedTags(video)">
          <VideoListItem :video="video" />
        </li>
      </template>
    </TransitionGroup>
  </InfiniteScroll>
</template>

<style lang="postcss" scoped>
@reference "../assets/main.css";

.list-enter-active,
.list-leave-active {
  @apply transition-all duration-500 ease-in-out;
}

.list-enter-from,
.list-leave-to {
  @apply opacity-0;
}
</style>

<script setup lang="ts">
import { type Video } from '@/data/videos.ts'
import { getTags } from '@/data/tags'
import { useSelectedTagsStore } from '@/stores/selectedTags.ts'
import VideoListItem from './VideoListItem.vue'
import { getChannelTitle } from '@/data/channels.ts'
import InfiniteScroll from './InfiniteScroll.vue'
import { ref } from 'vue'

interface Props {
  videos: Video[]
}
const props = defineProps<Props>()

const { selectedTags } = useSelectedTagsStore()

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
  const tags = getTags(video.video_id).concat([getChannelTitle(video.channel_id)])
  const tagsSet = new Set<string>(tags)

  return contain(tagsSet, selectedTags)
}

const perPage = 10
const lastItem = ref(perPage)
const videoItems = ref<Video[]>(props.videos.slice(0, lastItem.value))

const fetchItems = (resolve: (hasMoreData: boolean) => void) => {
  setTimeout(() => {
    let actuallyAdded = 0
    while (true) {
      const newItems = props.videos.slice(lastItem.value, lastItem.value + perPage)
      videoItems.value.push(...newItems)
      lastItem.value += newItems.length

      actuallyAdded += newItems.filter((item) => containSelectedTags(item)).length
      if (actuallyAdded >= perPage || lastItem.value >= props.videos.length) {
        break
      }
    }

    const hasMoveItems = lastItem.value < props.videos.length
    resolve(hasMoveItems)
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
      <template v-for="video in videoItems" :key="video.video_id">
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

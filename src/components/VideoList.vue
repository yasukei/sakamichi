<script setup lang="ts">
import { type Video } from '@/data/videos.ts'
import { getTags } from '@/data/tags'
import { useSelectedTagsStore } from '@/stores/selectedTags.ts'
import VideoListItem from './VideoListItem.vue'
import { getChannelTitle } from '@/data/channels.ts'

interface Props {
  videos: Video[]
}
defineProps<Props>()

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
</script>

<template>
  <TransitionGroup name="list" tag="ul">
    <template v-for="video in videos" :key="video.video_id">
      <li v-show="containSelectedTags(video)">
        <VideoListItem :video="video" />
      </li>
    </template>
  </TransitionGroup>
</template>

<style lang="postcss" scoped>
@reference "../assets/main.css";

li {
  @apply mb-8;
}

.list-enter-active,
.list-leave-active {
  @apply transition-all duration-500 ease-in-out;
}

.list-enter-from,
.list-leave-to {
  @apply opacity-0 translate-x-30;
}
</style>

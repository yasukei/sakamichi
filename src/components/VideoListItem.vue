<script setup lang="ts">
import type { Video } from '../../types/youtube.d.ts'
import { formatDateString } from '@/utils.ts'
import TagList from '@/components/TagList.vue'
import { useJsonDataStore } from '@/stores/jsonData'

interface Props {
  video: Video
}
const props = defineProps<Props>()

const jsonDataStore = useJsonDataStore()

const channel = jsonDataStore.channelsDict[props.video.snippet.channelId]
const getChannelUrl = () => {
  return 'https://www.youtube.com/channel/' + channel.id
}
const getVideoUrl = () => {
  const isShorts =
    props.video.snippet.title.toLowerCase().indexOf('shorts') >= 0 ||
    props.video.contentDetails.duration.indexOf('M') == -1

  if (isShorts) {
    return 'https://www.youtube.com/shorts/' + props.video.id
  }
  return 'https://www.youtube.com/watch?v=' + props.video.id
}
</script>

<template>
  <div>
    <a :href="getVideoUrl()" target="_blank">
      <img
        :src="video.snippet.thumbnails.medium.url"
        :alt="video.snippet.title"
        class="w-full rounded-lg"
      />
    </a>
    <h2 class="video-title">
      <a :href="getVideoUrl()" target="_blank">{{ video.snippet.title }}</a>
    </h2>
    <div class="flex justify-start items-center gap-4">
      <a :href="getChannelUrl()" target="_blank">
        <img :src="channel.snippet.thumbnails.default.url" class="w-10 h-10 object-contain" />
      </a>
      <a :href="getChannelUrl()" target="_blank" class="channel-title">
        {{ channel.snippet.title }}
      </a>
    </div>
    <time class="video-datetime" :datetime="video.snippet.publishedAt">{{
      formatDateString(video.snippet.publishedAt)
    }}</time>
    <TagList :tags="jsonDataStore.getTags(video.id)" :canClick="true" />
  </div>
</template>

<style lang="postcss" scoped>
@reference "../assets/main.css";

.video-title {
  @apply text-lg;
}

.channel-title {
  @apply text-sm;
}

.description {
  @apply bg-slate-100 rounded-md p-2 m-2;
}
</style>

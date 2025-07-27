<script setup lang="ts">
import { getTags } from '@/data/tags'
import { type Video } from '@/data/videos.ts'
import { formatDateString } from '@/utils.ts'
import TagList from '@/components/TagList.vue'
import { channels } from '@/data/channels.ts'

interface Props {
  video: Video
}
const props = defineProps<Props>()

const channel = channels[props.video.channel_id]
const getChannelUrl = () => {
  return 'https://www.youtube.com/channel/' + channel.channel_id
}
const getVideoUrl = () => {
  const isShorts =
    props.video.title.toLowerCase().indexOf('shorts') >= 0 ||
    props.video.duration.indexOf('M') == -1

  if (isShorts) {
    return 'https://www.youtube.com/shorts/' + props.video.video_id
  }
  return 'https://youtube.com/watch?v=' + props.video.video_id
}
</script>

<template>
  <div>
    <a :href="getVideoUrl()" target="_blank">
      <img :src="video.thumbnails.medium.url" :alt="video.title" class="w-full rounded-lg" />
    </a>
    <h2 class="video-title">
      <a :href="getVideoUrl()" target="_blank">{{ video.title }}</a>
    </h2>
    <div class="flex justify-start items-center gap-4">
      <a :href="getChannelUrl()" target="_blank">
        <img :src="channel.thumbnails.default.url" class="w-10 h-10 object-contain" />
      </a>
      <a :href="getChannelUrl()" target="_blank" class="channel-title">
        {{ channel.title }}
      </a>
    </div>
    <time class="video-datetime" :datetime="video.published_at">{{
      formatDateString(video.published_at)
    }}</time>
    <TagList :tags="getTags(video.video_id)" :canClick="false" />
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

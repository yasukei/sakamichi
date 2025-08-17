<script setup lang="ts">
import type { Video } from '../../types/youtube.d.ts'
import { formatDateString, formatTimeString } from '@/utils.ts'
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
    props.video.contentDetails.duration?.indexOf('M') === -1

  if (isShorts) {
    return 'https://www.youtube.com/shorts/' + props.video.id
  }
  return 'https://www.youtube.com/watch?v=' + props.video.id
}
const getDurationString = () => {
  if (props.video.contentDetails.duration) {
    return formatTimeString(props.video.contentDetails.duration)
  }
  return '--:--'
}
</script>

<template>
  <div>
    <a :href="getVideoUrl()" target="_blank">
      <div class="relative">
        <img :src="video.snippet.thumbnails.medium.url" :alt="video.snippet.title" class="w-full" />
        <div class="absolute bottom-1 right-1 p-0.25 bg-black opacity-90 text-white text-sm">
          <p>{{ getDurationString() }}</p>
        </div>
      </div>
    </a>
    <div class="flex gap-2 items-center mt-2">
      <a :href="getChannelUrl()" target="_blank" class="shrink-0">
        <img
          :src="channel.snippet.thumbnails.default.url"
          :alt="channel.snippet.title"
          class="w-10 h-10 object-contain"
        />
      </a>
      <div>
        <h2 class="text-md line-clamp-3">
          <a :href="getVideoUrl()" target="_blank">{{ video.snippet.title }}</a>
        </h2>
        <time class="video-datetime" :datetime="video.snippet.publishedAt">{{
          formatDateString(video.snippet.publishedAt)
        }}</time>
      </div>
    </div>
    <TagList
      :tags="[channel.snippet.title].concat(jsonDataStore.getTags(video.id))"
      :canClick="true"
    />
  </div>
</template>

<style lang="postcss" scoped>
@reference "../assets/main.css";
</style>

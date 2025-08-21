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
      <!-- video's thumbnail -->
      <div class="relative">
        <img :src="video.snippet.thumbnails.medium.url" :alt="video.snippet.title" class="w-full" />
        <div
          class="absolute bottom-1 right-1 px-0.75 py-0.25 bg-black opacity-80 text-white text-sm rounded-xs"
        >
          <p>{{ getDurationString() }}</p>
        </div>
      </div>
    </a>
    <div class="flex gap-2 items-center mt-2">
      <!-- channel's thumbnail -->
      <div class="relative group w-10 h-10 shrink-0">
        <a :href="getChannelUrl()" target="_blank">
          <img
            :src="channel.snippet.thumbnails.default.url"
            :alt="channel.snippet.title"
            class="object-contain"
          />
        </a>
        <div
          class="absolute text-nowrap bg-black bg-opacity-60 text-md text-white flex items-center justify-center px-1.5 py-0.5 opacity-0 transition-opacity duration-300 group-hover:opacity-100 rounded-xs"
        >
          <p class="text-center">{{ channel.snippet.title }}</p>
        </div>
      </div>
      <div>
        <h2 class="text-md line-clamp-3">
          <a :href="getVideoUrl()" target="_blank">{{ video.snippet.title }}</a>
        </h2>
        <time class="video-datetime" :datetime="video.snippet.publishedAt">{{
          formatDateString(video.snippet.publishedAt)
        }}</time>
      </div>
    </div>
    <TagList :tags="jsonDataStore.tagsDict[video.id].tags" :canClick="true" />
  </div>
</template>

<style lang="postcss" scoped>
@reference "../assets/main.css";
</style>

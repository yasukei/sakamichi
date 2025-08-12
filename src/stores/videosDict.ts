import axios from 'axios'
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

import type { Dict } from '../../types/sakamichi'
import type { Video } from '../../types/youtube'

export const useVideosDictStore = defineStore('videosDict', () => {
  // States
  const videosDict = ref<Dict<Video>>({}) // TODO: initialize vidoesDict-1.json and so on
  const isLoaded = ref(false)

  // Getters
  const videos = computed(() => {
    return Object.values(videosDict.value)
  })

  // Actions
  async function fetchVideosDict() {
    const url = window.origin + import.meta.env.BASE_URL + 'videosDict.json'
    try {
      const response = await axios.get<Dict<Video>>(url)
      videosDict.value = response.data
      isLoaded.value = true
    } catch (error) {
      // TODO: error handling
      throw error
    }
    return videosDict
  }

  return { videosDict, videos, isLoaded, fetchVideosDict }
})

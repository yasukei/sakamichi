import axios from 'axios'
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

import type { Dict, Member, VideoTags } from '../../types/sakamichi'
import type { Channel, Video } from '../../types/youtube'

export const useJsonDataStore = defineStore('jsonData', () => {
  // States
  const membersDict = ref<Dict<Member>>({})
  const channelsDict = ref<Dict<Channel>>({})
  const videosDict = ref<Dict<Video>>({}) // TODO: initialize vidoesDict-1.json and so on
  const tagsDict = ref<Dict<VideoTags>>({})
  const isLoaded = ref(false)

  // Getters
  const members = computed(() => {
    return Object.values(membersDict.value)
  })
  const channels = computed(() => {
    return Object.values(channelsDict.value)
  })
  const videos = computed(() => {
    return Object.values(videosDict.value)
  })
  const tags = computed(() => {
    return Object.values(tagsDict.value)
  })
  const getXbatchMembers = computed(() => {
    return (batch: number, graduated: boolean): Member[] => {
      return members.value.filter(
        (member) => member.batch === batch && member.graduated === graduated,
      )
    }
  })
  const getXbatchNames = computed(() => {
    return (batch: number, graduated: boolean): string[] => {
      return getXbatchMembers.value(batch, graduated).map((member) => member.name)
    }
  })
  const getChannelTitle = computed(() => {
    return (channelId: string): string => {
      return channelsDict.value[channelId].snippet.title
    }
  })
  const getChannelTitles = computed(() => {
    return () => {
      return channels.value.map((channel) => channel.snippet.title)
    }
  })
  const getTags = computed(() => {
    return (videoId: string): string[] => {
      if (!(videoId in tagsDict.value)) {
        return ['未分類']
      }

      return tagsDict.value[videoId].tags.sort((a, b) => {
        if (!(a in membersDict.value)) {
          return 1
        }
        if (!(b in membersDict.value)) {
          return -1
        }

        if (membersDict.value[a].batch != membersDict.value[b].batch) {
          return membersDict.value[a].batch - membersDict.value[b].batch
        }
        return membersDict.value[a].order - membersDict.value[b].order
      })
    }
  })

  // Actions
  async function fetch() {
    const baseUrl = window.origin + import.meta.env.BASE_URL

    try {
      const elems = [
        {
          url: baseUrl + 'membersDict.json',
          dict: membersDict,
        },
        {
          url: baseUrl + 'channelsDict.json',
          dict: channelsDict,
        },
        {
          url: baseUrl + 'videosDict.json',
          dict: videosDict,
        },
        {
          url: baseUrl + 'tagsDict.json',
          dict: tagsDict,
        },
      ]
      const promises = elems.map(async (elem) => {
        const response = await axios.get(elem.url)
        elem.dict.value = response.data
      })
      await Promise.all(promises)
      isLoaded.value = true
    } catch (error) {
      // TODO: error handling
      throw error
    }
  }

  return {
    membersDict,
    channelsDict,
    videosDict,
    tagsDict,
    isLoaded,
    members,
    channels,
    videos,
    tags,
    getXbatchMembers,
    getXbatchNames,
    getChannelTitle,
    getChannelTitles,
    getTags,
    fetch,
  }
})

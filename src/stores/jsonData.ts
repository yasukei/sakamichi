import axios from 'axios'

import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

import type { Dict, Member, VideoTags } from '../../types/sakamichi'
import type { Channel, Video } from '../../types/youtube'

async function fetchJson() {
  try {
    const baseUrl = window.origin + import.meta.env.BASE_URL
    const promises = [
      axios.get<Dict<Member>>(baseUrl + 'membersDict.json'),
      axios.get<Dict<Channel>>(baseUrl + 'channelsDict.json'),
      axios.get<Dict<Video>>(baseUrl + 'videosDict.json'),
      axios.get<Dict<VideoTags>>(baseUrl + 'tagsDict.json'),
    ]
    const [res0, res1, res2, res3] = await Promise.all(promises)

    const _membersDict = res0.data as Dict<Member>
    const _channelsDict = res1.data as Dict<Channel>
    const _videosDict = res2.data as Dict<Video>
    const _videoTagsDict = res3.data as Dict<VideoTags>

    return {
      _membersDict,
      _channelsDict,
      _videosDict,
      _videoTagsDict,
    }
  } catch (error) {
    // TODO: error handling
    throw error
  }
}

export interface TagsSet {
  videoId: string
  tags: Set<string>
}

export type TagsSetDict = Record<string, TagsSet>

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
  const tagsSetDict = computed(() => {
    const tagsSetDict = Object.values(tagsDict.value).reduce(
      (accumulator, videoTags: VideoTags) => {
        const tagsSet = {
          videoId: videoTags.videoId,
          tags: new Set(videoTags.tags),
        }
        accumulator[videoTags.videoId] = tagsSet
        return accumulator
      },
      {} as TagsSetDict,
    )

    return tagsSetDict
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

  // Actions
  async function load() {
    if (isLoaded.value) {
      return
    }

    const { _membersDict, _channelsDict, _videosDict, _videoTagsDict } = await fetchJson()

    membersDict.value = _membersDict
    channelsDict.value = _channelsDict
    videosDict.value = _videosDict
    tagsDict.value = _videoTagsDict
    isLoaded.value = true
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
    tagsSetDict,
    getXbatchMembers,
    getXbatchNames,
    getChannelTitle,
    getChannelTitles,
    load,
  }
})

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

import type { Video } from '../types/youtube'
import type { ChannelDefinition, Member, Tags } from '../types/sakamichi'
import { YoutubeApi } from './youtubeApi'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const CHANNEL_DEFINITIONS_JSON = __dirname + '/data/channel_definitions.json'
const CHANNELS_DICT_JSON = __dirname + '/data/channelsDict.json'
const VIDEOS_DICT_JSON = __dirname + '/data/videosDict.json'
const MEMBERS_JSON = __dirname + '/data/members.json'
const MEMBERS_DICT_JSON = __dirname + '/data/membersDict.json'
const TAGS_DICT_JSON = __dirname + '/data/tagsDict.json'
const UNTAGS_DICT_JSON = __dirname + '/data/untagsDict.json'

function loadJson<T>(filePath: string): T {
  const fileContent = fs.readFileSync(filePath, 'utf-8')
  return JSON.parse(fileContent)
}

function saveAsJson<T>(filePath: string, content: T) {
  fs.writeFileSync(filePath, JSON.stringify(content, null, '  '), 'utf-8')
}

function makeDict<T>(array: T[], keyMemberName: string): { [key: string]: T } {
  const dict = array.reduce((dict, elem) => {
    dict[elem[keyMemberName]] = elem
    return dict
  }, {})
  return dict
}

function makeUntagsDict(
  videos: Video[],
  tagsDict: { [key: string]: Tags },
): { [key: string]: Tags } {
  const untaggedVideos = videos.filter((video) => {
    return !(video.id in tagsDict)
  })
  const untags: Tags[] = untaggedVideos.map((untaggedVideo) => {
    return {
      title: untaggedVideo.snippet.title,
      videoId: untaggedVideo.id,
      tags: [],
    }
  })
  return makeDict(untags, 'videoId')
}

const apiKey = process.env.GOOGLE_API_KEY
if (!apiKey) {
  throw new Error('GOOGLE_API_KEY is not defined in environment variables.')
}

const main = async () => {
  try {
    const youtubeApi = new YoutubeApi(apiKey)

    console.info(`Loading ${CHANNEL_DEFINITIONS_JSON}`)
    const channelDefinitions = loadJson<ChannelDefinition[]>(CHANNEL_DEFINITIONS_JSON)
    const channelDefinitionsDict = makeDict(channelDefinitions, 'channelId')
    const channelIds = channelDefinitions
      .filter((channelDefinition) => channelDefinition.isValid)
      .map((channelDefinition) => channelDefinition.channelId)

    console.info(`Loading ${MEMBERS_JSON}`)
    const members = loadJson<Member[]>(MEMBERS_JSON)
    const membersDict = makeDict(members, 'name')

    console.info(`Loading ${TAGS_DICT_JSON}`)
    const tagsDict = loadJson<{ [key: string]: Tags }>(TAGS_DICT_JSON)

    console.info('Getting channels information from YoutubeApi')
    const channels = await youtubeApi.getChannels(channelIds)
    const channelsDict = makeDict(channels, 'id')

    console.info('Getting videos information from YoutubeApi')
    const allVideos = await channels.reduce<Promise<Video[]>>(async (videosPromise, channel) => {
      const videos = await videosPromise
      const playlistItems = await youtubeApi.getPlaylistItems(
        channel.contentDetails.relatedPlaylists.uploads,
      )
      const videoIds = playlistItems.map((item) => item.contentDetails.videoId)
      videos.push(...(await youtubeApi.getVideos(videoIds)))
      return videos
    }, Promise.resolve([]))

    console.info('Filtering videos')
    const filteredVideos = allVideos.filter((video) => {
      const channelDefinition = channelDefinitionsDict[video.snippet.channelId]
      if (channelDefinition.isOfficial) {
        return true
      }

      const containsKeyword = (keyword: string) => {
        return video.snippet.title.includes(keyword) || video.snippet.description.includes(keyword)
      }
      if (containsKeyword('日向坂')) {
        return true
      }
      return Object.keys(membersDict).some((key) => {
        return containsKeyword(key)
      })
    })

    console.info('Sorting videos')
    filteredVideos.sort((a, b) => {
      if (a.snippet.publishedAt < b.snippet.publishedAt) {
        return 1
      } else if (a.snippet.publishedAt > b.snippet.publishedAt) {
        return -1
      }
      return 0
    })
    const filteredVideosDict = makeDict(filteredVideos, 'id')

    console.info('Checking untagged videos')
    const untagsDict = makeUntagsDict(filteredVideos, tagsDict)

    console.info(`Saving ${CHANNELS_DICT_JSON}`)
    saveAsJson(CHANNELS_DICT_JSON, channelsDict)
    console.info(`Saving ${VIDEOS_DICT_JSON}`)
    saveAsJson(VIDEOS_DICT_JSON, filteredVideosDict)
    console.info(`Saving ${MEMBERS_DICT_JSON}`)
    saveAsJson(MEMBERS_DICT_JSON, membersDict)
    console.info(`Saving ${UNTAGS_DICT_JSON}`)
    saveAsJson(UNTAGS_DICT_JSON, untagsDict)
  } catch (error) {
    console.error(error)
    throw error
  }
}

main()

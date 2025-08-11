import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

import { Channel, Video } from '../types/youtube'
import { Member } from '../types/sakamichi'
import { YoutubeApi } from './youtubeApi'

interface ChannelDefinition {
  name: string
  channelId: string
  isOfficial: boolean
  isValid: boolean
}

function loadChannelDefinitions(filePath: string): ChannelDefinition[] {
  const fileContent = fs.readFileSync(filePath, 'utf-8')
  return JSON.parse(fileContent)
}

function loadMembersDict(filePath: string): { [key: string]: Member } {
  const fileContent = fs.readFileSync(filePath, 'utf-8')
  return JSON.parse(fileContent)
}

function makeChannelDefinitionsDict(channelDefinitions: ChannelDefinition[]): {
  [key: string]: ChannelDefinition
} {
  const dict = channelDefinitions.reduce((dict, channelDefinition) => {
    dict[channelDefinition.channelId] = channelDefinition
    return dict
  }, {})
  return dict
}

function makeChannelsDict(channels: Channel[]): { [key: string]: Channel } {
  const dict = channels.reduce((dict, channel) => {
    dict[channel.id] = channel
    return dict
  }, {})
  return dict
}

function makeVideosDict(videos: Video[]): { [key: string]: Video } {
  const dict = videos.reduce((dict, video) => {
    dict[video.id] = video
    return dict
  }, {})
  return dict
}

function save<T>(filePath: string, content: T) {
  fs.writeFileSync(filePath, JSON.stringify(content, null, '  '), 'utf-8')
}

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const filePaths = {
  'channel_definitions.json': __dirname + '/data/channel_definitions.json',
  'channels.json': __dirname + '/data/channels.json',
  'videos.json': __dirname + '/data/videos.json',
  'members.json': __dirname + '/data/members.json',
}
const apiKey = process.env.GOOGLE_API_KEY
if (!apiKey) {
  throw new Error('GOOGLE_API_KEY is not defined in environment variables.')
}

const main = async () => {
  try {
    const youtubeApi = new YoutubeApi(apiKey)

    console.info('Loading channel_definitions.json')
    const channelDefinitions = loadChannelDefinitions(filePaths['channel_definitions.json'])
    const channelDefinitionsDict = makeChannelDefinitionsDict(channelDefinitions)
    const channelIds = channelDefinitions
      .filter((channelDefinition) => channelDefinition.isValid)
      .map((channelDefinition) => channelDefinition.channelId)

    console.info('Loading members.json')
    const membersDict = loadMembersDict(filePaths['members.json'])

    console.info('Getting channels information from YoutubeApi')
    const channels = await youtubeApi.getChannels(channelIds)
    const channelsDict = makeChannelsDict(channels)

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

      const containsKeyword = (keyword) => {
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
    const filteredVideosDict = makeVideosDict(filteredVideos)

    console.info('Saving channels.json')
    save(filePaths['channels.json'], channelsDict)
    console.info('Saving videos.json')
    save(filePaths['videos.json'], filteredVideosDict)
  } catch (error) {
    console.error(error)
  }
}

main()

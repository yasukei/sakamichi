import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

import type { Video } from '../types/youtube'
import type { ChannelDefinition, Member } from '../types/sakamichi'
import { YoutubeApi } from './youtubeApi'

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

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const filePaths = {
  'channel_definitions.json': __dirname + '/data/channel_definitions.json',
  'channelsDict.json': __dirname + '/data/channelsDict.json',
  'videosDict.json': __dirname + '/data/videosDict.json',
  'members.json': __dirname + '/data/members.json',
  'membersDict.json': __dirname + '/data/membersDict.json',
}
const apiKey = process.env.GOOGLE_API_KEY
if (!apiKey) {
  throw new Error('GOOGLE_API_KEY is not defined in environment variables.')
}

const main = async () => {
  try {
    const youtubeApi = new YoutubeApi(apiKey)

    console.info('Loading channel_definitions.json')
    const channelDefinitions = loadJson<ChannelDefinition[]>(filePaths['channel_definitions.json'])
    const channelDefinitionsDict = makeDict(channelDefinitions, 'channelId')
    const channelIds = channelDefinitions
      .filter((channelDefinition) => channelDefinition.isValid)
      .map((channelDefinition) => channelDefinition.channelId)

    console.info('Loading members.json')
    const members = loadJson<Member[]>(filePaths['members.json'])
    const membersDict = makeDict(members, 'name')

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

    console.info('Saving channelsDict.json')
    saveAsJson(filePaths['channelsDict.json'], channelsDict)
    console.info('Saving videosDict.json')
    saveAsJson(filePaths['videosDict.json'], filteredVideosDict)
    console.info('Saving membersDict.json')
    saveAsJson(filePaths['membersDict.json'], membersDict)
  } catch (error) {
    console.error(error)
  }
}

main()

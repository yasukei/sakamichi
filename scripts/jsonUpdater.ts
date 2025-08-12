import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

import type { Video } from '../types/youtube'
import type { ChannelDefinition, Member, Tags, Dict } from '../types/sakamichi'
import { YoutubeApi } from './youtubeApi'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
// input files
const CHANNEL_DEFINITIONS_JSON = __dirname + '/data/channel_definitions.json'
const MEMBERS_JSON = __dirname + '/data/members.json'
const TAGS_DICT_JSON = __dirname + '/data/tagsDict.json'
// output files
const MEMBERS_DICT_JSON = __dirname + '/data/membersDict.json'
const CHANNELS_DICT_JSON = __dirname + '/data/channelsDict.json'
const VIDEOS_DICT_JSON = __dirname + '/data/videosDict.json'
const UNTAGS_DICT_JSON = __dirname + '/data/untagsDict.json'

function loadJson<T>(filePath: string): T {
  const fileContent = fs.readFileSync(filePath, 'utf-8')
  return JSON.parse(fileContent)
}

function saveAsJson<T>(filePath: string, content: T) {
  fs.writeFileSync(filePath, JSON.stringify(content, null, '  '), 'utf-8')
}

function makeDict<T>(array: T[], keyMemberName: string): Dict<T> {
  const dict = array.reduce((dict, elem) => {
    dict[elem[keyMemberName]] = elem
    return dict
  }, {})
  return dict
}

function containsKeyword(video: Video, keyword: string) {
  return video.snippet.title.includes(keyword) || video.snippet.description.includes(keyword)
}

const newYoutubeApi = () => {
  const apiKey = process.env.GOOGLE_API_KEY
  if (!apiKey) {
    throw new Error('GOOGLE_API_KEY is not defined in environment variables.')
  }
  return new YoutubeApi(apiKey)
}

const loadFiles = () => {
  const channelDefinitions = loadJson<ChannelDefinition[]>(CHANNEL_DEFINITIONS_JSON)
  const members = loadJson<Member[]>(MEMBERS_JSON)
  const tagsDict = loadJson<Dict<Tags>>(TAGS_DICT_JSON)

  const validChannelIds = channelDefinitions
    .filter((channelDefinition) => channelDefinition.isValid)
    .map((channelDefinition) => channelDefinition.channelId)

  return {
    channelDefinitions,
    members,
    tagsDict,
    validChannelIds,
  }
}

const getDataFromYoutubeApi = async (youtubeApi: YoutubeApi, validChannelIds: string[]) => {
  const channels = await youtubeApi.getChannels(validChannelIds)

  const videos = await channels.reduce<Promise<Video[]>>(async (videosPromise, channel) => {
    const videos = await videosPromise

    const playlistItems = await youtubeApi.getPlaylistItems(
      channel.contentDetails.relatedPlaylists.uploads,
    )
    const videoIds = playlistItems.map((item) => item.contentDetails.videoId)
    videos.push(...(await youtubeApi.getVideos(videoIds)))
    return videos
  }, Promise.resolve([]))

  return {
    channels,
    videos,
  }
}

const filterVideos = (
  videos: Video[],
  channelDefinitions: ChannelDefinition[],
  members: Member[],
) => {
  const channelDefinitionsDict = makeDict(channelDefinitions, 'channelId')

  const filteredVideos = videos.filter((video) => {
    const channelDefinition = channelDefinitionsDict[video.snippet.channelId]
    if (channelDefinition.isOfficial) {
      return true
    }

    if (containsKeyword(video, '日向坂')) {
      return true
    }
    return members.some((member) => containsKeyword(video, member.name))
  })

  return filteredVideos
}

const sortByPublishedAtDesc = (a: Video, b: Video) => {
  if (a.snippet.publishedAt < b.snippet.publishedAt) {
    return 1
  } else if (a.snippet.publishedAt > b.snippet.publishedAt) {
    return -1
  }
  return 0
}

const getUntags = (videos: Video[], tagsDict: Dict<Tags>, members: Member[]): Tags[] => {
  const untaggedVideos = videos.filter((video) => {
    return !(video.id in tagsDict)
  })
  return untaggedVideos.map((untaggedVideo) => {
    const containedMembers = members.filter((member) => containsKeyword(untaggedVideo, member.name))
    return {
      title: untaggedVideo.snippet.title,
      videoId: untaggedVideo.id,
      tags: containedMembers.map((member) => member.name),
    }
  })
}

const main = async () => {
  try {
    const youtubeApi = newYoutubeApi()

    console.info('Loading files')
    const { validChannelIds, channelDefinitions, members, tagsDict } = loadFiles()

    console.info('Getting data from YoutubeApi')
    const { channels, videos } = await getDataFromYoutubeApi(youtubeApi, validChannelIds)

    console.info('Filtering videos')
    const filteredVideos = filterVideos(videos, channelDefinitions, members)

    console.info('Sorting videos')
    filteredVideos.sort(sortByPublishedAtDesc)

    console.info('Getting untags')
    const untags = getUntags(filteredVideos, tagsDict, members)

    console.info('Saving files')
    const savingFiles = [
      {
        filePath: MEMBERS_DICT_JSON,
        content: makeDict(members, 'name'),
      },
      {
        filePath: CHANNELS_DICT_JSON,
        content: makeDict(channels, 'id'),
      },
      {
        filePath: VIDEOS_DICT_JSON,
        content: makeDict(filteredVideos, 'id'),
      },
      {
        filePath: UNTAGS_DICT_JSON,
        content: makeDict(untags, 'videoId'),
      },
    ]
    savingFiles.forEach((savingFile) => {
      saveAsJson(savingFile.filePath, savingFile.content)
    })
  } catch (error) {
    console.error(error)
    throw error
  }
}

main()

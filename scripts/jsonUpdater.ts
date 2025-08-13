import fs from 'fs'

import type { Channel, Video } from '../types/youtube'
import type { ChannelDefinition, Member, VideoTags, Dict } from '../types/sakamichi'
import { YoutubeApi } from './youtubeApi'

const DIR_PATH = import.meta.dirname + '/'
// suffixes
const TAGS_DICT_SUFFIX = '_tagsDict.json'
const UNTAGS_DICT_SUFFIX = '_untagsDict.json'

// dir paths
const TAGS_DICT_DIR_FOR_LOAD = DIR_PATH + 'data/tagsDict/'
const UNTAGS_DICT_DIR = DIR_PATH + 'data/tagsDict/'

// input files
const CHANNEL_DEFINITIONS_JSON = DIR_PATH + 'data/channel_definitions.json'
const MEMBERS_JSON = DIR_PATH + 'data/members.json'
// output files
const MEMBERS_DICT_JSON = DIR_PATH + '../public/membersDict.json'
const CHANNELS_DICT_JSON = DIR_PATH + '../public/channelsDict.json'
const VIDEOS_DICT_JSON = DIR_PATH + '../public/videosDict.json'
const TAGS_DICT_JSON_FOR_SAVE = DIR_PATH + '../public/tagsDict.json'

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

function removeAllWhiteSpace(text: string) {
  return text.replace(/\s/g, '')
}

function containsKeyword(video: Video, keyword: string) {
  const title = removeAllWhiteSpace(video.snippet.title)
  const description = removeAllWhiteSpace(video.snippet.description)

  return title.includes(keyword) || description.includes(keyword)
}

function getChannelForSave(channel: Channel): Channel {
  return {
    id: channel.id,
    snippet: {
      title: channel.snippet.title,
      description: channel.snippet.description,
      thumbnails: {
        default: channel.snippet.thumbnails.default,
      },
    },
    contentDetails: {
      relatedPlaylists: {
        uploads: channel.contentDetails.relatedPlaylists.uploads,
      },
    },
  }
}

function getChannelsForSave(channels: Channel[]): Channel[] {
  return channels.map((channel) => getChannelForSave(channel))
}

function getVideoForSave(video: Video): Video {
  return {
    id: video.id,
    snippet: {
      publishedAt: video.snippet.publishedAt,
      channelId: video.snippet.channelId,
      title: video.snippet.title,
      description: video.snippet.description,
      thumbnails: {
        medium: video.snippet.thumbnails.medium,
      },
    },
    contentDetails: {
      duration: video.contentDetails.duration,
    },
  }
}

function getVideosForSave(videos: Video[]): Video[] {
  return videos.map((video) => getVideoForSave(video))
}

function getVideoTagsForSave(videoTags: VideoTags): VideoTags {
  return {
    videoId: videoTags.videoId,
    tags: videoTags.tags,
  }
}

function getVideoTagsArrayForSave(videoTagsArray: VideoTags[]): VideoTags[] {
  return videoTagsArray.map((tags) => getVideoTagsForSave(tags))
}

const newYoutubeApi = () => {
  const apiKey = process.env.GOOGLE_API_KEY
  if (!apiKey) {
    throw new Error('GOOGLE_API_KEY is not defined in environment variables.')
  }
  return new YoutubeApi(apiKey)
}

const deleteAllUntagsDict = () => {
  const dirPath = UNTAGS_DICT_DIR
  const entries = fs.readdirSync(dirPath)
  const untagsDictFilePaths = entries
    .filter((entry) => entry.endsWith(UNTAGS_DICT_SUFFIX))
    .map((entry) => `${dirPath}/${entry}`)

  untagsDictFilePaths.forEach((filePath) => {
    fs.unlinkSync(filePath)
  })
}

const loadTagsDict = (dirPath: string) => {
  const entries = fs.readdirSync(dirPath)
  const tagsDictFilePaths = entries
    .filter((entry) => entry.endsWith(TAGS_DICT_SUFFIX))
    .map((entry) => `${dirPath}/${entry}`)

  return tagsDictFilePaths.reduce((accumulator, tagsDictFilePath) => {
    const jsonContent = loadJson<Dict<VideoTags>>(tagsDictFilePath)
    return { ...accumulator, ...jsonContent }
  }, {})
}

const loadFiles = () => {
  const channelDefinitions = loadJson<ChannelDefinition[]>(CHANNEL_DEFINITIONS_JSON)
  const members = loadJson<Member[]>(MEMBERS_JSON)
  const tagsDict = loadTagsDict(TAGS_DICT_DIR_FOR_LOAD)

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

const filterHinatazakaVideos = (
  videos: Video[],
  channelDefinitions: ChannelDefinition[],
  members: Member[],
) => {
  const channelDefinitionsDict = makeDict(channelDefinitions, 'channelId')

  const hinatazakaVideos = videos.filter((video) => {
    const channelDefinition = channelDefinitionsDict[video.snippet.channelId]
    if (channelDefinition.isOfficial) {
      return true
    }

    if (containsKeyword(video, '日向坂')) {
      return true
    }
    return members.some((member) => containsKeyword(video, member.name))
  })

  return hinatazakaVideos
}

const sortByPublishedAtDesc = (a: Video, b: Video) => {
  if (a.snippet.publishedAt < b.snippet.publishedAt) {
    return 1
  } else if (a.snippet.publishedAt > b.snippet.publishedAt) {
    return -1
  }
  return 0
}

const filterUntaggedVideos = (videos: Video[], tagsDict: Dict<VideoTags>) => {
  return videos.filter((video) => !(video.id in tagsDict))
}

const makeDefaultTagsForEachChannel = (videos: Video[], members: Member[]): Dict<VideoTags[]> => {
  const defaultTagsForEachChannel = videos.reduce((accumulator, video) => {
    const membersInTheVideo = members.filter((member) => containsKeyword(video, member.name))

    const defaultTags = {
      title: video.snippet.title,
      videoId: video.id,
      tags: membersInTheVideo.map((member) => member.name),
    }

    const channelId = video.snippet.channelId
    if (!(channelId in accumulator)) {
      accumulator[channelId] = []
    }
    accumulator[channelId].push(defaultTags)

    return accumulator
  }, {})

  return defaultTagsForEachChannel
}

const saveUntagsDictForEachChannel = (tagsForEachChannel: Dict<VideoTags[]>) => {
  Object.keys(tagsForEachChannel).forEach((channelId) => {
    const filePath = `${UNTAGS_DICT_DIR}/${channelId}${UNTAGS_DICT_SUFFIX}`
    const tags = tagsForEachChannel[channelId]

    saveAsJson(filePath, makeDict(tags, 'videoId'))
  })
}

const main = async () => {
  try {
    const youtubeApi = newYoutubeApi()

    console.info(`Deleting existing *${UNTAGS_DICT_SUFFIX}`)
    deleteAllUntagsDict()

    console.info('Loading files')
    const { validChannelIds, channelDefinitions, members, tagsDict } = loadFiles()

    console.info('Getting data from YoutubeApi')
    const { channels, videos } = await getDataFromYoutubeApi(youtubeApi, validChannelIds)

    console.info('Filtering Hinatazaka videos')
    const hinatazakaVideos = filterHinatazakaVideos(videos, channelDefinitions, members)

    console.info('Sorting videos')
    hinatazakaVideos.sort(sortByPublishedAtDesc)

    console.info('Filtering untagged vidoes')
    const untaggedVideos = filterUntaggedVideos(hinatazakaVideos, tagsDict)

    console.info('Making default tags for untagged vidoes for each channel')
    const defaultTagsForEachChannel = makeDefaultTagsForEachChannel(untaggedVideos, members)

    console.info('Saving files')
    const savingFiles = [
      {
        filePath: MEMBERS_DICT_JSON,
        content: makeDict(members, 'name'),
      },
      {
        filePath: CHANNELS_DICT_JSON,
        content: makeDict(getChannelsForSave(channels), 'id'),
      },
      {
        filePath: VIDEOS_DICT_JSON,
        content: makeDict(getVideosForSave(hinatazakaVideos), 'id'),
      },
      {
        filePath: TAGS_DICT_JSON_FOR_SAVE,
        content: makeDict(getVideoTagsArrayForSave(Object.values(tagsDict)), 'videoId'),
      },
    ]
    savingFiles.forEach((savingFile) => {
      saveAsJson(savingFile.filePath, savingFile.content)
    })
    saveUntagsDictForEachChannel(defaultTagsForEachChannel)
  } catch (error) {
    // console.error(error)
    throw error
  }
}

main()

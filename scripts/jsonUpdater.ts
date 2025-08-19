import fs from 'fs'

import { program } from 'commander'

import type { Channel, PlayListItem, Video } from '../types/youtube'
import type { ChannelDefinition, Member, VideoTags, Dict } from '../types/sakamichi'
import { YoutubeApi } from './youtubeApi'

const DIR_PATH = import.meta.dirname + '/'
// suffixes
const TAGS_DICT_SUFFIX = '_tagsDict.json'
const UNTAGS_DICT_SUFFIX = '_untagsDict.json'
const VIDEOS_SUFFIX = '_videos.json'
const EXCLUDE_VIDEO_IDS_SUFFIX = '_excludeVideoIds.json'

// dir paths
const TAGS_DICT_DIR_FOR_LOAD = DIR_PATH + 'data/tagsDict/'
const UNTAGS_DICT_DIR = DIR_PATH + 'data/tagsDict/'
const VIDEOS_DICT_DIR = DIR_PATH + 'data/videos/'
const EXCLUDE_VIDEO_IDS_DIR = DIR_PATH + 'data/videos/'

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

function loadOnlyValuesFromDictJsonFile<T>(filePath: string): T[] {
  const content: Dict<T> = loadJson(filePath)
  return Object.values(content)
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

function sortTagsProperty(tagsDict: Dict<VideoTags>, members: Member[]) {
  const membersDict = makeDict(members, 'name')

  Object.values(tagsDict).forEach((videoTags: VideoTags) => {
    videoTags.tags.sort((a, b) => {
      try {
        const memberA = membersDict[a]
        const memberB = membersDict[b]
        if (memberA.batch != membersDict[b].batch) {
          return memberA.batch - memberB.batch
        }
        return memberA.order - memberB.order
      } catch (error) {
        console.error(`Error occured:`)
        console.error(`  videoId: [${videoTags.videoId}]`)
        console.error(`  a:       [${a}]`)
        console.error(`  b:       [${b}]`)
        console.error('Probably, the following VideoTags contains invalid data')
        console.error(`${JSON.stringify(videoTags, null, '  ')}`)
        throw error
      }
    })
  })
}

const loadFiles = () => {
  const channelDefinitions = loadJson<ChannelDefinition[]>(CHANNEL_DEFINITIONS_JSON)
  const members = loadJson<Member[]>(MEMBERS_JSON)

  const tagsDict = loadTagsDict(TAGS_DICT_DIR_FOR_LOAD)
  sortTagsProperty(tagsDict, members)

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
  const loadVideosFromLocal = (filePath: string): Video[] => {
    if (fs.existsSync(filePath)) {
      return loadJson(filePath)
    }
    return []
  }
  const saveVideosToLocal = (filePath: string, videos: Video[]) => {
    saveAsJson(filePath, videos)
  }
  const loadExcludeVideoIdsSet = (channelId: string): Set<string> => {
    const filePath = `${EXCLUDE_VIDEO_IDS_DIR}/${channelId}${EXCLUDE_VIDEO_IDS_SUFFIX}`
    if (fs.existsSync(filePath)) {
      const videoIds: string[] = loadJson(filePath)
      return new Set(videoIds)
    }
    return new Set()
  }

  const channels = await youtubeApi.getChannels(validChannelIds)

  const videos = await channels.reduce<Promise<Video[]>>(async (accumulator, channel) => {
    console.info(`Getting data from ${channel.id}, ${channel.snippet.title}`)

    const filePath = `${VIDEOS_DICT_DIR}/${channel.id}${VIDEOS_SUFFIX}`
    const videosInLocalFile = loadVideosFromLocal(filePath)
    const cache = makeDict(videosInLocalFile, 'id')

    const playListItemValidator = (playlistItems: PlayListItem[]) => {
      const itemsToBeAdded = playlistItems.filter((playlistItem) => {
        return !(playlistItem.contentDetails.videoId in cache)
      })
      return {
        itemsToBeAdded: itemsToBeAdded,
        continueToGet: itemsToBeAdded.length > 0,
      }
    }
    const playlistItems = await youtubeApi.getPlaylistItems(
      channel.contentDetails.relatedPlaylists.uploads,
      playListItemValidator,
    )
    const videoIds = playlistItems.map((item) => item.contentDetails.videoId)
    const videosFromYoutube = await youtubeApi.getVideos(videoIds)

    const videosInThisChannel = [...videosFromYoutube, ...videosInLocalFile]
    saveVideosToLocal(filePath, videosInThisChannel)

    const excludeVideoIdsSet = loadExcludeVideoIdsSet(channel.id)
    const videosWithoutExcludeVideoIds = videosInThisChannel.filter(
      (video) => !excludeVideoIdsSet.has(video.id),
    )

    const videosInAllChannels = await accumulator
    videosInAllChannels.push(...videosWithoutExcludeVideoIds)
    return videosInAllChannels
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

const displayStats = (channels: Channel[], videos: Video[], hinatazakaVideos: Video[]) => {
  console.info('Stats:')
  console.info('  Channels:')
  channels.forEach((channel) => {
    const allVideos = videos.filter((video) => video.snippet.channelId === channel.id)
    const memberVideos = hinatazakaVideos.filter((video) => video.snippet.channelId === channel.id)
    console.info(`    ${channel.id}, ${channel.snippet.title}`)
    console.info(`      all videos:    [${allVideos.length}]`)
    console.info(
      `      member videos: [${memberVideos.length.toString().padStart(allVideos.length.toString().length)}]`,
    )
  })
  console.info('  Videos:')
  console.info(`    all videos:    [${videos.length}]`)
  console.info(
    `    member videos: [${hinatazakaVideos.length.toString().padStart(videos.length.toString().length)}]`,
  )
}

const main = async () => {
  try {
    program.option('-s, --skipGettingYoutubeData').parse()
    const options = program.opts()

    const youtubeApi = newYoutubeApi()

    console.info(`Deleting existing *${UNTAGS_DICT_SUFFIX}`)
    deleteAllUntagsDict()

    console.info('Loading files')
    const { validChannelIds, channelDefinitions, members, tagsDict } = loadFiles()

    const fromFiles = () => {
      console.info('Getting channels and videos data from files')
      const videos: Video[] = loadOnlyValuesFromDictJsonFile(VIDEOS_DICT_JSON)
      const channels: Channel[] = loadOnlyValuesFromDictJsonFile(CHANNELS_DICT_JSON)
      return { channels, videos }
    }
    const fromYoutubeApi = async () => {
      console.info('Getting channels and videos data from YoutubeApi')
      return getDataFromYoutubeApi(youtubeApi, validChannelIds)
    }
    const { channels, videos } = options.skipYoutubeData ? fromFiles() : await fromYoutubeApi()

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

    displayStats(channels, videos, hinatazakaVideos)
  } catch (error) {
    // console.error(error)
    throw error
  }
}

main()

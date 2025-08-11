import axios from 'axios'

import {
  Channel,
  ChannelsResponse,
  PlayListItem,
  PlayListItemsResponse,
  Video,
  VideosResponse,
} from '../types/youtube'

export class YoutubeApi {
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async getChannels(channelIds: string[]): Promise<Channel[]> {
    const url = 'https://www.googleapis.com/youtube/v3/channels'
    const maxResults = 50
    const channels: Channel[] = []
    let _channelIds = [...channelIds]

    while (_channelIds.length > 0) {
      const ids = _channelIds.slice(0, maxResults)
      _channelIds = _channelIds.slice(maxResults)

      const response = await axios.get<ChannelsResponse>(url, {
        params: {
          part: 'snippet,contentDetails',
          id: ids.join(','),
          key: this.apiKey,
        },
      })
      channels.push(...response.data.items)
    }

    return channels
  }

  async getPlaylistItems(playlistId: string): Promise<PlayListItem[]> {
    const url = 'https://www.googleapis.com/youtube/v3/playlistItems'
    const maxResults = 50
    const playlistItems: PlayListItem[] = []
    let nextPageToken: string | undefined = undefined

    do {
      const response = await axios.get<PlayListItemsResponse>(url, {
        params: {
          part: 'snippet,contentDetails',
          playlistId: playlistId,
          key: this.apiKey,
          maxResults: maxResults,
          pageToken: nextPageToken,
        },
      })
      playlistItems.push(...response.data.items)
      nextPageToken = response.data.nextPageToken
    } while (nextPageToken)

    return playlistItems
  }

  async getVideos(videoIds: string[]): Promise<Video[]> {
    const url = 'https://www.googleapis.com/youtube/v3/videos'
    const maxResults = 50
    const videos: Video[] = []
    let _videoIds = [...videoIds]

    while (_videoIds.length > 0) {
      const ids = _videoIds.slice(0, maxResults)
      _videoIds = _videoIds.slice(maxResults)

      const response = await axios.get<VideosResponse>(url, {
        params: {
          part: 'snippet,contentDetails',
          id: ids.join(','),
          key: this.apiKey,
        },
      })
      videos.push(...response.data.items)
    }

    return videos
  }
}

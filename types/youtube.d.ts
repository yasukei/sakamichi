export interface Thumbnail {
  url: string
  width: number
  height: number
}

export interface Channel {
  id: string
  snippet: {
    title: string
    description: string
    thumbnails: {
      default: Thumbnail
    }
  }
  contentDetails: {
    relatedPlaylists: {
      uploads: string
    }
  }
}

export interface ChannelsResponse {
  items: Channel[]
}

export interface PlayListItem {
  id: string
  snippet: {
    publishedAt: string
    channelId: string
    title: string
    description: string
  }
  contentDetails: {
    videoId: string
  }
}

export interface PlayListItemsResponse {
  nextPageToken?: string
  items: PlayListItem[]
}

export interface Video {
  id: string
  snippet: {
    publishedAt: string
    channelId: string
    title: string
    description: string
    thumbnails: {
      medium: Thumbnail
    }
  }
  contentDetails: {
    duration?: string // It becomes undefined when the video is scheduled to be published
  }
}

export interface VideosResponse {
  items: Video[]
}

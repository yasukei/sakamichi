import { type Thumbnail } from '@/data/thumbnail.d'
import videoJson from '@/data/videos.json'

export interface Video {
  video_id: string
  channel_id: string
  published_at: string
  title: string
  description: string
  thumbnails: {
    default: Thumbnail
    medium: Thumbnail
    high: Thumbnail
    standard: Thumbnail
    maxres?: Thumbnail
  }
  duration: string
  embed_html: string
}

export const videos: { [key: string]: Video } = videoJson

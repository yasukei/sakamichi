import { type Thumbnail } from '@/data/thumbnail.d'
import channelsJson from '@/data/channels.json'

export interface Channel {
  channel_id: string
  title: string
  description: string
  thumbnails: {
    default: Thumbnail
    medium: Thumbnail
    high: Thumbnail
  }
}

export const channels: { [key: string]: Channel } = channelsJson

export function getChannelTitle(channel_id: string): string {
  return channels[channel_id]?.title
}

export function getChannelTitles(): string[] {
  return Object.values(channels).map((channel) => channel.title)
}

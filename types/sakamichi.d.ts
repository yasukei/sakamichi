export interface ChannelDefinition {
  name: string
  channelId: string
  isOfficial: boolean
  isValid: boolean
}

export interface Member {
  name: string
  batch: number
  order: number
  graduated: boolean
}

export interface VideoTags {
  title?: string
  videoId: string
  tags: string[]
}

export type Dict<T> = Record<string, T>

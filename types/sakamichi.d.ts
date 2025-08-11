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

export interface Tags {
  video_id: string
  tags: string[]
}

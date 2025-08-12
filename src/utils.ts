import type { Member, Tags, Dict } from '../types/sakamichi.d.ts'
import type { Channel, Video } from '../types/youtube.d.ts'
import membersDict from '../scripts/data/membersDict.json'
import channelsDict from '../scripts/data/channelsDict.json'
import videosDict from '../scripts/data/videosDict.json'
import tagsDict from '../scripts/data/tagsDict.json'

// TODO: hide from outside
export const members: Dict<Member> = membersDict
export const channels: Dict<Channel> = channelsDict
export const videos: Dict<Video> = videosDict
const tags: Dict<Tags> = tagsDict

export function getXbatchMembers(batch: number, graduated: boolean): Member[] {
  return Object.values(members).filter(
    (member) => member.batch === batch && member.graduated === graduated,
  )
}

export function getXbatchNames(batch: number, graduated: boolean): string[] {
  return getXbatchMembers(batch, graduated).map((member) => member.name)
}

export function getChannelTitle(channel_id: string): string {
  return channels[channel_id].snippet.title
}

export function getChannelTitles(): string[] {
  return Object.values(channels).map((channel) => channel.snippet.title)
}

export function getTags(video_id: string): string[] {
  if (!(video_id in tags)) {
    return ['未分類']
  }

  return tags[video_id].tags.sort((a, b) => {
    if (!(a in members)) {
      return 1
    }
    if (!(b in members)) {
      return -1
    }

    if (members[a].batch != members[b].batch) {
      return members[a].batch - members[b].batch
    }
    return members[a].order - members[b].order
  })
}

export function formatDateString(isoString: string): string {
  const date = new Date(isoString)

  const formatter = new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  return formatter.format(date).replace(/(\d+)\/(\d+)\/(\d+)/, '$1年$2月$3日')
}

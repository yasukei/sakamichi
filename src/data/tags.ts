import { members } from '@/data/members'
import tagsJson from '@/data/scripts/tags.json'

export interface Tags {
  video_id: string
  tags: string[]
}

const tags: { [key: string]: Tags } = tagsJson

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

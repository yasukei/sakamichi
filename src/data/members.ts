import membersJson from '@/data/members.json'

export interface Member {
  name: string
  batch: number
  order: number
  graduated: boolean
}

export const members: { [key: string]: Member } = membersJson

function getXbatchMembers(batch: number): Member[] {
  return Object.values(members).filter((member) => member.batch == batch)
}

function getXbatchNames(batch: number): string[] {
  return getXbatchMembers(batch).map((member) => member.name)
}

export const batch2Members = getXbatchMembers(2)
export const batch3Members = getXbatchMembers(3)
export const batch4Members = getXbatchMembers(4)
export const batch5Members = getXbatchMembers(5)

export const batch2Names = getXbatchNames(2)
export const batch3Names = getXbatchNames(3)
export const batch4Names = getXbatchNames(4)
export const batch5Names = getXbatchNames(5)

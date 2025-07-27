import membersJson from '@/data/members.json'

export interface Member {
  name: string
  batch: number
  order: number
  graduated: boolean
}

export const members: { [key: string]: Member } = membersJson

export function getXbatchMembers(batch: number, graduated: boolean): Member[] {
  return Object.values(members).filter(
    (member) => member.batch === batch && member.graduated === graduated,
  )
}

export function getXbatchNames(batch: number, graduated: boolean): string[] {
  return getXbatchMembers(batch, graduated).map((member) => member.name)
}

export function formatDateString(isoString: string): string {
  const date = new Date(isoString)

  const formatter = new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  return formatter.format(date).replace(/(\d+)\/(\d+)\/(\d+)/, '$1年$2月$3日')
}

export function formatTimeString(duration: string): string {
  const ss =
    duration
      .match(/(\d*S)/g)?.[0]
      .replace('S', '')
      .padStart(2, '0') ?? '00'
  const mm =
    duration
      .match(/(\d*M)/g)?.[0]
      .replace('M', '')
      .padStart(2, '0') ?? '00'
  const hh = duration.match(/(\d*H)/g)?.[0].replace('H', '') ?? undefined

  if (hh) {
    return `${hh}:${mm}:${ss}`
  }
  return `${mm}:${ss}`
}

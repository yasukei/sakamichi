export function formatDateString(isoString: string): string {
  const date = new Date(isoString)

  const formatter = new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  return formatter.format(date).replace(/(\d+)\/(\d+)\/(\d+)/, '$1年$2月$3日')
}

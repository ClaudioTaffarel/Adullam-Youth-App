export type CommunityEvent = {
  id: number
  title: string
  category: string
  image: string
  description: string
}

export type EventsResponse = {
  data: CommunityEvent[]
  total: number
}
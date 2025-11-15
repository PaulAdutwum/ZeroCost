export interface Event {
  id: string
  title: string
  description: string
  latitude: number
  longitude: number
  address: string
  startTime: string
  endTime?: string
  category: string
  categoryId: string
  source: string
  sourceId: string
  sourceUrl: string
  imageUrl?: string
  organizerName?: string
  organizerContact?: string
  capacity?: number
  isVerified: boolean
  createdAt: string
  updatedAt: string
  distanceKm?: number
  score?: number
}

export interface Location {
  latitude: number
  longitude: number
}

export interface NearbyEventsRequest {
  latitude: number
  longitude: number
  maxDistanceKm: number
  limit: number
  preferredCategoryIds?: string[]
  query?: string
}

export interface Category {
  id: string
  name: string
  description: string
  icon: string
}



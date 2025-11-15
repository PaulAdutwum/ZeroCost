import axios from 'axios'
import type { Event, NearbyEventsRequest, Category } from '@/types'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const getNearbyEvents = async (request: NearbyEventsRequest): Promise<Event[]> => {
  const response = await api.post<Event[]>('/events/nearby', request)
  return response.data
}

export const searchEvents = async (query: string): Promise<Event[]> => {
  const response = await api.get<Event[]>('/events/search', {
    params: { query },
  })
  return response.data
}

export const getEventById = async (id: string): Promise<Event> => {
  const response = await api.get<Event>(`/events/${id}`)
  return response.data
}

export const getCategories = async (): Promise<Category[]> => {
  const response = await api.get<Category[]>('/categories')
  return response.data
}

export default api



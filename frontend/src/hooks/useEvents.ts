import { useState, useEffect } from 'react'
import { getNearbyEvents } from '@/lib/api'
import type { Event, NearbyEventsRequest } from '@/types'

export function useEvents(request: NearbyEventsRequest) {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true)
      setError(null)
      
      try {
        const data = await getNearbyEvents(request)
        setEvents(data)
      } catch (err) {
        console.error('Failed to fetch events:', err)
        setError('Failed to load events. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [request.latitude, request.longitude, request.maxDistanceKm, request.limit])

  return { events, loading, error }
}



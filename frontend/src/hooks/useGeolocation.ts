import { useState, useEffect } from 'react'
import type { Location } from '@/types'

export function useGeolocation() {
  const [location, setLocation] = useState<Location | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser')
      setLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        })
        setLoading(false)
      },
      (err) => {
        console.error('Geolocation error:', err)
        setError(err.message)
        setLoading(false)
        
        // Default to San Francisco if location access denied
        setLocation({
          latitude: 37.7749,
          longitude: -122.4194,
        })
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    )
  }, [])

  return { location, error, loading }
}



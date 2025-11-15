'use client'

import { useState, useEffect } from 'react'
import Map from '@/components/Map'
import EventList from '@/components/EventList'
import FilterBar from '@/components/FilterBar'
import { useEvents } from '@/hooks/useEvents'
import { useGeolocation } from '@/hooks/useGeolocation'

export default function Home() {
  const { location, error: locationError, loading: locationLoading } = useGeolocation()
  const [filters, setFilters] = useState({
    categories: [] as string[],
    maxDistance: 50,
    query: '',
  })

  const { events, loading: eventsLoading, error: eventsError } = useEvents({
    latitude: location?.latitude || 37.7749,
    longitude: location?.longitude || -122.4194,
    maxDistanceKm: filters.maxDistance,
    limit: 100,
  })

  const [selectedEvent, setSelectedEvent] = useState<string | null>(null)

  return (
    <main className="flex h-screen flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm z-10">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold text-primary-600">🎯 ZeroCost</h1>
              <span className="text-sm text-gray-500">
                Discover free opportunities
              </span>
            </div>
            
            {locationLoading && (
              <div className="text-sm text-gray-500 animate-pulse">
                📍 Getting your location...
              </div>
            )}
            
            {locationError && (
              <div className="text-sm text-red-500">
                ⚠️ Location access denied
              </div>
            )}
          </div>
          
          <FilterBar 
            filters={filters} 
            onFilterChange={setFilters}
            eventCount={events.length}
          />
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Event List Sidebar */}
        <aside className="w-96 bg-white border-r border-gray-200 overflow-hidden flex flex-col">
          <EventList
            events={events}
            loading={eventsLoading}
            error={eventsError}
            selectedEvent={selectedEvent}
            onSelectEvent={setSelectedEvent}
          />
        </aside>

        {/* Map */}
        <div className="flex-1">
          <Map
            events={events}
            center={location || { latitude: 37.7749, longitude: -122.4194 }}
            selectedEvent={selectedEvent}
            onSelectEvent={setSelectedEvent}
          />
        </div>
      </div>
    </main>
  )
}



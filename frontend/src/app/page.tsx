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
    <main className="flex h-screen w-screen flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm z-20 flex-shrink-0">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white px-4 py-2 rounded-lg shadow-md">
                <h1 className="text-2xl font-bold">🎯 ZeroCost</h1>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">
                  Discover Free Opportunities
                </p>
                <p className="text-xs text-gray-500">
                  Find free food, events, and giveaways near you
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {locationLoading && (
                <div className="flex items-center space-x-2 bg-blue-50 px-4 py-2 rounded-lg">
                  <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                  <span className="text-sm text-blue-600 font-medium">
                    Getting your location...
                  </span>
                </div>
              )}
              
              {locationError && (
                <div className="flex items-center space-x-2 bg-red-50 px-4 py-2 rounded-lg">
                  <span className="text-sm text-red-600 font-medium">
                    ⚠️ Location access denied - Using default location
                  </span>
                </div>
              )}
              
              {location && !locationLoading && (
                <div className="flex items-center space-x-2 bg-green-50 px-4 py-2 rounded-lg">
                  <span className="text-green-600">📍</span>
                  <span className="text-sm text-green-600 font-medium">
                    Location detected
                  </span>
                </div>
              )}
            </div>
          </div>
          
          <FilterBar 
            filters={filters} 
            onFilterChange={setFilters}
            eventCount={events.length}
          />
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden bg-white">
        {/* Event List Sidebar */}
        <aside className="w-96 bg-white border-r border-gray-200 overflow-hidden flex flex-col shadow-lg">
          <EventList
            events={events}
            loading={eventsLoading}
            error={eventsError}
            selectedEvent={selectedEvent}
            onSelectEvent={setSelectedEvent}
          />
        </aside>

        {/* Map Container */}
        <div className="flex-1 relative bg-gray-100">
          {!eventsLoading && events.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 z-10">
              <div className="text-center p-8 bg-white rounded-lg shadow-xl max-w-md">
                <div className="text-6xl mb-4">🗺️</div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  No Events Yet
                </h2>
                <p className="text-gray-600 mb-4">
                  The scraper will find events in your area soon.
                  <br />
                  This may take a few minutes.
                </p>
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                  <div className="animate-spin h-5 w-5 border-2 border-primary-600 border-t-transparent rounded-full"></div>
                  <span>Searching for events...</span>
                </div>
              </div>
            </div>
          )}
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



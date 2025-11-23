'use client'

import { useEffect, useRef } from 'react'
import MapGL, { Marker, Popup, NavigationControl } from 'react-map-gl'
import type { Event, Location } from '@/types'
import { MapPin } from 'lucide-react'

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ''

interface MapProps {
  events: Event[]
  center: Location
  selectedEvent: string | null
  onSelectEvent: (id: string | null) => void
}

export default function Map({ events, center, selectedEvent, onSelectEvent }: MapProps) {
  const mapRef = useRef<any>(null)

  const selectedEventData = events.find(e => e.id === selectedEvent)

  useEffect(() => {
    if (mapRef.current && center) {
      mapRef.current.flyTo({
        center: [center.longitude, center.latitude],
        zoom: 12,
        duration: 1000,
      })
    }
  }, [center])

  // Show error if no Mapbox token
  if (!MAPBOX_TOKEN || MAPBOX_TOKEN === 'your-mapbox-token-here') {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
          <div className="text-6xl mb-4">🗺️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Mapbox Token Required</h2>
          <p className="text-gray-600 mb-4">
            To see the interactive map, you need to add a Mapbox token.
          </p>
          <div className="text-left bg-gray-50 p-4 rounded-lg text-sm space-y-2">
            <p className="font-semibold text-gray-700">Setup Instructions:</p>
            <ol className="list-decimal list-inside space-y-1 text-gray-600">
              <li>Go to <a href="https://account.mapbox.com/" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">mapbox.com</a></li>
              <li>Sign up (free)</li>
              <li>Copy your access token</li>
              <li>Add to <code className="bg-gray-200 px-1 rounded">frontend/.env.local</code></li>
            </ol>
          </div>
          <p className="text-xs text-gray-500 mt-4">
            Showing {events.length} events in sidebar
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full relative">
      {/* Event count badge */}
      {events.length > 0 && (
        <div className="absolute top-4 left-4 z-10 bg-white px-4 py-2 rounded-lg shadow-lg">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-gray-700">
              {events.length} {events.length === 1 ? 'event' : 'events'} on map
            </span>
          </div>
        </div>
      )}

      <MapGL
        ref={mapRef}
        initialViewState={{
          latitude: center.latitude,
          longitude: center.longitude,
          zoom: 12,
        }}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        mapboxAccessToken={MAPBOX_TOKEN}
      >
        <NavigationControl position="top-right" />

        {/* User Location Marker */}
        <Marker
          latitude={center.latitude}
          longitude={center.longitude}
          anchor="bottom"
        >
          <div className="relative">
            <div className="absolute -inset-2 bg-blue-500 rounded-full opacity-20 animate-ping" />
            <div className="bg-blue-500 rounded-full p-2 shadow-lg">
              <MapPin className="w-5 h-5 text-white" />
            </div>
          </div>
        </Marker>

        {/* Event Markers */}
        {events.map((event) => (
          <Marker
            key={event.id}
            latitude={event.latitude}
            longitude={event.longitude}
            anchor="bottom"
            onClick={(e) => {
              e.originalEvent.stopPropagation()
              onSelectEvent(event.id)
            }}
          >
            <div
              className={`
                cursor-pointer transition-transform hover:scale-110
                ${selectedEvent === event.id ? 'scale-125 z-10' : ''}
              `}
            >
              <div className={`
                px-3 py-1 rounded-full shadow-lg font-medium text-sm
                ${getCategoryColor(event.category)}
                ${selectedEvent === event.id ? 'ring-4 ring-white' : ''}
              `}>
                {getCategoryEmoji(event.category)}
              </div>
            </div>
          </Marker>
        ))}

        {/* Selected Event Popup */}
        {selectedEventData && (
          <Popup
            latitude={selectedEventData.latitude}
            longitude={selectedEventData.longitude}
            anchor="top"
            onClose={() => onSelectEvent(null)}
            closeButton={true}
            closeOnClick={false}
            className="max-w-xs"
          >
            <div className="p-3">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-bold text-base leading-tight flex-1 pr-2">
                  {selectedEventData.title}
                </h3>
                <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${getCategoryBadgeColorForPopup(selectedEventData.category)}`}>
                  {getCategoryEmoji(selectedEventData.category)}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                {selectedEventData.description?.substring(0, 150)}
                {selectedEventData.description && selectedEventData.description.length > 150 ? '...' : ''}
              </p>
              <div className="space-y-1 text-xs text-gray-500">
                <div className="flex items-center justify-between">
                  <span className="flex items-center">
                    <span className="mr-1">{getCategoryEmoji(selectedEventData.category)}</span>
                    {selectedEventData.category}
                  </span>
                  {selectedEventData.distanceKm && (
                    <span className="font-medium">📍 {selectedEventData.distanceKm.toFixed(1)} km away</span>
                  )}
                </div>
                {selectedEventData.sourceUrl && (
                  <a
                    href={selectedEventData.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:text-primary-700 font-medium inline-flex items-center mt-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    View Details →
                  </a>
                )}
              </div>
            </div>
          </Popup>
        )}
      </MapGL>
    </div>
  )
}

function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    'Free Food': 'bg-orange-500 text-white',
    'Campus Events': 'bg-blue-500 text-white',
    'Community Events': 'bg-green-500 text-white',
    'Giveaways': 'bg-purple-500 text-white',
    'Workshops': 'bg-yellow-500 text-white',
    'Entertainment': 'bg-pink-500 text-white',
    'Sports': 'bg-red-500 text-white',
    'Health & Wellness': 'bg-teal-500 text-white',
  }
  return colors[category] || 'bg-gray-500 text-white'
}

function getCategoryEmoji(category: string): string {
  const emojis: Record<string, string> = {
    'Free Food': '🍕',
    'Campus Events': '🎓',
    'Community Events': '🏘️',
    'Giveaways': '🎁',
    'Workshops': '🔧',
    'Entertainment': '🎭',
    'Sports': '⚽',
    'Health & Wellness': '🧘',
  }
  return emojis[category] || '📍'
}

function getCategoryBadgeColorForPopup(category: string): string {
  const colors: Record<string, string> = {
    'Free Food': 'bg-orange-100 text-orange-700',
    'Campus Events': 'bg-blue-100 text-blue-700',
    'Community Events': 'bg-green-100 text-green-700',
    'Giveaways': 'bg-purple-100 text-purple-700',
    'Workshops': 'bg-yellow-100 text-yellow-700',
    'Entertainment': 'bg-pink-100 text-pink-700',
    'Sports': 'bg-red-100 text-red-700',
    'Health & Wellness': 'bg-teal-100 text-teal-700',
  }
  return colors[category] || 'bg-gray-100 text-gray-700'
}



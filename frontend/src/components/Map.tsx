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

  return (
    <div className="w-full h-full relative">
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
            <div className="p-2">
              <h3 className="font-bold text-lg mb-1">{selectedEventData.title}</h3>
              <p className="text-sm text-gray-600 mb-2">
                {selectedEventData.description?.substring(0, 100)}
                {selectedEventData.description?.length > 100 ? '...' : ''}
              </p>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{getCategoryEmoji(selectedEventData.category)} {selectedEventData.category}</span>
                {selectedEventData.distanceKm && (
                  <span>📍 {selectedEventData.distanceKm.toFixed(1)} km</span>
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



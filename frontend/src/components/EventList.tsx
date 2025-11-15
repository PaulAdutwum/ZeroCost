'use client'

import { format } from 'date-fns'
import { Calendar, MapPin, Users, ExternalLink } from 'lucide-react'
import type { Event } from '@/types'

interface EventListProps {
  events: Event[]
  loading: boolean
  error: string | null
  selectedEvent: string | null
  onSelectEvent: (id: string) => void
}

export default function EventList({
  events,
  loading,
  error,
  selectedEvent,
  onSelectEvent,
}: EventListProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading events...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <div className="text-center">
          <p className="text-red-500 mb-2">⚠️ {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <div className="text-center text-gray-500">
          <p className="text-4xl mb-4">🔍</p>
          <p className="text-lg font-medium">No events found</p>
          <p className="text-sm">Try adjusting your filters or search radius</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <h2 className="text-lg font-semibold text-gray-900">
          {events.length} {events.length === 1 ? 'Event' : 'Events'} Nearby
        </h2>
      </div>

      <div className="divide-y divide-gray-200">
        {events.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            selected={selectedEvent === event.id}
            onClick={() => onSelectEvent(event.id)}
          />
        ))}
      </div>
    </div>
  )
}

function EventCard({
  event,
  selected,
  onClick,
}: {
  event: Event
  selected: boolean
  onClick: () => void
}) {
  const startTime = new Date(event.startTime)

  return (
    <div
      onClick={onClick}
      className={`
        p-4 cursor-pointer transition-colors
        hover:bg-gray-50
        ${selected ? 'bg-primary-50 border-l-4 border-primary-500' : ''}
      `}
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-semibold text-gray-900 flex-1 pr-2">
          {event.title}
        </h3>
        <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700 whitespace-nowrap">
          {event.category}
        </span>
      </div>

      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
        {event.description}
      </p>

      <div className="space-y-1 text-xs text-gray-500">
        <div className="flex items-center">
          <Calendar className="w-3 h-3 mr-1" />
          <span>{format(startTime, 'MMM d, yyyy • h:mm a')}</span>
        </div>

        {event.distanceKm !== undefined && (
          <div className="flex items-center">
            <MapPin className="w-3 h-3 mr-1" />
            <span>{event.distanceKm.toFixed(1)} km away</span>
          </div>
        )}

        {event.organizerName && (
          <div className="flex items-center">
            <Users className="w-3 h-3 mr-1" />
            <span>{event.organizerName}</span>
          </div>
        )}
      </div>

      {event.score !== undefined && (
        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-full bg-gray-200 rounded-full h-1.5 w-20">
              <div
                className="bg-primary-500 h-1.5 rounded-full"
                style={{ width: `${event.score * 100}%` }}
              />
            </div>
            <span className="text-xs text-gray-500 ml-2">
              {(event.score * 100).toFixed(0)}% match
            </span>
          </div>

          {event.sourceUrl && (
            <a
              href={event.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-primary-500 hover:text-primary-600"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>
      )}
    </div>
  )
}



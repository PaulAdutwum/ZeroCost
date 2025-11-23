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
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-primary-50 to-blue-50">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">
            {events.length} {events.length === 1 ? 'Event' : 'Events'} Nearby
          </h2>
          <div className="text-xs text-gray-500 bg-white px-3 py-1 rounded-full">
            Live Updates
          </div>
        </div>
        <p className="text-xs text-gray-600 mt-1">
          Click an event to see it on the map
        </p>
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
  const isToday = startTime.toDateString() === new Date().toDateString()
  const isSoon = startTime.getTime() - Date.now() < 3600000 * 2 // Within 2 hours

  return (
    <div
      onClick={onClick}
      className={`
        p-4 cursor-pointer transition-all duration-200
        hover:bg-gray-50 hover:shadow-md
        ${selected ? 'bg-primary-50 border-l-4 border-primary-600 shadow-md' : 'border-l-4 border-transparent'}
      `}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 pr-2">
          <h3 className="font-semibold text-gray-900 leading-tight">
            {event.title}
          </h3>
          {isSoon && (
            <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">
              🔥 Starting Soon!
            </span>
          )}
        </div>
        <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap font-medium ${getCategoryBadgeColor(event.category)}`}>
          {getCategoryEmoji(event.category)} {event.category}
        </span>
      </div>

      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
        {event.description}
      </p>

      <div className="space-y-1.5 text-xs text-gray-600">
        <div className="flex items-center">
          <Calendar className="w-3.5 h-3.5 mr-1.5 text-primary-500" />
          <span className="font-medium">
            {isToday ? 'Today' : format(startTime, 'MMM d, yyyy')} • {format(startTime, 'h:mm a')}
          </span>
        </div>

        {event.distanceKm !== undefined && (
          <div className="flex items-center">
            <MapPin className="w-3.5 h-3.5 mr-1.5 text-green-500" />
            <span>{event.distanceKm.toFixed(1)} km away</span>
            {event.address && <span className="ml-1 text-gray-400">• {event.address.split(',')[0]}</span>}
          </div>
        )}

        {event.organizerName && (
          <div className="flex items-center">
            <Users className="w-3.5 h-3.5 mr-1.5 text-blue-500" />
            <span>by {event.organizerName}</span>
          </div>
        )}
      </div>

      {event.score !== undefined && (
        <div className="mt-3 flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center flex-1">
            <div className="flex-1 max-w-[100px] bg-gray-200 rounded-full h-2 mr-2">
              <div
                className="bg-gradient-to-r from-primary-500 to-primary-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${event.score * 100}%` }}
              />
            </div>
            <span className="text-xs text-gray-600 font-medium">
              {(event.score * 100).toFixed(0)}% match
            </span>
          </div>

          {event.sourceUrl && (
            <a
              href={event.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="ml-3 flex items-center space-x-1 text-primary-600 hover:text-primary-700 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              <span className="text-xs font-medium">View</span>
            </a>
          )}
        </div>
      )}
    </div>
  )
}

function getCategoryBadgeColor(category: string): string {
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



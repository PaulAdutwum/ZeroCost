'use client'

import { useState } from 'react'
import { Search, SlidersHorizontal, X } from 'lucide-react'

interface FilterBarProps {
  filters: {
    categories: string[]
    maxDistance: number
    query: string
  }
  onFilterChange: (filters: any) => void
  eventCount: number
}

const CATEGORIES = [
  { name: 'Free Food', emoji: '🍕' },
  { name: 'Campus Events', emoji: '🎓' },
  { name: 'Community Events', emoji: '🏘️' },
  { name: 'Giveaways', emoji: '🎁' },
  { name: 'Workshops', emoji: '🔧' },
  { name: 'Entertainment', emoji: '🎭' },
  { name: 'Sports', emoji: '⚽' },
  { name: 'Health & Wellness', emoji: '🧘' },
]

export default function FilterBar({ filters, onFilterChange, eventCount }: FilterBarProps) {
  const [showFilters, setShowFilters] = useState(false)

  const handleQueryChange = (query: string) => {
    onFilterChange({ ...filters, query })
  }

  const handleDistanceChange = (distance: number) => {
    onFilterChange({ ...filters, maxDistance: distance })
  }

  const toggleCategory = (category: string) => {
    const newCategories = filters.categories.includes(category)
      ? filters.categories.filter((c) => c !== category)
      : [...filters.categories, category]
    onFilterChange({ ...filters, categories: newCategories })
  }

  const clearFilters = () => {
    onFilterChange({ categories: [], maxDistance: 50, query: '' })
  }

  const hasActiveFilters = filters.categories.length > 0 || filters.query !== ''

  return (
    <div className="mt-4 space-y-3">
      {/* Search Bar */}
      <div className="flex items-center space-x-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search events..."
            value={filters.query}
            onChange={(e) => handleQueryChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          {filters.query && (
            <button
              onClick={() => handleQueryChange('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`
            px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors
            ${showFilters ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}
          `}
        >
          <SlidersHorizontal className="w-5 h-5" />
          <span>Filters</span>
          {hasActiveFilters && (
            <span className="bg-white text-primary-500 px-2 py-0.5 rounded-full text-xs font-bold">
              {filters.categories.length + (filters.query ? 1 : 0)}
            </span>
          )}
        </button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-4 border border-gray-200">
          {/* Distance Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Distance: {filters.maxDistance} km
            </label>
            <input
              type="range"
              min="1"
              max="100"
              step="1"
              value={filters.maxDistance}
              onChange={(e) => handleDistanceChange(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-500"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>1 km</span>
              <span>100 km</span>
            </div>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categories
            </label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((category) => (
                <button
                  key={category.name}
                  onClick={() => toggleCategory(category.name)}
                  className={`
                    px-3 py-1.5 rounded-full text-sm font-medium transition-colors
                    ${
                      filters.categories.includes(category.name)
                        ? 'bg-primary-500 text-white'
                        : 'bg-white text-gray-700 border border-gray-300 hover:border-primary-500'
                    }
                  `}
                >
                  {category.emoji} {category.name}
                </button>
              ))}
            </div>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <div className="flex justify-end">
              <button
                onClick={clearFilters}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* Results Count */}
      <div className="text-sm text-gray-600">
        Showing <span className="font-semibold">{eventCount}</span> events
      </div>
    </div>
  )
}


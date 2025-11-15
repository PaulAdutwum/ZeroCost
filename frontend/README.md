# ZeroCost Frontend

Modern, responsive Next.js frontend for discovering free events and opportunities.

## Features

- **Interactive Map**: Mapbox GL JS for beautiful event visualization
- **Real-time Search**: Instant event filtering and search
- **Geolocation**: Automatic user location detection
- **Category Filters**: Filter by event type
- **Distance Slider**: Adjust search radius
- **Responsive Design**: Mobile-first, works on all devices
- **Event Cards**: Beautiful event cards with details
- **Performance Optimized**: Server-side rendering, image optimization

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Maps**: Mapbox GL JS via react-map-gl
- **Icons**: Lucide React
- **HTTP Client**: Axios
- **Date Handling**: date-fns

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Mapbox account (free tier works)

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.local.example .env.local

# Edit .env.local with your values
# - NEXT_PUBLIC_API_URL: Backend API URL
# - NEXT_PUBLIC_MAPBOX_TOKEN: Get from https://account.mapbox.com/
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

```bash
npm run build
npm start
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Yes | Backend API URL (e.g., http://localhost:8080) |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Yes | Mapbox access token |
| `NEXTAUTH_SECRET` | No | NextAuth.js secret (for auth) |
| `NEXTAUTH_URL` | No | NextAuth.js URL |

## Project Structure

```
frontend/
├── src/
│   ├── app/              # Next.js app router
│   │   ├── layout.tsx    # Root layout
│   │   ├── page.tsx      # Home page
│   │   └── globals.css   # Global styles
│   ├── components/       # React components
│   │   ├── Map.tsx       # Mapbox map component
│   │   ├── EventList.tsx # Event list sidebar
│   │   └── FilterBar.tsx # Search and filters
│   ├── hooks/           # Custom React hooks
│   │   ├── useEvents.ts  # Events data fetching
│   │   └── useGeolocation.ts # User location
│   ├── lib/             # Utilities
│   │   └── api.ts       # API client
│   └── types/           # TypeScript types
│       └── index.ts     # Type definitions
├── public/              # Static assets
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── next.config.js
```

## Components

### Map Component

Interactive Mapbox map with:
- User location marker (blue pulsing)
- Event markers (color-coded by category)
- Click to select events
- Popup with event details
- Navigation controls

### EventList Component

Scrollable list of events:
- Event cards with title, description, time, distance
- Match score visualization
- Click to select/highlight on map
- External link to source

### FilterBar Component

Search and filter interface:
- Text search input
- Distance slider (1-100 km)
- Category chips
- Clear filters button
- Results count

## API Integration

The frontend communicates with the Java Spring Boot API:

```typescript
// Get nearby events
POST /api/v1/events/nearby
{
  "latitude": 37.7749,
  "longitude": -122.4194,
  "maxDistanceKm": 50,
  "limit": 100
}

// Search events
GET /api/v1/events/search?query=pizza

// Get categories
GET /api/v1/categories
```

## Mapbox Setup

1. Create account at [mapbox.com](https://www.mapbox.com/)
2. Get access token from [account page](https://account.mapbox.com/)
3. Add to `.env.local`:
   ```
   NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1...
   ```

Free tier includes:
- 50,000 map loads/month
- All map styles
- Navigation, geocoding, directions

## Styling

Uses Tailwind CSS with custom configuration:

```javascript
// Primary color palette
primary: {
  50: '#f0f9ff',
  500: '#0ea5e9',
  600: '#0284c7',
  // ...
}
```

Custom classes:
- `.marker-pulse`: Animated map markers
- Responsive breakpoints: sm, md, lg, xl

## Performance

Optimizations:
- Server-side rendering (SSR)
- Image optimization with next/image
- Code splitting and lazy loading
- Mapbox GL JS optimized rendering
- SWR for client-side caching
- Debounced search input

## Docker

```bash
# Build
docker build -t zerocost-frontend .

# Run
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_API_URL=http://api:8080 \
  -e NEXT_PUBLIC_MAPBOX_TOKEN=your_token \
  zerocost-frontend
```

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

```bash
# Or use CLI
vercel --prod
```

### Other Platforms

- Netlify
- AWS Amplify
- Railway
- Render

Set environment variables in platform settings.

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Accessibility

- Semantic HTML
- ARIA labels
- Keyboard navigation
- Screen reader support
- Color contrast (WCAG AA)

## Future Enhancements

- [ ] User authentication
- [ ] Save favorite events
- [ ] Push notifications
- [ ] Share events
- [ ] Event calendar view
- [ ] Dark mode
- [ ] PWA support
- [ ] Offline mode

## License

MIT License


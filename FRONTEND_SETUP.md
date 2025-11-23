# 🎨 Frontend Setup & Testing Guide

## What's New in the Frontend! 🎉

### Enhanced Features:

#### 1. **EventList Component** 
- ✨ Beautiful gradient header
- 🔥 "Starting Soon!" badges for urgent events
- 🎨 Color-coded category badges
- 📊 Animated match score bars
- 📅 "Today" indicator for same-day events
- 🏢 Shows organizer and location details
- ✨ Smooth hover effects

#### 2. **Map Component**
- 📍 Live event count badge
- ⚠️ Helpful setup message if no Mapbox token
- 🎈 Enhanced popups with better design
- 🎯 Animated user location marker
- 🌈 Color-coded event markers by category

#### 3. **Overall UI**
- 🎨 Clean, bright interface (no more dark mode!)
- ⚡ Smooth animations and transitions
- 📱 Better visual feedback
- 🎯 Professional design

## Quick Setup (5 Minutes)

### Step 1: Get Mapbox Token (FREE!)

1. Go to https://account.mapbox.com/
2. Click "Sign up" (it's free!)
3. After signing up, you'll see your access token
4. Copy the token (starts with `pk.`)

### Step 2: Setup Frontend Environment

```bash
cd /Users/pauladutwum/Documents/Myprojects/ZeroCost/frontend

# Create environment file
cat > .env.local << 'EOF'
# API URL
NEXT_PUBLIC_API_URL=http://localhost:8080

# Paste your Mapbox token here
NEXT_PUBLIC_MAPBOX_TOKEN=pk.YOUR_TOKEN_HERE
EOF

# Replace pk.YOUR_TOKEN_HERE with your actual token!
```

### Step 3: Install Dependencies

```bash
npm install
```

### Step 4: Start Backend Services

```bash
# In a new terminal
cd /Users/pauladutwum/Documents/Myprojects/ZeroCost/infra
docker-compose up -d

# Wait 30 seconds for services to start
sleep 30

# Check services are running
docker-compose ps
```

### Step 5: Start Frontend

```bash
cd /Users/pauladutwum/Documents/Myprojects/ZeroCost/frontend
npm run dev
```

### Step 6: Open Browser

Open http://localhost:3000

## What You Should See 🎯

### Header Section
- 🎯 Blue gradient "ZeroCost" badge
- 📍 Location status indicator (green when detected)
- 🔍 Search bar
- 🎛️ Filters button

### Event List (Left Sidebar)
- Shows count of events nearby
- "Live Updates" badge
- Event cards with:
  - Title
  - Category badge (color-coded)
  - Description
  - Date/time (shows "Today" for today's events)
  - Distance from you
  - Organizer name
  - Match score bar
  - "View" link to original source

### Map (Right Side)
- Interactive Mapbox map
- Your location (blue pulsing marker)
- Event markers (colored by category)
- Click markers to see popup
- Event count badge
- Zoom controls

## Testing Checklist ✅

### Basic Functionality
- [ ] Page loads without errors
- [ ] Map displays (if Mapbox token set)
- [ ] Event list shows on left side
- [ ] Location is detected (or defaults to SF)
- [ ] All colors and styling look correct

### Interactivity
- [ ] Click on event in list → highlights on map
- [ ] Click on map marker → shows popup
- [ ] Search bar filters events
- [ ] Distance slider changes results
- [ ] Category filters work
- [ ] "Clear filters" button works

### Visual Elements
- [ ] No dark/black areas
- [ ] All text is readable
- [ ] Hover effects work smoothly
- [ ] Animations are smooth
- [ ] Icons display correctly

## Common Issues & Solutions

### Issue: Map shows "Mapbox Token Required"
**Solution**: 
```bash
cd frontend
# Edit .env.local and add your Mapbox token
nano .env.local  # or use any text editor
```

### Issue: No events showing
**Solution**: 
```bash
# The scraper needs time to find events
# Trigger it manually:
cd infra
docker-compose restart go-scraper

# Watch logs
docker-compose logs -f go-scraper

# Or insert test event:
curl -X POST http://localhost:8080/api/v1/events/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "events": [{
      "title": "Test Event",
      "description": "Testing the frontend",
      "latitude": 37.7749,
      "longitude": -122.4194,
      "startTime": "'$(date -u +"%Y-%m-%dT18:00:00Z")'",
      "category": "Free Food",
      "source": "Manual Test"
    }]
  }'
```

### Issue: API connection error
**Solution**:
```bash
# Check Java API is running
curl http://localhost:8080/actuator/health

# If not running:
cd infra
docker-compose restart java-api
```

### Issue: Slow loading
**Solution**:
```bash
# Clear Next.js cache
cd frontend
rm -rf .next
npm run dev
```

## Visual Tour 🎬

### Color Scheme:
- **Free Food** 🍕 - Orange
- **Campus Events** 🎓 - Blue
- **Community Events** 🏘️ - Green
- **Giveaways** 🎁 - Purple
- **Workshops** 🔧 - Yellow
- **Entertainment** 🎭 - Pink
- **Sports** ⚽ - Red
- **Health & Wellness** 🧘 - Teal

### Indicators:
- 🔥 "Starting Soon!" - Event within 2 hours
- 📅 "Today" - Event is happening today
- 📍 Green badge - Location detected
- 🔵 Blue badge - Getting location
- 🔴 Red badge - Location denied
- ⚪ White ring - Selected event marker

## Development Tips

### Hot Reload
- Changes to React components reload automatically
- Changes to `.env.local` require restart

### Debugging
```bash
# Check browser console (F12) for errors
# Check terminal for server-side errors
```

### Performance
```bash
# Build for production to test performance
npm run build
npm start
```

## Push to GitHub

Once you've tested everything:

```bash
cd /Users/pauladutwum/Documents/Myprojects/ZeroCost

# Check what's changed
git status

# If you have new changes, commit them
git add -A
git commit -m "Your message here"

# Push to GitHub
git push
```

## Screenshots to Take 📸

For your portfolio/README:
1. Homepage with events loaded
2. Map view with multiple markers
3. Event card details
4. Filters panel open
5. Mobile responsive view

## Next Steps 🚀

1. ✅ Test all functionality
2. ✅ Take screenshots
3. ✅ Update README with screenshots
4. ✅ Add more scrapers (optional)
5. ✅ Deploy to Vercel (see deployment guide)

## Need Help?

Check:
- Browser console (F12)
- Terminal logs
- `docker-compose logs` for backend
- `TESTING.md` for detailed tests

---

**Enjoy your beautiful, functional ZeroCost app!** 🎉

The frontend is now production-ready with professional styling and smooth UX!


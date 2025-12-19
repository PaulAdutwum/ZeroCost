#!/bin/bash

# =============================================================================
# ZeroCost Sample Data Seeder
# =============================================================================
# Seeds the database with sample free events for testing
# =============================================================================

API_URL="${JAVA_API_URL:-http://localhost:8080}"

echo "🌱 Seeding sample events..."

# Sample events JSON
read -r -d '' EVENTS_JSON << 'EOF'
{
  "events": [
    {
      "title": "Free Pizza Night at Student Union",
      "description": "Come enjoy free pizza while supplies last! Hosted by the Computer Science Club. All students welcome.",
      "latitude": 37.8719,
      "longitude": -122.2585,
      "address": "MLK Student Union, UC Berkeley",
      "start_time": "2025-01-15T18:00:00Z",
      "end_time": "2025-01-15T20:00:00Z",
      "category": "Free Food",
      "source": "Campus Events",
      "source_url": "https://events.berkeley.edu/pizza-night",
      "organizer": "CS Club"
    },
    {
      "title": "Free Coding Workshop - Intro to Python",
      "description": "Learn Python programming basics in this free 2-hour workshop. Laptops provided. Perfect for beginners!",
      "latitude": 37.8716,
      "longitude": -122.2727,
      "address": "Soda Hall, UC Berkeley",
      "start_time": "2025-01-16T14:00:00Z",
      "end_time": "2025-01-16T16:00:00Z",
      "category": "Workshops",
      "source": "Campus Events",
      "source_url": "https://events.berkeley.edu/python-workshop",
      "organizer": "CS Department"
    },
    {
      "title": "Free Tacos Tuesday",
      "description": "Free tacos for the first 200 people! Vegetarian options available. Sponsored by local restaurants.",
      "latitude": 37.7749,
      "longitude": -122.4194,
      "address": "Union Square, San Francisco",
      "start_time": "2025-01-14T12:00:00Z",
      "end_time": "2025-01-14T14:00:00Z",
      "category": "Free Food",
      "source": "Community Events",
      "source_url": "https://example.com/free-tacos",
      "organizer": "SF Food Bank"
    },
    {
      "title": "Free Outdoor Yoga in the Park",
      "description": "Join us for free yoga every Saturday morning. All levels welcome. Bring your own mat or borrow one of ours.",
      "latitude": 37.7694,
      "longitude": -122.4862,
      "address": "Golden Gate Park, San Francisco",
      "start_time": "2025-01-18T09:00:00Z",
      "end_time": "2025-01-18T10:30:00Z",
      "category": "Health & Wellness",
      "source": "Community Events",
      "source_url": "https://example.com/yoga-park",
      "organizer": "SF Parks & Rec"
    },
    {
      "title": "Free Concert in the Park",
      "description": "Live jazz music featuring local artists. Bring a blanket and enjoy! Free admission.",
      "latitude": 37.7699,
      "longitude": -122.4661,
      "address": "Stern Grove, San Francisco",
      "start_time": "2025-01-19T15:00:00Z",
      "end_time": "2025-01-19T18:00:00Z",
      "category": "Entertainment",
      "source": "Community Events",
      "source_url": "https://example.com/stern-grove-concert",
      "organizer": "Stern Grove Festival"
    },
    {
      "title": "Free Tech Talk: AI and the Future",
      "description": "Industry experts discuss the latest in AI. Free pizza and drinks provided. Limited seats - first come first served.",
      "latitude": 37.4275,
      "longitude": -122.1697,
      "address": "Gates Building, Stanford University",
      "start_time": "2025-01-20T17:00:00Z",
      "end_time": "2025-01-20T19:00:00Z",
      "category": "Workshops",
      "source": "Campus Events",
      "source_url": "https://events.stanford.edu/ai-talk",
      "organizer": "Stanford AI Lab"
    },
    {
      "title": "Community Food Pantry - Free Groceries",
      "description": "Weekly food distribution. Fresh produce, canned goods, and bread available. No questions asked, all welcome.",
      "latitude": 37.7849,
      "longitude": -122.4094,
      "address": "Glide Memorial Church, San Francisco",
      "start_time": "2025-01-17T10:00:00Z",
      "end_time": "2025-01-17T14:00:00Z",
      "category": "Free Food",
      "source": "Community Events",
      "source_url": "https://example.com/food-pantry",
      "organizer": "Glide Foundation"
    },
    {
      "title": "Free Basketball Tournament",
      "description": "3v3 basketball tournament open to all skill levels. Prizes for winners! Free entry and free snacks.",
      "latitude": 37.8044,
      "longitude": -122.2712,
      "address": "Lake Merritt, Oakland",
      "start_time": "2025-01-21T10:00:00Z",
      "end_time": "2025-01-21T16:00:00Z",
      "category": "Sports",
      "source": "Community Events",
      "source_url": "https://example.com/basketball-tourney",
      "organizer": "Oakland Parks"
    },
    {
      "title": "Free Book Giveaway",
      "description": "Hundreds of free books! Fiction, non-fiction, textbooks, and children's books. Take as many as you want.",
      "latitude": 37.8716,
      "longitude": -122.2601,
      "address": "Berkeley Public Library",
      "start_time": "2025-01-22T11:00:00Z",
      "end_time": "2025-01-22T17:00:00Z",
      "category": "Giveaways",
      "source": "Community Events",
      "source_url": "https://example.com/book-giveaway",
      "organizer": "Berkeley Library"
    },
    {
      "title": "Free Resume Workshop",
      "description": "Get help with your resume from career counselors. One-on-one feedback sessions. Bring your current resume!",
      "latitude": 37.7879,
      "longitude": -122.4075,
      "address": "SF Public Library Main Branch",
      "start_time": "2025-01-23T13:00:00Z",
      "end_time": "2025-01-23T16:00:00Z",
      "category": "Workshops",
      "source": "Community Events",
      "source_url": "https://example.com/resume-workshop",
      "organizer": "SF Career Center"
    }
  ]
}
EOF

# Send to API
echo "Sending events to $API_URL/api/v1/events/ingest..."

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/api/v1/events/ingest" \
  -H "Content-Type: application/json" \
  -d "$EVENTS_JSON")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "201" ] || [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Successfully seeded sample events!"
    echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
else
    echo "❌ Failed to seed events (HTTP $HTTP_CODE)"
    echo "$BODY"
fi



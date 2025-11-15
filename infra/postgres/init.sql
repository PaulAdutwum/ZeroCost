-- ZeroCost Database Schema

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sources table
CREATE TABLE IF NOT EXISTS sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    url TEXT,
    scraper_type VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Events table
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    location GEOGRAPHY(POINT, 4326),
    address TEXT,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    category_id UUID REFERENCES categories(id),
    source_id UUID REFERENCES sources(id),
    source_url TEXT,
    image_url TEXT,
    organizer_name VARCHAR(255),
    organizer_contact VARCHAR(255),
    capacity INTEGER,
    is_verified BOOLEAN DEFAULT false,
    raw_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create spatial index
CREATE INDEX IF NOT EXISTS idx_events_location ON events USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_events_start_time ON events(start_time);
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category_id);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at DESC);

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255),
    full_name VARCHAR(255),
    profile_image_url TEXT,
    home_latitude DOUBLE PRECISION,
    home_longitude DOUBLE PRECISION,
    notification_radius_km DOUBLE PRECISION DEFAULT 5.0,
    push_token TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- User preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id),
    is_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Saved events table
CREATE TABLE IF NOT EXISTS saved_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, event_id)
);

-- Event views/clicks tracking
CREATE TABLE IF NOT EXISTS event_interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    interaction_type VARCHAR(50) NOT NULL, -- 'view', 'click', 'save', 'share'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_interactions_event ON event_interactions(event_id);
CREATE INDEX IF NOT EXISTS idx_interactions_created ON event_interactions(created_at DESC);

-- Function to update location from lat/lng
CREATE OR REPLACE FUNCTION update_event_location()
RETURNS TRIGGER AS $$
BEGIN
    NEW.location := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update location
CREATE TRIGGER trigger_update_event_location
BEFORE INSERT OR UPDATE OF latitude, longitude ON events
FOR EACH ROW
EXECUTE FUNCTION update_event_location();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for events updated_at
CREATE TRIGGER trigger_update_events_timestamp
BEFORE UPDATE ON events
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Trigger for users updated_at
CREATE TRIGGER trigger_update_users_timestamp
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Insert default categories
INSERT INTO categories (name, description, icon) VALUES
    ('Free Food', 'Free meals, snacks, and refreshments', '🍕'),
    ('Campus Events', 'University and college campus events', '🎓'),
    ('Community Events', 'Local community gatherings', '🏘️'),
    ('Giveaways', 'Free items and product giveaways', '🎁'),
    ('Workshops', 'Free educational workshops and classes', '🔧'),
    ('Entertainment', 'Free concerts, shows, and performances', '🎭'),
    ('Sports', 'Free sporting events and activities', '⚽'),
    ('Health & Wellness', 'Free fitness and wellness events', '🧘')
ON CONFLICT (name) DO NOTHING;

-- Insert default sources
INSERT INTO sources (name, url, scraper_type) VALUES
    ('Reddit /r/freefood', 'https://www.reddit.com/r/freefood', 'reddit'),
    ('Reddit /r/freebies', 'https://www.reddit.com/r/freebies', 'reddit'),
    ('Eventbrite', 'https://www.eventbrite.com', 'eventbrite'),
    ('Meetup', 'https://www.meetup.com', 'meetup')
ON CONFLICT (name) DO NOTHING;

-- Create view for event statistics
CREATE OR REPLACE VIEW event_stats AS
SELECT 
    e.id,
    e.title,
    COUNT(DISTINCT CASE WHEN ei.interaction_type = 'view' THEN ei.id END) as view_count,
    COUNT(DISTINCT CASE WHEN ei.interaction_type = 'click' THEN ei.id END) as click_count,
    COUNT(DISTINCT se.id) as save_count,
    MAX(ei.created_at) as last_interaction
FROM events e
LEFT JOIN event_interactions ei ON e.id = ei.event_id
LEFT JOIN saved_events se ON e.id = se.event_id
GROUP BY e.id, e.title;


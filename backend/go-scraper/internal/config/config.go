package config

import (
	"log"
	"os"
	"strconv"
)

type Config struct {
	Port                   string
	JavaAPIURL             string
	ScraperIntervalMinutes int
	UserAgent              string
	
	// External API credentials
	RedditClientID     string
	RedditClientSecret string
	EventbriteAPIKey   string
	MeetupAPIKey       string
	
	// Rate limiting
	MaxConcurrentScrapers int
	RequestDelayMS        int
}

func LoadConfig() *Config {
	cfg := &Config{
		Port:                   getEnv("PORT", "8081"),
		JavaAPIURL:             getEnv("JAVA_API_URL", "http://localhost:8080"),
		ScraperIntervalMinutes: getEnvAsInt("SCRAPER_INTERVAL_MINUTES", 30),
		UserAgent:              getEnv("SCRAPER_USER_AGENT", "ZeroCostBot/1.0"),
		
		RedditClientID:     getEnv("REDDIT_CLIENT_ID", ""),
		RedditClientSecret: getEnv("REDDIT_CLIENT_SECRET", ""),
		EventbriteAPIKey:   getEnv("EVENTBRITE_API_KEY", ""),
		MeetupAPIKey:       getEnv("MEETUP_API_KEY", ""),
		
		MaxConcurrentScrapers: getEnvAsInt("MAX_CONCURRENT_SCRAPERS", 4),
		RequestDelayMS:        getEnvAsInt("REQUEST_DELAY_MS", 1000),
	}

	log.Printf("Configuration loaded:")
	log.Printf("  Port: %s", cfg.Port)
	log.Printf("  Java API URL: %s", cfg.JavaAPIURL)
	log.Printf("  Scraper Interval: %d minutes", cfg.ScraperIntervalMinutes)
	log.Printf("  Max Concurrent Scrapers: %d", cfg.MaxConcurrentScrapers)

	return cfg
}

func getEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}

func getEnvAsInt(key string, defaultValue int) int {
	valueStr := os.Getenv(key)
	if valueStr == "" {
		return defaultValue
	}
	value, err := strconv.Atoi(valueStr)
	if err != nil {
		log.Printf("Warning: Invalid integer value for %s, using default %d", key, defaultValue)
		return defaultValue
	}
	return value
}


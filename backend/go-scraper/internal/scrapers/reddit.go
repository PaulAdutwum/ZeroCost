package scrapers

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"regexp"
	"strings"
	"time"

	"github.com/zerocost/scraper/internal/config"
	"github.com/zerocost/scraper/internal/models"
	"golang.org/x/time/rate"
)

type RedditScraper struct {
	config      *config.Config
	rateLimiter *rate.Limiter
	httpClient  *http.Client
	subreddits  []string
}

func NewRedditScraper(cfg *config.Config, limiter *rate.Limiter) *RedditScraper {
	return &RedditScraper{
		config:      cfg,
		rateLimiter: limiter,
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
		subreddits: []string{"freefood", "freebies", "FREE", "randomactsofpizza"},
	}
}

func (s *RedditScraper) Name() string {
	return "Reddit"
}

func (s *RedditScraper) Scrape(ctx context.Context) ([]models.Event, error) {
	events := make([]models.Event, 0)

	for _, subreddit := range s.subreddits {
		select {
		case <-ctx.Done():
			return events, ctx.Err()
		default:
			subredditEvents, err := s.scrapeSubreddit(ctx, subreddit)
			if err != nil {
				log.Printf("Error scraping r/%s: %v", subreddit, err)
				continue
			}
			events = append(events, subredditEvents...)
		}
	}

	return events, nil
}

func (s *RedditScraper) scrapeSubreddit(ctx context.Context, subreddit string) ([]models.Event, error) {
	// Wait for rate limiter
	if err := s.rateLimiter.Wait(ctx); err != nil {
		return nil, err
	}

	url := fmt.Sprintf("https://www.reddit.com/r/%s/new.json?limit=25", subreddit)

	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return nil, err
	}

	req.Header.Set("User-Agent", s.config.UserAgent)

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("reddit API returned status %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var redditResp struct {
		Data struct {
			Children []struct {
				Data struct {
					Title       string  `json:"title"`
					Selftext    string  `json:"selftext"`
					URL         string  `json:"url"`
					CreatedUTC  float64 `json:"created_utc"`
					Score       int     `json:"score"`
					NumComments int     `json:"num_comments"`
					Author      string  `json:"author"`
					Permalink   string  `json:"permalink"`
				} `json:"data"`
			} `json:"children"`
		} `json:"data"`
	}

	if err := json.Unmarshal(body, &redditResp); err != nil {
		return nil, err
	}

	events := make([]models.Event, 0)

	for _, child := range redditResp.Data.Children {
		post := child.Data

		// Filter for relevant posts (containing location keywords)
		if !s.isRelevantPost(post.Title, post.Selftext) {
			continue
		}

		// Extract location (simplified - would need geocoding in production)
		lat, lng, address := s.extractLocation(post.Title + " " + post.Selftext)
		if lat == 0 && lng == 0 {
			continue // Skip posts without location
		}

		// Determine category
		category := s.categorizePost(post.Title, post.Selftext)

		// Parse time (assume event is within next 7 days if not specified)
		startTime := time.Now().Add(24 * time.Hour)

		event := models.Event{
			Title:       post.Title,
			Description: post.Selftext,
			Latitude:    lat,
			Longitude:   lng,
			Address:     address,
			StartTime:   startTime,
			Category:    category,
			Source:      "Reddit /r/" + subreddit,
			SourceURL:   "https://www.reddit.com" + post.Permalink,
			Organizer:   post.Author,
			RawData: map[string]interface{}{
				"score":        post.Score,
				"num_comments": post.NumComments,
				"created_utc":  post.CreatedUTC,
			},
		}

		events = append(events, event)
	}

	return events, nil
}

func (s *RedditScraper) isRelevantPost(title, body string) bool {
	text := strings.ToLower(title + " " + body)

	keywords := []string{
		"free", "giveaway", "pizza", "food", "event", "today", "tonight",
		"campus", "university", "college", "giving away", "come get",
	}

	for _, keyword := range keywords {
		if strings.Contains(text, keyword) {
			return true
		}
	}

	return false
}

func (s *RedditScraper) extractLocation(text string) (float64, float64, string) {
	// Common city coordinates (simplified - would use geocoding API in production)
	cities := map[string]struct {
		lat, lng float64
	}{
		"san francisco": {37.7749, -122.4194},
		"sf":            {37.7749, -122.4194},
		"new york":      {40.7128, -74.0060},
		"nyc":           {40.7128, -74.0060},
		"los angeles":   {34.0522, -118.2437},
		"la":            {34.0522, -118.2437},
		"chicago":       {41.8781, -87.6298},
		"boston":        {42.3601, -71.0589},
		"seattle":       {47.6062, -122.3321},
		"austin":        {30.2672, -97.7431},
		"portland":      {45.5152, -122.6784},
		"denver":        {39.7392, -104.9903},
		"berkeley":      {37.8715, -122.2730},
		"stanford":      {37.4275, -122.1697},
	}

	textLower := strings.ToLower(text)

	for city, coords := range cities {
		if strings.Contains(textLower, city) {
			return coords.lat, coords.lng, city
		}
	}

	// Try to extract address using regex
	addressRegex := regexp.MustCompile(`\d+\s+[\w\s]+(?:street|st|avenue|ave|road|rd|boulevard|blvd|drive|dr|lane|ln)`)
	if match := addressRegex.FindString(textLower); match != "" {
		// Default to San Francisco if address found but no city
		return 37.7749, -122.4194, match
	}

	return 0, 0, ""
}

func (s *RedditScraper) categorizePost(title, body string) string {
	text := strings.ToLower(title + " " + body)

	if strings.Contains(text, "pizza") || strings.Contains(text, "food") ||
		strings.Contains(text, "meal") || strings.Contains(text, "lunch") ||
		strings.Contains(text, "dinner") || strings.Contains(text, "breakfast") {
		return "Free Food"
	}

	if strings.Contains(text, "concert") || strings.Contains(text, "music") ||
		strings.Contains(text, "show") || strings.Contains(text, "performance") {
		return "Entertainment"
	}

	if strings.Contains(text, "workshop") || strings.Contains(text, "class") ||
		strings.Contains(text, "tutorial") || strings.Contains(text, "seminar") {
		return "Workshops"
	}

	if strings.Contains(text, "giveaway") || strings.Contains(text, "free stuff") {
		return "Giveaways"
	}

	return "Community Events"
}



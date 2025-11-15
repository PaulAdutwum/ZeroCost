package scrapers

import (
	"context"
	"log"
	"sync"
	"time"

	"github.com/zerocost/scraper/internal/config"
	"github.com/zerocost/scraper/internal/ingestion"
	"github.com/zerocost/scraper/internal/models"
	"golang.org/x/time/rate"
)

type Scraper interface {
	Name() string
	Scrape(ctx context.Context) ([]models.Event, error)
}

type Manager struct {
	scrapers        []Scraper
	ingestionClient *ingestion.Client
	rateLimiter     *rate.Limiter
	config          *config.Config
}

func NewManager(ingestionClient *ingestion.Client, cfg *config.Config) *Manager {
	// Create rate limiter (max 10 requests per second)
	limiter := rate.NewLimiter(rate.Every(time.Duration(cfg.RequestDelayMS)*time.Millisecond), 1)

	manager := &Manager{
		scrapers:        make([]Scraper, 0),
		ingestionClient: ingestionClient,
		rateLimiter:     limiter,
		config:          cfg,
	}

	// Register all scrapers
	manager.scrapers = append(manager.scrapers, NewRedditScraper(cfg, limiter))
	manager.scrapers = append(manager.scrapers, NewEventbriteScraper(cfg, limiter))
	manager.scrapers = append(manager.scrapers, NewMeetupScraper(cfg, limiter))
	manager.scrapers = append(manager.scrapers, NewUniversityScraper(cfg, limiter))

	return manager
}

func (m *Manager) RunAllScrapers(ctx context.Context) {
	log.Println("Starting scraping run for all sources...")
	startTime := time.Now()

	results := make(chan models.ScraperResult, len(m.scrapers))
	var wg sync.WaitGroup

	// Run scrapers concurrently with limited parallelism
	semaphore := make(chan struct{}, m.config.MaxConcurrentScrapers)

	for _, scraper := range m.scrapers {
		wg.Add(1)
		go func(s Scraper) {
			defer wg.Done()

			// Acquire semaphore
			semaphore <- struct{}{}
			defer func() { <-semaphore }()

			result := m.runScraper(ctx, s)
			results <- result
		}(scraper)
	}

	// Wait for all scrapers to complete
	go func() {
		wg.Wait()
		close(results)
	}()

	// Collect and process results
	totalEvents := 0
	totalErrors := 0

	for result := range results {
		log.Printf("Scraper '%s' completed: %d events, %d errors, duration: %v",
			result.Source, len(result.Events), result.ErrorCount, result.Duration)

		if len(result.Events) > 0 {
			if err := m.ingestionClient.IngestEvents(result.Events); err != nil {
				log.Printf("Failed to ingest events from %s: %v", result.Source, err)
				totalErrors++
			} else {
				totalEvents += len(result.Events)
			}
		}
	}

	duration := time.Since(startTime)
	log.Printf("Scraping run completed: %d total events ingested, %d errors, duration: %v",
		totalEvents, totalErrors, duration)
}

func (m *Manager) runScraper(ctx context.Context, scraper Scraper) models.ScraperResult {
	log.Printf("Starting scraper: %s", scraper.Name())
	startTime := time.Now()

	events, err := scraper.Scrape(ctx)
	duration := time.Since(startTime)

	result := models.ScraperResult{
		Source:     scraper.Name(),
		Events:     events,
		Duration:   duration,
		ErrorCount: 0,
	}

	if err != nil {
		log.Printf("Error in scraper %s: %v", scraper.Name(), err)
		result.ErrorCount = 1
	}

	return result
}



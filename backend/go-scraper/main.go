package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strconv"
	"syscall"
	"time"

	"github.com/robfig/cron/v3"
	"github.com/zerocost/scraper/internal/config"
	"github.com/zerocost/scraper/internal/ingestion"
	"github.com/zerocost/scraper/internal/scrapers"
)

func main() {
	log.Println("Starting ZeroCost Scraper Service...")

	// Load configuration
	cfg := config.LoadConfig()

	// Initialize ingestion client
	ingestionClient := ingestion.NewClient(cfg.JavaAPIURL)

	// Initialize scrapers
	scraperManager := scrapers.NewManager(ingestionClient, cfg)

	// Start HTTP server for health checks
	go startHTTPServer(cfg.Port)

	// Set up cron scheduler
	c := cron.New()
	
	// Schedule scraping jobs
	interval := cfg.ScraperIntervalMinutes
	schedule := "@every " + strconv.Itoa(interval) + "m"
	
	_, err := c.AddFunc(schedule, func() {
		log.Printf("Starting scheduled scraping run...")
		ctx, cancel := context.WithTimeout(context.Background(), 30*time.Minute)
		defer cancel()
		
		scraperManager.RunAllScrapers(ctx)
	})
	
	if err != nil {
		log.Fatalf("Failed to schedule scraping job: %v", err)
	}

	// Start cron scheduler
	c.Start()
	log.Printf("Scraper scheduled to run every %d minutes", interval)

	// Run immediately on startup
	go func() {
		log.Println("Running initial scraping...")
		ctx, cancel := context.WithTimeout(context.Background(), 30*time.Minute)
		defer cancel()
		scraperManager.RunAllScrapers(ctx)
	}()

	// Wait for interrupt signal
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, os.Interrupt, syscall.SIGTERM)
	<-sigChan

	log.Println("Shutting down scraper service...")
	c.Stop()
	log.Println("Scraper service stopped")
}

func startHTTPServer(port string) {
	mux := http.NewServeMux()

	// Health check endpoint
	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"healthy","service":"go-scraper"}`))
	})

	// Metrics endpoint
	mux.HandleFunc("/metrics", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		// TODO: Add actual metrics
		w.Write([]byte(`{"scrapers":4,"last_run":"2025-11-15T10:00:00Z"}`))
	})

	log.Printf("HTTP server listening on port %s", port)
	if err := http.ListenAndServe(":"+port, mux); err != nil {
		log.Fatalf("Failed to start HTTP server: %v", err)
	}
}


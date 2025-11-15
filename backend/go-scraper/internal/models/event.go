package models

import "time"

// Event represents a scraped free event/opportunity
type Event struct {
	Title        string                 `json:"title"`
	Description  string                 `json:"description"`
	Latitude     float64                `json:"latitude"`
	Longitude    float64                `json:"longitude"`
	Address      string                 `json:"address,omitempty"`
	StartTime    time.Time              `json:"start_time"`
	EndTime      *time.Time             `json:"end_time,omitempty"`
	Category     string                 `json:"category"`
	Source       string                 `json:"source"`
	SourceURL    string                 `json:"source_url"`
	ImageURL     string                 `json:"image_url,omitempty"`
	Organizer    string                 `json:"organizer,omitempty"`
	Capacity     int                    `json:"capacity,omitempty"`
	RawData      map[string]interface{} `json:"raw_data,omitempty"`
}

// ScraperResult contains events scraped from a source
type ScraperResult struct {
	Source       string
	Events       []Event
	ErrorCount   int
	Duration     time.Duration
}



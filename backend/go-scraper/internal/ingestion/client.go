package ingestion

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"time"

	"github.com/zerocost/scraper/internal/models"
)

type Client struct {
	apiURL     string
	httpClient *http.Client
}

func NewClient(apiURL string) *Client {
	return &Client{
		apiURL: apiURL,
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// IngestEvents sends scraped events to the Java API
func (c *Client) IngestEvents(events []models.Event) error {
	if len(events) == 0 {
		return nil
	}

	url := fmt.Sprintf("%s/api/v1/events/ingest", c.apiURL)

	payload := map[string]interface{}{
		"events": events,
	}

	jsonData, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("failed to marshal events: %w", err)
	}

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("User-Agent", "ZeroCost-Scraper/1.0")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusCreated {
		return fmt.Errorf("ingestion failed with status %d: %s", resp.StatusCode, string(body))
	}

	log.Printf("Successfully ingested %d events", len(events))
	return nil
}

// IngestEvent sends a single event to the Java API
func (c *Client) IngestEvent(event models.Event) error {
	return c.IngestEvents([]models.Event{event})
}


package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/streadway/amqp"
)

func failOnError(err error, msg string) {
	if err != nil {
		log.Fatalf("%s: %s", msg, err)
	}
}

func main() {
	rabbitURL := os.Getenv("RABBITMQ_URL")
	if rabbitURL == "" {
		rabbitURL = "amqp://guest:guest@localhost:5672/"
	}
	backendURL := os.Getenv("BACKEND_URL")
	if backendURL == "" {
		backendURL = "http://localhost:3001/api/weather/logs"
	}

	conn, err := amqp.Dial(rabbitURL)
	failOnError(err, "Failed to connect to RabbitMQ")
	defer conn.Close()

	ch, err := conn.Channel()
	failOnError(err, "Failed to open a channel")
	defer ch.Close()

	q, err := ch.QueueDeclare(
		"weather", // name
		true,      // durable
		false,     // delete when unused
		false,     // exclusive
		false,     // no-wait
		nil,       // arguments
	)
	failOnError(err, "Failed to declare a queue")

	msgs, err := ch.Consume(
		q.Name, // queue
		"",     // consumer
		false,  // auto-ack
		false,  // exclusive
		false,  // no-local
		false,  // no-wait
		nil,    // args
	)
	failOnError(err, "Failed to register a consumer")

	forever := make(chan bool)

	go func() {
		for d := range msgs {
			// Inspect x-death headers to determine prior attempts (sum of counts)
			attempts := 0
			if hdr, ok := d.Headers["x-death"]; ok {
				if arr, ok2 := hdr.([]interface{}); ok2 {
					for _, item := range arr {
						// AMQP x-death items can be amqp.Table (map[string]interface{})
						switch t := item.(type) {
						case amqp.Table:
							if c, ok := t["count"]; ok {
								switch v := c.(type) {
								case int:
									attempts += v
								case int32:
									attempts += int(v)
								case int64:
									attempts += int(v)
								case float64:
									attempts += int(v)
								}
							}
						case map[string]interface{}:
							if c, ok := t["count"]; ok {
								switch v := c.(type) {
								case int:
									attempts += v
								case float64:
									attempts += int(v)
								}
							}
						}
					}
				}
			}

			// If attempts exceed threshold, publish directly to DLX and ack
			if attempts >= 4 {
				log.Printf("Message has reached %d attempts; routing to DLQ", attempts)
				// publish to DLX exchange
				err := ch.Publish("dlx.weather", "", false, false, amqp.Publishing{
					ContentType:  "application/json",
					DeliveryMode: amqp.Persistent,
					Body:         d.Body,
				})
				if err != nil {
					log.Printf("Failed to publish to DLX: %v", err)
					// attempt to nack for retry as last resort
					d.Nack(false, true)
					continue
				}
				d.Ack(false)
				continue
			}

			// Forward to backend (include x-api-key if provided)
			// Try to normalize JSON payload: map location object to lat/lon and string, map wind->wind_kph, set createdAt from timestamp
			var outBody []byte
			var normalized = false
			var payload map[string]interface{}
			if err := json.Unmarshal(d.Body, &payload); err == nil {
				// normalize location
				if loc, ok := payload["location"].(map[string]interface{}); ok {
					var lat, lon interface{}
					if v, ok2 := loc["lat"]; ok2 {
						lat = v
					}
					if v, ok2 := loc["lon"]; ok2 {
						lon = v
					}
					if lat == nil {
						if v, ok2 := loc["latitude"]; ok2 {
							lat = v
						}
					}
					if lon == nil {
						if v, ok2 := loc["longitude"]; ok2 {
							lon = v
						}
					}
					if lat != nil && lon != nil {
						payload["lat"] = lat
						payload["lon"] = lon
						payload["location"] = fmt.Sprintf("%v,%v", lat, lon)
					} else {
						// stringify location object
						if b, err := json.Marshal(loc); err == nil {
							payload["location"] = string(b)
						}
					}
				}
				// map wind -> wind_kph
				if _, ok := payload["wind_kph"]; !ok {
					if w, ok2 := payload["wind"]; ok2 {
						payload["wind_kph"] = w
					}
				}
				// timestamp -> createdAt (if numeric)
				if ts, ok := payload["timestamp"]; ok {
					switch v := ts.(type) {
					case float64:
						// assume seconds -> ms
						t := time.Unix(int64(v), 0)
						payload["createdAt"] = t.Format(time.RFC3339)
					case int64:
						t := time.Unix(v, 0)
						payload["createdAt"] = t.Format(time.RFC3339)
					}
				}
				if b, err := json.Marshal(payload); err == nil {
					outBody = b
					normalized = true
				}
			}

			var reader io.Reader
			if normalized {
				reader = bytes.NewReader(outBody)
			} else {
				reader = bytes.NewReader(d.Body)
			}

			req, err := http.NewRequest("POST", backendURL, reader)
			if err != nil {
				log.Printf("Failed to create request: %v", err)
				d.Nack(false, true)
				continue
			}
			req.Header.Set("Content-Type", "application/json")
			if key := os.Getenv("BACKEND_API_KEY"); key != "" {
				req.Header.Set("x-api-key", key)
			}
			resp, err := http.DefaultClient.Do(req)
			if err != nil {
				log.Printf("Failed to POST to backend: %v", err)
				d.Nack(false, true)
				continue
			}
			resp.Body.Close()
			if resp.StatusCode >= 200 && resp.StatusCode < 300 {
				d.Ack(false)
			} else {
				log.Printf("Backend returned status %d", resp.StatusCode)
				d.Nack(false, true)
			}
		}
	}()

	log.Printf(" [*] Waiting for messages. To exit press CTRL+C")
	<-forever
}

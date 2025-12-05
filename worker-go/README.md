# Worker (Go)

This worker connects to RabbitMQ, consumes messages from the `weather` queue, and forwards them to the backend `/api/weather/logs` endpoint.

Setup

1. Initialize module and install dependency:

```bash
cd worker-go
go mod init github.com/yourname/sunmap-worker
go get github.com/streadway/amqp
```

2. Build and run:

```bash
go build -o worker .
RABBITMQ_URL=amqp://guest:guest@localhost:5672/ BACKEND_URL=http://localhost:3001/api/weather/logs ./worker
```

Configuration via env:
- `RABBITMQ_URL` default `amqp://guest:guest@localhost:5672/`
- `BACKEND_URL` default `http://localhost:3001/api/weather/logs`

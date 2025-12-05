# Node worker (alternative)

This is a Node.js worker alternative to the Go worker. It consumes messages from the `weather` queue and forwards each message to the backend `/api/weather/logs` endpoint.

Setup

1. Install dependencies:
```cmd
cd worker-node
npm install
```

2. Run the worker (Windows cmd):
```cmd
set "RABBITMQ_URL=amqp://guest:guest@localhost:5672/"
set "BACKEND_URL=http://localhost:3001/api/weather/logs"
npm start
```

Environment variables
- `RABBITMQ_URL` default `amqp://guest:guest@localhost:5672/`
- `BACKEND_URL` default `http://localhost:3001/api/weather/logs`
- `WEATHER_QUEUE` default `weather`
- `WORKER_PREFETCH` default `1`

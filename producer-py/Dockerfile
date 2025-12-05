FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672/
ENV PUBLISHER_RETRIES=8
ENV PUBLISH_COUNT=1
ENV PUBLISHER_RETRY_DELAY=2

# Run the publisher in a loop so it periodically sends messages (adjust sleep as needed)
CMD ["sh", "-c", "while true; do python publisher.py; sleep 30; done"]

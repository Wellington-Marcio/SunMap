import os
import json
import time
import sys
import pika

rabbit_url = os.getenv('RABBITMQ_URL', 'amqp://guest:guest@localhost:5672/')
max_retries = int(os.getenv('PUBLISHER_RETRIES', '8'))
retry_delay = float(os.getenv('PUBLISHER_RETRY_DELAY', '2'))
count = int(os.getenv('PUBLISH_COUNT', '1'))

sample = {
    "location": {"lat": -23.55, "lon": -46.63},
    "temperature": 28.4,
    "humidity": 74,
    "source": "producer-py",
    "timestamp": None,
}

def connect_with_retry(url, retries=max_retries, delay=retry_delay):
    params = pika.URLParameters(url)
    last_err = None
    for attempt in range(1, retries + 1):
        try:
            conn = pika.BlockingConnection(params)
            return conn
        except Exception as e:
            last_err = e
            print(f"Connection attempt {attempt}/{retries} failed: {e}")
            if attempt < retries:
                time.sleep(delay * attempt)
    raise last_err

def main():
    try:
        conn = connect_with_retry(rabbit_url)
    except Exception as e:
        print("ERROR: could not connect to RabbitMQ after retries:", e)
        sys.exit(1)

    ch = conn.channel()
    ch.queue_declare(queue='weather', durable=True)

    for i in range(count):
        payload = sample.copy()
        payload['timestamp'] = time.time()
        body = json.dumps(payload)
        ch.basic_publish(exchange='', routing_key='weather', body=body, properties=pika.BasicProperties(delivery_mode=2))
        print(f'Published message {i+1}/{count}')

    conn.close()

if __name__ == '__main__':
    main()

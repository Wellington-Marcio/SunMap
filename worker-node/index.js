const amqp = require('amqplib');
const fetch = require('node-fetch');

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672/';
const QUEUE = process.env.WEATHER_QUEUE || 'weather';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001/api/weather/logs';
const PREFETCH = Number(process.env.WORKER_PREFETCH || '1');
const BACKEND_API_KEY = process.env.BACKEND_API_KEY || process.env.WEATHER_API_KEY || 'local_dev_key';

async function run() {
  console.log('Connecting to RabbitMQ %s', RABBITMQ_URL);
  const conn = await amqp.connect(RABBITMQ_URL);
  const ch = await conn.createChannel();
  await ch.assertQueue(QUEUE, { durable: true });
  await ch.prefetch(PREFETCH);
  console.log('Waiting for messages in %s', QUEUE);

  ch.consume(
    QUEUE,
    async (msg) => {
      if (!msg) return;
      const body = msg.content.toString();
      console.log('Received message:', body);
      try {
        const res = await fetch(BACKEND_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': BACKEND_API_KEY },
          body,
        });
        if (res.ok) {
          ch.ack(msg);
          console.log('Forwarded to backend, acked');
        } else {
          console.error('Backend responded with', res.status);
          ch.nack(msg, false, true);
        }
      } catch (err) {
        console.error('Error forwarding to backend:', err.message || err);
        // requeue message for retry
        ch.nack(msg, false, true);
      }
    },
    { noAck: false },
  );

  // handle shutdown
  process.on('SIGINT', async () => {
    console.log('Shutting down...');
    await ch.close();
    await conn.close();
    process.exit(0);
  });
}

run().catch((err) => {
  console.error('Worker failed:', err);
  process.exit(1);
});

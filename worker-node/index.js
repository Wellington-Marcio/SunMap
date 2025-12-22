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
      // try to parse and normalize payload so backend gets consistent fields
      let payload = null;
      try {
        payload = JSON.parse(body);
      } catch (e) {
        // leave as raw string if not JSON
      }
      // inspect x-death header to count previous delivery attempts
      let attempts = 0;
      try {
        const hdr = msg.properties && msg.properties.headers && msg.properties.headers['x-death'];
        if (Array.isArray(hdr)) {
          attempts = hdr.reduce((acc, it) => acc + (it && it.count ? Number(it.count) : 0), 0);
        }
      } catch (e) {
        // ignore header parsing errors
      }
      if (attempts >= 4) {
        console.warn(`Message reached ${attempts} attempts - routing to DLQ`);
        try {
          // publish directly to DLX exchange
          ch.publish('dlx.weather', '', Buffer.from(body), { persistent: true });
          ch.ack(msg);
          console.log('Published to dlx.weather and acked original message');
          return;
        } catch (pubErr) {
          console.error('Failed to publish to DLX:', pubErr);
          // as last resort, nack for retry
          ch.nack(msg, false, true);
          return;
        }
      }
      try {
        // build body to send (normalize when possible)
        let bodyToSend = body;
        try {
          if (payload && typeof payload === 'object') {
            // map location object to string and top-level lat/lon
            if (payload.location && typeof payload.location === 'object') {
              const lat = payload.location.lat ?? payload.location.latitude ?? null;
              const lon = payload.location.lon ?? payload.location.longitude ?? null;
              if (lat != null && lon != null) {
                payload.lat = lat;
                payload.lon = lon;
                payload.location = `${lat},${lon}`;
              } else {
                // ensure location is a JSON string if it's an object
                payload.location = JSON.stringify(payload.location);
              }
            }
            // map wind -> wind_kph if present
            if ((payload.wind_kph == null) && payload.wind != null) {
              const w = Number(payload.wind);
              if (!Number.isNaN(w)) payload.wind_kph = w;
            }
            // if timestamp present (seconds), set createdAt for clarity
            if (payload.timestamp && !payload.createdAt) {
              const ts = Number(payload.timestamp);
              if (!Number.isNaN(ts)) {
                // if timestamp looks like seconds (small), convert to ms
                const created = ts > 1e12 ? new Date(ts) : new Date(ts * 1000);
                payload.createdAt = created.toISOString();
              }
            }
            bodyToSend = JSON.stringify(payload);
          }
        } catch (normErr) {
          console.warn('Normalization failed, sending raw body', normErr);
          bodyToSend = body;
        }

        const res = await fetch(BACKEND_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': BACKEND_API_KEY },
          body: bodyToSend,
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

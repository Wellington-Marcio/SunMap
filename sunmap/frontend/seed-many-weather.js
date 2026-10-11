import axios from 'axios';

async function postRecord(rec) {
  try {
    const res = await axios.post('http://localhost:3001/api/weather/logs', rec, { headers: { 'Content-Type': 'application/json' } });
    console.log('Inserted:', res.data?._id ?? res.status);
  } catch (e) {
    if (e.response) console.error('Insert error:', e.response.status, JSON.stringify(e.response.data));
    else if (e.request) console.error('Insert error: no response, request sent', e.message);
    else console.error('Insert error:', e.message);
  }
}

function rand(min, max) { return Math.random() * (max - min) + min; }

async function main() {
  const count = Number(process.argv[2] || 50);
  console.log(`Seeding ${count} weather records...`);
  const now = Date.now();
  for (let i = 0; i < count; i++) {
    // spread records over last 30 days
    const daysAgo = Math.floor(rand(0, 30));
    const ts = now - daysAgo * 24 * 60 * 60 * 1000 - Math.floor(rand(0, 24*60*60*1000));
    const createdAt = new Date(ts).toISOString();
    const temp = Math.round(rand(8, 36) * 10) / 10; // 1-decimal temp
    const humidity = Math.round(rand(20, 95));
    const lat = -22.9 + rand(-0.5, 0.5);
    const lon = -43.2 + rand(-0.5, 0.5);
    const payload = {
      lat,
      lon,
      temperature: temp,
      humidity,
      raw: { seeded: true, index: i },
      createdAt,
    };
    // await a small delay to avoid overwhelming server
    await postRecord(payload);
    await new Promise(r => setTimeout(r, 80));
  }
  console.log('Seeding finished');
}

main();

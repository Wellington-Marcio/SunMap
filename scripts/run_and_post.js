const { spawn } = require('child_process');
const path = require('path');

const backendMain = path.join(__dirname, '..', 'backend', 'dist', 'main.js');

console.log('Starting backend child process:', backendMain);
const child = spawn(process.execPath, [backendMain], {
  cwd: path.join(__dirname, '..', 'backend'),
  env: process.env,
});

child.stdout.on('data', (chunk) => {
  const text = chunk.toString();
  process.stdout.write(`[backend stdout] ${text}`);
  if (text.includes('Listening on port')) {
    doPost();
  }
});

child.stderr.on('data', (chunk) => {
  process.stderr.write(`[backend stderr] ${chunk.toString()}`);
});

child.on('exit', (code, sig) => {
  console.log(`Backend process exited with code=${code} sig=${sig}`);
  process.exit(code || 0);
});

async function doPost() {
  try {
    console.log('Performing login POST to http://127.0.0.1:3001/api/auth/login');
    const res = await fetch('http://127.0.0.1:3001/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'admin@sunmap.com', password: '123456' }),
    });
    const text = await res.text();
    console.log('POST STATUS', res.status);
    console.log('POST BODY', text);
  }
  catch (err) {
    console.error('POST ERROR', err);
  }
  finally {
    // Give backend some time, then shut it down
    setTimeout(() => {
      try { child.kill(); } catch (e) { }
    }, 1000);
  }
}

const http = require('http');
const url = 'http://127.0.0.1:3001/weather/fetch?lat=-22.9&lon=-43.2';
http.get(url, (res) => {
  res.setEncoding('utf8');
  let s = '';
  res.on('data', (c) => s += c);
  res.on('end', () => {
    try {
      console.log('STATUS', res.statusCode);
      console.log('BODY', s);
    } catch (e) {
      console.error('PARSE_ERR', e);
    }
  });
}).on('error', (e) => {
  console.error('ERR', e.message);
  process.exit(1);
});

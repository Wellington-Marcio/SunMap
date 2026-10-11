const axios = require('axios');

(async () => {
  try {
    const res = await axios.post('http://127.0.0.1:3003/api/auth/login', {
      email: 'admin@sunmap.com',
      password: '123456'
    }, { timeout: 5000 });
    console.log('status', res.status);
    console.log('data', res.data);
  } catch (err) {
    if (err.response) {
      console.log('status', err.response.status);
      console.log('data', err.response.data);
    } else {
      console.error('error', err.message);
    }
    process.exit(1);
  }
})();

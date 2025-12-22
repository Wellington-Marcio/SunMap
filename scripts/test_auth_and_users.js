(async () => {
  try {
    const loginRes = await fetch('http://127.0.0.1:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@sunmap.com', password: '123456' })
    });

    const loginJson = await loginRes.json();
    console.log('---LOGIN-RESPONSE---');
    console.log(JSON.stringify(loginJson, null, 2));

    const token = loginJson?.access_token;
    if (!token) {
      console.error('No access_token returned from login. Aborting.');
      process.exit(2);
    }

    const usersRes = await fetch('http://127.0.0.1:3001/api/users', {
      headers: { Authorization: 'Bearer ' + token }
    });
    const usersJson = await usersRes.json();
    console.log('---USERS-RESPONSE---');
    console.log(JSON.stringify(usersJson, null, 2));
  } catch (err) {
    console.error('Error during requests:', err);
    process.exit(1);
  }
})();

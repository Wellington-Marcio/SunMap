(async ()=>{
  try{
    const res = await fetch('http://127.0.0.1:3001/api/auth/login',{
      method:'POST',
      headers:{'content-type':'application/json'},
      body: JSON.stringify({email:'admin@sunmap.com', password:'123456'})
    });
    const text = await res.text();
    console.log('STATUS', res.status);
    console.log(text);
  }catch(e){
    console.error('ERROR', e);
  }
})();

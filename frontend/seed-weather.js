import axios from 'axios';

async function main(){
  try{
    const res = await axios.post('http://localhost:3001/api/weather/logs',{
      lat: -22.9,
      lon: -43.2,
      temperature: 28.3,
      humidity: 61,
      raw: {}
    },{
      headers: {'Content-Type': 'application/json'}
    });
    console.log('POST response status:', res.status);
    console.log(res.data);
  } catch (e) {
    if (e.response) console.error('Error response:', e.response.status, e.response.data);
    else console.error('Error:', e.message);
  }
}

main();

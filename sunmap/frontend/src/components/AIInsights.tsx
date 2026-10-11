// React import not required with new JSX transform

type WeatherRecord = { _id?: string; temperature?: number; humidity?: number; wind_kph?: number; precip_mm?: number; condition?: any; createdAt?: string; locationName?: string };

export default function AIInsights({ records }: { records: WeatherRecord[] }) {
  if (!records || records.length === 0) return <div className="panel-card">Sem dados suficientes para gerar insights</div>;

  const latest = records[0];
  const temps = records.map(r => Number(r.temperature ?? 0));
  const avgTemp = temps.reduce((a,b)=>a+b,0)/Math.max(1, temps.length);
  const maxTemp = Math.max(...temps);
  const minTemp = Math.min(...temps);
  const avgPrecip = records.map(r=>Number(r.precip_mm ?? 0)).reduce((a,b)=>a+b,0)/Math.max(1, records.length);
  const maxWind = Math.max(...records.map(r=>Number(r.wind_kph ?? 0)));

  const insights: string[] = [];
  if (avgPrecip > 1 || (latest?.condition && JSON.stringify(latest.condition).toLowerCase().includes('rain'))) {
    insights.push('Alta chance de chuva nas próximas horas.');
  }
  if (avgTemp >= 35 || maxTemp >= 38) {
    insights.push('Calor extremo — tome cuidado com exposição solar.');
  }
  if (avgTemp <= 5 || minTemp <= 0) {
    insights.push('Frio intenso previsto — agasalhe-se adequadamente.');
  }
  if (maxWind >= 60) {
    insights.push('Possibilidade de ventania forte. Verifique estruturas e árvores soltas.');
  }
  if (insights.length === 0) {
    insights.push('Clima estável e dentro do esperado para as últimas leituras.');
  }

  return (
    <div className="panel-card">
      <h3>Insights de IA</h3>
      <div style={{display:'flex',gap:12}}>
        <div style={{flex:1}}>
          <div style={{fontSize:'0.95rem',marginBottom:8}}>Resumo rápido</div>
          <div style={{fontWeight:700,fontSize:'1.4rem'}}>{latest?.temperature ?? '—'}° • {latest?.humidity ?? '—'}%</div>
          <div style={{color:'var(--muted)',marginTop:6}}>{latest?.locationName ?? ''} — {latest?.createdAt ? new Date(latest.createdAt).toLocaleString() : ''}</div>
        </div>
        <div style={{flex:2}}>
          <div style={{fontSize:'0.95rem',marginBottom:8}}>Recomendações</div>
          <ul style={{margin:0,paddingLeft:18}}>
            {insights.map((t,i)=>(<li key={i} style={{marginBottom:6}}>{t}</li>))}
          </ul>
        </div>
      </div>
      <div style={{marginTop:10,fontSize:'0.85rem',color:'var(--muted)'}}>
        Média temp: {avgTemp.toFixed(1)}° • Precip média: {avgPrecip.toFixed(2)} mm • Vento máximo: {maxWind} km/h
      </div>
    </div>
  );
}

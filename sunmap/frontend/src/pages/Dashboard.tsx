import { useEffect, useState, useMemo, useRef } from 'react';
import { weatherApi, usersApi } from '../api';
import Sidebar from '../components/Sidebar';
import ErrorBoundary from '../components/ErrorBoundary';
import DynamicChart from '../components/DynamicChart';
import AIInsights from '../components/AIInsights';
import { useToast } from '../components/Toast';

type User = { _id?: string; email?: string; username?: string; name?: string; roles?: string[] };
type WeatherRecord = { _id?: string; temp?: number; temperature?: number; createdAt?: string; [k: string]: any };

export default function Dashboard() {
  // quick mount log to help diagnose blank page issues
  useEffect(() => {
    try {
      console.log('Dashboard mounted');
    } catch (e) {
      console.error('Dashboard mount log failed', e);
    }
  }, []);
  const [weather, setWeather] = useState<WeatherRecord[]>([]);
  const [, setUsers] = useState<User[]>([]);
  const [currentUserName, setCurrentUserName] = useState<string>('Usuários');
  const [loadingWeather, setLoadingWeather] = useState<boolean>(true);
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [locLoading, setLocLoading] = useState<boolean>(false);
  const [chartError, setChartError] = useState<boolean>(false);
  const chartErrorRef = useRef<boolean>(false);
  const [summary, setSummary] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [tableExpanded, setTableExpanded] = useState<boolean>(false);
  
  const toast = (() => {
    try {
      return useToast();
    } catch (e) {
      // if ToastProvider isn't mounted yet, fallback to console
      return { push: (text: string) => console.log('toast:', text) } as any;
    }
  })();

  // compute filtered weather according to date range
  const filteredWeather = useMemo(() => {
    if (!fromDate && !toDate) return weather;
    const from = fromDate ? new Date(fromDate) : null;
    const to = toDate ? new Date(toDate) : null;
    // if to provided, set to end of day
    if (to) to.setHours(23,59,59,999);
    return weather.filter(w => {
      if (!w.createdAt) return false;
      const d = new Date(w.createdAt);
      if (from && d < from) return false;
      if (to && d > to) return false;
      return true;
    });
  }, [weather, fromDate, toDate]);

  // helper: compute summary (latest + averages) from a list of records
  const computeSummary = (records: WeatherRecord[] | null) => {
    try {
      const list = Array.isArray(records) ? records : (weather || []);
      const h = 6;
      const cutoff = new Date(Date.now() - h * 3600 * 1000);
      const recent = list.filter((item: any) => {
        try { return item && item.createdAt && new Date(item.createdAt) >= cutoff; } catch { return false; }
      });
      let latest = recent.slice().sort((a: any, b: any) => {
        try { return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(); } catch { return 0; }
      })[0] || null;
      // fallback: if there are no "recent" records (e.g. no createdAt within cutoff),
      // pick the newest available record from the full list so the UI still shows a value.
      if (!latest) {
        latest = list.slice().sort((a: any, b: any) => {
          try { const ta = a?.createdAt ? new Date(a.createdAt).getTime() : 0; const tb = b?.createdAt ? new Date(b.createdAt).getTime() : 0; return tb - ta; } catch { return 0; }
        })[0] || null;
      }
      const temps = recent.map((it: any) => Number(it.temperature ?? it.temp ?? it.value ?? NaN)).filter((n: any) => Number.isFinite(n));
      const hums = recent.map((it: any) => Number(it.humidity ?? NaN)).filter((n: any) => Number.isFinite(n));
      const winds = recent.map((it: any) => Number(it.wind_kph ?? it.wind ?? NaN)).filter((n: any) => Number.isFinite(n));
      const avgTemp = temps.length ? temps.reduce((s: number, v: number) => s + v, 0) / temps.length : null;
      const avgHum = hums.length ? hums.reduce((s: number, v: number) => s + v, 0) / hums.length : null;
      const avgWind = winds.length ? winds.reduce((s: number, v: number) => s + v, 0) / winds.length : null;
      const localSummary = { latest, average: { temperature: avgTemp, humidity: avgHum, wind_kph: avgWind }, count: recent.length };
      setSummary(localSummary);
    } catch (e) {
      console.warn('computeSummary failed', e);
    }
  };

  // read logged user name from stored JWT (sunmap_token) if present
  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;
      const token = localStorage.getItem('sunmap_token');
      if (!token) return;
      const parts = token.split('.');
      if (parts.length < 2) return;
      const payload = parts[1];
      // base64url -> base64
      const b64 = payload.replace(/-/g, '+').replace(/_/g, '/');
      const pad = b64.length % 4;
      const padded = pad ? b64 + '='.repeat(4 - pad) : b64;
      const json = atob(padded);
      const obj = JSON.parse(json);
      const name = obj?.name || obj?.username || obj?.email || obj?.sub || null;
      if (name) setCurrentUserName(String(name));
    } catch (e) {
      // ignore parse errors
    }
  }, []);

  // chart data derived from filtered weather
  // decide what to display: by default only show last 5 records, unless a date filter is applied
  const displayedWeather = useMemo(() => {
    const hasFilter = Boolean(fromDate || toDate);
    if (!hasFilter) {
      return weather.slice(0, 5);
    }
    return filteredWeather;
  }, [weather, fromDate, toDate, filteredWeather]);

  const lineChartData = useMemo(() => {
    try {
      chartErrorRef.current = false;

      const labels = displayedWeather.slice(0, 12).map((w) => {
        if (w.createdAt) {
          try {
            const d = new Date(w.createdAt);
            return d.toLocaleString();
          } catch (e) {
            return String(w.createdAt);
          }
        }
        return '' + (w._id ?? '');
      }).reverse();

      const temps = displayedWeather.slice(0, 12).map((w) => Number(w.temperature ?? w.temp ?? w.value ?? 0)).reverse();

      return {
        labels,
        datasets: [
          {
            label: 'Temperatura (°C)',
            data: temps,
            borderWidth: 2,
            backgroundColor: (ctx: any) => {
              const chart = ctx.chart;
              const gradient = chart.ctx.createLinearGradient(0, 0, 0, chart.height || 180);
              const root = typeof window !== 'undefined' ? getComputedStyle(document.documentElement) : null;
              const purple = (root?.getPropertyValue('--accent-cobalt') || '#9b6bff').trim();
              const pink = (root?.getPropertyValue('--accent-light-blue') || '#ff5fa2').trim();
              gradient.addColorStop(0, purple + '33');
              gradient.addColorStop(1, pink + '22');
              return gradient;
            },
            borderColor: 'rgba(155,107,255,0.95)',
            tension: 0.35,
            fill: true,
            pointRadius: 3,
          },
        ],
      };
    } catch (e) {
      console.error('lineChartData calculation failed', e);
      chartErrorRef.current = true;
      return { labels: [], datasets: [] } as any;
    }
  }, [displayedWeather]);


  // bar chart removed — gauge used instead; keep placeholder to avoid unused-import errors
  /* barChartData intentionally removed; previous implementation kept for reference */

  useEffect(() => {
    let cancelled = false as boolean;
    let intervalId: any = null;
    // Temporarily reduce polling interval to 30s for quicker test feedback.
    // Revert to 10 minutes (1000 * 60 * 10) after debugging.
    const POLL_MS = 1000 * 30; // 30 seconds

    const fetchWeather = async () => {
      if (cancelled) return;
      setLoadingWeather(true);
      try {
        // normalized fetch returns array of records
        const payload = await weatherApi.getList(1, 50);
        // sort newest first by createdAt when available
        const sorted = (payload || []).slice().sort((a: any, b: any) => {
          try {
            const ta = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
            const tb = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
            return tb - ta;
          } catch (e) { return 0; }
        });
        if (!cancelled) setWeather(sorted);
        if (!cancelled) computeSummary(sorted);
        console.debug('[Dashboard] fetched weather records:', (sorted || []).length, 'last:', (sorted[0]?.createdAt || 'n/a'));
        // if there are no records, try fetching once from external WeatherAPI (best-effort)
        if ((!payload || payload.length === 0) && !cancelled) {
          try {
            await weatherApi.fetchExternal();
            const r2 = await weatherApi.getList(1, 50);
            if (!cancelled) setWeather(r2);
          } catch (e) {
            console.warn('fetchExternal fallback failed', e);
          }
        }
      } catch (err) {
        console.error('weatherApi.getList error:', err);
        toast.push('Erro ao buscar dados do servidor', 'error');
        if (!cancelled) setWeather([]);
      } finally {
        if (!cancelled) setLoadingWeather(false);
      }
    };

    // initial fetch immediately
    fetchWeather();
    // schedule periodic polling
    intervalId = setInterval(fetchWeather, POLL_MS);

    // re-fetch when the page becomes visible again or window regains focus
    const onVisibility = () => { if (document.visibilityState === 'visible') fetchWeather(); };
    window.addEventListener('focus', fetchWeather);
    document.addEventListener('visibilitychange', onVisibility);

    // fetch users once (no need to poll users frequently)
    usersApi.list(1, 5).then((r) => { if (!cancelled) setUsers(Array.isArray(r.data) ? r.data : (r.data?.data || [])); }).catch(() => { if (!cancelled) setUsers([]); });

    return () => { cancelled = true; if (intervalId) clearInterval(intervalId); window.removeEventListener('focus', fetchWeather); document.removeEventListener('visibilitychange', onVisibility); };
  }, []);

  // fetch dashboard summary
  useEffect(() => {
    // initial summary fetch (kept for first paint). adapt backend shape to UI expectations.
    (async () => {
      try {
        const r = await weatherApi.summary(6);
        const srv = r.data || r;
        if (!srv) return;
        if (typeof srv.average === 'number') {
          setSummary({ latest: srv.latest || null, average: { temperature: srv.average, humidity: null, wind_kph: null }, count: srv.count || 0 });
        } else {
          setSummary(srv);
        }
      } catch (_e) { /* ignore */ }
    })();
  }, []);

  // reflect calculation errors into state after displayedWeather changes
  useEffect(() => {
    setChartError(Boolean(chartErrorRef.current));
  }, [displayedWeather]);

  const tableRecords = useMemo(() => {
    const hasFilter = Boolean(fromDate || toDate);
    const list = hasFilter ? filteredWeather : weather;
    // Show only 5 records by default to keep the table compact.
    // If the table is expanded (user clicked the card), show up to 20.
    const limit = hasFilter ? 50 : (tableExpanded ? 20 : 5);
    return (list || []).slice(0, limit);
  }, [weather, filteredWeather, fromDate, toDate, tableExpanded]);

  // provide a single `latestRecord` that UI cards can read from (summary.latest first,
  // fallback to the most-recent `weather[0]` if available)
  const latestRecord = summary?.latest ?? (weather && weather.length ? weather[0] : null);
  const latestTempValue = (() => {
    try {
      const v = latestRecord?.temperature ?? latestRecord?.temp ?? latestRecord?.value ?? null;
      const n = v == null ? NaN : Number(v);
      return Number.isFinite(n) ? n : NaN;
    } catch (e) {
      return NaN;
    }
  })();
  const latestWindValue = (() => {
    try {
      // prefer wind_kph, fall back to wind (could be kph) or wind_mps (convert to kph)
      const raw = latestRecord?.wind_kph ?? latestRecord?.wind ?? latestRecord?.wind_mps ?? null;
      if (raw == null) return NaN;
      const num = Number(raw);
      if (Number.isFinite(num)) {
        // if we fell back to m/s (wind_mps), ensure we convert; heuristic: small numbers likely m/s
        if (latestRecord?.wind_mps && latestRecord?.wind_kph == null) {
          return Number((Number(latestRecord.wind_mps) * 3.6).toFixed(1));
        }
        return Number(num);
      }
      return NaN;
    } catch (e) {
      return NaN;
    }
  })();
  const latestTempPercent = Number.isFinite(latestTempValue) ? Math.max(0, Math.min(1, (latestTempValue + 10) / 60)) : 0.5; // map -10..50 to 0..1
  const gaugeAngle = Number.isFinite(latestTempPercent) ? (-120 + latestTempPercent * 240) : -120; // -120..120 degrees

  // traduz condições em inglês para português para exibição
  const conditionTranslations: Record<string, string> = {
    'sunny': 'Ensolarado',
    'clear': 'Limpo',
    'partly cloudy': 'Parcialmente nublado',
    'cloudy': 'Nublado',
    'overcast': 'Céu encoberto',
    'mist': 'Neblina',
    'fog': 'Nevoeiro',
    'patchy rain possible': 'Possibilidade de chuva',
    'light rain': 'Chuva leve',
    'moderate rain': 'Chuva moderada',
    'heavy rain': 'Chuva forte',
    'thunderstorm': 'Trovoadas',
    'thundery': 'Trovoadas',
    'light drizzle': 'Chuvisco leve',
    'drizzle': 'Chuvisco',
    'showers': 'Aguaceiros',
    'patchy light rain': 'Chuva fraca intermitente',
    'patchy snow possible': 'Possibilidade de neve',
    'snow': 'Neve',
    'sleet': 'Granizo',
    'windy': 'Vento',
    'blizzard': 'Nevasca',
    'freezing rain': 'Chuva congelante',
    'partly sunny': 'Parcialmente ensolarado',
  };

  function formatCondition(input: any) {
    if (input == null) return '—';
    let text = '';

    // if caller passed the whole weather record, try common fields
    if (typeof input === 'object' && !Array.isArray(input)) {
      const rec: any = input;
      if (rec.condition) {
        if (typeof rec.condition === 'string') text = rec.condition;
        else if (rec.condition?.text) text = rec.condition.text;
        else if (rec.condition?.description) text = rec.condition.description;
        else text = String(rec.condition);
      } else if (rec.weather && Array.isArray(rec.weather) && rec.weather[0]) {
        text = rec.weather[0].description ?? rec.weather[0].main ?? JSON.stringify(rec.weather[0]);
      } else if (rec.description) {
        text = rec.description;
      } else if (rec.main) {
        text = rec.main;
      } else if (rec.text) {
        text = rec.text;
      } else {
        // fallback: try to stringify a likely field
        text = String(rec.condition ?? rec.description ?? rec.weather ?? rec);
      }
    } else if (Array.isArray(input)) {
      const first = input[0];
      if (first) text = first.description ?? first.main ?? String(first);
      else text = '—';
    } else {
      // primitive (string/number)
      text = String(input);
    }

    const norm = (text || '').toLowerCase().trim();
    // try exact or contains match using the translation map
    if (conditionTranslations[norm]) return conditionTranslations[norm];
    for (const key of Object.keys(conditionTranslations)) {
      if (norm.includes(key)) return conditionTranslations[key];
    }

    // fallback: capitalize first letter
    if (!text) return '—';
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  // format location for display: prefer human-friendly name fields, otherwise coordinates
  function formatLocation(input: any) {
    if (input == null) return '—';
    try {
      if (typeof input === 'object' && !Array.isArray(input)) {
        const rec: any = input;
        const name = rec.locationName ?? rec.location ?? rec.city ?? rec.name ?? rec.station ?? null;
        if (name) return String(name);
        if (rec.lat != null && rec.lon != null) return `${rec.lat},${rec.lon}`;
        if (rec.latitude != null && rec.longitude != null) return `${rec.latitude},${rec.longitude}`;
        if (rec.coord && Array.isArray(rec.coord) && rec.coord.length >= 2) return `${rec.coord[0]},${rec.coord[1]}`;
        return '—';
      }
      if (Array.isArray(input)) {
        const first = input[0];
        if (!first) return '—';
        return formatLocation(first);
      }
      return String(input);
    } catch (e) {
      return '—';
    }
  }

  // Debug: log derived data when they change (temporary)
  // removed debug logs: data is now updated silently

  // handlers for filter controls
  const applyFilter = () => {
    // filteredWeather is derived via useMemo — updating fromDate/toDate already does it
  };
  const resetFilter = () => { setFromDate(''); setToDate(''); };

  const handleUseLocation = async () => {
    setLocLoading(true);
    // hide banner when user explicitly triggers a new attempt
    setShowLocationBanner(false);
    try {
      // Prefer asking for permission status first so we can inform the user
      const supportsPermissions = typeof navigator !== 'undefined' && (navigator as any).permissions;
      if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
        try {
              if (supportsPermissions) {
            try {
              const status = await (navigator as any).permissions.query({ name: 'geolocation' });
              if (status.state === 'denied') {
                // User has previously denied: inform and fall back
                toast.push('Permissão de localização negada no navegador. Usando localização por IP como fallback. Para usar sua localização, habilite a permissão nas configurações do site.', 'warning');
                // show banner so user can re-enable permission manually
                setShowLocationBanner(true);
                await weatherApi.fetchExternal();
                setLocLoading(false);
                setLoadingWeather(true);
                const r2 = await weatherApi.getList(1, 50);
                const sorted2 = (r2 || []).slice().sort((a: any, b: any) => {
                  try { return (b?.createdAt ? new Date(b.createdAt).getTime() : 0) - (a?.createdAt ? new Date(a.createdAt).getTime() : 0); } catch { return 0; }
                });
                setWeather(sorted2);
                computeSummary(sorted2);
                return;
              }
              // if state is 'prompt' or 'granted' we'll proceed to request
            } catch (permErr) {
              // ignore permission query errors and continue to getCurrentPosition
              console.warn('permissions.query failed', permErr);
            }
          }

          const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
            const timer = setTimeout(() => reject(new Error('geolocation timeout')), 10000);
            navigator.geolocation.getCurrentPosition(
              (p) => { clearTimeout(timer); resolve(p); },
              (err) => { clearTimeout(timer); reject(err); },
              { enableHighAccuracy: false, maximumAge: 600000, timeout: 10000 }
            );
          });
          const lat = String(pos.coords.latitude);
          const lon = String(pos.coords.longitude);
          await weatherApi.fetchExternal(lat, lon);
        } catch (geoErr) {
          console.warn('Geolocation failed or permission denied:', geoErr);
          // Inform user and fall back to IP-based fetch
          toast.push('Não foi possível obter sua localização (permissão negada ou timeout). Usando localização por IP como fallback.', 'warning');
          // show banner so user can try again
          setShowLocationBanner(true);
          await weatherApi.fetchExternal();
        }
      } else {
        // geolocation not available in this environment
        console.warn('Geolocation API not available in this browser/environment');
        await weatherApi.fetchExternal();
      }
      // refresh list
      setLoadingWeather(true);
      const r = await weatherApi.getList(1, 50);
      const sortedR = (r || []).slice().sort((a: any, b: any) => {
        try { return (b?.createdAt ? new Date(b.createdAt).getTime() : 0) - (a?.createdAt ? new Date(a.createdAt).getTime() : 0); } catch { return 0; }
      });
      setWeather(sortedR);
      computeSummary(sortedR);
      // successful fetch - hide banner
      setShowLocationBanner(false);
    } catch (err) {
      console.error('handleUseLocation error', err);
      try {
        // final fallback
        await weatherApi.fetchExternal();
        const r2 = await weatherApi.getList(1, 50);
        const sorted2 = (r2 || []).slice().sort((a: any, b: any) => {
          try { return (b?.createdAt ? new Date(b.createdAt).getTime() : 0) - (a?.createdAt ? new Date(a.createdAt).getTime() : 0); } catch { return 0; }
        });
        setWeather(sorted2);
        computeSummary(sorted2);
        // signal banner so user can retry manually
        setShowLocationBanner(true);
      } catch (e) {
        console.error('fallback fetchExternal failed', e);
      }
    } finally {
      setLocLoading(false);
      setLoadingWeather(false);
    }
  };

  // try to request geolocation permission once on initial mount so the browser
  // can prompt the user for location access automatically when they open the app.
  const [autoLocTried, setAutoLocTried] = useState<boolean>(false);
  const [showLocationBanner, setShowLocationBanner] = useState<boolean>(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (autoLocTried) return;
    setAutoLocTried(true);
    // call but don't block render; any errors are handled inside handleUseLocation
    try {
      void handleUseLocation();
    } catch (e) {
      // swallow — handleUseLocation already logs/handles errors
      console.warn('auto location request failed', e);
    }
  }, []);

  return (
    <ErrorBoundary>
    <div className="dashboard-page">
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div className="dashboard-title">SunMap Painel</div>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <button
              aria-label="Abrir menu"
              title="Menu"
              onClick={() => setSidebarOpen(true)}
              className="logout-btn"
              style={{padding:'8px 10px', borderRadius:10}}
            >
              ☰
            </button>
          </div>
        </div>

        {/* Location permission banner (appears when geolocation failed/denied) */}
        {showLocationBanner && (
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,background:'linear-gradient(90deg, rgba(255,99,71,0.06), rgba(59,130,246,0.04))',padding:12,borderRadius:8,marginBottom:12}}>
            <div style={{display:'flex',flexDirection:'column'}}>
              <div style={{fontWeight:600}}>Permissão de localização necessária</div>
              <div style={{color:'var(--muted)',fontSize:'0.9rem'}}>A aplicação não conseguiu obter sua localização. Permita acesso à localização para ver dados locais do clima.</div>
            </div>
            <div style={{display:'flex',gap:8}}>
              <button className="filter-btn" onClick={() => handleUseLocation()} disabled={locLoading} style={{padding:'6px 10px'}}>{locLoading ? 'Buscando...' : 'Tentar novamente'}</button>
              <button className="filter-btn-reset" onClick={() => setShowLocationBanner(false)} style={{padding:'6px 10px'}}>Ignorar</button>
            </div>
          </div>
        )}

        {/* KPI Row - totals and summary */}
        <div style={{display:'flex',flexDirection:'column',gap:12,marginBottom:12}}>
          <div style={{display:'flex',justifyContent:'flex-end',gap:8}}>
            <div style={{display:'flex',gap:6,alignItems:'center'}}>
              <label style={{color:'var(--muted)',fontSize:'0.85rem'}}>Início</label>
              <input className="filter-input" type="date" value={fromDate} onChange={(e)=>setFromDate(e.target.value)} />
              <label style={{color:'var(--muted)',fontSize:'0.85rem'}}>Fim</label>
              <input className="filter-input" type="date" value={toDate} onChange={(e)=>setToDate(e.target.value)} />
              <button className="filter-btn" onClick={applyFilter} style={{marginLeft:6}}>Aplicar</button>
              <button className="filter-btn-reset" onClick={resetFilter} style={{marginLeft:6}}>Reset</button>
              <button className="filter-btn" onClick={handleUseLocation} disabled={locLoading} style={{marginLeft:6}}>{locLoading ? 'Buscando...' : 'Atualização'}</button>
            </div>
          </div>

          <div style={{display:'flex',gap:12,alignItems:'stretch'}}>
          <div className="panel-card" style={{flex:'1 1 0'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div>
                <div style={{fontSize:'0.85rem',color:'var(--muted)'}}>{currentUserName}</div>
              </div>
            </div>
            <div style={{marginTop:12}}>
              {currentUserName ? (
                <div style={{marginTop:8, display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <div>{currentUserName}</div>
                </div>
              ) : (
                <div style={{color:'var(--muted)'}}>Nenhum usuário</div>
              )}
            </div>
          </div>
          <div className="panel-card" style={{flex:'1 1 0'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div>
                <div style={{fontSize:'0.85rem',color:'var(--muted)'}}>Temperatura atual</div>
                <div style={{fontSize:'1.4rem',fontWeight:700}}>{latestRecord ? `${latestRecord.temperature ?? latestRecord.temp ?? latestRecord.value ?? '—'}°` : '—'}</div>
              </div>
              <div style={{fontSize:'0.85rem',color:'rgba(255,255,255,0.6)'}}>Agora</div>
            </div>
            <div style={{marginTop:10,color:'var(--muted)',fontSize:'0.85rem'}}>
              <div>Média (últimas 6h): {summary?.average?.temperature != null ? `${Number(summary.average.temperature).toFixed(1)}°` : '—'}</div>
              <div>Registros: {summary?.count != null ? summary.count : '—'}</div>
            </div>
          </div>
          <div className="panel-card" style={{flex:'1 1 0'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div>
                <div style={{fontSize:'0.85rem',color:'var(--muted)'}}>Umidade</div>
                <div style={{fontSize:'1.4rem',fontWeight:700}}>{latestRecord ? `${latestRecord.humidity ?? '—'}%` : '—'}</div>
              </div>
              <div style={{fontSize:'0.85rem',color:'rgba(255,255,255,0.6)'}}>Agora</div>
            </div>
            <div style={{marginTop:10,color:'var(--muted)',fontSize:'0.85rem'}}>
              <div>Média (últimas 6h): {summary?.average?.humidity != null ? `${Number(summary.average.humidity).toFixed(0)}%` : '—'}</div>
            </div>
          </div>
          <div className="panel-card" style={{flex:'1 1 0'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div>
                <div style={{fontSize:'0.85rem',color:'var(--muted)'}}>Vento</div>
                <div style={{fontSize:'1.4rem',fontWeight:700}}>{latestRecord ? (Number.isFinite(latestWindValue) ? `${latestWindValue.toFixed(1)} km/h` : (latestRecord?.wind_kph || latestRecord?.wind || latestRecord?.wind_mps ? `${latestRecord.wind_kph ?? latestRecord.wind ?? latestRecord.wind_mps} km/h` : '—')) : '—'}</div>
              </div>
              <div style={{fontSize:'0.85rem',color:'rgba(255,255,255,0.6)'}}>Agora</div>
            </div>
            <div style={{marginTop:10,color:'var(--muted)',fontSize:'0.85rem'}}>
              <div>Média (últimas 6h): {summary?.average?.wind_kph != null ? `${Number(summary.average.wind_kph).toFixed(1)} km/h` : '—'}</div>
            </div>
          </div>
          <div className="panel-card" style={{flex:'1 1 0'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div>
                <div style={{fontSize:'0.85rem',color:'var(--muted)'}}>Condição</div>
                <div style={{fontSize:'1.4rem',fontWeight:700}}>{formatCondition(latestRecord)}</div>
              </div>
              <div style={{fontSize:'0.85rem',color:'rgba(255,255,255,0.6)'}}>Agora</div>
            </div>
            <div style={{marginTop:10,color:'var(--muted)',fontSize:'0.85rem'}}>
              <div>{latestRecord ? formatLocation(latestRecord) : '—'}</div>
              <div style={{marginTop:6}}>{latestRecord?.createdAt ? `Última: ${new Date(latestRecord.createdAt).toLocaleString()}` : ''}</div>
            </div>
          </div>
          </div>
        </div>

        <div className="dashboard-grid">
          {/* Sidebar moved to hamburger menu (drawer). Keep main content full width */}
          {sidebarOpen && (
            <>
              <div className="drawer-overlay" onClick={() => setSidebarOpen(false)} />
              <div className="sidebar-drawer" role="dialog" aria-label="Menu lateral">
                <Sidebar />
              </div>
            </>
          )}

          <main>
            <div className="main-panels">
                <div className="panel-card">
                  <h3>Últimos registros de clima</h3>
                  <div style={{marginTop:12}}>
                    <div style={{height:180}}>
                      {/* line chart using real data */}
                      {(loadingWeather || chartError) ? (
                        <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100%'}}>Carregando...</div>
                      ) : (
                        <DynamicChart type="line" data={lineChartData} />
                      )}
                    </div>
                    <div style={{marginTop:8, color:'var(--muted)'}}>
                      {weather.length > 0 ? (
                        <div>
                          Exibindo {displayedWeather.length} de {weather.length} registros — {displayedWeather.slice(0,3).map((w) => (<span key={w._id} style={{marginRight:8}}>{(w.temperature ?? w.temp ?? w.value ?? '—') + '°' }</span>))}
                          {!fromDate && !toDate && weather.length > displayedWeather.length && (
                            <div style={{fontSize:'0.8rem',opacity:0.85,marginTop:6}}>Mostrando os últimos 5 registros. Aplique um filtro para ver mais.</div>
                          )}
                        </div>
                      ) : (
                        <div>Nenhum registro de clima</div>
                      )}
                    </div>
                  </div>
                  </div>
                  <div className="panel-card">
                  <h3>Temperatura Média</h3>
                  <div style={{display:'flex',justifyContent:'flex-end'}} className="filter-controls">
                    {/* export buttons moved to table header (kept here as empty container for layout consistency) */}
                  </div>
                <div style={{marginTop:12}}>
                  {/* velocímetro (gauge) exibindo a última temperatura */}
                  <div style={{display:'flex',justifyContent:'center',alignItems:'center',flexDirection:'column',gap:8}}>
                    <svg width="220" height="140" viewBox="0 0 220 140" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                      <defs>
                        <linearGradient id="gaugeGrad" x1="0" x2="1" y1="0" y2="0">
                          <stop offset="0%" stopColor="#2e50f9" />
                          <stop offset="50%" stopColor="#ff9f40" />
                          <stop offset="100%" stopColor="#ef4444" />
                        </linearGradient>
                      </defs>
                      {/* background arc */}
                      <path d="M30 100 A80 80 0 0 1 190 100" stroke="rgba(255,255,255,0.06)" strokeWidth="18" fill="none" strokeLinecap="round" />
                      {/* colored arc overlay (same path, narrower) */}
                      <path d="M30 100 A80 80 0 0 1 190 100" stroke="url(#gaugeGrad)" strokeWidth="12" fill="none" strokeLinecap="round" strokeOpacity="0.95" />
                      {/* ticks */}
                      {[...Array(13)].map((_, i) => {
                        const t = -120 + (i / 12) * 240; // angle
                        const cx = 110;
                        const cy = 100;
                        const r1 = 72;
                        const r2 = 80;
                        const rad = (t * Math.PI) / 180;
                        const x1 = cx + r1 * Math.cos(rad);
                        const y1 = cy + r1 * Math.sin(rad);
                        const x2 = cx + r2 * Math.cos(rad);
                        const y2 = cy + r2 * Math.sin(rad);
                        return (<line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(255,255,255,0.12)" strokeWidth={i % 3 === 0 ? 2 : 1} strokeLinecap="round" />);
                      })}
                      {/* needle */}
                      <g transform={`rotate(${gaugeAngle} 110 100)`}> 
                        {/* Outline / shadow: draw a slightly thicker, darker stroke behind the needle */}
                        <line x1="110" y1="100" x2="110" y2="46" stroke="#0af1f5" strokeOpacity="0.78" strokeWidth="6" strokeLinecap="round" />
                        {/* Base stroke: make needle visible on dark backgrounds */}
                        <line x1="110" y1="100" x2="110" y2="46" stroke="rgba(255,255,255,0.95)" strokeWidth="3" strokeLinecap="round" />
                        {/* Gradient overlay for colored needle effect */}
                        <line x1="110" y1="100" x2="110" y2="36" stroke="url(#gaugeGrad)" strokeWidth="2" strokeLinecap="round" />
                      </g>
                      {/* center cap */}
                      <circle cx="110" cy="100" r="8" fill="#494d52" stroke="#0af1f5" strokeOpacity="0.78" />
                    </svg>
                    <div style={{fontSize:'1.2rem',fontWeight:700}}>{Number.isFinite(latestTempValue) ? `${latestTempValue}°C` : '—'}</div>
                    <div style={{fontSize:'0.85rem',color:'var(--muted)'}}>Última</div>
                  </div>
                </div>
                {/* users moved to the small Users card above */}
              </div>

                {/* AI Insights based on recent records */}
                <AIInsights records={tableRecords} />



                <div className={"panel-card table-card"} onClick={() => setTableExpanded(v => !v)} role="button" tabIndex={0} style={{flexBasis: '100%', width: '100%'}}>
                  <h3 style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <span>Registros Climáticos</span>
                    <div style={{display:'flex',gap:8,alignItems:'center'}}>
                      <button
                        className="export-btn"
                        onClick={async (e) => { e.stopPropagation(); try {
                          const from = fromDate || '';
                          const to = toDate || '';
                          const res = await weatherApi.exportCsv(from, to);
                          const blob = res.data instanceof Blob ? res.data : new Blob([res.data], { type: 'text/csv' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `weather_export_${from || 'all'}_${to || 'all'}.csv`;
                          document.body.appendChild(a);
                          a.click();
                          a.remove();
                          URL.revokeObjectURL(url);
                        } catch (err) {
                          console.error('Erro ao exportar CSV', err);
                          toast.push('Erro ao exportar CSV', 'error');
                        }}}
                      >
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M12 3v10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/><path d="M8 11l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/><rect x="3" y="17" width="18" height="4" rx="1" stroke="currentColor" strokeWidth="1.2"/></svg>
                        <span>CSV</span>
                      </button>
                      <button
                        className="export-btn"
                        onClick={async (e) => { e.stopPropagation(); try {
                          const from = fromDate || '';
                          const to = toDate || '';
                          const res = await weatherApi.exportXlsx(from, to);
                          const blob = res.data instanceof Blob ? res.data : new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `weather_export_${from || 'all'}_${to || 'all'}.xlsx`;
                          document.body.appendChild(a);
                          a.click();
                          a.remove();
                          URL.revokeObjectURL(url);
                          toast.push('Exportação XLSX iniciada', 'success');
                        } catch (err) {
                          console.error('Erro ao exportar XLSX', err);
                          toast.push('Erro ao exportar XLSX', 'error');
                        }}}
                      >
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.2"/><path d="M7 8h10M7 12h10M7 16h6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        <span>XLSX</span>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setTableExpanded(v => !v); }}
                        className="filter-btn"
                        style={{padding:'6px 8px', fontSize:'0.85rem'}}
                      >{tableExpanded ? 'Mostrar 5' : 'Mostrar 20'}</button>
                    </div>
                  </h3>
                  <div style={{marginTop:8, overflowX:'auto'}}>
                    <table style={{width:'100%',borderCollapse:'collapse'}}>
                      <thead>
                        <tr style={{textAlign:'left',borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
                          <th style={{padding:'6px 8px'}}>Data/Hora</th>
                          <th style={{padding:'6px 8px'}}>Local</th>
                          <th style={{padding:'6px 8px'}}>Condição</th>
                          <th style={{padding:'6px 8px'}}>Temperatura</th>
                          <th style={{padding:'6px 8px'}}>Umidade</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tableRecords.map((r) => (
                          <tr key={r._id} style={{borderBottom:'1px solid rgba(255,255,255,0.03)'}}>
                            <td style={{padding:'8px'}}>{r.createdAt ? new Date(r.createdAt).toLocaleString() : '-'}</td>
                            <td style={{padding:'8px'}}>{formatLocation(r)}</td>
                            <td style={{padding:'8px'}}>{formatCondition(r.condition)}</td>
                            <td style={{padding:'8px'}}>{r.temperature ?? r.temp ?? '—'}°</td>
                            <td style={{padding:'8px'}}>{r.humidity ?? '—'}%</td>
                          </tr>
                        ))}
                        {tableRecords.length === 0 && (
                          <tr><td colSpan={5} style={{padding:12,color:'var(--muted)'}}>Nenhum registro para exibir</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                
            </div>
          </main>
        </div>
      </div>
    </div>
    </ErrorBoundary>
  );
}

import { Controller, Get, Query, Post, Body, BadRequestException, Res } from '@nestjs/common';
import { WeatherService } from './weather.service';
import axios from 'axios';
import ExcelJS from 'exceljs';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

@Controller('weather')
export class WeatherController {
  constructor(private readonly weatherService: WeatherService) {}

  @Get()
  async getAll() {
    return this.weatherService.findAll();
  }

  @Post('logs')
  async create(@Body() body: any) {
    try {
      const payload = { ...(body || {}) };
      try {
        if (payload.timestamp) {
          const ts = Number(payload.timestamp);
          if (!Number.isNaN(ts)) {
            const ms = ts > 1e12 ? ts : ts * 1000;
            const diff = Date.now() - ms;
            const FIVE_MIN = 5 * 60 * 1000;
            if (diff >= 0 && diff <= FIVE_MIN) {
              payload.originTimestamp = new Date(ms).toISOString();
            }
          }
        }
      } catch (e) {
        // ignore
      }
      if (payload.createdAt) delete payload.createdAt;
      if (payload.timestamp) delete payload.timestamp;
      return this.weatherService.create(payload);
    } catch (err) {
      throw new BadRequestException('Invalid payload');
    }
  }

  @Get('summary')
  async summary(@Query('hours') hours: number) {
    const h = Number(hours) || 6;
    const all = await this.weatherService.findAll();
    const cutoff = new Date(Date.now() - h * 3600 * 1000);
    const recent = (all || []).filter((r: any) => {
      try {
        return r && r.createdAt && new Date(r.createdAt) >= cutoff;
      } catch {
        return false;
      }
    });
    const latest = recent
      .slice()
      .sort((a: any, b: any) => {
        try {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        } catch {
          return 0;
        }
      })[0] || null;
    const temps = recent.map((r: any) => Number(r.temperature ?? r.temp ?? r.value ?? NaN)).filter((n: any) => Number.isFinite(n));
    const hums = recent.map((r: any) => Number(r.humidity ?? NaN)).filter((n: any) => Number.isFinite(n));
    const winds = recent.map((r: any) => Number(r.wind_kph ?? r.wind ?? NaN)).filter((n: any) => Number.isFinite(n));
    const avgTemp = temps.length ? temps.reduce((s: number, v: number) => s + v, 0) / temps.length : null;
    const avgHum = hums.length ? hums.reduce((s: number, v: number) => s + v, 0) / hums.length : null;
    const avgWind = winds.length ? winds.reduce((s: number, v: number) => s + v, 0) / winds.length : null;
    return { latest, average: { temperature: avgTemp, humidity: avgHum, wind_kph: avgWind }, count: recent.length };
  }

  // Use OpenWeatherMap to fetch a single record by lat/lon and persist it.
  @Get('fetch')
  async fetch(@Query('lat') lat?: string, @Query('lon') lon?: string) {
    try {
      const key = process.env.OPENWEATHER_API_KEY || process.env.OWM_API_KEY || null;
      if (!key) {
        return { ok: false, message: 'OPENWEATHER_API_KEY not configured on backend' };
      }
      const qlat = (lat || '').toString();
      const qlon = (lon || '').toString();
      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${encodeURIComponent(qlat)}&lon=${encodeURIComponent(qlon)}&appid=${encodeURIComponent(key)}&units=metric&lang=pt`;
      const resp = await axios.get(url, { timeout: 8000 });
      const d = resp && resp.data ? resp.data : null;
      if (!d) return { ok: false, message: 'no data from OpenWeatherMap' };
      const payload: any = {
        location: d.name || `${qlat},${qlon}`,
        locationName: d.name || null,
        lat: qlat || undefined,
        lon: qlon || undefined,
        temperature: d.main?.temp ?? null,
        humidity: d.main?.humidity ?? null,
        wind_kph: d.wind && typeof d.wind.speed === 'number' ? Number((d.wind.speed * 3.6).toFixed(2)) : null,
        condition: Array.isArray(d.weather) && d.weather[0] ? d.weather[0].description : null,
        raw: d,
        timestamp: d.dt ? d.dt : undefined,
      };
      const saved = await this.weatherService.create(payload);
      return { ok: true, data: saved };
    } catch (e: any) {
      return { ok: false, message: 'fetch failed', error: e?.message ?? String(e) };
    }
  }

  @Get('export')
  async exportCsv(@Res() res: any, @Query('from') from?: string, @Query('to') to?: string) {
    try {
      const all = await this.weatherService.findAll();
      let list = Array.isArray(all) ? all.slice() : [];
      // apply optional date filter (inclusive)
      if (from) {
        const fromD = new Date(from);
        if (!isNaN(fromD.getTime())) list = list.filter((r: any) => r.createdAt && new Date(r.createdAt) >= fromD);
      }
      if (to) {
        const toD = new Date(to);
        if (!isNaN(toD.getTime())) {
          toD.setHours(23,59,59,999);
          list = list.filter((r: any) => r.createdAt && new Date(r.createdAt) <= toD);
        }
      }
      // build CSV
      const headers = ['createdAt','locationName','lat','lon','temperature','humidity','wind_kph','condition'];
      const rows = [headers.join(',')];
      for (const r of list) {
        const vals = [
          r.createdAt ? new Date(r.createdAt).toISOString() : '',
          r.locationName ?? r.location ?? '',
          r.lat ?? r.latitude ?? '',
          r.lon ?? r.longitude ?? '',
          r.temperature ?? r.temp ?? '',
          r.humidity ?? '',
          r.wind_kph ?? r.wind ?? '',
          // quote condition to avoid CSV breakage
          (typeof r.condition === 'string' ? `"${String(r.condition).replace(/"/g,'""')}"` : (r.condition ? `"${String(r.condition)}"` : '')),
        ];
        rows.push(vals.join(','));
      }
      const csv = rows.join('\n');
      const fname = `weather_export_${from || 'all'}_${to || 'all'}.csv`;
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${fname}"`);
      return res.send(csv);
    } catch (e) {
      return { ok: false, message: 'export failed', error: e?.message ?? String(e) };
    }
  }

  @Get('export-xlsx')
  async exportXlsx(@Res() res: any, @Query('from') from?: string, @Query('to') to?: string) {
    try {
      // simple request log for debugging
      // eslint-disable-next-line no-console
      console.log('/weather/export-xlsx called with', { from, to });
      const all = await this.weatherService.findAll();
      let list = Array.isArray(all) ? all.slice() : [];
      if (from) {
        const fromD = new Date(from);
        if (!isNaN(fromD.getTime())) list = list.filter((r: any) => r.createdAt && new Date(r.createdAt) >= fromD);
      }
      if (to) {
        const toD = new Date(to);
        if (!isNaN(toD.getTime())) {
          toD.setHours(23,59,59,999);
          list = list.filter((r: any) => r.createdAt && new Date(r.createdAt) <= toD);
        }
      }
      // Build a real XLSX file using exceljs
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Weather');
      const headers = ['createdAt','locationName','lat','lon','temperature','humidity','wind_kph','condition'];
      sheet.addRow(headers);
      for (const r of list) {
        const row = [
          r.createdAt ? new Date(r.createdAt).toISOString() : '',
          r.locationName ?? r.location ?? '',
          r.lat ?? r.latitude ?? '',
          r.lon ?? r.longitude ?? '',
          r.temperature ?? r.temp ?? '',
          r.humidity ?? '',
          r.wind_kph ?? r.wind ?? '',
          typeof r.condition === 'string' ? r.condition : (r.condition ? String(r.condition) : ''),
        ];
        sheet.addRow(row);
      }
      // auto width for columns
      sheet.columns.forEach((col) => {
        let maxLen = 10;
        col.eachCell({ includeEmpty: true }, (cell) => {
          const v = cell.value ? String(cell.value) : '';
          if (v.length > maxLen) maxLen = v.length;
        });
        col.width = Math.min(Math.max(maxLen + 2, 10), 60);
      });
      const fname = `weather_export_${from || 'all'}_${to || 'all'}.xlsx`;
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=\"${fname}\"`);
      // write XLSX to a temp file then stream it to avoid stream issues
      const tmpDir = os.tmpdir();
      const tmpPath = path.join(tmpDir, `weather_export_${Date.now()}.xlsx`);
      // debugging: log before writing and after
      // eslint-disable-next-line no-console
      console.log('writing xlsx to tmpPath', tmpPath);
      await workbook.xlsx.writeFile(tmpPath);
      // eslint-disable-next-line no-console
      console.log('writeFile finished', tmpPath);
      const readStream = fs.createReadStream(tmpPath);
      readStream.on('error', (err) => {
        // eslint-disable-next-line no-console
        console.error('error streaming xlsx file', err);
        try { res.status(500).json({ ok: false, message: 'stream error' }); } catch {};
      });
      readStream.on('end', () => {
        // remove temp file
        fs.unlink(tmpPath, (err) => {
          if (err) {
            // eslint-disable-next-line no-console
            console.warn('failed to remove temp xlsx', tmpPath, err.message);
          }
        });
      });
      // pipe to response
      readStream.pipe(res);
      return;
    } catch (e) {
      return { ok: false, message: 'export failed', error: e?.message ?? String(e) };
    }
  }
}

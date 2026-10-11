const fs = require('fs');
let puppeteer;
(async () => {
  try {
    try {
      puppeteer = require('puppeteer-core');
    } catch (e) {
      // fallback to full puppeteer if puppeteer-core not installed
      puppeteer = require('puppeteer');
    }

    // try to locate a local Chrome/Edge binary (Windows common paths)
    const candidates = [];
    if (process.platform === 'win32') {
      const prog = process.env.PROGRAMFILES || 'C:\\Program Files';
      const progx86 = process.env['PROGRAMFILES(X86)'] || 'C:\\Program Files (x86)';
      const localApp = process.env.LOCALAPPDATA || (process.env.USERPROFILE ? `${process.env.USERPROFILE}\\AppData\\Local` : null);
      candidates.push(`${prog}\\Google\\Chrome\\Application\\chrome.exe`);
      candidates.push(`${progx86}\\Google\\Chrome\\Application\\chrome.exe`);
      if (localApp) candidates.push(`${localApp}\\Google\\Chrome\\Application\\chrome.exe`);
      candidates.push(`${prog}\\Microsoft\\Edge\\Application\\msedge.exe`);
      candidates.push(`${progx86}\\Microsoft\\Edge\\Application\\msedge.exe`);
      if (localApp) candidates.push(`${localApp}\\Microsoft\\Edge\\Application\\msedge.exe`);
    }

    let execPath = null;
    for (const c of candidates) {
      try {
        if (c && fs.existsSync(c)) { execPath = c; break; }
      } catch (e) { }
    }

    const launchOptions = { args: ['--no-sandbox', '--disable-setuid-sandbox'] };
    if (execPath) launchOptions.executablePath = execPath;

    const browser = await puppeteer.launch(launchOptions);
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(30000);
    const url = process.env.URL || 'http://localhost:5173/';
    await page.goto(url, { waitUntil: 'networkidle2' });
    // wait a bit for client JS to render the cards
    await page.waitForTimeout(1200);

    const result = await page.evaluate(() => {
      // find a card whose text contains "Vento" (case-insensitive)
      const cards = Array.from(document.querySelectorAll('.panel-card'));
      for (const card of cards) {
        const text = card.innerText || '';
        if (/vento/i.test(text)) {
          // try to find the big value element (fontWeight 700 or large font)
          // fallback: find first element that looks like a number with km/h
          const txt = card.innerText;
          const m = txt.match(/([0-9]{1,3}(?:\.[0-9]+)?)\s*(km\/h|kph|m\/s)?/i);
          const wind = m ? (m[1] + (m[2] ? ' ' + m[2] : '')) : null;
          // try to find direction words like N, S, E, W or degree
          const dirMatch = txt.match(/(N|S|E|W|NE|NW|SE|SW|[0-9]{1,3}°|[0-9]{1,3}\s?degrees)/i);
          const direction = dirMatch ? dirMatch[0] : null;
          return { wind: wind || null, direction: direction || null, rawText: txt.substr(0, 800) };
        }
      }
      return { wind: null, direction: null, rawText: document.body.innerText.substr(0,800) };
    });

    console.log('DOM check result:');
    console.log(JSON.stringify(result, null, 2));
    await browser.close();
    process.exit(0);
  } catch (e) {
    console.error('Headless check failed:', e && e.message ? e.message : e);
    process.exit(2);
  }
})();

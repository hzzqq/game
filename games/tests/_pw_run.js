// Headless driver for games/tests/runner.html
// Serves /d/project/play over HTTP, opens runner.html in chromium,
// clicks "运行全部测试", waits for all cards to finish, then scrapes
// window.RESULTS + card badges and writes a JSON report of failures.
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = 'D:/project/play';
const PORT = 8731;
const MIME = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.json':'application/json', '.png':'image/png', '.svg':'image/svg+xml' };

function startServer(){
  return new Promise(res=>{
    const server = http.createServer((req,rsp)=>{
      let p = decodeURIComponent(req.url.split('?')[0]);
      if(p === '/') p = '/index.html';
      const fp = path.resolve(ROOT, '.' + p);
      const rootRes = path.resolve(ROOT);
      if(!fp.startsWith(rootRes) || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()){
        rsp.writeHead(404); rsp.end('not found'); return;
      }
      rsp.writeHead(200, {'Content-Type': MIME[path.extname(fp)]||'application/octet-stream'});
      fs.createReadStream(fp).pipe(rsp);
    });
    server.listen(PORT, ()=>res(server));
  });
}

(async()=>{
  const server = await startServer();
  console.log('server up on', PORT);
  const browser = await chromium.launch({ args:['--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist',
    '--disable-background-timer-throttling','--disable-renderer-backgrounding','--disable-backgrounding-occluded-windows'] });
  const page = await browser.newPage();
  const pageErrors = [];
  page.on('pageerror', e=> pageErrors.push(String(e)));
  page.on('console', m=>{ if(m.type()==='error') pageErrors.push('CONSOLE_ERR: '+m.text()); });

  const url = `http://localhost:${PORT}/games/tests/runner.html`;
  await page.goto(url, { waitUntil:'load', timeout: 60000 });
  // wait for TESTS to be defined
  await page.waitForFunction(()=>typeof TESTS!=='undefined' && TESTS.length>0, null, { timeout: 60000 });
  const total = await page.evaluate(()=>TESTS.length);
  console.log('TESTS registered:', total);

  await page.click('#runAll');

  // wait until runAll button re-enabled AND no card is in 'wait' state
  await page.waitForFunction(()=>{
    const btn = document.getElementById('runAll');
    if(!btn || btn.disabled) return false;
    const waiting = document.querySelectorAll('#grid .badge.wait').length;
    return waiting === 0;
  }, null, { timeout: 600000 });

  // give a small settle
  await page.waitForTimeout(500);

  const report = await page.evaluate(()=>{
    const cards = Array.from(document.querySelectorAll('#grid .card'));
    const out = [];
    for(const c of cards){
      const name = (c.querySelector('h3')||{}).textContent || '';
      const badge = c.querySelector('.badge');
      const badgeText = badge ? badge.textContent : '';
      const failed = (typeof RESULTS!=='undefined' && RESULTS[name]) ? RESULTS[name].failed : undefined;
      const errors = (typeof RESULTS!=='undefined' && RESULTS[name]) ? RESULTS[name].errors : undefined;
      const log = c.querySelector('.log') ? c.querySelector('.log').innerText : '';
      out.push({ name, badgeText, failed, errors, logTail: log.slice(-800) });
    }
    return out;
  });

  const fails = report.filter(r=> (r.failed && r.failed>0) || (r.errors && r.errors.length>0) || /失败|❌|FATAL/.test(r.badgeText));
  console.log('\n===== SUMMARY =====');
  console.log('total cards:', report.length);
  console.log('fail count:', fails.length);

  const summary = { total: report.length, failCount: fails.length, fails: fails.map(f=>({name:f.name, failed:f.failed, errors:f.errors, logTail:f.logTail})) };
  fs.writeFileSync('D:/project/play/games/tests/_pw_report.json', JSON.stringify(summary, null, 2));
  console.log('wrote _pw_report.json');

  // print compact failure list
  for(const f of fails){
    console.log('FAIL:', f.name, '| failed=', f.failed, '| errors=', JSON.stringify(f.errors));
  }
  if(pageErrors.length){
    console.log('\n--- page/console errors (first 20) ---');
    console.log(pageErrors.slice(0,20).join('\n'));
  }

  await browser.close();
  server.close();
  process.exit(0);
})().catch(e=>{ console.error('HARNESS ERROR:', e); process.exit(1); });

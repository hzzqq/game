// Targeted fast runner for games/tests/runner.html
// Runs ONLY the game test suites whose names are passed on argv (or a default fail list).
// Repositions the hidden test iframe ON-SCREEN and disables rAF throttling so canvas
// games actually paint (mirrors a real, focused browser tab) — this lets us tell apart
// genuine game bugs from headless-offscreen artifacts.
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = 'D:/project/play';
const PORT = 8732;
const MIME = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.json':'application/json', '.png':'image/png', '.svg':'image/svg+xml' };

// default = the 12 fails from the full sweep
const DEFAULT_NAMES = [
  '坦克对战 Battle','飞机大战 Plane','数独 Sudoku','扫雷 Minesweeper','斗地主 Dou Dizhu',
  '造梦西游 Dream','保卫萝卜 Carrot','贪吃蛇 Snake','吃豆人 Pac-Man','五子棋 Gomoku',
  '泡泡堂 BubbleBob','TERMINAL // 尖塔 SPIRE'
];
const names = process.argv.slice(2).length ? process.argv.slice(2) : DEFAULT_NAMES;

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
  const browser = await chromium.launch({ args:[
    '--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist',
    '--disable-background-timer-throttling','--disable-renderer-backgrounding','--disable-backgrounding-occluded-windows'
  ]});
  const page = await browser.newPage({ viewport:{ width:900, height:700 } });
  const pageErrors = [];
  page.on('pageerror', e=> pageErrors.push(String(e)));

  const url = `http://localhost:${PORT}/games/tests/runner.html`;
  await page.goto(url, { waitUntil:'load', timeout: 60000 });
  await page.waitForFunction(()=>typeof TESTS!=='undefined' && TESTS.length>0, null, { timeout: 60000 });

  // Reposition any test iframe ON-SCREEN so rAF fires and canvas sizes correctly.
  await page.evaluate(()=>{
    const mo = new MutationObserver(muts=>{
      for(const m of muts){
        for(const n of m.addedNodes){
          if(n.tagName === 'IFRAME'){
            n.style.cssText = 'position:fixed;left:0;top:0;width:800px;height:600px;z-index:99999;opacity:0.02;pointer-events:none;display:block';
          }
        }
      }
    });
    mo.observe(document.body, { childList:true });
    window.__mo = mo;
  });

  // Run only the requested tests
  const result = await page.evaluate(async(names)=>{
    const picked = TESTS.filter(t=> names.includes(t.name));
    const found = picked.map(t=>t.name);
    for(const t of picked){ await runOne(t); }
    const out = {};
    for(const t of picked){ out[t.name] = RESULTS[t.name]; }
    return { found, results: out, missing: names.filter(n=>!found.includes(n)) };
  }, names);

  console.log('\n===== TARGETED RESULT =====');
  console.log('requested:', names.length, '| found:', result.found.length, '| missing:', JSON.stringify(result.missing));
  let pass=0, fail=0;
  for(const name of result.found){
    const r = result.results[name] || {};
    const ok = (r.failed===0 && (!r.errors || r.errors.length===0));
    if(ok){ pass++; console.log('  ✅', name); }
    else { fail++; console.log('  ❌', name, '|', JSON.stringify(r.errors)); }
  }
  console.log(`\nPASS ${pass} / FAIL ${fail}`);
  fs.writeFileSync('D:/project/play/games/tests/_pw_targeted.json', JSON.stringify(result, null, 2));
  if(pageErrors.length){ console.log('\n-- page errors --\n'+pageErrors.slice(0,15).join('\n')); }

  await browser.close();
  server.close();
  process.exit(0);
})().catch(e=>{ console.error('HARNESS ERROR:', e); process.exit(1); });

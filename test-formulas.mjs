// Прогон живой страницы в headless Chrome и сверка с эталонными числами таблицы
import { createRequire } from 'module'; import { fileURLToPath } from 'url';
// puppeteer-core берём из папки проекта (npm install), иначе из общей папки Каталиста на Маке Маши
let puppeteer;
try { puppeteer = createRequire(import.meta.url)('puppeteer-core'); }
catch { puppeteer = createRequire('/Users/maria/Desktop/Catalyst/x.js')('puppeteer-core'); }
import http from 'http'; import fs from 'fs'; import path from 'path';

const dir = path.dirname(fileURLToPath(import.meta.url));
const srv = http.createServer((req,res)=>{
  const p = path.join(dir, decodeURIComponent(req.url.split('?')[0]) === '/' ? 'index.html' : decodeURIComponent(req.url.split('?')[0]));
  if(!fs.existsSync(p)) { res.writeHead(404); return res.end('nf'); }
  const t = p.endsWith('.png') ? 'image/png' : p.endsWith('.json') ? 'application/json' : 'text/html; charset=utf-8';
  res.writeHead(200,{'content-type':t}); res.end(fs.readFileSync(p));
});
await new Promise(r=>srv.listen(8799, r));

const CH = [
  process.env.CHROME_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  'C:/Program Files/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CH) { console.error('Не найден Google Chrome: укажите путь в CHROME_PATH'); process.exit(1); }
const browser = await puppeteer.launch({executablePath: CH, headless: 'new', args:['--no-sandbox']});
const page = await browser.newPage();
await page.setViewport({width:1600, height:1000});

async function run(state){
  await page.goto('http://localhost:8799/', {waitUntil:'networkidle0'});
  await page.evaluate(s => { localStorage.setItem('kalk-mk-v1', JSON.stringify(s)); }, state);
  await page.goto('http://localhost:8799/', {waitUntil:'networkidle0'});
  await page.evaluate(() => {
    MK.push({n:'__T180__', c:[180,180,180]}, {n:'__T450__', c:[450,450,450]}, {n:'__T200__', c:[200,200,200]});
    ACTS.push({n:'__A3500__', h1:3500, hx:3500, per:0, note:'тест'});
    render();
  });
  return page.evaluate(() => ({
    client: document.getElementById('o-client').textContent,
    cost:   document.getElementById('o-cost').textContent,
    masters:document.getElementById('o-masters').textContent,
    parts:  document.getElementById('o-parts').textContent
  }));
}
const base = {guests:200,hours:2,fixMode:'each',rangeMode:'mk',base:3500,add:500,norm:20,fix:2000,margin:1.67,act:[]};
const N = s => s.replace(/ |\s/g,'').replace('₽','');

const cases = [
  { t:'Блок А (200 уч, 2 ч, 180 ₽/уч) → 5 мастеров, расход 58 000, клиенту 96 860',
    s:{...base, mode:'masters', mk:[{name:'__T180__', p:200, m:1, h:2}]},
    exp:{masters:'5', cost:'58000', client:'96860'} },
  { t:'Блок Б (1 мастер, 1 ч, 450 ₽/уч) → 20 участников, расход 14 500, клиенту 24 215',
    s:{...base, hours:1, mode:'parts', mk:[{name:'__T450__', p:1, m:1, h:1}]},
    exp:{parts:'20', cost:'14500', client:'24215'} },
  { t:'Блок В (70 уч, 1 мастер, 200 ₽/уч) → 4 ч, расход 21 000, клиенту 35 070',
    s:{...base, mode:'dur', mk:[{name:'__T200__', p:70, m:1, h:1}]},
    exp:{cost:'21000', client:'35070'} },
  { t:'Нестандартный (100 уч, 2 мастера, 1 ч, 200 ₽/уч) → расход 29 000, клиенту 48 430',
    s:{...base, mode:'manual', mk:[{name:'__T200__', p:100, m:2, h:1}]},
    exp:{cost:'29000', client:'48430'} },
  { t:'Активность (3 500 ₽/ч, 6 ч, 1 мастер) → расход 21 000, клиенту 35 070',
    s:{...base, mode:'masters', mk:[], act:[{name:'__A3500__', m:1, h:6}]},
    exp:{cost:'21000', client:'35070'} },
  { t:'Аэротату 1 мастер, 6 ч → 90 участников ориентировочно',
    s:{...base, mode:'masters', mk:[], act:[{name:'Аэротату', m:1, h:6}]},
    exp:{parts:'90'} }
];


let ok=0, fail=0;
for(const c of cases){
  const r = await run(c.s);
  const bad = Object.entries(c.exp).filter(([k,v]) => N(r[k]) !== v);
  if(bad.length){ fail++; console.log('FAIL ' + c.t + '\n   получено:', JSON.stringify(r), '\n   ждали:', JSON.stringify(c.exp)); }
  else { ok++; console.log('OK   ' + c.t); }
}
console.log(`\nИТОГ: ${ok}/${ok+fail}`);
await browser.close(); srv.close();
process.exit(fail ? 1 : 0);

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
    ACTS.push({n:'__A3500__', h1:3500, hx:3500, per:15, note:'тест'});
    render();
  });
  return page.evaluate(() => ({
    client: document.getElementById('o-client').textContent,
    cost:   document.getElementById('o-cost').textContent,
    masters:document.getElementById('o-masters').textContent,
    parts:  document.getElementById('o-parts').textContent,
    margin: document.getElementById('o-mpct').textContent,
    bad:    String(document.querySelector('.res').classList.contains('bad'))
  }));
}
const base = {guests:200,hours:2,fixMode:'each',rangeMode:'mk',base:3500,add:500,norm:20,fix:2000,margin:1.67,act:[]};
const N = s => s.replace(/ |\s/g,'').replace('₽','');

const cases = [
  { t:'200 уч, 2 ч, 180 ₽/уч → 5 мастеров, расход 58 000, клиенту 96 860, маржа 40,1%',
    s:{...base, mk:[{name:'__T180__', p:200}]},
    exp:{masters:'5', cost:'58000', client:'96860', margin:'40,1%', bad:'false'} },
  { t:'20 уч, 1 ч, 450 ₽/уч → 1 мастер, расход 14 500, клиенту 24 215',
    s:{...base, hours:1, mk:[{name:'__T450__', p:20}]},
    exp:{masters:'1', cost:'14500', client:'24215'} },
  { t:'70 уч, 4 ч, 200 ₽/уч → 1 мастер, расход 21 000, клиенту 35 070',
    s:{...base, hours:4, mk:[{name:'__T200__', p:70}]},
    exp:{masters:'1', cost:'21000', client:'35070'} },
  { t:'100 уч, 3 ч, 200 ₽/уч → 2 мастера, расход 31 000, клиенту 51 770',
    s:{...base, hours:3, mk:[{name:'__T200__', p:100}]},
    exp:{masters:'2', cost:'31000', client:'51770'} },
  { t:'50 уч, 2 ч, 200 ₽/уч, мастеров вручную 3 (авто дал бы 2) → расход 24 000, клиенту 40 080',
    s:{...base, mk:[{name:'__T200__', p:50, m:3}]},
    exp:{masters:'3', cost:'24000', client:'40080'} },
  { t:'Активность: 90 уч по норме 15/ч, 6 ч → 1 мастер, расход 21 000; по 400 ₽ → клиенту 36 000, маржа 41,7%',
    s:{...base, mk:[], act:[{name:'__A3500__', p:90, h:6, pp:400}]},
    exp:{masters:'1', cost:'21000', client:'36000', margin:'41,7%', bad:'false'} },
  { t:'Та же активность без своей цены → рекомендуемая 390 ₽ → клиенту 35 100, маржа 40,2%',
    s:{...base, mk:[], act:[{name:'__A3500__', p:90, h:6}]},
    exp:{client:'35100', margin:'40,2%', bad:'false'} },
  { t:'Та же активность по 250 ₽ → клиенту 22 500, маржа 6,7% — красный',
    s:{...base, mk:[], act:[{name:'__A3500__', p:90, h:6, pp:250}]},
    exp:{client:'22500', margin:'6,7%', bad:'true'} },
  { t:'Мастеров вручную 2 при 400 ₽ → расход 42 000 больше выручки 36 000, маржа -16,7% — красный',
    s:{...base, mk:[], act:[{name:'__A3500__', p:90, h:6, m:2, pp:400}]},
    exp:{masters:'2', cost:'42000', client:'36000', margin:'-16,7%', bad:'true'} },
  { t:'МК с маржой 40% + активность по 250 ₽ → общая маржа 33,8% — красный',
    s:{...base, mk:[{name:'__T180__', p:200}], act:[{name:'__A3500__', p:90, h:6, pp:250}]},
    exp:{cost:'79000', client:'119360', margin:'33,8%', bad:'true'} },
  { t:'Старый сохранённый расчёт: Аэротату 1 мастер, 6 ч → переносится в 90 участников, 1 мастер',
    s:{...base, mk:[], act:[{name:'Аэротату', m:1, h:6}]},
    exp:{parts:'90', masters:'1'} }
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

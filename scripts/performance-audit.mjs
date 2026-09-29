import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';
import fs from 'node:fs';
import path from 'node:path';
import desktopConfig from 'lighthouse/core/config/desktop-config.js';
const phase = process.argv[2] || 'current';
if (!/^[a-z0-9-]+$/i.test(phase)) throw new Error('Use a simple report label');
fs.mkdirSync(`.perf/${phase}`, {recursive:true});
fs.mkdirSync(`.perf/chrome-${phase}`, {recursive:true});
const chrome = await chromeLauncher.launch({chromePath:process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', userDataDir:path.resolve(`.perf/chrome-${phase}`), chromeFlags:['--headless=new','--no-first-run']});
try {
  for (const mode of ['desktop','mobile']) for (let run = 1; run <= 3; run++) {
    const result = await lighthouse('http://127.0.0.1:4173/', {port:chrome.port, output:'json', logLevel:'error'}, mode === 'desktop' ? desktopConfig : undefined);
    const lhr = result.lhr;
    fs.writeFileSync(`.perf/${phase}/${mode}-${run}.json`, JSON.stringify(lhr));
    fs.writeFileSync(`.perf/${phase}/${mode}-${run}-trace.json`, JSON.stringify(result.artifacts.Trace));
    const metrics = Object.fromEntries(['first-contentful-paint','largest-contentful-paint','total-blocking-time','cumulative-layout-shift','speed-index'].map(k=>[k,lhr.audits[k].numericValue]));
    console.log(JSON.stringify({phase, mode, run, scores:Object.fromEntries(Object.entries(lhr.categories).map(([k,v])=>[k,v.score])), ...metrics}));
  }
} finally { await chrome.kill(); }

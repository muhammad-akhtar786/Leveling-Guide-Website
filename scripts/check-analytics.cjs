const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const chromePath=process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe';
(async()=>{
  const browser=await chromium.launch({executablePath:chromePath,headless:true});
  const results=[];
  try {
    for(const mode of ['normal','no-idle-callback','slow-load']) {
      const page=await browser.newPage();
      const downloads=[],collects=[];
      page.on('request',r=>{if(r.url().startsWith('https://www.googletagmanager.com/gtag/js'))downloads.push(r.url());});
      page.on('response',r=>{if(/google-analytics\.com\/g\/collect/.test(r.url()))collects.push({url:r.url(),body:r.request().postData(),status:r.status()});});
      if(mode==='no-idle-callback')await page.addInitScript(()=>{delete window.requestIdleCallback;delete window.cancelIdleCallback;});
      let releaseImage;
      if(mode==='slow-load') {
        const gate=new Promise(resolve=>{releaseImage=resolve;});
        await page.route('**/concrete-interior-800.webp',async route=>{await gate;await route.continue();});
      }
      // Queue a debug event at readiness, before the load/idle download.
      await page.addInitScript(()=>document.addEventListener('DOMContentLoaded',()=>gtag('event','performance_validation',{debug_mode:true}),{once:true}));
      await page.goto('http://127.0.0.1:4173/',{waitUntil:'domcontentloaded'});
      const queue=await page.evaluate(()=>({gtag:typeof gtag,js:dataLayer.filter(e=>e[0]==='js').length,config:dataLayer.filter(e=>e[0]==='config').length}));
      assert.deepEqual(queue,{gtag:'function',js:1,config:1});
      await page.waitForFunction(()=>!!document.querySelector('script[src^="https://www.googletagmanager.com/gtag/js"]'),{},{timeout:5000});
      const timing=await page.evaluate(()=>({readyState:document.readyState,time:performance.now()}));
      if(mode==='slow-load') {assert.notEqual(timing.readyState,'complete');releaseImage();}
      await page.waitForFunction(()=>typeof window.google_tag_manager==='object',{}, {timeout:30000});
      // Exercise repeated load signals; script and config must stay unique.
      await page.evaluate(()=>{window.dispatchEvent(new Event('load'));window.dispatchEvent(new Event('load'));});
      await page.waitForTimeout(10000);
      assert.equal(downloads.length,1);
      const events=collects.flatMap(c=>{
        const lines=c.body?c.body.split('\n'):[''];
        return lines.map(body=>({params:new URLSearchParams(new URL(c.url).search+'&'+body),status:c.status}));
      });
      const views=events.filter(e=>e.params.get('en')==='page_view');
      console.log('Collected events',events.map(e=>({event:e.params.get('en'),status:e.status})));
      assert.equal(views.length,1,mode+' exactly one page_view');
      assert.equal(views[0].params.get('tid'),'G-EEVCE53BZW');
      assert.ok(views[0].status>=200&&views[0].status<300);
      assert.ok(events.some(e=>e.params.get('en')==='performance_validation'&&e.status>=200&&e.status<300),'early queued debug event collected');
      const result={mode,scriptRequests:downloads.length,pageViews:views.length,collectStatus:views[0].status,earlyQueuedEvent:true,...timing};
      results.push(result);console.log(result);
      await page.close();
    }
    fs.writeFileSync('.perf/analytics-check.json',JSON.stringify(results,null,2));
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});

const {chromium} = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const {execFileSync} = require('node:child_process');
const origin = 'http://127.0.0.1:4173';
const files = execFileSync('git',['ls-files'],{encoding:'utf8'}).trim().split(/\r?\n/).filter(f=>f.endsWith('.html'));
const check = (v,message) => assert.ok(v,message);
(async () => {
  const browser = await chromium.launch({executablePath:process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
  try {
    const page = await browser.newPage();
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    // Parse every checked-in page without executing scripts or sending extra analytics.
    let links=0,schemas=0;
    for(const file of files) {
      const html=fs.readFileSync(file,'utf8');
      const old=execFileSync('git',['show',`HEAD:${file}`],{encoding:'utf8'});
      const inspected=await page.evaluate(({html,old})=>{
        const doc=new DOMParser().parseFromString(html,'text/html');
        const prior=new DOMParser().parseFromString(old,'text/html');
        const select=d=>[...d.querySelectorAll('title,meta[name="description"],meta[name="robots"],link[rel="canonical"],h1,script[type="application/ld+json"]')].map(e=>e.outerHTML);
        return {metadata:select(doc),prior:select(prior),schemas:[...doc.querySelectorAll('script[type="application/ld+json"]')].map(s=>JSON.parse(s.textContent)),refs:[...doc.querySelectorAll('[href],[src]')].map(e=>e.getAttribute('href')||e.getAttribute('src')),ids:[...doc.querySelectorAll('[id]')].map(e=>e.id)};
      },{html,old});
      assert.deepEqual(inspected.metadata,inspected.prior,`${file} metadata changed`);
      schemas+=inspected.schemas.length;
      if(!file.startsWith('google')) {
        assert.equal((html.match(/gtag\('config'/g)||[]).length,1,file+' config count');
        check(!html.includes('<script async src="https://www.googletagmanager.com'),file+' early GA');
      }
      for(const ref of inspected.refs) {
        if(/^(https?:|mailto:|tel:|data:)/.test(ref))continue;
        const url=new URL(ref,origin+'/'+file.replace(/index\.html$/,''));
        let target=path.join(process.cwd(),decodeURIComponent(url.pathname));
        if(fs.existsSync(target)&&fs.statSync(target).isDirectory())target=path.join(target,'index.html');
        check(fs.existsSync(target),`${file}: missing ${ref}`);
        if(url.hash&&target.endsWith('.html')) {
          const content=fs.readFileSync(target,'utf8');
          check(content.includes(`id="${decodeURIComponent(url.hash.slice(1))}"`)||content.includes(`id='${decodeURIComponent(url.hash.slice(1))}'`),`${file}: missing anchor ${ref}`);
        }
        links++;
      }
    }
    for(const f of ['robots.txt','sitemap.xml','googleb4761610aea93b57.html']) assert.equal(fs.readFileSync(f,'utf8').replace(/\r\n/g,'\n'),execFileSync('git',['show',`HEAD:${f}`],{encoding:'utf8'}));
    console.log(`PASS: ${files.length} HTML files; ${schemas} valid/unchanged schemas; ${links} internal references; metadata, robots, sitemap, verification preserved.`);
    for(const width of [1350,412,940]) {
      await page.setViewportSize({width,height:940});
      await page.goto(origin);
      if(width>960) {
        const toggle=page.locator('.dropdown-toggle').first();
        await toggle.focus();await page.keyboard.press('ArrowDown');
        assert.equal(await toggle.getAttribute('aria-expanded'),'true');
        await page.keyboard.press('Escape');assert.equal(await toggle.getAttribute('aria-expanded'),'false');
        check(await toggle.evaluate(e=>document.activeElement===e),'dropdown focus');
      } else {
        await page.locator('.nav-toggle').click();check(await page.locator('.mobile-nav').isVisible(),'menu visible');
        check(await page.locator('.mobile-close').evaluate(e=>document.activeElement===e),'menu focus');
        await page.locator('.mobile-nav summary').first().click();check(await page.locator('.mobile-nav details').first().getAttribute('open')!==null,'mobile dropdown');
        await page.keyboard.press('Escape');assert.equal(await page.locator('.nav-toggle').getAttribute('aria-expanded'),'false');
        await page.locator('.nav-toggle').click();await page.locator('.mobile-close').click();check(!await page.locator('.mobile-nav').isVisible(),'menu closed');
      }
      await page.locator('.header-search').click();await page.locator('#global-search').fill('primer');
      check(await page.locator('#global-search-results a').count()>0,'search results');await page.locator('.search-close').click();
      check(!await page.locator('#search-dialog').isVisible(),'search closed');
      await page.locator('#quick-length').fill('20');await page.locator('#quick-width').fill('10');await page.locator('#quick-depth').selectOption('0.25');
      assert.equal(await page.locator('#quick-bags').textContent(),'11');
      await page.locator('.layer-toggle').click();check(await page.locator('.layer-viewer').evaluate(e=>e.classList.contains('is-assembled')),'layer viewer');
      console.log(`PASS: navigation, keyboard, search, quick calculator, layer viewer at ${width}px.`);
    }
    for(const [route,form,result,expected] of [
      ['self-leveling-concrete-calculator','material-calc-form','res-bags','6 bags'],
      ['self-leveling-concrete-cost-calculator','cost-calc-form','cost-res-total','$210.00'],
      ['self-leveling-concrete-bag-coverage-calculator','bag-coverage-form','bc-res-total-area','100.0 sq ft']
    ]) {
      await page.goto(`${origin}/${route}/`);
      await page.locator(`#${form} button[type=submit]`).click();assert.equal(await page.locator('#'+result).textContent(),expected);
      await page.locator(`#${form} input[type=number]`).first().fill('-1');await page.waitForTimeout(250);check(await page.locator('.calc-error.is-visible').count()===1,'invalid input');
      await page.locator(`#${form} button[type=reset]`).click();check(await page.locator('.results.is-visible').count()===0,'reset');
      console.log(`PASS: ${route} calculation, validation, reset.`);
    }
    await page.goto(origin+'/contact/');check(await page.locator('main a[href^="mailto:"]').count()===1,'contact email');
    for(const width of [1350,412]) {
      await page.setViewportSize({width,height:940});await page.goto(origin);
      await page.evaluate(async()=>{for(const img of document.images){img.loading='eager';await img.decode();}});
      check(await page.evaluate(()=>[...document.images].every(i=>i.complete&&i.naturalWidth>0)),'images');
      await page.screenshot({path:`.perf/${width}-after.png`,fullPage:true});
    }
    assert.deepEqual(errors,[]);console.log('PASS: all homepage images load; no browser exceptions.');
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});

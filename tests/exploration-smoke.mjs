import { chromium } from 'playwright';
import fs from 'node:fs/promises';
const browser = await chromium.launch({executablePath:'/usr/local/bin/chromium',headless:true,args:['--no-sandbox','--enable-webgl','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const report=[];
try {
 const page=await browser.newPage({viewport:{width:1440,height:1024}});const errors=[];page.on('pageerror',error=>errors.push(error.message));page.on('console',message=>{if(message.type()==='error')errors.push(message.text())});
 await page.goto('http://127.0.0.1:5173');await page.waitForFunction(()=>window.__SPACE_EXPLORER__?.snapshot().ready,null,{timeout:90000});
 const initial=await page.evaluate(()=>window.__SPACE_EXPLORER__.snapshot());
 for(const destination of ['moon','overview','mars','overview']){
   await page.locator('.primary-nav').getByRole('button',{name:destination.toUpperCase(),exact:true}).click();
   await page.waitForFunction(name=>document.querySelector('.app').dataset.destination===name&&document.querySelector('.app').dataset.journey==='arrived'&&!window.__SPACE_EXPLORER__.snapshot().isTransitioning,destination,{timeout:30000});
   await page.waitForFunction(()=>getComputedStyle(document.querySelector('.destination-groups')).opacity==='1',null,{timeout:15000});
   const s=await page.evaluate(()=>window.__SPACE_EXPLORER__.snapshot());
   await page.screenshot({path:`docs/exploration/desktop-${destination}.png`,fullPage:true});
   report.push({destination,camera:s.camera,target:s.target,bounds:s.worldBounds,markers:s.markers,modelsUnchanged:JSON.stringify(initial.modelIds)===JSON.stringify(s.modelIds),cards:await page.locator('.hardware-card').count()});
 }
 await fs.writeFile('docs/exploration/first-smoke.json',JSON.stringify({errors,report},null,2));console.log(JSON.stringify({errors,states:report.map(({destination,camera,cards,modelsUnchanged})=>({destination,camera,cards,modelsUnchanged}))},null,2));
} finally {await browser.close()}

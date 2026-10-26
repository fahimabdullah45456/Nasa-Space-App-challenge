import { existsSync } from 'node:fs';
import {chromium} from 'playwright';import fs from 'node:fs/promises';
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||(existsSync('/usr/local/bin/chromium')?'/usr/local/bin/chromium':undefined),headless:true,args:['--no-sandbox','--enable-webgl','--use-angle=swiftshader','--enable-unsafe-swiftshader','--js-flags=--max-old-space-size=4096']});
const base=process.env.LAB_URL||'http://127.0.0.1:5174/planet-lab.html';const reports=[];
try{
 for(const name of ['Earth','Mars','Moon']){
  for(const [view,query] of [['medium',''],['close','&close'],['side','&close&light=side'],['rotated','&close&angle=1.7'],['reverse','&light=reverse&angle=3.14']]){
   const page=await browser.newPage({viewport:{width:1000,height:1000}});const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
   await page.goto(`${base}?qa&planet=${name}&still${query}`);await page.waitForFunction(n=>window.__PLANET_LAB__?.[n]?.snapshot().meshes.length>0,name,{timeout:90000});await page.waitForTimeout(1500);
   const snapshot=await page.evaluate(n=>window.__PLANET_LAB__[n].snapshot(),name);await page.screenshot({path:`docs/planet-lab/${name.toLowerCase()}-${view}.png`});reports.push({name,view,errors,snapshot});console.log(name,view,errors.length?'ERROR '+errors.join(';'):'rendered');await page.close();
  }
 }
 const page=await browser.newPage({viewport:{width:1680,height:900}});await page.goto(base+'?qa');await page.waitForFunction(()=>['Earth','Mars','Moon'].every(n=>window.__PLANET_LAB__?.[n]?.snapshot().meshes.length>0),null,{timeout:90000});await page.waitForTimeout(2000);await page.screenshot({path:'docs/planet-lab/three-worlds.png'});const a=await page.evaluate(()=>Object.fromEntries(Object.entries(window.__PLANET_LAB__).map(([n,v])=>[n,v.snapshot()])));await page.waitForTimeout(2000);const b=await page.evaluate(()=>Object.fromEntries(Object.entries(window.__PLANET_LAB__).map(([n,v])=>[n,v.snapshot()])));reports.push({motion:{a,b}});await page.close();
 await fs.writeFile('docs/planet-lab/qa.json',JSON.stringify(reports,null,2));
}finally{await browser.close();}

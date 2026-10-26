import {existsSync} from 'node:fs';
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||(existsSync('/usr/local/bin/chromium')?'/usr/local/bin/chromium':undefined),headless:true,args:['--no-sandbox','--enable-webgl','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const report=[]; const base=process.env.TEST_URL||'http://127.0.0.1:5173';
const snap=p=>p.evaluate(()=>window.__SPACE_EXPLORER__?.snapshot());
async function arrived(p,name){await p.waitForFunction(n=>document.querySelector('.app').dataset.destination===n&&document.querySelector('.app').dataset.journey==='arrived',name,{timeout:45000});await p.waitForFunction(n=>document.querySelector('.hardware-strip').dataset.destination===n&&getComputedStyle(document.querySelector('.destination-groups')).opacity==='1',name,{timeout:15000});}
async function nav(p,name){await p.locator('.primary-nav').getByRole('button',{name:name.toUpperCase(),exact:true}).click();await arrived(p,name);}
try{
 for(const viewport of [{width:1440,height:1024},{width:800,height:1024},{width:390,height:844}].filter(v=>!process.env.TEST_WIDTHS||process.env.TEST_WIDTHS.split(',').includes(String(v.width)))){
  const context=await browser.newContext({viewport});const p=await context.newPage();const errors=[],models=[];
  p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text())});p.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);if(r.url().endsWith('.glb'))models.push(new URL(r.url()).pathname)});
  await p.goto(base);await p.waitForFunction(()=>document.querySelector('[data-testid="scene"]')?.dataset.status==='ready',null,{timeout:90000});await arrived(p,'overview');
  await p.waitForFunction(()=>getComputedStyle(document.querySelector('.canvas-wrap')).opacity==='1');
  const initial=await snap(p);const states=[];
  for(const name of ['overview','moon','overview','mars','overview']){
   if(name!=='overview'||states.length)await nav(p,name);
   assert.equal(await p.locator('.hardware-card').count(),name==='overview'?4:2);
   assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth),viewport.width);
   assert.equal(await p.locator('.primary-nav .active').textContent(),name.toUpperCase());
   const overlaps=await p.evaluate(()=>[...document.querySelectorAll('.projected-marker:not([hidden])')].flatMap(marker=>{
    const a=marker.getBoundingClientRect();const hits=[];
    for(const node of document.querySelectorAll('.story .chapter,.story h1,.story .tagline,.story .description,.hero-actions > button,.mission-overview')){
     const boxes=[];
     if(node.matches('button,.mission-overview'))boxes.push(node.getBoundingClientRect());
     else {const texts=document.createTreeWalker(node,NodeFilter.SHOW_TEXT);while(texts.nextNode()){if(!texts.currentNode.textContent.trim())continue;const range=document.createRange();range.selectNodeContents(texts.currentNode);boxes.push(...range.getClientRects());}}
     if(boxes.some(b=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top))hits.push(marker.getAttribute('aria-label')+' overlaps '+node.tagName+' '+node.className);
    }return hits;
   }));assert.deepEqual(overlaps,[]);
   const s=await snap(p);
   if(s){assert.deepEqual(s.modelIds,initial.modelIds);assert.equal(s.activeTimelines,0);assert.equal(s.scenePlanetMeshes.length,4);
    for(const [key,value]of Object.entries(s.markers))if(value)assert.equal(value.hit,`${key}-surface`);
    if(name!=='overview'){assert.ok(s.target.every((x,i)=>Math.abs(x-s.worldBounds[name].center[i])<1e-6));assert.ok(s.camera.every((x,i)=>Math.abs(x-s.cameraPlan.position[i])<1e-6));}
   }
   await p.screenshot({path:`docs/exploration/${viewport.width}-${name}.png`,fullPage:true});
   states.push({name,cards:await p.locator('.hardware-card').count(),markers:s?.markers});
  }
  for(const name of ['moon','mars']){
   const marker=p.getByRole('button',{name:`Select ${name==='moon'?'Moon':'Mars'} destination`,exact:true});assert.ok(await marker.isVisible(),`${name} marker visible`);await marker.click();await arrived(p,name);await nav(p,'overview');
  }
  await p.locator('.primary-nav').getByRole('button',{name:'MOON',exact:true}).click();await p.waitForTimeout(180);
  await p.locator('.primary-nav').getByRole('button',{name:'MARS',exact:true}).click();await p.waitForTimeout(180);
  await p.locator('.primary-nav').getByRole('button',{name:'OVERVIEW',exact:true}).click();await arrived(p,'overview');
  if(initial){const s=await snap(p);assert.equal(s.activeTimelines,0);assert.deepEqual(s.modelIds,initial.modelIds);}
  await nav(p,'moon');await p.getByRole('button',{name:'Scene and motion settings'}).click();
  const slider=p.getByRole('slider',{name:'PLANET ROTATION SPEED'});await slider.fill('3');
  await p.getByRole('button',{name:'PAUSE ROTATION',exact:true}).click();await p.keyboard.press('Escape');
  await nav(p,'mars');
  if(initial){const a=await snap(p);assert.equal(a.rotationSpeed,3);assert.equal(a.isRotationPaused,true);await p.waitForFunction(min=>window.__SPACE_EXPLORER__.snapshot().frames>=min,a.frames+3,{timeout:20000});assert.deepEqual((await snap(p)).quaternions,a.quaternions);}
  await p.getByRole('button',{name:'Scene and motion settings'}).click();await p.getByRole('button',{name:'RESUME ROTATION',exact:true}).click();
  if(initial){const a=await snap(p);await p.waitForFunction(min=>window.__SPACE_EXPLORER__.snapshot().frames>=min,a.frames+3,{timeout:20000});assert.notDeepEqual((await snap(p)).quaternions,a.quaternions);}
  await p.getByRole('button',{name:'RESET TO DEFAULT',exact:true}).click();await p.keyboard.press('Escape');
  await p.locator('.hardware-card').first().click();await p.getByRole('dialog').waitFor();await p.screenshot({path:`docs/exploration/${viewport.width}-hardware-dialog.png`,fullPage:true});await p.keyboard.press('Escape');
  await p.getByRole('button',{name:'ARCHIVE',exact:true}).click();assert.equal(await p.locator('#archive-heading').evaluate(e=>document.activeElement===e),true);
  await p.emulateMedia({reducedMotion:'reduce'});await nav(p,'moon');if(initial){const s=await snap(p);assert.equal(s.activeTimelines,0);assert.equal(s.effectiveRotationSpeed,0);}
  await p.screenshot({path:`docs/exploration/${viewport.width}-reduced-moon.png`,fullPage:true});
  assert.equal(models.length,3);assert.deepEqual(errors,[]);report.push({viewport,states,models,errors,rapidSwitching:true,markersClickable:true,settings:true,archive:true,reducedMotion:true});
  await context.close();console.log(`PASS ${viewport.width}`);
 }
 await fs.writeFile(`docs/exploration/${process.env.TEST_REPORT||'validation'}.json`,JSON.stringify(report,null,2));
}finally{await browser.close()}

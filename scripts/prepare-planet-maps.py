from pathlib import Path
from PIL import Image
import numpy as np,json,hashlib
src=Path('source-assets/planet-lab');out=Path('public/textures/planets');out.mkdir(exist_ok=True)
manifest=[]
def save(im,name,source,treatment):
 p=out/name
 if p.suffix=='.jpg':im.convert('RGB').save(p,quality=96,subsampling=0,optimize=True)
 else:im.save(p,optimize=True)
 manifest.append(dict(file=str(p),size=im.size,source=source,treatment=treatment,bytes=p.stat().st_size,sha256=hashlib.sha256(p.read_bytes()).hexdigest()))
for inp,name,size in [('8k_earth_daymap.jpg','earth-day.jpg',8192),('8k_earth_nightmap.jpg','earth-night.jpg',4096),('8k_mars.jpg','mars-color.jpg',8192),('lroc_color_poles_8k.tif','moon-color.jpg',8192)]:
 im=Image.open(src/inp).convert('RGB');im=im.resize((size,size//2),Image.Resampling.LANCZOS);save(im,name,inp,'Re-encoded sRGB JPEG, no invented detail')
cloud=Image.open(src/'8k_earth_clouds.jpg').convert('L').resize((4096,2048),Image.Resampling.LANCZOS)
rgba=Image.new('RGBA',cloud.size,(255,255,255,255));rgba.putalpha(cloud);save(rgba,'earth-clouds.png','8k_earth_clouds.jpg','White RGB with source grayscale as alpha, resized 4K')
spec=np.asarray(Image.open(src/'2k_earth_specular_map.tif').convert('L'),dtype=np.float32)/255
rough=np.uint8(np.clip(.86-.53*spec,0,1)*255);save(Image.fromarray(rough),'earth-roughness.png','2k_earth_specular_map.tif','Ocean mask white mapped to roughness .33; land .86; data, not color')
save(Image.open(src/'2k_earth_normal_map.tif').convert('RGB'),'earth-normal.png','2k_earth_normal_map.tif','Preserved tangent normal data, not inferred from albedo')
def normal(h,radius,size,exaggeration):
 im=Image.fromarray(h.astype('float32')).resize((size,size//2),Image.Resampling.BICUBIC);a=np.asarray(im);H,W=a.shape
 dx=(np.roll(a,-1,1)-np.roll(a,1,1))/2;dy=np.gradient(a,axis=0)
 cos=np.cos(np.pi/2-(np.arange(H)+.5)*np.pi/H);cos=np.maximum(cos,.08)[:,None]
 x=-dx/(radius*cos*2*np.pi/W)*exaggeration;y=dy/(radius*np.pi/H)*exaggeration
 lat=np.abs(90-(np.arange(H)+.5)*180/H)[:,None];fade=np.clip((88-lat)/8,0,1);fade=fade*fade*(3-2*fade);x*=fade;y*=fade
 n=np.stack([x,y,np.ones_like(x)],axis=-1);n/=np.linalg.norm(n,axis=-1,keepdims=True)
 return Image.fromarray(np.uint8(np.clip(n*.5+.5,0,1)*255))
moon=np.asarray(Image.open(src/'ldem_16_uint.tif'),dtype=np.float32)*.5-10000
save(normal(moon,1737400,4096,1.5),'moon-normal.png','ldem_16_uint.tif','LOLA half-meter DEM -> metric spherical tangent derivatives; 1.5x relief, pole fade, 4K RGB normal')
mars=np.fromfile(src/'megt90n000eb.img',dtype='>i2').reshape(2880,5760).astype('float32');mars=np.roll(mars,2880,axis=1)
save(normal(mars,3396000,4096,1.5),'mars-normal.png','megt90n000eb.img','Signed big-endian meters; roll 180deg from 0..360 to -180..180; metric spherical tangent derivatives at 1.5x relief')
# Keep data previews for verifying alignment without pretending albedo is elevation.
for a,name in [(moon,'moon-height-inspect.jpg'),(mars,'mars-height-inspect.jpg')]:
 a=(a-a.min())/(a.max()-a.min());im=Image.fromarray(np.uint8(a*255));im.thumbnail((900,450));im.save('docs/planet-lab/'+name)
Path('docs/planet-lab/runtime-manifest.json').write_text(json.dumps(manifest,indent=2));print(json.dumps([{'file':x['file'],'size':x['size'],'bytes':x['bytes']} for x in manifest],indent=2))

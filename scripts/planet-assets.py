from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from urllib.request import urlopen,Request
from PIL import Image
import json
root=Path('source-assets/planet-lab');root.mkdir(exist_ok=True)
sss='https://www.solarsystemscope.com/textures/download/'
svs='https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004720/'
items={k:sss+k for k in ['8k_earth_daymap.jpg','8k_earth_clouds.jpg','8k_earth_nightmap.jpg','8k_mars.jpg','2k_earth_specular_map.tif','2k_earth_normal_map.tif']}
items.update({k:svs+k for k in ['lroc_color_poles_8k.tif','ldem_16_uint.tif']})
items.update({k:'https://pds-geosciences.wustl.edu/mgs/urn-nasa-pds-mgs_mola_topography_derived/meg016/'+k for k in ['megt90n000eb.img','megt90n000eb.xml']})
def fetch(it):
 name,url=it;p=root/name
 try:
  if not p.exists():
   with urlopen(Request(url,headers={'User-Agent':'Mozilla/5.0'}),timeout=120) as r:p.write_bytes(r.read())
  if p.suffix in ['.img','.xml']:return {'file':name,'url':url,'bytes':p.stat().st_size}
  im=Image.open(p);print(name,im.size,im.mode,flush=True);return {'file':name,'url':url,'size':im.size,'mode':im.mode,'bytes':p.stat().st_size}
 except Exception as e:print(name,str(e),flush=True);return {'file':name,'url':url,'error':str(e)}
with ThreadPoolExecutor(max_workers=5) as pool: records=list(pool.map(fetch,items.items()))
Path('docs/planet-lab/downloads.json').write_text(json.dumps(records,indent=2))

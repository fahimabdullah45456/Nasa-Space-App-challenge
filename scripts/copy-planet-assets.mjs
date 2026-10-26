import fs from 'node:fs/promises';
for(const path of ['textures/planets','models/planets'])await fs.cp(`public/${path}`,`planet-lab-dist/${path}`,{recursive:true});

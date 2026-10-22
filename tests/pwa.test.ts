import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
test('install manifest uses portable relative scope and real install-sized PNG icons',()=>{
 const manifest=JSON.parse(readFileSync(new URL('../public/manifest.webmanifest',import.meta.url),'utf8'));
 assert.equal(manifest.start_url,'./');assert.equal(manifest.scope,'./');assert.equal(manifest.display,'standalone');
 for(const icon of manifest.icons){const png=readFileSync(new URL('../public/'+icon.src,import.meta.url));const [width,height]=icon.sizes.split('x').map(Number);assert.equal(png.readUInt32BE(16),width);assert.equal(png.readUInt32BE(20),height);}
});

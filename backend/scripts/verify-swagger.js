// Quick integrity check on the generated OpenAPI spec.
// Walks every $ref and confirms it resolves inside the document.
import { swaggerSpec } from '../config/swagger.js';

const spec = swaggerSpec;
const broken = [];
const REF = '$ref';

const walk = (node, path = '') => {
  if (!node || typeof node !== 'object') return;
  for (const k of Object.keys(node)) {
    const v = node[k];
    const p = `${path}/${k}`;
    if (k === REF && typeof v === 'string') {
      const segments = v.replace('#/', '').split('/');
      let cur = spec;
      let ok = true;
      for (const seg of segments) {
        if (cur && typeof cur === 'object' && seg in cur) {
          cur = cur[seg];
        } else {
          ok = false;
          break;
        }
      }
      if (!ok) broken.push(`${p} -> ${v}`);
    } else if (typeof v === 'object') {
      walk(v, p);
    }
  }
};

walk(spec);

const paths = Object.keys(spec.paths || {});
let endpoints = 0;
for (const p of paths) {
  endpoints += Object.keys(spec.paths[p]).filter((k) =>
    ['get', 'post', 'put', 'patch', 'delete'].includes(k)
  ).length;
}

console.log(`paths      : ${paths.length}`);
console.log(`endpoints  : ${endpoints}`);
console.log(`tags       : ${(spec.tags || []).length}`);
console.log(`schemas    : ${Object.keys(spec.components?.schemas || {}).length}`);
console.log(`broken refs: ${broken.length}`);
if (broken.length) {
  for (const b of broken) console.log('  - ' + b);
  process.exit(1);
}
console.log('OK');

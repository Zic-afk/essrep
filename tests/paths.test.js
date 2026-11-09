/* Validate file:// navigation and local assets without depending on the working directory. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {pathToFileURL,fileURLToPath}=require('node:url');
const root=path.resolve(__dirname,'..');
const documents=['index.html',...fs.readdirSync(path.join(root,'pages')).filter(n=>n.endsWith('.html')).map(n=>'pages/'+n)];
let count=0;
function check(ref,source){
  const target=new URL(ref,pathToFileURL(path.join(root,source)));
  if(target.protocol!=='file:')return;
  const file=fileURLToPath(target);
  assert.ok(fs.existsSync(file)&&fs.statSync(file).isFile(),`${source} -> ${ref}`);
  if(target.hash&&file.endsWith('.html')){
    const id=decodeURIComponent(target.hash.slice(1));
    assert.ok(fs.readFileSync(file,'utf8').includes(`id="${id}"`),`Missing anchor: ${source} -> ${ref}`);
  }
  count++;
}
for(const source of documents){
  const text=fs.readFileSync(path.join(root,source),'utf8');
  assert.ok(!text.includes('\ufffd'),`UTF-8: ${source}`);
  for(const [,ref] of text.matchAll(/\b(?:href|src)="([^"]+)"/g))check(ref,source);
}
for(const name of fs.readdirSync(path.join(root,'css'))){
  const source='css/'+name,text=fs.readFileSync(path.join(root,source),'utf8');
  for(const [,ref] of text.matchAll(/url\(['"]?([^)'"\s]+)['"]?\)/g))check(ref,source);
}
for(const project of require('../js/data.js').projects)check(project.page,'index.html');
assert.equal(documents.length,7);
console.log(`Paths passed: ${documents.length} HTML pages, CSS assets, project destinations, anchors; ${count} local references.`);

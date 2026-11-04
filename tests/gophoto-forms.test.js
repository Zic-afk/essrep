const assert=require('node:assert/strict'),forms=require('../js/gophoto-forms.js');
const sphere=forms.sphere(),scatter=forms.scatter();assert.equal(forms.COUNT,50000);assert.equal(sphere.length,150000);assert.equal(scatter.length,150000);
for(let i=0;i<sphere.length;i+=3)assert.ok(Math.abs(Math.hypot(sphere[i],sphere[i+1],sphere[i+2])-1)<1e-6,'Sphere is a unit surface');
assert.ok(scatter.some(x=>x>3)&&scatter.some(x=>x< -3),'Intro points originate from widely separated places');assert.deepEqual(scatter,forms.scatter(),'Intro geometry is deterministic');console.log('PASS: 50,000-point sphere and dispersed intro geometry.');

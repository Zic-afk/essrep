/* Explicit landing-page examples, not the application's full answer engine. */
const LearningDemo=(()=>{
  function normalize(value,english=false){let result=value.toLowerCase().normalize('NFKC').replace(/\([^)]*\)/g,'').replace(/ё/g,'е').trim().replace(/[.!?]+$/,'').replace(/\s+/g,' ');if(english)result=result.replace(/^(?:to|a|the)\s+/,'');return result;}
  function distance(a,b){const row=Array.from({length:b.length+1},(_,i)=>i);for(let i=1;i<=a.length;i++){let previous=row[0];row[0]=i;for(let j=1;j<=b.length;j++){const old=row[j];row[j]=Math.min(row[j]+1,row[j-1]+1,previous+(a[i-1]===b[j-1]?0:1));previous=old;}}return row[b.length];}
  function grade(value,answers,english=false){
    const entered=value.split(/[,;/\n]+/).map(v=>normalize(v,english)).filter(Boolean),expected=[...new Set(answers.map(v=>normalize(v,english)))];
    if(!entered.length)return {kind:'empty'};const matched=new Set();let typo=false;
    for(const part of entered){let index=expected.indexOf(part);if(index<0){index=expected.findIndex(answer=>Math.max(part.length,answer.length)>=6&&distance(part,answer)===1);if(index>=0)typo=true;}if(index<0)return {kind:'wrong'};matched.add(index);}
    return {kind:matched.size<expected.length?'partial':typo?'typo':'correct'};
  }
  return {normalize,grade};
})();
if(typeof module!=='undefined')module.exports=LearningDemo;

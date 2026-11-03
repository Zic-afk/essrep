(() => {
  'use strict';
  const form=document.querySelector('#estimate-form'),root=document.querySelector('#estimate-options');
  const number=value=>value.toLocaleString('ru-RU',{maximumFractionDigits:2});
  for(const group of Esscale.groups){
    const field=document.createElement('fieldset'),legend=document.createElement('legend');legend.textContent=group.title;field.append(legend);
    const subtitle=document.createElement('p');subtitle.className='group-subtitle';subtitle.textContent=group.subtitle;field.append(subtitle);
    for(const [id,title,description,value] of group.items){
      const label=document.createElement('label');label.className='estimate-option';
      const input=document.createElement('input');input.type='checkbox';input.name=id;input.value=id;
      const text=document.createElement('span'),strong=document.createElement('strong'),small=document.createElement('small');strong.textContent=title;small.textContent=description;text.append(strong,small);
      const points=document.createElement('span');points.className='option-points';points.textContent=group.id==='factors'?'×'+number(value):value+' EP';label.append(input,text,points);field.append(label);
    }root.append(field);
  }
  function update(){const ids=[...form.querySelectorAll('input:checked')].map(i=>i.value),result=Esscale.calculate(ids);
    document.querySelector('#ep-value').textContent=number(result.ep)+' EP';document.querySelector('#price-value').textContent=result.ep?number(result.min)+'–'+number(result.max)+' ₽':'—';document.querySelector('#weeks-value').textContent=result.ep?result.weeks+' нед.':'—';
    document.querySelector('#estimate-send').href='https://t.me/sborka_esscale?text='+encodeURIComponent(Esscale.message(ids));
  }
  form.addEventListener('change',update);form.addEventListener('reset',()=>setTimeout(update,0));update();
  const header=document.querySelector('.header');addEventListener('scroll',()=>header.classList.toggle('scrolled',scrollY>40),{passive:true});
})();

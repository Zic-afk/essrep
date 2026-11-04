/* Shared content and pure calculator logic. Also usable from Node for checks. */
const Esscale = (() => {
  const projects = [
    {id:'wearninglords',page:'pages/project-wearninglords.html',title:'WearningLords',category:'ПРИЛОЖЕНИЕ / ИЗУЧЕНИЕ СЛОВ',description:'Изучение слов с вводом ответа. Чтобы закрепить слово, нужно ответить верно в три разных дня без ошибок между ними.',tags:['iPhone · iPad · Mac','10 языков'],note:'Скоро в App Store',url:'https://esscale.ru/wearninglords/',bg:'#bbc9a1',fg:'#263c2a',symbol:'Aa',lat:.25,lon:-.6},
    {id:'scandere',page:'pages/project-scandere.html',title:'Scandere',category:'УПРАВЛЕНИЕ ПРОЦЕССАМИ',description:'Система управления компанией и финансового учёта. Математическая модель связывает выручку, прибыль, маржинальность и конверсию.',tags:['297 EP','20 недель','Android · iOS · Windows'],note:'Процессы, сотрудники, склады и финансы',url:'https://esscale.ru/scandere/',bg:'#adc4cf',fg:'#234754',symbol:'▥',lat:.58,lon:.75},
    {id:'gophoto',page:'pages/project-gophoto.html',title:'GoPhoto',category:'ПЛАГИН / LIGHTROOM CLASSIC',description:'Плагин для Lightroom Classic: публикация фотографий в GoPhoto прямо из каталога.',tags:['Lightroom Classic 12+','Версия 0.2.3'],note:'Версия 0.2.3',url:null,bg:'#b6a8c2',fg:'#42334e',symbol:'◫',lat:-.28,lon:2.8}
  ];
  const features={
    wearninglords:['Самостоятельный ввод перевода','Закрепление слов в разные дни','Интерфейс на 10 языках'],
    scandere:['Точки, склады и сотрудники','Расчёт выручки, прибыли и конверсии','Учёт смен и зарплат'],
    gophoto:['Установка в Lightroom Classic','Подключение к GoPhoto','Публикация фотоколлекций']
  };
  const teasers={wearninglords:'Тренировка слов, где ответ нужно вспомнить и набрать самостоятельно.',scandere:'Процессы и финансы компании — в одной математической модели.',gophoto:'Публикация фотографий в GoPhoto прямо из Lightroom Classic.'};
  for(const project of projects){project.features=features[project.id];project.teaser=teasers[project.id];if(project.id==='gophoto')project.previewAccent='#38BDF8';}
  const groups = [
    {id:'server',title:'Серверная часть',subtitle:'Логика, данные, инфраструктура',items:[
      ['core','Ядро сервера','Архитектура, бизнес-логика, структуры данных',24],['network','Сетевой слой','HTTP, WebSocket, разбор форматов',19],['database','База данных','Схема, процедуры, оптимизация запросов',20],['scale','Масштабирование','Репликация, кэширование, живые обновления',23],['accounts','Учётные записи','Регистрация, вход, хранение паролей',9],['security','Защита','SSL, защита от SQL-инъекций, перебора паролей и всплесков запросов',19],['media','Медиа и статика','Загрузка, хранение, раздача файлов',10],['infra','Инфраструктура','Docker, Nginx, сборка, развёртывание',13]]},
    {id:'mobile',title:'Мобильное приложение',subtitle:'iOS и Android из одной кодовой базы',items:[
      ['architecture','Архитектура приложения','Структура виджетов, состояние, навигация',21],['interface','Интерфейс','Адаптивная вёрстка, виджеты, анимации',18],['logic','Сложная логика','Расчёты на клиенте, офлайн-режим',13],['api','Интеграция с сервером','Работа с API, обработка ответов',8],['release','Тестирование и релиз','Проверка на устройствах, публикация в магазинах',16]]},
    {id:'factors',title:'Коэффициенты сложности',subtitle:'Умножают только оценку серверной части',items:[
      ['threads','Многопоточность','Тысячи одновременных подключений',1.3],['async','Асинхронность','Неблокирующая обработка запросов',1.3],['legacy','Работа с легаси','Модернизация существующей кодовой базы',1.5]]}
  ];
  const round=value=>Math.round((value+Number.EPSILON)*100)/100;
  function calculate(ids){
    const selected=new Set(ids);let server=0,mobile=0,factor=1;
    for(const group of groups)for(const [id,,,value] of group.items)if(selected.has(id)){
      if(group.id==='server')server+=value;else if(group.id==='mobile')mobile+=value;else factor*=value;
    }
    const ep=round(server*factor+mobile);
    return {ep,server,mobile,factor:round(factor),min:Math.round(ep*3500),max:Math.round(ep*5000),weeks:Math.ceil(ep/15)};
  }
  function message(ids){
    const result=calculate(ids),selected=new Set(ids);if(!result.ep)return 'Здравствуйте! Хочу обсудить проект с ESSCALE.';
    const lines=['Здравствуйте! Хочу обсудить проект.','Состав предварительного расчёта:'];
    for(const group of groups){const items=group.items.filter(([id])=>selected.has(id));if(items.length){lines.push('',group.title+':');for(const [,title,,value] of items)lines.push(`• ${title} (${group.id==='factors'?'×'+value:value+' EP'})`);}}
    lines.push('',`Объём: ${result.ep} EP`,`Стоимость: ${result.min.toLocaleString('ru-RU')}–${result.max.toLocaleString('ru-RU')} ₽`,`Срок: ${result.weeks} нед.`, 'Предварительная оценка. Хочу уточнить детали.');return lines.join('\n');
  }
  return {projects,groups,calculate,message};
})();
if(typeof module!=='undefined')module.exports=Esscale;

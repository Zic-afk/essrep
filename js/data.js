/* Shared content and pure calculator logic. Also usable from Node for checks. */
const Esscale = (() => {
  const projects = [
    {id:'wearninglords',page:'pages/project-wearninglords.html',title:'WearningLords',category:'ПРИЛОЖЕНИЕ / ИЗУЧЕНИЕ СЛОВ',description:'Изучение слов с вводом ответа. Чтобы закрепить слово, нужно ответить верно в три разных дня без ошибок между ними.',tags:['iPhone · iPad · Mac','10 языков'],note:'Скоро в App Store',url:'https://esscale.ru/wearninglords/',bg:'#bbc9a1',fg:'#263c2a',symbol:'Aa',lat:.25,lon:-.6},
    {id:'scandere',page:'pages/project-scandere.html',title:'Scandere',category:'УПРАВЛЕНИЕ ПРОЦЕССАМИ',description:'Scandere – это система управления и анализа внутренних процессов компании. Внутри системы финансовый учет, математические расчеты KPI, парсинг и анализ информации из корпоративных чатов, управление складами и торговыми точками.',tags:['297 EP','20 недель','Android · iOS · Windows'],note:'Процессы, сотрудники, склады и финансы',url:'https://esscale.ru/scandere/',bg:'#adc4cf',fg:'#234754',symbol:'▥',lat:.58,lon:.75},
    {id:'gophoto',page:'pages/project-gophoto.html',title:'GoPhoto',category:'ПЛАГИН / LIGHTROOM CLASSIC',description:'Плагин для Lightroom Classic: публикация фотографий в GoPhoto прямо из каталога.',tags:['Lightroom Classic 12+','Версия 0.2.3'],note:'Версия 0.2.3',url:null,bg:'#b6a8c2',fg:'#42334e',symbol:'◫',lat:-.28,lon:2.8}
  ];
  projects.push({id:'giovanna',page:'pages/project-giovanna.html',title:'Giovanna',category:'ИНТЕРАКТИВНОЕ ПОРТФОЛИО',description:'Планета, на которой живут наши проекты. Интерактивный космос, объёмные карточки и путешествия через облака.',tags:['Canvas · CSS · JavaScript','Без 3D-движка'],note:'Вы сейчас здесь',url:null,bg:'#9edce1',fg:'#163343',previewAccent:'#9edce1',symbol:'◉',lat:-.4,lon:-.1});
  const features={
    giovanna:['Навигация через живую планету','Интерактивный космос и карточки','Переходы через облака'],
    wearninglords:['Самостоятельный ввод перевода','Закрепление слов в разные дни','Интерфейс на 10 языках'],
    scandere:['Точки, склады и сотрудники','Расчёт выручки, прибыли и конверсии','Учёт смен и зарплат'],
    gophoto:['Установка в Lightroom Classic','Подключение к GoPhoto','Публикация фотоколлекций']
  };
  const hoverDescriptions={scandere:'Система управления бизнесом. Ваша личная ERP с широким функционалом.',giovanna:'Сам этот сайт - тоже проект',wearninglords:'Тренировка английского. Сад слов.',gophoto:'Плагин для Lightroom Classic. Умный поиск фотографий по лицам и автоматизация их выдачи клиентам.'};
  projects.forEach(project=>{project.hoverDescription=hoverDescriptions[project.id];});
  const teasers={wearninglords:'Приложение - тренажер слов, где ответ нужно вспомнить и набрать самостоятельно.',scandere:'Scandere – Система управления бизнесом. Ваша личная ERP с широким кастомным функционалом, настраиваемым под ваши личные потребности. Проекты и финансы компании в одной математической модели.',gophoto:'Публикация фотографий в GoPhoto прямо из Lightroom Classic.'};
  teasers.giovanna='Планета, на которой живут наши проекты. Вы сейчас внутри одного из них.';
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
    const result=calculate(ids),selected=new Set(ids);if(!result.ep)return 'Здравствуйте! Хочу обсудить проект с MASQUAD.';
    const lines=['Здравствуйте! Хочу обсудить проект.','Состав предварительного расчёта:'];
    for(const group of groups){const items=group.items.filter(([id])=>selected.has(id));if(items.length){lines.push('',group.title+':');for(const [,title,,value] of items)lines.push(`• ${title} (${group.id==='factors'?'×'+value:value+' EP'})`);}}
    lines.push('',`Объём: ${result.ep} EP`,`Стоимость: ${result.min.toLocaleString('ru-RU')}–${result.max.toLocaleString('ru-RU')} ₽`,`Срок: ${result.weeks} нед.`, 'Предварительная оценка. Хочу уточнить детали.');return lines.join('\n');
  }
  return {projects,groups,calculate,message};
})();
if(typeof module!=='undefined')module.exports=Esscale;

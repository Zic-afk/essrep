(() => {
  'use strict';
  const pages = ['calculator.html', 'directions.html'];
  const embedded = new URLSearchParams(location.search).has('overlay') && parent !== window;
  if (embedded) {
    document.documentElement.classList.add('overlay-document');
    document.addEventListener('click', event => {
      const link = event.target.closest('a');
      if (!link || event.button || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      const url = new URL(link.href);
      const page = url.pathname.split('/').pop();
      if (url.hash && url.pathname === location.pathname) {
        event.preventDefault();
        document.getElementById(decodeURIComponent(url.hash.slice(1)))?.scrollIntoView({behavior: 'smooth'});
      } else if (pages.includes(page) || page === 'index.html') {
        event.preventDefault();
        parent.postMessage({type: 'esscale-page', page}, '*');
      }
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') parent.postMessage({type: 'esscale-page', page: 'index.html'}, '*');
    });
    return;
  }
  if (!document.body.classList.contains('orbit-home')) return;
  const dialog = document.createElement('dialog');
  dialog.className = 'page-overlay';
  dialog.setAttribute('aria-label', 'Направления и расчёт проекта');
  const close = document.createElement('button');
  close.className = 'page-overlay-close';
  close.type = 'button';
  close.setAttribute('aria-label', 'Вернуться на главную');
  close.textContent = '×';
  dialog.append(close);
  const frames = new Map();
  for (const page of pages) {
    const frame = document.createElement('iframe');
    frame.title = page === 'calculator.html' ? 'Рассчитать проект' : 'Что мы решаем';
    frame.hidden = true;
    frame.src = 'pages/' + page + '?overlay=1';
    dialog.append(frame);
    frames.set(page, frame);
  }
  document.body.append(dialog);
  let timer, opener;
  function open(page, updateHistory = true) {
    if (updateHistory) {
      const url = new URL(location.href);
      const wasOpen = pages.includes(url.searchParams.get('panel'));
      if (url.searchParams.get('panel') !== page) {
        url.searchParams.set('panel', page);
        history[wasOpen ? 'replaceState' : 'pushState'](history.state, '', url.href);
      }
    }
    clearTimeout(timer);
    for (const [name, frame] of frames) frame.hidden = name !== page;
    if (!dialog.open) {
      opener = document.activeElement;
      dialog.showModal();
      requestAnimationFrame(() => requestAnimationFrame(() => dialog.classList.add('is-visible')));
    }
    close.focus();
  }
  function hide() {
    clearTimeout(timer);
    dialog.classList.remove('is-visible');
    timer = setTimeout(() => { dialog.close(); opener?.focus({preventScroll: true}); }, matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 320);
  }
  function dismiss() {
    if (pages.includes(new URL(location.href).searchParams.get('panel'))) history.back();
    else hide();
  }
  window.addEventListener('popstate', () => {
    const page = new URL(location.href).searchParams.get('panel');
    if (frames.has(page)) open(page, false);
    else hide();
  });
  close.onclick = dismiss;
  dialog.addEventListener('cancel', event => { event.preventDefault(); dismiss(); });
  document.addEventListener('click', event => {
    const link = event.target.closest('a');
    if (!link || event.button || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const url = new URL(link.href);
    const page = url.pathname.split('/').pop();
    if (frames.has(page) && url.href === new URL('pages/' + page, location.href).href) {
      event.preventDefault();
      open(page);
    }
  });
  window.addEventListener('message', event => {
    if (![...frames.values()].some(frame => frame.contentWindow === event.source) || event.data?.type !== 'esscale-page') return;
    if (frames.has(event.data.page)) open(event.data.page);
    else if (event.data.page === 'index.html') dismiss();
  });
  const initialUrl = new URL(location.href);
  const initialPage = initialUrl.searchParams.get('panel');
  if (frames.has(initialPage)) {
    initialUrl.searchParams.delete('panel');
    history.replaceState(history.state, '', initialUrl.href);
    open(initialPage);
  }
})();

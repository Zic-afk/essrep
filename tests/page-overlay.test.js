const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

// Exercise browser history without a browser dependency.
function setup(initial = 'https://example.test/index.html') {
  const windowEvents = {}, documentEvents = {}, elements = [];
  const location = new URL(initial);
  const entries = ['https://example.test/pages/project-wearninglords.html', initial];
  let index = 1;
  function element(tag) {
    const classes = new Set();
    const node = {tag, hidden: false, contentWindow: {}, children: [],
      classList: {add: c => classes.add(c), remove: c => classes.delete(c)},
      setAttribute() {}, append(...children) { this.children.push(...children); },
      addEventListener(name, fn) { this[name] = fn; }, focus() {},
      showModal() { this.open = true; }, close() { this.open = false; }};
    elements.push(node);
    return node;
  }
  const document = {body: {classList: {contains: () => true}, append() {}}, activeElement: {focus() {}},
    createElement: element, addEventListener: (name, fn) => { documentEvents[name] = fn; }};
  const history = {state: null,
    pushState(state, _, url) { entries.splice(++index); entries.push(url); location.href = url; },
    replaceState(state, _, url) { entries[index] = url; location.href = url; },
    back() { location.href = entries[--index]; windowEvents.popstate(); },
    forward() { location.href = entries[++index]; windowEvents.popstate(); }};
  const window = {addEventListener: (name, fn) => { windowEvents[name] = fn; }};
  vm.runInNewContext(fs.readFileSync(require.resolve('../js/page-overlay.js'), 'utf8'), {
    URL, URLSearchParams, location, history, window, parent: window, document,
    requestAnimationFrame: fn => fn(), setTimeout: fn => { fn(); return 1; }, clearTimeout() {},
    matchMedia: () => ({matches: true})
  });
  return {location, history, entries, elements,
    click(page) { documentEvents.click({button: 0, target: {closest: () => ({href: new URL('pages/' + page, location).href})}, preventDefault() {}}); },
    switch(page) { const frame = elements.find(e => e.src?.endsWith(page + '?overlay=1'));
      windowEvents.message({source: frame.contentWindow, data: {type: 'esscale-page', page}}); }};
}
const app = setup();
app.click('calculator.html');
assert.equal(app.entries.length, 3);
assert.equal(app.location.search, '?panel=calculator.html');
app.switch('directions.html');
assert.equal(app.entries.length, 3, 'Switching pages keeps a single step back to home');
app.history.back();
assert.equal(app.location.pathname, '/index.html');
assert.equal(app.location.search, '');
assert.equal(app.elements.find(e => e.tag === 'dialog').open, false);
app.history.forward();
assert.equal(app.elements.find(e => e.tag === 'dialog').open, true);
app.elements.find(e => e.tag === 'button').onclick();
assert.equal(app.location.search, '', 'Close returns to home history entry');
const direct = setup('https://example.test/index.html?panel=directions.html');
direct.history.back();
assert.equal(direct.location.pathname, '/index.html');
assert.equal(direct.location.search, '', 'Opening a panel URL also creates a home entry');
console.log('Overlay history passed: open, switch, Back, Forward, close and direct panel URL.');

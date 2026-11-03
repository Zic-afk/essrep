# «Планета проектов» — подробный план разработки

Фон сайта в пиксельном стиле: нижняя половина экрана — вращающаяся планета, на её поверхности по широте и долготе стоят объёмные карточки проектов. Над горизонтом висит крупная карточка выбранного проекта, за ней космос с летающими объектами.

---

## 1. Общая идея и архитектура

Сцена собирается из **четырёх независимых слоёв** (снизу вверх):

| Слой | Чем делается | Что внутри |
|---|---|---|
| Космос | Canvas 2D | звёзды в 2–3 слоя параллакса, туманность, летающие спрайты |
| Планета | Canvas 2D (попиксельная отрисовка) | пиксельная карта мира, натянутая на шар, освещение, атмосфера |
| Карточки на планете | HTML + CSS | маленькие объёмные карточки, привязанные к точкам на шаре |
| Выбранная карточка | HTML + CSS | крупная карточка над горизонтом с описанием проекта |

Ключевые решения, которые сильно упрощают проект:

1. **Никакого настоящего 3D-движка.** Шар — это математика на 30 строк. Всё рисуется обычным Canvas 2D, без WebGL и Three.js.
2. **Низкое внутреннее разрешение.** Canvas рисуется, например, в 480×270 «игровых» пикселей и растягивается на экран без сглаживания. Всё автоматически пиксельное и в одном масштабе.
3. **Одна переменная управляет всем:** `state.rotation`, угол поворота планеты. Её читают и планета, и карточки, поэтому они всегда синхронны.
4. **Карточки — это HTML**, а не картинки на canvas: живой текст, клики, ссылки, доступность с клавиатуры.

---

## 2. Инструменты

### Обязательные

| Инструмент | Зачем | Цена | Где |
|---|---|---|---|
| **VS Code** | редактор кода | бесплатно | code.visualstudio.com |
| **Node.js (LTS)** | нужен для Vite | бесплатно | nodejs.org |
| **Vite** | сборщик и локальный сервер с автообновлением | бесплатно | vitejs.dev |
| **Aseprite** | рисование карты планеты, рамок карточек, спрайтов | ~$20 (или бесплатная сборка из исходников) | aseprite.org |
| **Pixelorama** | бесплатная альтернатива Aseprite | бесплатно | itch.io → Pixelorama |
| **GSAP** | плавные анимации (доворот планеты, появление карточки) | бесплатно | gsap.com |
| **Lospec** | готовые пиксельные палитры, уроки | бесплатно | lospec.com |

### Для графики (по желанию, но очень помогают)

| Инструмент | Зачем |
|---|---|
| **Pixel Planet Generator** (Deep-Fold, itch.io) | быстро получить референс или готовую вращающуюся планету спрайт-листом; подсмотреть цвета и стиль |
| **Space Background Generator** (Deep-Fold, itch.io) | пиксельные туманности и звёздные поля для фона |
| **Kenney.nl** | бесплатные ассеты (лицензия CC0): корабли, астероиды, UI-элементы |
| **itch.io**, поиск «pixel space assets» | ещё ассеты, но **проверяйте лицензию** |
| **Figma** | макет композиции, расположение карточек, мобильная версия |
| **Google Fonts** | пиксельные шрифты: *Pixelify Sans*, *Press Start 2P*, *VT323*; проверьте кириллицу |
| **Blender** | только если захотите планету из 3D-рендера (см. приложение) |

### Для публикации

GitHub Pages, Netlify или Vercel — все бесплатны для такого сайта.

---

## 3. Итерации

Каждая итерация заканчивается рабочим результатом, который можно открыть в браузере.

---

### Итерация 0. Подготовка (1 вечер)

**Цель:** рабочее окружение и пустой проект.

1. Установите VS Code, Node.js и Aseprite (или Pixelorama).
2. Создайте проект:
   ```bash
   npm create vite@latest planet-portfolio -- --template vanilla
   cd planet-portfolio
   npm install
   npm install gsap
   npm run dev
   ```
3. Разложите файлы по такой структуре:
   ```
   planet-portfolio/
   ├── index.html
   ├── public/
   │   ├── planet-map.png     ← карта мира 256×128
   │   ├── card-frame.png     ← рамка карточки 12×12
   │   └── sprites/           ← астероиды, спутники
   └── src/
       ├── main.js            ← игровой цикл, состояние
       ├── config.js          ← размеры, константы
       ├── stars.js           ← космос
       ├── planet.js          ← планета
       ├── cards.js           ← карточки
       ├── projects.js        ← данные проектов
       └── style.css
   ```

**Готово, когда:** `npm run dev` открывает пустую страницу.

---

### Итерация 1. Арт-дирекция и макет (1–2 вечера)

**Цель:** понять, как всё будет выглядеть, *до* написания кода.

1. **Палитра.** Выберите на lospec.com палитру из 16–32 цветов: в ней должны быть тёмные космические тона, цвета планеты и акцент для карточек. Хорошо подходят палитры вроде *Endesga 32*, *Resurrect 64* и *Apollo*. Импортируйте её в Aseprite: `Palette → Load Palette`.
2. **Размер «игрового» пикселя.** Решите, сколько экранных пикселей занимает один пиксель арта. Ориентир: **4 px на десктопе, 3 px на телефоне**. Меньше — картинка становится мелкой и «нечестной», больше — грубой.
3. **Макет.** В Figma или Aseprite нарисуйте статичный кадр:
   - где проходит горизонт планеты (примерно 50–55% высоты экрана);
   - сколько карточек видно одновременно (5–7 — хороший предел);
   - где висит выбранная карточка (примерно 15–40% высоты, по центру);
   - отдельно мобильный вертикальный вариант.
4. **Список проектов.** Сколько их, какие у них названия и картинки-превью.

**Готово, когда:** есть картинка «вот так должно быть» и палитра.

---

### Итерация 2. Каркас: canvas, пиксели, игровой цикл (1 вечер)

**Цель:** canvas в низком разрешении, который правильно растягивается на любой экран.

Принцип: размер пикселя фиксирован, а количество игровых пикселей подстраивается под окно.

**`src/config.js`**
```js
export const view = { W: 0, H: 0, PIXEL: 4 };

export function resize(canvas) {
  view.PIXEL = innerWidth < 700 ? 3 : 4;
  view.W = Math.ceil(innerWidth / view.PIXEL);
  view.H = Math.ceil(innerHeight / view.PIXEL);
  canvas.width = view.W;            // внутреннее разрешение
  canvas.height = view.H;
  canvas.style.width = view.W * view.PIXEL + 'px';
  canvas.style.height = view.H * view.PIXEL + 'px';
}
```

**`src/style.css`**
```css
html, body { margin: 0; height: 100%; overflow: hidden; background: #0b0b1a; }
#scene {
  position: fixed; left: 0; top: 0;
  image-rendering: pixelated;      /* без размытия при увеличении */
}
#cards { position: fixed; inset: 0; pointer-events: none; }
```

**`src/main.js`** — игровой цикл:
```js
import { view, resize } from './config.js';

const canvas = document.querySelector('#scene');
const ctx = canvas.getContext('2d');

export const state = { rotation: 0, autoRotate: true, selected: null };

function onResize() {
  resize(canvas);
  ctx.imageSmoothingEnabled = false;
  // здесь позже: пересчёт планеты и звёзд
}
addEventListener('resize', onResize);
onResize();

let last = performance.now();
function frame(now) {
  const dt = Math.min((now - last) / 1000, 0.1); // секунды, с защитой от скачков
  last = now;
  update(dt);
  render();
  requestAnimationFrame(frame);
}
function update(dt) {
  if (state.autoRotate) state.rotation += dt * 0.05; // радиан в секунду
}
function render() {
  ctx.fillStyle = '#0b0b1a';
  ctx.fillRect(0, 0, view.W, view.H);
}
requestAnimationFrame(frame);
```

**`index.html`** (тело):
```html
<canvas id="scene"></canvas>
<div id="cards"></div>
<div id="hero" hidden></div>
<script type="module" src="/src/main.js"></script>
```

**Готово, когда:** экран залит цветом, при изменении окна ничего не размывается. Для проверки нарисуйте `ctx.fillRect(10, 10, 1, 1)`: должен появиться чёткий квадрат 4×4.

**Подводный камень:** всегда округляйте координаты при рисовании (`Math.floor`), иначе пиксели «дрожат».

---

### Итерация 3. Космос (2–3 вечера)

**Цель:** живой фон, который уже сам по себе можно показывать.

#### 3.1. Звёзды с параллаксом

Звёзды — это просто случайные точки, рисовать их не нужно.

**`src/stars.js`**
```js
import { view } from './config.js';

const LAYERS = [
  { count: 140, speed: 1.5, colors: ['#3b3b6b', '#4a4a80'] },  // дальние
  { count: 60,  speed: 4,   colors: ['#8a8ac8', '#a0b8e0'] },  // средние
  { count: 20,  speed: 9,   colors: ['#ffffff', '#ffe9a8'] },  // ближние
];
let layers = [];

export function initStars() {
  layers = LAYERS.map(l => ({
    ...l,
    stars: Array.from({ length: l.count }, () => ({
      x: Math.random() * view.W,
      y: Math.random() * view.H,
      color: l.colors[Math.floor(Math.random() * l.colors.length)],
      twinkle: Math.random() * Math.PI * 2,
    })),
  }));
}

export function updateStars(dt) {
  for (const l of layers) for (const s of l.stars) {
    s.x -= l.speed * dt;
    if (s.x < 0) { s.x += view.W; s.y = Math.random() * view.H; }
    s.twinkle += dt * 2;
  }
}

export function drawStars(ctx) {
  for (const l of layers) for (const s of l.stars) {
    if (Math.sin(s.twinkle) < -0.8) continue;        // мерцание
    ctx.fillStyle = s.color;
    ctx.fillRect(Math.floor(s.x), Math.floor(s.y), 1, 1);
  }
}
```

Идеи для улучшения:
- несколько «больших» звёзд в виде крестика 3×3 пикселя;
- лёгкий параллакс от мыши: слои смещаются на `mouseX * speed * 0.01`.

#### 3.2. Туманность

1. Сгенерируйте фон в **Space Background Generator**, подобрав цвета под вашу палитру.
2. Экспортируйте PNG небольшого размера (например, 480×270).
3. Рисуйте его первым слоем: `ctx.drawImage(nebula, 0, 0, view.W, view.H)`. Если пропорции окна отличаются, обрезайте, а не растягивайте.

#### 3.3. Летающие объекты

1. Возьмите спрайты с kenney.nl или itch.io, либо нарисуйте 3–5 штук сами в Aseprite: астероид 12×12, спутник 16×16, комета 24×8.
2. Цвета приведите к своей палитре: `Sprite → Color Mode → Indexed`.
3. Анимация (мигающий огонёк спутника, хвост кометы) — 2–4 кадра. Экспорт: `File → Export Sprite Sheet`.
4. Логика: у объекта есть позиция, скорость и время жизни. Появляется за краем экрана, пролетает, исчезает. На экране одновременно 2–5 объектов.

**Подводный камень:** не вращайте пиксельные спрайты кодом (`ctx.rotate`): пиксели «ломаются». Если нужно вращение, рисуйте кадры поворота в Aseprite.

**Готово, когда:** звёзды плывут с параллаксом, иногда пролетает астероид или комета.

---

### Итерация 4. Планета (3–5 вечеров) — главная часть

**Цель:** большая пиксельная планета, видна верхняя дуга, плавно вращается.

#### 4.1. Рисуем карту мира

Планета — это **плоская карта** (как карта Земли), которая натягивается на шар.

1. В Aseprite создайте холст **256×128** (соотношение 2:1 обязательно).
2. Включите `View → Tiled Mode → Tile in X axis`: так видно, как левый край стыкуется с правым. Шов должен быть незаметен, иначе на планете будет видна линия.
3. Рисуйте: океан, материки, острова, пустыни, горы. Палитра — 4–8 цветов на планету.
4. **Полюса:** верхние и нижние 10–12 строк сделайте сплошной полярной шапкой. На шаре они сжимаются в точку, и любые детали там искажаются. Это особенно важно, потому что мы наклоним планету к зрителю и северный полюс будет виден.
5. Сохраните как `public/planet-map.png`.

**Если рисовать не хочется:**
- уменьшите настоящую текстуру планеты (например, с сайта Solar System Scope, лицензия CC BY 4.0, нужно указать авторство) до 256×128 и переведите в индексированную палитру в Aseprite: получится пиксельная Земля или Марс;
- или сгенерируйте карту шумом в коде (библиотека `simplex-noise`): высота → цвет по порогам.

#### 4.2. Как работает отрисовка шара

Для каждого пикселя экрана внутри круга один раз вычисляем, какой точке шара он соответствует (широта и долгота). Это таблица (LUT), она строится **один раз** при запуске и при ресайзе. В каждом кадре остаётся только взять цвет из карты со сдвигом на угол вращения. Это очень быстро.

Наклон `TILT` поворачивает северный полюс к зрителю: мы как будто смотрим на планету немного сверху, и выглядит это объёмнее.

**`src/planet.js`**
```js
import { view } from './config.js';

export const planet = { R: 0, CX: 0, CY: 0, TILT: 0.35 };

let tex, lut = [], buf, bctx, img;
const TWO_PI = Math.PI * 2;

export async function loadPlanet(src) {
  const im = new Image();
  im.src = src;
  await im.decode();
  const c = document.createElement('canvas');
  c.width = im.width; c.height = im.height;
  const g = c.getContext('2d');
  g.drawImage(im, 0, 0);
  tex = g.getImageData(0, 0, im.width, im.height);
}

export function layoutPlanet() {
  const { W, H } = view;
  planet.R  = Math.max(W * 0.7, H * 0.6);   // радиус: подбирайте под макет
  planet.CX = W / 2;
  planet.CY = H * 0.52 + planet.R;          // верх планеты на 52% высоты
  buildLUT();
}

function buildLUT() {
  const { W, H } = view, { R, CX, CY, TILT } = planet;
  buf = document.createElement('canvas');
  buf.width = W; buf.height = H;
  bctx = buf.getContext('2d');
  img = bctx.createImageData(W, H);
  lut = [];
  const cT = Math.cos(TILT), sT = Math.sin(TILT);

  for (let py = 0; py < H; py++) for (let px = 0; px < W; px++) {
    const X  = (px + 0.5 - CX) / R;
    const Yp = (CY - (py + 0.5)) / R;
    const d = X * X + Yp * Yp;
    if (d > 1) continue;                     // вне круга
    const Zp = Math.sqrt(1 - d);

    // убираем наклон, получаем координаты на «прямом» шаре
    const Y = Yp * cT + Zp * sT;
    const Z = -Yp * sT + Zp * cT;
    const lat = Math.asin(Y);
    const a = Math.atan2(X, Z);

    // освещение: свет сверху-слева, 4 ступени (пиксельный стиль)
    const l = -0.5 * X + 0.6 * Yp + 0.62 * Zp;
    const shade = l > 0.75 ? 1 : l > 0.45 ? 0.82 : l > 0.2 ? 0.64 : 0.48;

    // атмосфера у края диска
    const rim = Zp < 0.18 ? 1 : 0;

    const v = Math.min(tex.height - 1, Math.floor((0.5 - lat / Math.PI) * tex.height));
    lut.push({ i: (py * W + px) * 4, a, v, shade, rim });
  }
}

export function drawPlanet(ctx, rotation) {
  const d = img.data, t = tex.data, TW = tex.width;
  for (const p of lut) {
    let u = (p.a - rotation) / TWO_PI;
    u -= Math.floor(u);
    const ti = (p.v * TW + Math.floor(u * TW)) * 4;
    let r = t[ti] * p.shade, g = t[ti + 1] * p.shade, b = t[ti + 2] * p.shade;
    if (p.rim) { r = r * 0.6 + 60; g = g * 0.6 + 110; b = b * 0.6 + 160; }
    d[p.i] = r; d[p.i + 1] = g; d[p.i + 2] = b; d[p.i + 3] = 255;
  }
  bctx.putImageData(img, 0, 0);
  ctx.drawImage(buf, 0, 0);
}
```

В `main.js`:
```js
await loadPlanet('/planet-map.png');
// в onResize():  layoutPlanet(); initStars();
// в render():    drawStars(ctx); drawPlanet(ctx, state.rotation);
```

#### 4.3. Доводка внешнего вида
- **Свечение атмосферы снаружи:** 1–2 пикселя полупрозрачного голубого кольца по контуру круга. Рисуется дугой `ctx.arc` с округлёнными координатами или тоже через LUT.
- **Облака:** второй слой карты (`clouds.png` с прозрачностью), вращается чуть быстрее планеты.
- **Ночная сторона:** вместо затемнения в самой тёмной ступени добавьте жёлтые точки «городов».
- **Подбор ступеней света:** цвета теней лучше брать из палитры, а не просто затемнять. Это сразу выглядит «по-пиксельному». Вариант: сделать 4 версии карты (светлая → тёмная) и выбирать нужную по `shade`.

#### 4.4. Производительность
- На экране планета занимает примерно 30–60 тысяч игровых пикселей, это около 1–2 мс на кадр. Нормально.
- Если начнёт тормозить: замените массив объектов `lut` на типизированные массивы (`Float32Array` для `a`, `Uint16Array` для `v` и т. д.) или обновляйте планету через кадр (вращение медленное, разница незаметна).

**Готово, когда:** внизу экрана медленно крутится пиксельная планета со светом и атмосферой.

**Подводные камни:**
- виден шов на планете → не стыкуются края карты (вернитесь к Tiled Mode);
- искажения вверху → мало сплошной полярной шапки на карте;
- планета «мыльная» → забыли `image-rendering: pixelated`.

---

### Итерация 5. Карточки на планете (3–4 вечера)

**Цель:** карточки стоят на поверхности и вращаются вместе с планетой.

#### 5.1. Данные проектов

Удобный трюк: координаты проекта берутся **прямо из карты в Aseprite**. Наведите курсор на нужное место, внизу видно `x, y`; эти числа и записывайте.

**`src/projects.js`**
```js
const MAP_W = 256, MAP_H = 128;
const fromMap = (x, y) => ({
  lon: (x / MAP_W) * Math.PI * 2,
  lat: (0.5 - y / MAP_H) * Math.PI,
});

export const projects = [
  { id: 'shop',   title: 'Интернет-магазин', ...fromMap(40, 50),  url: '#', preview: '/p/shop.png' },
  { id: 'game',   title: 'Браузерная игра',  ...fromMap(120, 40), url: '#', preview: '/p/game.png' },
  { id: 'studio', title: 'Сайт студии',      ...fromMap(200, 60), url: '#', preview: '/p/studio.png' },
  // ...
];
```

Карточки лучше ставить **в северное полушарие** (y от 20 до 64 на карте). Из-за наклона это видимая и красивая часть шара.

#### 5.2. Проекция точки шара на экран

Это та же математика, что в планете, только в обратную сторону. Поэтому карточки точно совпадают с картой.

**`src/cards.js`**
```js
import { view } from './config.js';
import { planet } from './planet.js';

export function project(lat, lon, rotation) {
  const { R, CX, CY, TILT } = planet;
  const a = lon + rotation;
  const X = Math.cos(lat) * Math.sin(a);
  const Y = Math.sin(lat);
  const Z = Math.cos(lat) * Math.cos(a);
  const Yp = Y * Math.cos(TILT) - Z * Math.sin(TILT);
  const Zp = Y * Math.sin(TILT) + Z * Math.cos(TILT);
  return { x: CX + R * X, y: CY - R * Yp, z: Zp };   // z > 0 — видимая сторона
}
```

#### 5.3. HTML-карточки

Создание (один раз):
```js
const layer = document.querySelector('#cards');
const els = projects.map(p => {
  const el = document.createElement('button');
  el.className = 'card';
  el.innerHTML = `<span class="card__title">${p.title}</span><span class="card__pin"></span>`;
  el.addEventListener('click', () => focusProject(p));
  layer.append(el);
  return el;
});
```

Обновление каждый кадр (меняем только `transform` и `opacity`, это дёшево):
```js
export function updateCards(rotation) {
  projects.forEach((p, i) => {
    const el = els[i];
    const { x, y, z } = project(p.lat, p.lon, rotation);
    const visible = z > 0.12 && y < view.H;
    if (!visible || p === state.selected) { el.style.opacity = 0; el.style.pointerEvents = 'none'; return; }
    const s = 0.55 + 0.45 * z;                         // дальние меньше
    const sx = Math.round(x) * view.PIXEL, sy = Math.round(y) * view.PIXEL;
    el.style.transform = `translate(${sx}px, ${sy}px) translate(-50%, -100%) scale(${s.toFixed(3)})`;
    el.style.opacity = Math.min(1, (z - 0.12) * 4).toFixed(2);   // плавное появление у горизонта
    el.style.zIndex = Math.round(z * 100);                     // ближние поверх дальних
    el.style.pointerEvents = 'auto';
  });
}
```

#### 5.4. Стиль «объёмной» пиксельной карточки

1. В Aseprite нарисуйте **рамку 12×12**: угол 4×4, по 4 пикселя на сторону, середина — фон карточки. Сохраните как `card-frame.png`.
2. Объём даёт толстая нижняя грань (тёмная полоса) и тень, как у блока в игре.
3. «Ножка» — тонкая линия от карточки вниз к поверхности, показывает точку на планете.

```css
.card {
  position: absolute; left: 0; top: 0;
  transform-origin: 50% 100%;
  will-change: transform, opacity;
  font: 12px/1.2 'Pixelify Sans', monospace;
  color: #f4f4f4;
  padding: 6px 10px;
  border: 12px solid transparent;
  border-image: url('/card-frame.png') 4 fill round;
  image-rendering: pixelated;
  box-shadow: 0 4px 0 #1d1d3a, 0 8px 0 rgba(0, 0, 0, .35);   /* «толщина» и тень */
  background: none; cursor: pointer;
}
.card:hover, .card:focus-visible { filter: brightness(1.2); }
.card__pin {
  position: absolute; left: 50%; bottom: -24px;
  width: 4px; height: 12px; background: #ffd56b;
  transform: translateX(-50%);
}
```

Параметры рамки (`4`, `12px`) подгоните так, чтобы пиксель рамки был равен игровому пикселю (×3 или ×4).

**Готово, когда:** карточки стоят на своих местах, уплывают за горизонт и появляются с другой стороны, ближние перекрывают дальние.

**Подводные камни:**
- карточки «дрожат» → округляйте `x` и `y` до игрового пикселя (как в коде выше);
- карточки скапливаются у горизонта → увеличьте порог `z > 0.12` или уменьшите наклон;
- карточки съехали с поверхности после ресайза → `layoutPlanet()` должен вызываться до `updateCards()`.

---

### Итерация 6. Выбор проекта и большая карточка (3–4 вечера)

**Цель:** по клику планета доворачивается к проекту, его карточка взлетает и становится крупной над горизонтом.

#### 6.1. Доворот планеты по кратчайшему пути

Точка оказывается в центре видимой стороны, когда `lon + rotation = 0`, то есть `rotation = -lon`.

```js
import gsap from 'gsap';
const TWO_PI = Math.PI * 2;

export function focusProject(p) {
  let delta = (-p.lon - state.rotation) % TWO_PI;
  if (delta > Math.PI)  delta -= TWO_PI;
  if (delta < -Math.PI) delta += TWO_PI;     // кратчайший путь

  state.autoRotate = false;
  const from = project(p.lat, p.lon, state.rotation);   // откуда «взлетит» карточка

  gsap.to(state, {
    rotation: state.rotation + delta,
    duration: 1.2,
    ease: 'power2.inOut',
    onComplete: () => showHero(p, from),
  });
}
```

#### 6.2. Большая карточка (hero)

- Это отдельный блок `#hero` по центру, примерно на 15–40% высоты экрана, над горизонтом.
- Внутри: превью проекта, название, описание, теги, кнопки «Открыть» и «Закрыть».
- Появление: GSAP-анимация из точки на планете в центр.

```js
function showHero(p, from) {
  const hero = document.querySelector('#hero');
  hero.innerHTML = `
    <img src="${p.preview}" alt="">
    <h2>${p.title}</h2>
    <a href="${p.url}">Открыть проект</a>
    <button class="hero__close">Закрыть</button>`;
  hero.hidden = false;
  state.selected = p;

  const rect = hero.getBoundingClientRect();
  const pt = project(p.lat, p.lon, state.rotation);
  const dx = pt.x * view.PIXEL - (rect.left + rect.width / 2);
  const dy = pt.y * view.PIXEL - rect.bottom;
  gsap.fromTo(hero,
    { x: dx, y: dy, scale: 0.2, opacity: 0 },
    { x: 0, y: 0, scale: 1, opacity: 1, duration: 0.6, ease: 'back.out(1.4)' });

  hero.querySelector('.hero__close').onclick = hideHero;
}

function hideHero() {
  const hero = document.querySelector('#hero');
  gsap.to(hero, { opacity: 0, scale: 0.8, duration: 0.3, onComplete: () => {
    hero.hidden = true;
    state.selected = null;
    state.autoRotate = true;
  }});
}
```

#### 6.3. Навигация
- Стрелки ← → на клавиатуре и кнопки по бокам переключают на соседний проект по долготе.
- Свайп на телефоне: отслеживайте `pointerdown` и `pointerup`, разница по X больше 50 px — переключение.
- Можно разрешить «крутить» планету перетаскиванием: `rotation += dx * 0.005`, после отпускания — инерция через GSAP.

**Готово, когда:** клик по карточке → планета плавно доворачивается → карточка взлетает и раскрывается → «Закрыть» возвращает вращение.

---

### Итерация 7. Адаптив, производительность, доступность (2–3 вечера)

**Мобильные устройства**
- `PIXEL = 3`, меньше звёзд (умножьте `count` на 0.5), 1–2 летающих объекта.
- Планета крупнее относительно ширины, видно 3–4 карточки.
- Большая карточка занимает почти всю ширину.

**Производительность**
- Пауза, когда вкладка скрыта:
  ```js
  document.addEventListener('visibilitychange', () => { paused = document.hidden; });
  ```
- Если сайт — фон под другим контентом, при прокрутке вниз останавливайте цикл (`IntersectionObserver`).
- Проверка: DevTools → Performance, кадр должен укладываться в 16 мс даже на слабом телефоне. Удобно включить в DevTools замедление CPU в 4 раза.

**Доступность**
- Карточки — это `<button>`, они доступны с клавиатуры (Tab), у фокуса видимая обводка.
- Уважайте `prefers-reduced-motion`: отключите автовращение, полёты и параллакс, переходы делайте мгновенными.
  ```js
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  ```
- Запасной вариант: если canvas не поддерживается или JS выключен, показывайте обычный список проектов (`<noscript>` или скрытый список, который показывается при ошибке).
- Контраст текста на карточках — минимум 4.5:1.

**Загрузка**
- Пока грузится карта планеты, показывайте космос (он не зависит от картинок).
- Все PNG маленькие (килобайты), сжимать особо нечего, но можно прогнать через squoosh.app.

**Готово, когда:** сайт плавно работает на телефоне, управляется с клавиатуры и не раздражает людей с чувствительностью к движению.

---

### Итерация 8. Публикация (1 вечер)

1. `npm run build` → появится папка `dist/`.
2. Варианты:
   - **Netlify:** перетащить папку `dist` на app.netlify.com/drop;
   - **Vercel** или **GitHub Pages:** подключить репозиторий, сайт будет обновляться при каждом push.
3. Проверьте сайт на реальном телефоне (iOS Safari и Android Chrome).
4. Не забудьте указать авторов ассетов, если этого требует лицензия (CC BY).

---

## 4. Итоговая оценка времени

| Итерация | Время |
|---|---|
| 0. Подготовка | 1 вечер |
| 1. Арт-дирекция и макет | 1–2 вечера |
| 2. Каркас | 1 вечер |
| 3. Космос | 2–3 вечера |
| 4. Планета | 3–5 вечеров |
| 5. Карточки на планете | 3–4 вечера |
| 6. Выбор проекта | 3–4 вечера |
| 7. Адаптив и полировка | 2–3 вечера |
| 8. Публикация | 1 вечер |
| **Итого** | **примерно 3–5 недель по вечерам** |

Больше всего времени обычно уходит не на код, а на рисование карты и подбор цветов. Это нормально.

---

## 5. Чек-лист перед запуском

- [ ] Карта планеты бесшовная по горизонтали, полюса без деталей
- [ ] Все цвета из одной палитры
- [ ] Один игровой пиксель везде одинакового размера (canvas, рамки, шрифт)
- [ ] Карточки не дрожат и не скапливаются у горизонта
- [ ] Доворот планеты идёт по кратчайшему пути
- [ ] Работает на телефоне, свайпы работают
- [ ] Клавиатура: Tab, Enter, стрелки, Esc закрывает карточку
- [ ] `prefers-reduced-motion` учтён
- [ ] Анимация на паузе в скрытой вкладке
- [ ] Есть запасной список проектов
- [ ] Указаны авторы чужих ассетов, если нужно

---

## 6. Идеи на потом

- **Шейдер вместо Canvas 2D.** Тот же алгоритм планеты на WebGL (фрагментный шейдер): можно делать огромное разрешение, сложное освещение, анимированный океан. Математика остаётся прежней.
- **Своя планета для каждой категории проектов:** несколько планет, переключение между ними «перелётом».
- **Звук:** тихий эмбиент и пиксельные «бипы» при наведении (библиотека Howler.js), обязательно с кнопкой выключения.
- **Сутки на планете:** свет медленно движется, на ночной стороне загораются города.
- **Пасхалка:** редкий пролёт НЛО, по клику на него — секретный проект.

---

## Приложение А. Планета через Pixel Planet Generator (быстрый старт)

Если хочется увидеть результат в первый же день:

1. Откройте Pixel Planet Generator (Deep-Fold, itch.io).
2. Выберите тип планеты, настройте цвета под палитру, задайте размер в пикселях и количество кадров.
3. Экспортируйте спрайт-лист.
4. В коде показывайте кадр `Math.floor((rotation / TWO_PI) * frames) % frames`.

**Минусы:** вращение по кадрам (рывками при медленной скорости), сложнее точно привязать карточки, планета маленькая и при большом увеличении пиксели становятся очень крупными. Подходит как черновик и референс стиля, а основной вариант — Итерация 4.

## Приложение Б. Планета из Blender

1. UV-сфера, на неё текстура планеты, свет сбоку.
2. Рендер в низком разрешении (например, 256×256) — 60–120 кадров полного оборота.
3. В Aseprite: импорт как последовательность кадров, `Color Mode → Indexed` с вашей палитрой.
4. Используется так же, как спрайт-лист из Приложения А.

Даёт более «рендерный» вид, но требует освоения Blender.

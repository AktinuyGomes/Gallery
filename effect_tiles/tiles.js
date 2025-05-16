// Настройки эффекта "Tiles"

// Основные параметры сетки
let TILE_SIZE = 50; // Размер отдельной плитки
let SPACING = 5;   // Расстояние между плитками

// Настройки взаимодействия с мышью
let ENABLE_COLOR_CHANGE = false;       // Менять ли цвет плитки при клике (true | false)
let ENABLE_PERMANENT_OFFSET = false;   // Сохранять ли смещение плитки при клике (true | false)
let HOVER_EFFECT_MODE = "rotate";      // Эффект при наведении: "fade" | "highlight" | "rotate"

// Параметры анимации
let TILE_APPEAR_DURATION = 0.6;        // Длительность анимации появления плитки
let TILE_APPEAR_DELAY_MULTIPLIER = 0.05; // Множитель задержки появления плитки
let CLICK_EFFECT_RADIUS = 150;         // Радиус воздействия при клике
let CLICK_EFFECT_FORCE_MULTIPLIER = 0.1; // Множитель силы эффекта при клике
let CLICK_ANIMATION_DURATION = 0.6;    // Длительность анимации при клике
let RIPPLE_COUNT = 3;                  // Количество пульсирующих кругов при клике
let RIPPLE_BASE_SCALE = 5;             // Базовый размер пульсирующего круга
let RIPPLE_SCALE_MULTIPLIER = 2;     // Множитель размера для последующих пульсирующих кругов
let RIPPLE_DURATION_BASE = 0.8;        // Базовая длительность анимации пульсации
let RIPPLE_DURATION_MULTIPLIER = 0.2;  // Множитель длительности для последующих пульсирующих кругов
let RIPPLE_DELAY_MULTIPLIER = 0.1;     // Множитель задержки для последующих пульсирующих кругов

// Параметры фоновой анимации
let BACKGROUND_ANIMATION_SPEED_X = 0.3; // Скорость фоновой анимации по X
let BACKGROUND_ANIMATION_SPEED_Y = 0.5; // Скорость фоновой анимации по Y
let BACKGROUND_ANIMATION_SCALE_X = 0.03; // Масштаб фоновой анимации по X
let BACKGROUND_ANIMATION_SCALE_Y = 0.05; // Масштаб фоновой анимации по Y

// Параметры эффектов наведения
let HOVER_ALPHA_FADE = 0;              // Альфа при наведении в режиме "fade"
let HOVER_ALPHA_HIGHLIGHT = 0.5;       // Альфа при наведении в режиме "highlight" и "rotate"
let HOVER_SCALE_HIGHLIGHT = 1.08;      // Масштаб при наведении в режиме "highlight" и "rotate"
let HOVER_ROTATION_ROTATE = 0.15;      // Вращение при наведении в режиме "rotate"
let HOVER_OFFSET_X = 2;                // Смещение по X при наведении (кроме режима "fade")
let HOVER_OFFSET_Y = -2;               // Смещение по Y при наведении (кроме режима "fade")
let HOVER_SMOOTHING = 0.2;             // Сглаживание для альфа и масштаба при наведении
let ROTATION_SMOOTHING = 0.1;          // Сглаживание для вращения при наведении


// Проверка Pixi
if (!PIXI || !PIXI.Application) throw new Error("PixiJS не загружен или несовместим");

const app = new PIXI.Application({
  resizeTo: window,
  backgroundAlpha: 0,
  resolution: window.devicePixelRatio,
  antialias: true
});

Object.assign(app.view.style, {
  position: "fixed",
  top: "0",
  left: "0",
  zIndex: "1",
  pointerEvents: "auto"
});
document.body.appendChild(app.view);

let cols, rows;
let tiles = [];
const tileContainer = new PIXI.Container();
app.stage.addChild(tileContainer);

let currentPalette = palettes[Math.floor(Math.random() * palettes.length)];

// Кеш текстур
const textureCache = {};
function getTileTexture(color) {
  if (!textureCache[color]) {
    const g = new PIXI.Graphics();
    g.beginFill(color);
    g.drawRoundedRect(2, 2, TILE_SIZE - 4, TILE_SIZE - 4, 6); // Использован TILE_SIZE
    g.endFill();
    textureCache[color] = app.renderer.generateTexture(g);
  }
  return textureCache[color];
}

const shadowTexture = (() => {
  const s = new PIXI.Graphics();
  s.beginFill(0x000000, 0.25);
  s.drawRoundedRect(4, 4, TILE_SIZE - 4, TILE_SIZE - 4, 6); // Использован TILE_SIZE
  s.endFill();
  return app.renderer.generateTexture(s);
})();

function createTile(x, y, color) {
  const tile = new PIXI.Sprite(getTileTexture(color));
  tile.x = x * (TILE_SIZE + SPACING); // Использованы TILE_SIZE и SPACING
  tile.y = y * (TILE_SIZE + SPACING); // Использованы TILE_SIZE и SPACING
  tile.baseX = tile.x;
  tile.baseY = tile.y;
  tile.offsetX = 0;
  tile.offsetY = 0;
  tile.alpha = 0;
  tile.originalAlpha = 1;
  tile.scale.set(1);
  tile.zIndex = 1;
  tile.tint = color;
  tile.colorIndex = currentPalette.indexOf(color);

  const shadowSprite = new PIXI.Sprite(shadowTexture);
  shadowSprite.x = tile.x + 3;
  shadowSprite.y = tile.y + 3;
  shadowSprite.zIndex = 0;

  tileContainer.addChild(shadowSprite);
  tileContainer.addChild(tile);
  tileContainer.sortChildren();
  tiles.push({ sprite: tile, shadow: shadowSprite });

  gsap.to(tile, {
    alpha: 1,
    duration: TILE_APPEAR_DURATION, // Использован TILE_APPEAR_DURATION
    ease: "power1.out",
    delay: TILE_APPEAR_DELAY_MULTIPLIER * (x + y) + Math.random() * 0.2 // Использован TILE_APPEAR_DELAY_MULTIPLIER
  });
}

function buildGrid() {
  tileContainer.removeChildren();
  tiles = [];

  cols = Math.floor((app.screen.width + SPACING) / (TILE_SIZE + SPACING)); // Использованы TILE_SIZE и SPACING
  rows = Math.floor((app.screen.height + SPACING) / (TILE_SIZE + SPACING)); // Использованы TILE_SIZE и SPACING

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const color = currentPalette[Math.floor(Math.random() * currentPalette.length)];
      createTile(x, y, color);
    }
  }
}

let mouse = { x: -9999, y: -9999 };
['mousemove', 'pointermove'].forEach(event => {
  app.renderer.view.addEventListener(event, (e) => {
    const rect = app.view.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  });
});

app.renderer.view.addEventListener("mouseleave", () => {
  mouse.x = -9999;
  mouse.y = -9999;
});

['click', 'touchstart'].forEach(event => {
  app.renderer.view.addEventListener(event, () => {
    for (let { sprite: tile } of tiles) {
      const centerX = tile.x + TILE_SIZE / 2; // Использован TILE_SIZE
      const centerY = tile.y + TILE_SIZE / 2; // Использован TILE_SIZE
      const dx = mouse.x - centerX;
      const dy = mouse.y - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < CLICK_EFFECT_RADIUS) { // Использован CLICK_EFFECT_RADIUS
        const angle = Math.atan2(dy, dx);
        const force = (CLICK_EFFECT_RADIUS - dist) * CLICK_EFFECT_FORCE_MULTIPLIER; // Использованы CLICK_EFFECT_RADIUS и CLICK_EFFECT_FORCE_MULTIPLIER

        if (ENABLE_PERMANENT_OFFSET) { // Использован ENABLE_PERMANENT_OFFSET
          tile.offsetX += Math.cos(angle) * 2;
          tile.offsetY += Math.sin(angle) * 2;
        }

        if (ENABLE_COLOR_CHANGE) { // Использован ENABLE_COLOR_CHANGE
          tile.colorIndex = (tile.colorIndex + 1) % currentPalette.length;
          const newColor = currentPalette[tile.colorIndex];

          gsap.to(tile, {
            tint: newColor,
            duration: 0.6,
            ease: "power1.out"
          });
        }

        gsap.to(tile, {
          x: "+=" + Math.cos(angle) * force,
          y: "+=" + Math.sin(angle) * force,
          alpha: 0.2, // Это значение можно тоже сделать настраиваемым
          duration: CLICK_ANIMATION_DURATION, // Использован CLICK_ANIMATION_DURATION
          ease: "power1.out",
          yoyo: true,
          repeat: 1
        });
      }
    }

    for (let i = 0; i < RIPPLE_COUNT; i++) { // Использован RIPPLE_COUNT
      const ripple = new PIXI.Graphics();
      ripple.beginFill(0xffffff, 0.15); // Цвет и альфа пульсации можно сделать настраиваемыми
      ripple.drawCircle(0, 0, 10); // Размер начального круга можно сделать настраиваемым
      ripple.endFill();

      const rippleSprite = new PIXI.Sprite(app.renderer.generateTexture(ripple));
      rippleSprite.x = mouse.x;
      rippleSprite.y = mouse.y;
      rippleSprite.anchor.set(0.5);
      rippleSprite.alpha = 0.2; // Начальная альфа пульсации
      app.stage.addChild(rippleSprite);

      gsap.to(rippleSprite.scale, {
        x: RIPPLE_BASE_SCALE + i * RIPPLE_SCALE_MULTIPLIER, // Использованы RIPPLE_BASE_SCALE и RIPPLE_SCALE_MULTIPLIER
        y: RIPPLE_BASE_SCALE + i * RIPPLE_SCALE_MULTIPLIER, // Использованы RIPPLE_BASE_SCALE и RIPPLE_SCALE_MULTIPLIER
        duration: RIPPLE_DURATION_BASE + i * RIPPLE_DURATION_MULTIPLIER, // Использованы RIPPLE_DURATION_BASE и RIPPLE_DURATION_MULTIPLIER
        ease: "power1.out",
        delay: i * RIPPLE_DELAY_MULTIPLIER // Использован RIPPLE_DELAY_MULTIPLIER
      });
      gsap.to(rippleSprite, {
        alpha: 0,
        duration: RIPPLE_DURATION_BASE + i * RIPPLE_DURATION_MULTIPLIER, // Использованы RIPPLE_DURATION_BASE и RIPPLE_DURATION_MULTIPLIER
        delay: i * RIPPLE_DELAY_MULTIPLIER, // Использован RIPPLE_DELAY_MULTIPLIER
        onComplete: () => {
          app.stage.removeChild(rippleSprite);
          rippleSprite.destroy({ children: true, texture: true, baseTexture: true });
        }
      });
    }
  });
});

app.ticker.add(() => {
  const time = performance.now() * 0.001;
  for (let { sprite: tile } of tiles) {
    const centerX = tile.x + TILE_SIZE / 2; // Использован TILE_SIZE
    const centerY = tile.y + TILE_SIZE / 2; // Использован TILE_SIZE
    const dx = mouse.x - centerX;
    const dy = mouse.y - centerY;

    const isHovered = Math.abs(dx) < TILE_SIZE / 2 && Math.abs(dy) < TILE_SIZE / 2; // Использован TILE_SIZE

    let targetAlpha = tile.originalAlpha;
    let targetScale = 1;
    let targetRotation = 0;

    if (HOVER_EFFECT_MODE === "fade") { // Использован HOVER_EFFECT_MODE
      targetAlpha = isHovered ? HOVER_ALPHA_FADE : tile.originalAlpha; // Использован HOVER_ALPHA_FADE
    } else if (HOVER_EFFECT_MODE === "highlight") { // Использован HOVER_EFFECT_MODE
      targetAlpha = isHovered ? HOVER_ALPHA_HIGHLIGHT : tile.originalAlpha; // Использован HOVER_ALPHA_HIGHLIGHT
      targetScale = isHovered ? HOVER_SCALE_HIGHLIGHT : 1; // Использован HOVER_SCALE_HIGHLIGHT
    } else if (HOVER_EFFECT_MODE === "rotate") { // Использован HOVER_EFFECT_MODE
      targetAlpha = isHovered ? HOVER_ALPHA_HIGHLIGHT : tile.originalAlpha; // Использован HOVER_ALPHA_HIGHLIGHT
      targetScale = isHovered ? HOVER_SCALE_HIGHLIGHT : 1; // Использован HOVER_SCALE_HIGHLIGHT
      targetRotation = isHovered ? HOVER_ROTATION_ROTATE : 0; // Использован HOVER_ROTATION_ROTATE
    }

    const offsetHoverX = (HOVER_EFFECT_MODE === "fade") ? 0 : (isHovered ? HOVER_OFFSET_X : 0); // Использованы HOVER_EFFECT_MODE и HOVER_OFFSET_X
    const offsetHoverY = (HOVER_EFFECT_MODE === "fade") ? 0 : (isHovered ? HOVER_OFFSET_Y : 0); // Использованы HOVER_EFFECT_MODE и HOVER_OFFSET_Y

    tile.alpha += (targetAlpha - tile.alpha) * HOVER_SMOOTHING; // Использован HOVER_SMOOTHING
    tile.scale.x += (targetScale - tile.scale.x) * HOVER_SMOOTHING; // Использован HOVER_SMOOTHING
    tile.scale.y += (targetScale - tile.scale.y) * HOVER_SMOOTHING; // Использован HOVER_SMOOTHING
    tile.rotation += (targetRotation - tile.rotation) * ROTATION_SMOOTHING; // Использован ROTATION_SMOOTHING

    tile.x = tile.baseX + tile.offsetX + Math.cos(time + tile.y * BACKGROUND_ANIMATION_SCALE_Y) * BACKGROUND_ANIMATION_SPEED_X + offsetHoverX; // Использованы BACKGROUND_ANIMATION_SCALE_Y и BACKGROUND_ANIMATION_SPEED_X
    tile.y = tile.baseY + tile.offsetY + Math.sin(time + tile.x * BACKGROUND_ANIMATION_SCALE_X) * BACKGROUND_ANIMATION_SPEED_Y + offsetHoverY; // Использованы BACKGROUND_ANIMATION_SCALE_X и BACKGROUND_ANIMATION_SPEED_Y
  }
});


buildGrid();

window.addEventListener('resize', () => setTimeout(buildGrid, 100));

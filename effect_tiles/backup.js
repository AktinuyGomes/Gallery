const app = new PIXI.Application({
  resizeTo: window,
  backgroundAlpha: 0,
  resolution: window.devicePixelRatio,
  antialias: true
});

app.view.style.position = "fixed";
app.view.style.top = "0";
app.view.style.left = "0";
app.view.style.zIndex = "1";
app.view.style.pointerEvents = "auto";
document.body.appendChild(app.view);

const tileSize = 50;
const spacing = 5;
let cols, rows;
let tiles = [];
const tileContainer = new PIXI.Container();
app.stage.addChild(tileContainer);

// Выбираем палитру случайно:
let currentPalette = palettes[Math.floor(Math.random() * palettes.length)];

/* ---------------
   СОЗДАНИЕ ПЛИТКИ
   --------------- */

function createTile(x, y, color) {
  const graphics = new PIXI.Graphics();
  graphics.beginFill(color);
  graphics.drawRoundedRect(2, 2, tileSize - 4, tileSize - 4, 6);
  graphics.endFill();

  const tile = new PIXI.Sprite(app.renderer.generateTexture(graphics));
  tile.x = x * (tileSize + spacing);
  tile.y = y * (tileSize + spacing);
  tile.baseY = tile.y;
  tile.alpha = 0;
  tile.originalAlpha = 1;
  tile.eventMode = 'none'; // отключаем курсор-события, если нужно

  // Тень (можно сделать чуть более мягкую)
  const shadow = new PIXI.Graphics();
  shadow.beginFill(0x000000, 0.25);
  shadow.drawRoundedRect(4, 4, tileSize - 4, tileSize - 4, 6);
  shadow.endFill();

  const shadowSprite = new PIXI.Sprite(app.renderer.generateTexture(shadow));
  shadowSprite.x = tile.x + 3;
  shadowSprite.y = tile.y + 3;
  tileContainer.addChild(shadowSprite);

  tileContainer.addChild(tile);
  tiles.push(tile);

  // Появление плитки с задержкой
  gsap.to(tile, {
    alpha: 1,
    duration: 0.6,
    ease: "power1.out",
    delay: 0.05 * (x + y)
  });
}

/* ---------------
   ПОСТРОЕНИЕ СЕТКИ
   --------------- */

function buildGrid() {
  tileContainer.removeChildren();
  tiles = [];

  cols = Math.floor((app.screen.width + spacing) / (tileSize + spacing));
  rows = Math.floor((app.screen.height + spacing) / (tileSize + spacing));

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      // Берём случайный цвет из текущей палитры
      const color = currentPalette[Math.floor(Math.random() * currentPalette.length)];
      createTile(x, y, color);
    }
  }
}

/* ---------------
   ОБРАБОТКА МЫШИ
   --------------- */

let mouse = { x: -9999, y: -9999 };
app.renderer.view.addEventListener("mousemove", (e) => {
  const rect = app.view.getBoundingClientRect();
  mouse.x = e.clientX - rect.left;
  mouse.y = e.clientY - rect.top;
});

app.renderer.view.addEventListener("mouseleave", () => {
  mouse.x = -9999;
  mouse.y = -9999;
});

app.renderer.view.addEventListener("click", () => {
  for (let tile of tiles) {
    const dx = mouse.x - (tile.x + tileSize / 2);
    const dy = mouse.y - (tile.y + tileSize / 2);
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 150) {
      const angle = Math.atan2(dy, dx);
      const force = (150 - dist) / 10;

      gsap.to(tile, {
        x: tile.x + Math.cos(angle) * force,
        y: tile.y + Math.sin(angle) * force,
        alpha: 0.2,
        duration: 0.4,
        ease: "power2.out",
        yoyo: true,
        repeat: 1
      });
    }
  }

  // Ripple-эффект
  const ripple = new PIXI.Graphics();
  ripple.beginFill(0xffffff, 0.2);
  ripple.drawCircle(0, 0, 10);
  ripple.endFill();
  const rippleSprite = new PIXI.Sprite(app.renderer.generateTexture(ripple));
  rippleSprite.x = mouse.x;
  rippleSprite.y = mouse.y;
  rippleSprite.anchor.set(0.5);
  app.stage.addChild(rippleSprite);

  gsap.to(rippleSprite.scale, {
    x: 10,
    y: 10,
    duration: 0.6,
    ease: "power1.out"
  });
  gsap.to(rippleSprite, {
    alpha: 0,
    duration: 0.6,
    onComplete: () => app.stage.removeChild(rippleSprite)
  });
});

/* ---------------
   АНИМАЦИЯ ПЛИТ
   --------------- */

app.ticker.add(() => {
  const time = performance.now() * 0.001;
  for (let tile of tiles) {
    const centerX = tile.x + tileSize / 2;
    const centerY = tile.y + tileSize / 2;
    const dx = mouse.x - centerX;
    const dy = mouse.y - centerY;

    // Прозрачность при наведении
    if (Math.abs(dx) < tileSize / 2 && Math.abs(dy) < tileSize / 2) {
      tile.alpha += (0 - tile.alpha) * 0.2;
    } else {
      const delay = (centerX + centerY) * 0.00005;
      tile.alpha += (tile.originalAlpha - tile.alpha) * (0.02 + delay);
    }

    // Небольшое колебание по оси Y
    tile.y = tile.baseY + Math.sin(time + tile.x * 0.05) * 0.5;
  }
});

buildGrid();

/* ---------------
   РЕСАЙЗ
   --------------- */

window.addEventListener('resize', () => {
  setTimeout(buildGrid, 100);
});
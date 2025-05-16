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

const tileSize = 50;
const spacing = 5;
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
    g.drawRoundedRect(2, 2, tileSize - 4, tileSize - 4, 6);
    g.endFill();
    textureCache[color] = app.renderer.generateTexture(g);
  }
  return textureCache[color];
}

const shadowTexture = (() => {
  const s = new PIXI.Graphics();
  s.beginFill(0x000000, 0.25);
  s.drawRoundedRect(4, 4, tileSize - 4, tileSize - 4, 6);
  s.endFill();
  return app.renderer.generateTexture(s);
})();

function createTile(x, y, color) {
  const tile = new PIXI.Sprite(getTileTexture(color));
  tile.x = x * (tileSize + spacing);
  tile.y = y * (tileSize + spacing);
  tile.baseX = tile.x;
  tile.baseY = tile.y;
  tile.alpha = 0;
  tile.originalAlpha = 1;
  tile.scale.set(1);
  tile.zIndex = 1;

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
    duration: 0.6,
    ease: "power1.out",
    delay: 0.05 * (x + y) + Math.random() * 0.2
  });
}

function buildGrid() {
  tileContainer.removeChildren();
  tiles = [];

  cols = Math.floor((app.screen.width + spacing) / (tileSize + spacing));
  rows = Math.floor((app.screen.height + spacing) / (tileSize + spacing));

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
      const dx = mouse.x - (tile.x + tileSize / 2);
      const dy = mouse.y - (tile.y + tileSize / 2);
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 150) {
        const angle = Math.atan2(dy, dx);
        const force = (150 - dist) / 10;

        gsap.to(tile, {
          x: "+=" + Math.cos(angle) * force,
          y: "+=" + Math.sin(angle) * force,
          alpha: 0.2,
          duration: 0.6,
          ease: "power1.out",
          yoyo: true,
          repeat: 1
        });
      }
    }

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
      onComplete: () => {
        app.stage.removeChild(rippleSprite);
        rippleSprite.destroy({ children: true, texture: true, baseTexture: true });
      }
    });
  });
});

app.ticker.add(() => {
  const time = performance.now() * 0.001;
  for (let { sprite: tile } of tiles) {
    const centerX = tile.x + tileSize / 2;
    const centerY = tile.y + tileSize / 2;
    const dx = mouse.x - centerX;
    const dy = mouse.y - centerY;

    const isHovered = Math.abs(dx) < tileSize / 2 && Math.abs(dy) < tileSize / 2;
    const targetAlpha = isHovered ? 0.5 : tile.originalAlpha;
    tile.alpha += (targetAlpha - tile.alpha) * 0.2;

    const targetScale = isHovered ? 1.08 : 1;
    tile.scale.x += (targetScale - tile.scale.x) * 0.2;
    tile.scale.y += (targetScale - tile.scale.y) * 0.2;

    tile.x = tile.baseX + Math.cos(time + tile.y * 0.03) * 0.3;
    tile.y = tile.baseY + Math.sin(time + tile.x * 0.05) * 0.5;
  }
});

buildGrid();

window.addEventListener('resize', () => setTimeout(buildGrid, 100));

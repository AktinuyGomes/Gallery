// Получаем ссылку на панель
const settingsPanel = document.getElementById('settings-panel');

// Обработчик нажатия клавиши 'H'
document.addEventListener('keydown', (event) => {
    if (event.key === 'h' || event.key === 'H') {
        settingsPanel.classList.toggle('hidden');
    }
});

// Функция для связывания элементов управления с параметрами
function setupTilesSettings() {
    // Получаем ссылки на элементы управления
    const tileSizeControl = document.getElementById('tile-size');
    const tileSizeValueDisplay = document.getElementById('tile-size-value');
    const spacingControl = document.getElementById('spacing');
    const spacingValueDisplay = document.getElementById('spacing-value');
    const enableColorChangeControl = document.getElementById('enable-color-change');
    const enablePermanentOffsetControl = document.getElementById('enable-permanent-offset');
    const hoverEffectModeControl = document.getElementById('hover-effect-mode');

    // Проверяем, доступны ли переменные эффекта Tiles
    if (typeof TILE_SIZE !== 'undefined') {
        // Устанавливаем начальные значения на панели из скрипта эффекта
        tileSizeControl.value = TILE_SIZE;
        tileSizeValueDisplay.textContent = TILE_SIZE;
        spacingControl.value = SPACING;
        spacingValueDisplay.textContent = SPACING;
        enableColorChangeControl.checked = ENABLE_COLOR_CHANGE;
        enablePermanentOffsetControl.checked = ENABLE_PERMANENT_OFFSET;
        hoverEffectModeControl.value = HOVER_EFFECT_MODE;

        // Добавляем обработчики событий для обновления параметров эффекта
        tileSizeControl.addEventListener('input', (event) => {
            TILE_SIZE = parseInt(event.target.value, 10);
            tileSizeValueDisplay.textContent = TILE_SIZE;
            // Здесь нужно будет вызвать функцию в tiles.js для перестройки сетки
            if (typeof buildGrid === 'function') {
                buildGrid();
            }
        });

        spacingControl.addEventListener('input', (event) => {
            SPACING = parseInt(event.target.value, 10);
            spacingValueDisplay.textContent = SPACING;
            // Здесь нужно будет вызвать функцию в tiles.js для перестройки сетки
             if (typeof buildGrid === 'function') {
                buildGrid();
            }
        });

        enableColorChangeControl.addEventListener('change', (event) => {
            ENABLE_COLOR_CHANGE = event.target.checked;
        });

        enablePermanentOffsetControl.addEventListener('change', (event) => {
            ENABLE_PERMANENT_OFFSET = event.target.checked;
        });

        hoverEffectModeControl.addEventListener('change', (event) => {
            HOVER_EFFECT_MODE = event.target.value;
        });

        // Обработчики для других параметров Tiles будут добавлены позже
    }
}

// Вызываем функцию настройки для эффекта Tiles после загрузки страницы
// Важно убедиться, что скрипт tiles.js уже загружен и выполнился
window.addEventListener('load', () => {
    setupTilesSettings();
});
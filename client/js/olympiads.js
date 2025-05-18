window.init_olympiads = function () {
    console.log('Инициализация раздела "Олимпиады"');
    if (typeof initializeTooltips === 'function') {
        initializeTooltips();
    } else {
        console.error('Функция initializeTooltips не определена');
    }
    if (typeof loadOlympiads === 'function') {
        loadOlympiads();
    } else {
        console.error('Функция loadOlympiads не определена');
    }
    if (typeof setupEventListeners === 'function') {
        setupEventListeners();
    } else {
        console.error('Функция setupEventListeners не определена');
    }
};
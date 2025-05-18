console.log('Начало загрузки olympiad-summary.js');
window.init_olympiad_summary = function () {
    console.log('Инициализация Олимпиадной сводки');
    loadOlympiadSummary();
};

async function loadOlympiadSummary() {
    const statsDiv = document.getElementById('olympiad-stats');
    if (!statsDiv) return;

    try {
        const response = await fetch('/api/olympiads/summary');
        if (!response.ok) throw new Error('Ошибка загрузки сводки');
        const summary = await response.json();

        let statsHtml = '<h3>Статистика участия</h3>';
        statsHtml += '<p>Школьный этап: ' + (summary.school.participants || 0) + ' человек</p>';
        statsHtml += '<p>Муниципальный этап: ' + (summary.municipal.participants || 0) + ' человек</p>';
        statsHtml += '<p>Районный этап: ' + (summary.regional.participants || 0) + ' человек</p>';
        statsHtml += '<p>Финал: ' + (summary.final.participants || 0) + ' человек</p>';

        statsHtml += '<h3>Участники по предметам</h3>';
        statsHtml += '<table class="table"><thead><tr><th>Предмет</th><th>Школьный</th><th>Муниципальный</th><th>Районный</th><th>Финал</th></tr></thead><tbody>';
        summary.subjects.forEach(subject => {
            statsHtml += '<tr>';
            statsHtml += `<td>${subject.name}</td>`;
            statsHtml += `<td>${subject.school || 0}</td>`;
            statsHtml += `<td>${subject.municipal || 0}</td>`;
            statsHtml += `<td>${subject.regional || 0}</td>`;
            statsHtml += `<td>${subject.final || 0}</td>`;
            statsHtml += '</tr>';
        });
        statsHtml += '</tbody></table>';

        statsDiv.innerHTML = statsHtml;
    } catch (error) {
        console.error('Ошибка в loadOlympiadSummary:', error);
        statsDiv.innerHTML = '<p>Ошибка загрузки сводки: ' + error.message + '</p>';
    }
}
console.log('Файл olympiad-summary.js полностью загружен');
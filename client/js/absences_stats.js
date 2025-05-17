document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('absences-stats-section')) {
        loadStatistics();
        setupEventListeners();
    }
});

function setupEventListeners() {
    document.getElementById('statsFilterBtn').addEventListener('click', () => {
        const statsFilter = document.getElementById('statsFilter').value;
        loadStatistics(statsFilter);
    });
}

async function loadStatistics(filter = '') {
    const statsTable = document.getElementById('statsTable');
    if (!statsTable) return;

    try {
        let url = '/api/statistics';
        if (filter) url += `?student=${encodeURIComponent(filter)}`;

        const response = await fetch(url);
        if (!response.ok) throw new Error('Ошибка загрузки данных');
        const data = await response.json();

        statsTable.innerHTML = `
            <table>
                <thead><tr><th>Ученик</th><th>Общее число пропусков</th><th>Обоснованных</th><th>Необоснованных</th></tr></thead>
                <tbody>${data.map(item => `
                    <tr><td>${item.student}</td><td>${item.total}</td><td>${item.excused}</td><td>${item.unexcused}</td></tr>
                `).join('')}</tbody>
            </table>
        `;
    } catch (error) {
        statsTable.innerHTML = `<p>Ошибка загрузки данных: ${error.message}</p>`;
    }
}
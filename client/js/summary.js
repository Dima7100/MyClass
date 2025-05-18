window.init_summary = function () {
    console.log('Инициализация раздела "Сводка"');
    loadStudentBoxes();
    setupEventListeners();
};

async function loadStudentBoxes() {
    const container = document.getElementById('student-boxes');
    if (!container) {
        console.error('Элемент #student-boxes не найден');
        return;
    }

    try {
        console.log('Отправка запроса к /api/summary/students');
        const response = await fetch('/api/summary/students');
        if (!response.ok) throw new Error('Ошибка загрузки данных: ' + response.status);
        const data = await response.json();
        console.log('Получены данные:', data);

        container.innerHTML = data.map(student => `
            <div class="col-md-3 student-box" data-student-id="${student.id}">
                ${student.full_name}
            </div>
        `).join('');

        document.querySelectorAll('.student-box').forEach(box => {
            box.addEventListener('click', () => showSummary(box.dataset.studentId));
        });
    } catch (error) {
        console.error('Ошибка в loadStudentBoxes:', error);
        container.innerHTML = `<p>Ошибка загрузки учеников: ${error.message}</p>`;
    }
}

function setupEventListeners() {
    document.getElementById('print-summary-btn').addEventListener('click', () => {
        window.print();
    });
}

async function showSummary(studentId) {
    const modalBody = document.getElementById('summary-content');
    const modalTitle = document.getElementById('studentSummaryModalLabel');
    const modal = new bootstrap.Modal(document.getElementById('studentSummaryModal'));

    try {
        console.log(`Отправка запроса к /api/summary/${studentId}`);
        const response = await fetch(`/api/summary/${studentId}`);
        if (!response.ok) throw new Error('Ошибка загрузки сводки');
        const data = await response.json();
        console.log('Получены данные сводки:', data);

        modalTitle.textContent = `Сводка по ${data.full_name}`;
        modalBody.innerHTML = `
            <h4>Имя Фамилия Отчество</h4>
            <p>${data.full_name}</p>

            <h4>Мероприятия (${data.events.participated.length} из ${data.events.total})</h4>
            <ul>${data.events.participated.map(e => `<li>${e}</li>`).join('') || '<li>Нет данных</li>'}</ul>

            <h4>Поручения</h4>
            <ul>
                <li><strong>Выполнены:</strong> ${data.tasks.completed.map(t => `<li>${t}</li>`).join('') || '<li>Нет</li>'}</li>
                <li><strong>Не выполнены:</strong> ${data.tasks.incomplete.map(t => `<li>${t}</li>`).join('') || '<li>Нет</li>'}</li>
            </ul>

            <h4>Олимпиады</h4>
            <ul>${data.olympiads.participations.map(p => `<li>${p[0]} - ${p[1]}</li>`).join('') || '<li>Нет данных</li>'}</ul>

            <h4>Пропуски (${data.absences.totalAbsences} из ${data.absences.totalDays})</h4>
            <ul>${data.absences.records.map(r => `<li>${r[0]} - ${r[1]}</li>`).join('') || '<li>Нет данных</li>'}</ul>
        `;

        modal.show();
    } catch (error) {
        console.error('Ошибка в showSummary:', error);
        modalBody.innerHTML = `<p>Ошибка загрузки данных: ${error.message}</p>`;
        modal.show();
    }
}
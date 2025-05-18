window.init_events = function () {
    console.log('Инициализация раздела "Мероприятия"');
    loadEvents();
    setupEventListeners();
};

async function loadEvents() {
    const thead = document.querySelector('#events-table thead tr');
    const tbody = document.querySelector('#events-table tbody');
    if (!thead || !tbody) {
        console.error('Элементы thead или tbody не найдены');
        return;
    }

    try {
        // Получаем мероприятия через API
        const eventsResponse = await fetch('/api/events');
        if (!eventsResponse.ok) throw new Error('Ошибка загрузки мероприятий');
        const events = await eventsResponse.json();

        // Получаем данные об участии через API
        const participationsResponse = await fetch('/api/events/participations');
        if (!participationsResponse.ok) throw new Error('Ошибка загрузки данных об участии');
        const participations = await participationsResponse.json();

        // Получаем список учеников
        const studentsResponse = await fetch('/api/students');
        if (!studentsResponse.ok) throw new Error('Ошибка загрузки учеников');
        const students = await studentsResponse.json();

        thead.innerHTML = `
            <tr>
                <th>ФИО</th>
                ${events.map(event => `
                    <th title="${event.description || ''}">${event.name} (${event.weight})</th>
                `).join('')}
            </tr>
        `;

        tbody.innerHTML = students.map(student => {
            const studentParticipations = participations.filter(p => p.student_id === student.id);
            const [lastName, firstName] = student.full_name.split(' ').slice(0, 2); // Берем только Фамилию и Имя
            const shortName = `${lastName} ${firstName.charAt(0).toUpperCase()}.`;
            return `
                <tr data-student-id="${student.id}">
                    <td>${shortName}</td>
                    ${events.map(event => {
                        const participation = studentParticipations.find(p => p.event_id === event.id);
                        return `
                            <td data-event-id="${event.id}" data-student-id="${student.id}"
                                style="${participation ? 'background-color: #d4edda' : ''}">
                                ${participation ? event.weight : ''}
                            </td>`;
                    }).join('')}
                </tr>
            `;
        }).join('');

        document.querySelectorAll('.event-table td').forEach(td => {
            td.addEventListener('click', (e) => {
                const eventId = td.dataset.eventId;
                const studentId = td.dataset.studentId;
                if (eventId && studentId) {
                    toggleParticipation(eventId, studentId, td);
                }
            });

            // Добавляем обработчик для редактирования мероприятия при клике на заголовок
            document.querySelectorAll('.event-table th').forEach((th, index) => {
                if (index !== 0) { // Пропускаем первый столбец (ФИО)
                    th.addEventListener('click', () => {
                        const eventId = events[index - 1].id;
                        editEvent(eventId);
                    });
                }
            });
        });
    } catch (error) {
        console.error('Ошибка в loadEvents:', error);
        tbody.innerHTML = '<tr><td colspan="100">Ошибка загрузки данных: ' + error.message + '</td></tr>';
    }
}

function setupEventListeners() {
    const saveEventBtn = document.getElementById('save-event-btn');
    const modalTitle = document.getElementById('addEventModalLabel');
    const modal = new bootstrap.Modal(document.getElementById('addEventModal'));

    let editingEventId = null;

    saveEventBtn.addEventListener('click', async () => {
        const name = document.getElementById('event-name').value.trim();
        const description = document.getElementById('event-description').value.trim();
        const weight = parseInt(document.getElementById('event-weight').value);

        if (!name || !weight) {
            alert('Название и вес обязательны');
            return;
        }

        try {
            let response;
            if (editingEventId) {
                response = await fetch(`/api/events/${editingEventId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, description, weight })
                });
            } else {
                response = await fetch('/api/events', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, description, weight })
                });
            }

            if (!response.ok) throw new Error('Ошибка сохранения мероприятия');
            modal.hide();
            editingEventId = null;
            modalTitle.textContent = 'Добавить мероприятие';
            document.getElementById('event-name').value = '';
            document.getElementById('event-description').value = '';
            document.getElementById('event-weight').value = '';

            await loadEvents();
        } catch (error) {
            console.error('Ошибка при сохранении мероприятия:', error);
            alert(`Ошибка: ${error.message}`);
        }
    });

    async function editEvent(eventId) {
        try {
            console.log('Редактирование мероприятия с ID:', eventId);
            const response = await fetch(`/api/events/${eventId}`);
            if (!response.ok) throw new Error('Ошибка загрузки данных мероприятия');
            const event = await response.json();

            document.getElementById('event-name').value = event.name;
            document.getElementById('event-description').value = event.description || '';
            document.getElementById('event-weight').value = event.weight;
            document.getElementById('addEventModalLabel').textContent = 'Редактировать мероприятие';
            window.editingEventId = eventId;

            const modal = new bootstrap.Modal(document.getElementById('addEventModal'));
            modal.show();
        } catch (error) {
            console.error('Ошибка при редактировании мероприятия:', error);
            alert(`Ошибка: ${error.message}`);
        }
    }

    async function toggleParticipation(eventId, studentId, td) {
        try {
            const participationExistsResponse = await fetch(`/api/events/participations?event_id=${eventId}&student_id=${studentId}`);
            if (!participationExistsResponse.ok) throw new Error('Ошибка проверки участия');
            const participationData = await participationExistsResponse.json();

            let response;
            if (participationData.length > 0) {
                // Удаляем участие
                response = await fetch(`/api/event_participations/${participationData[0].id}`, {
                    method: 'DELETE'
                });
                if (!response.ok) throw new Error('Ошибка удаления участия');
                td.textContent = '';
                td.style.backgroundColor = ''; // Убираем цвет
            } else {
                // Добавляем участие
                response = await fetch('/api/events/participation', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ event_id: eventId, student_id: studentId })
                });
                if (!response.ok) throw new Error('Ошибка добавления участия');
                const eventResponse = await fetch(`/api/events/${eventId}`);
                const event = await eventResponse.json();
                td.textContent = event.weight;
                td.style.backgroundColor = '#d4edda'; // Светло-зелёный фон
            }

            if (!response.ok) throw new Error('Ошибка обновления участия');
        } catch (error) {
            console.error('Ошибка при обновлении участия:', error);
            alert(`Ошибка: ${error.message}`);
        }
    }
}
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
        const eventsResponse = await fetch('/api/events');
        if (!eventsResponse.ok) throw new Error('Ошибка загрузки мероприятий');
        const events = await eventsResponse.json();
        console.log('Мероприятия:', events);

        const participationsResponse = await fetch('/api/events/participations');
        if (!participationsResponse.ok) throw new Error('Ошибка загрузки данных об участии');
        const participations = await participationsResponse.json();
        console.log('Участия:', participations);

        const studentsResponse = await fetch('/api/students');
        if (!studentsResponse.ok) throw new Error('Ошибка загрузки учеников');
        const students = await studentsResponse.json();
        console.log('Ученики:', students);

        // Заголовок таблицы: первый столбец — "Названия мероприятий", остальные — ученики
        thead.innerHTML = `
            <tr>
                <th>Названия мероприятий</th>
                ${students.map(student => {
                    const [lastName, firstName] = student.full_name.split(' ').slice(0, 2);
                    const shortName = `${lastName} ${firstName.charAt(0).toUpperCase()}.`;
                    return `<th>${shortName}</th>`;
                }).join('')}
            </tr>
        `;

        // Тело таблицы: строки для каждого мероприятия
        tbody.innerHTML = events.map(event => {
            const eventParticipations = participations.filter(p => p.event_id === event.id);
            return `
                <tr>
                    <td class="event-name" data-event-id="${event.id}" title="${event.description || ''}">${event.name}</td>
                    ${students.map(student => {
                        const participation = eventParticipations.find(p => p.student_id === student.id);
                        return `
                            <td data-event-id="${event.id}" data-student-id="${student.id}"
                                style="${participation ? 'background-color: #d4edda' : ''}">
                                ${participation ? event.weight : ''}
                            </td>`;
                    }).join('')}
                </tr>
            `;
        }).join('');

        // Строка "Сумма баллов"
        const totalScoresRow = `
            <tr>
                <td>Сумма баллов</td>
                ${students.map(student => {
                    const studentParticipations = participations.filter(p => p.student_id === student.id);
                    const totalScore = studentParticipations.reduce((sum, p) => {
                        const event = events.find(e => e.id === p.event_id);
                        return sum + (event ? event.weight : 0);
                    }, 0);
                    return `<td>${totalScore}</td>`;
                }).join('')}
            </tr>
        `;
        tbody.insertAdjacentHTML('beforeend', totalScoresRow);

        // Обработчик клика для редактирования мероприятия
        document.querySelectorAll('.event-name').forEach(td => {
            td.addEventListener('click', () => {
                const eventId = td.dataset.eventId;
                editEvent(eventId);
            });
        });

        // Обработчик клика для отметки участия
        document.querySelectorAll('.event-table td:not(:first-child)').forEach(td => {
            td.addEventListener('click', (e) => {
                const eventId = td.dataset.eventId;
                const studentId = td.dataset.studentId;
                if (eventId && studentId) {
                    toggleParticipation(eventId, studentId, td);
                }
            });
        });
    } catch (error) {
        console.error('Ошибка в loadEvents:', error);
        tbody.innerHTML = '<tr><td colspan="100">Ошибка загрузки данных: ' + error.message + '</td></tr>';
    }
}

async function toggleParticipation(eventId, studentId, td) {
    try {
        console.log(`Проверка участия: eventId=${eventId}, studentId=${studentId}`);
        const participationExistsResponse = await fetch(`/api/events/participations?event_id=${eventId}&student_id=${studentId}`);
        if (!participationExistsResponse.ok) throw new Error('Ошибка проверки участия');
        const participationData = await participationExistsResponse.json();
        console.log('Данные участия:', participationData);

        let response;
        if (participationData.length > 0) {
            console.log('Удаление участия:', participationData[0].id);
            response = await fetch(`/api/event_participations/${participationData[0].id}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Ошибка удаления участия');
            td.textContent = '';
            td.style.backgroundColor = '';
        } else {
            console.log('Добавление участия');
            response = await fetch('/api/events/participation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ event_id: eventId, student_id: studentId })
            });
            if (!response.ok) throw new Error('Ошибка добавления участия');
            const eventResponse = await fetch(`/api/events/${eventId}`);
            if (!eventResponse.ok) throw new Error('Ошибка загрузки данных мероприятия');
            const event = await eventResponse.json();
            console.log('Данные мероприятия:', event);
            td.textContent = event.weight;
            td.style.backgroundColor = '#d4edda';
        }

        // Перезагружаем таблицу для обновления "Сумма баллов"
        loadEvents();
    } catch (error) {
        console.error('Ошибка при обновлении участия:', error);
        alert(`Ошибка: ${error.message}`);
    }
}

function setupEventListeners() {
    const saveEventBtn = document.getElementById('save-event-btn');
    const deleteEventBtn = document.getElementById('delete-event-btn');
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
            deleteEventBtn.style.display = 'none';

            await loadEvents();
        } catch (error) {
            console.error('Ошибка при сохранении мероприятия:', error);
            alert(`Ошибка: ${error.message}`);
        }
    });

    deleteEventBtn.addEventListener('click', async () => {
        if (!editingEventId) return;

        if (confirm('Вы уверены, что хотите удалить это мероприятие?')) {
            try {
                const response = await fetch(`/api/events/${editingEventId}`, {
                    method: 'DELETE'
                });
                if (!response.ok) throw new Error('Ошибка удаления мероприятия');
                modal.hide();
                editingEventId = null;
                modalTitle.textContent = 'Добавить мероприятие';
                document.getElementById('event-name').value = '';
                document.getElementById('event-description').value = '';
                document.getElementById('event-weight').value = '';
                deleteEventBtn.style.display = 'none';

                await loadEvents();
            } catch (error) {
                console.error('Ошибка при удалении мероприятия:', error);
                alert(`Ошибка: ${error.message}`);
            }
        }
    });

    window.editEvent = function(eventId) {
        fetch(`/api/events/${eventId}`)
            .then(response => {
                if (!response.ok) throw new Error('Ошибка загрузки данных мероприятия');
                return response.json();
            })
            .then(event => {
                document.getElementById('event-name').value = event.name;
                document.getElementById('event-description').value = event.description || '';
                document.getElementById('event-weight').value = event.weight;
                modalTitle.textContent = 'Редактировать мероприятие';
                editingEventId = eventId;
                deleteEventBtn.style.display = 'inline-block';
                modal.show();
            })
            .catch(error => {
                console.error('Ошибка при редактировании мероприятия:', error);
                alert(`Ошибка: ${error.message}`);
            });
    };
}
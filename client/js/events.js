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
        const [events] = await db.execute('SELECT * FROM events ORDER BY name ASC');
        const [participations] = await db.execute(`
            SELECT ep.event_id, ep.student_id, s.full_name
            FROM event_participations ep
            JOIN students s ON ep.student_id = s.id
        `);

        thead.innerHTML = `
            <tr>
                <th>ФИО</th>
                ${events.map(event => `
                    <th title="${event.description || ''}">${event.name} (${event.weight})</th>
                `).join('')}
            </tr>
        `;

        const students = await (await fetch('/api/students')).json();
        tbody.innerHTML = students.map(student => {
            const studentParticipations = participations.filter(p => p.student_id === student.id);
            return `
                <tr data-student-id="${student.id}">
                    <td>${student.full_name}</td>
                    ${events.map(event => {
                        const participation = studentParticipations.find(p => p.event_id === event.id);
                        return `<td data-event-id="${event.id}" data-student-id="${student.id}">
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
                } else if (eventId) {
                    editEvent(eventId);
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
            modalTitle.textContent = 'Редактировать мероприятие';
            editingEventId = eventId;

            modal.show();
        } catch (error) {
            console.error('Ошибка при редактировании мероприятия:', error);
            alert(`Ошибка: ${error.message}`);
        }
    }

    async function toggleParticipation(eventId, studentId, td) {
        try {
            const currentValue = td.textContent.trim() ? parseInt(td.textContent) : 0;
            const participationExists = await fetch(`/api/event_participations?event_id=${eventId}&student_id=${studentId}`);
            const participationData = await participationExists.json();

            let response;
            if (participationData.length > 0) {
                response = await fetch(`/api/event_participations/${participationData[0].id}`, {
                    method: 'DELETE'
                });
                td.textContent = '';
                td.style.backgroundColor = '';
            } else {
                response = await fetch('/api/event_participations', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ event_id: eventId, student_id: studentId })
                });
                const event = (await fetch(`/api/events/${eventId}`)).json();
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
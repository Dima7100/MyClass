window.init_events = function () {
    console.log('Инициализация раздела "Мероприятия"');
    loadEvents();
    setupEventListeners();
};

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

        if (!name || isNaN(weight) || weight < 1) {
            alert('Введите корректное название и вес мероприятия');
            return;
        }

        try {
            const eventData = { name, description, weight };
            let response;
            if (editingEventId) {
                response = await fetch(`/api/events/${editingEventId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(eventData)
                });
            } else {
                response = await fetch('/api/events', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(eventData)
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
            alert(`Ошибка: ${error.message}`);
        }
    });

    deleteEventBtn.addEventListener('click', async () => {
        if (confirm('Удалить мероприятие?')) {
            try {
                const response = await fetch(`/api/events/${editingEventId}`, { method: 'DELETE' });
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
                alert(`Ошибка: ${error.message}`);
            }
        }
    });
}

async function loadEvents() {
    const table = document.getElementById('events-table');
    if (!table) return;

    try {
        const response = await fetch('/api/events');
        if (!response.ok) throw new Error('Ошибка загрузки данных');
        const { events, participations, students } = await response.json();

        // Заголовки таблицы
        const headerRow = document.getElementById('events-header');
        headerRow.innerHTML = '<th>Название мероприятия</th>' + students.map(s => `<th>${s.full_name}</th>`).join('');

        // Тело таблицы
        const tbody = table.querySelector('tbody');
        tbody.innerHTML = events.map(event => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="event-name" data-event-id="${event.id}">${event.name}</td>
                ${students.map(student => {
                    const isParticipating = participations.some(p => p.event_id === event.id && p.student_id === student.id);
                    return `<td class="participation ${isParticipating ? 'active' : ''}" data-event-id="${event.id}" data-student-id="${student.id}">${isParticipating ? event.weight : ''}</td>`;
                }).join('')}
            `;
            return row.outerHTML;
        }).join('');

        // Добавляем обработчики для названий мероприятий
        document.querySelectorAll('.event-name').forEach(cell => {
            cell.addEventListener('click', () => editEvent(cell.dataset.eventId));
        });

        // Добавляем обработчики для ячеек участия
        document.querySelectorAll('.participation').forEach(cell => {
            cell.addEventListener('click', () => toggleParticipation(cell));
        });

        // Подсчёт суммы баллов
        const totalRow = document.getElementById('events-total');
        const totals = students.map(student => {
            return events.reduce((sum, event) => {
                const isParticipating = participations.some(p => p.event_id === event.id && p.student_id === student.id);
                return sum + (isParticipating ? event.weight : 0);
            }, 0);
        });
        totalRow.innerHTML = '<td>Сумма баллов</td>' + totals.map(total => `<td>${total}</td>`).join('');
    } catch (error) {
        table.querySelector('tbody').innerHTML = `<tr><td colspan="${students.length + 1}">Ошибка загрузки данных: ${error.message}</td></tr>`;
    }
}

async function editEvent(eventId) {
    try {
        const response = await fetch(`/api/events/${eventId}`);
        if (!response.ok) throw new Error('Ошибка загрузки данных мероприятия');
        const event = await response.json();

        document.getElementById('event-name').value = event.name;
        document.getElementById('event-description').value = event.description || '';
        document.getElementById('event-weight').value = event.weight;
        document.getElementById('addEventModalLabel').textContent = 'Редактировать мероприятие';
        document.getElementById('delete-event-btn').style.display = 'block';
        document.getElementById('save-event-btn').textContent = 'Сохранить';
        document.getElementById('delete-event-btn').dataset.eventId = eventId;
        new bootstrap.Modal(document.getElementById('addEventModal')).show();
    } catch (error) {
        alert(`Ошибка: ${error.message}`);
    }
}

async function toggleParticipation(cell) {
    const eventId = parseInt(cell.dataset.eventId);
    const studentId = parseInt(cell.dataset.studentId);

    try {
        const response = await fetch('/api/events/participation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ event_id: eventId, student_id: studentId })
        });
        if (!response.ok) throw new Error('Ошибка изменения участия');

        const message = document.getElementById('status-message');
        const isParticipating = cell.classList.contains('active');
        message.className = 'alert alert-' + (isParticipating ? 'warning' : 'success');
        message.textContent = `Участие ${isParticipating ? 'удалено' : 'засчитано'}`;
        message.classList.add('show');
        setTimeout(() => message.classList.remove('show'), 2000);

        await loadEvents();
    } catch (error) {
        alert(`Ошибка: ${error.message}`);
    }
}
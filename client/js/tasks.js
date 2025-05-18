window.init_tasks = function () {
    console.log('Инициализация раздела "Поручения"');
    loadTasks();
    setupEventListeners();
};

function setupEventListeners() {
    const saveTaskBtn = document.getElementById('save-task-btn');
    const deleteTaskBtn = document.getElementById('delete-task-btn');
    const modalTitle = document.getElementById('addTaskModalLabel');
    const modal = new bootstrap.Modal(document.getElementById('addTaskModal'));

    let editingTaskId = null;

    saveTaskBtn.addEventListener('click', async () => {
        const description = document.getElementById('task-description').value.trim();

        if (!description) {
            alert('Введите описание поручения');
            return;
        }

        try {
            const taskData = { description };
            let response;
            if (editingTaskId) {
                response = await fetch(`/api/tasks/${editingTaskId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(taskData)
                });
            } else {
                response = await fetch('/api/tasks', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(taskData)
                });
            }

            if (!response.ok) throw new Error('Ошибка сохранения поручения');
            modal.hide();
            editingTaskId = null;
            modalTitle.textContent = 'Добавить поручение';
            document.getElementById('task-description').value = '';
            deleteTaskBtn.style.display = 'none';
            await loadTasks();
        } catch (error) {
            alert(`Ошибка: ${error.message}`);
        }
    });

    deleteTaskBtn.addEventListener('click', async () => {
        if (confirm('Удалить поручение?')) {
            try {
                const response = await fetch(`/api/tasks/${editingTaskId}`, { method: 'DELETE' });
                if (!response.ok) throw new Error('Ошибка удаления поручения');
                modal.hide();
                editingTaskId = null;
                modalTitle.textContent = 'Добавить поручение';
                document.getElementById('task-description').value = '';
                deleteTaskBtn.style.display = 'none';
                await loadTasks();
            } catch (error) {
                alert(`Ошибка: ${error.message}`);
            }
        }
    });
}

async function loadTasks() {
    const table = document.getElementById('tasks-table');
    if (!table) return;

    try {
        const response = await fetch('/api/tasks');
        if (!response.ok) throw new Error('Ошибка загрузки данных');
        const { tasks, completions, students } = await response.json();

        // Заголовки таблицы
        const headerRow = document.getElementById('tasks-header');
        headerRow.innerHTML = '<th>Поручение</th>' + students.map(s => `<th>${s.full_name}</th>`).join('');

        // Тело таблицы
        const tbody = table.querySelector('tbody');
        tbody.innerHTML = tasks.map(task => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="task-name" data-task-id="${task.id}">${task.description}</td>
                ${students.map(student => {
                    const isCompleted = completions.some(c => c.task_id === task.id && c.student_id === student.id);
                    return `<td class="completion ${isCompleted ? 'active' : ''}" data-task-id="${task.id}" data-student-id="${student.id}">${isCompleted ? '✓' : ''}</td>`;
                }).join('')}
            `;
            return row.outerHTML;
        }).join('');

        // Добавляем обработчики для названий поручений
        document.querySelectorAll('.task-name').forEach(cell => {
            cell.addEventListener('click', () => editTask(cell.dataset.taskId));
        });

        // Добавляем обработчики для ячеек выполнения
        document.querySelectorAll('.completion').forEach(cell => {
            cell.addEventListener('click', () => toggleCompletion(cell));
        });
    } catch (error) {
        table.querySelector('tbody').innerHTML = `<tr><td colspan="${students.length + 1}">Ошибка загрузки данных: ${error.message}</td></tr>`;
    }
}

async function editTask(taskId) {
    try {
        const response = await fetch(`/api/tasks/${taskId}`);
        if (!response.ok) throw new Error('Ошибка загрузки данных поручения');
        const task = await response.json();

        document.getElementById('task-description').value = task.description;
        document.getElementById('addTaskModalLabel').textContent = 'Редактировать поручение';
        document.getElementById('delete-task-btn').style.display = 'block';
        document.getElementById('save-task-btn').textContent = 'Сохранить';
        document.getElementById('delete-task-btn').dataset.taskId = taskId;
        new bootstrap.Modal(document.getElementById('addTaskModal')).show();
    } catch (error) {
        alert(`Ошибка: ${error.message}`);
    }
}

async function toggleCompletion(cell) {
    const taskId = parseInt(cell.dataset.taskId);
    const studentId = parseInt(cell.dataset.studentId);

    try {
        const response = await fetch('/api/tasks/completion', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ task_id: taskId, student_id: studentId })
        });
        if (!response.ok) throw new Error('Ошибка изменения выполнения');

        const message = document.getElementById('status-message');
        const isCompleted = cell.classList.contains('active');
        message.className = 'alert alert-' + (isCompleted ? 'warning' : 'success');
        message.textContent = `Выполнение ${isCompleted ? 'снято' : 'засчитано'}`;
        message.classList.add('show');
        setTimeout(() => message.classList.remove('show'), 2000);

        await loadTasks();
    } catch (error) {
        alert(`Ошибка: ${error.message}`);
    }
}
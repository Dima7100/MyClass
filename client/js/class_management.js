window.init_class_management = function () {
    console.log('Инициализация раздела "Управление классом"');
    loadStudents();
    setupEventListeners();
};

async function loadStudents() {
    const tbody = document.querySelector('#student-table tbody');
    if (!tbody) {
        console.error('Элемент #student-table tbody не найден');
        return;
    }

    try {
        console.log('Отправка запроса к /api/students');
        const response = await fetch('/api/students');
        if (!response.ok) throw new Error('Ошибка загрузки данных: ' + response.status);
        const students = await response.json();
        console.log('Получены данные:', students);

        tbody.innerHTML = students.map(student => `
            <tr data-student-id="${student.id}">
                <td>${student.full_name}</td>
                <td class="actions">
                    <button class="btn btn-warning edit-btn" data-student-id="${student.id}">Редактировать</button>
                    <button class="btn btn-danger delete-btn" data-student-id="${student.id}">Удалить</button>
                </td>
            </tr>
        `).join('');

        // Обновляем обработчики после рендера
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                editStudent(btn.dataset.studentId);
            });
        });

        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                deleteStudent(btn.dataset.studentId);
            });
        });
    } catch (error) {
        console.error('Ошибка в loadStudents:', error);
        tbody.innerHTML = `<tr><td colspan="2">Ошибка загрузки данных: ${error.message}</td></tr>`;
    }
}

function setupEventListeners() {
    const saveStudentBtn = document.getElementById('save-student-btn');
    const clearDatabaseBtn = document.getElementById('clear-database-btn');
    const modalTitle = document.getElementById('addStudentModalLabel');
    const modal = new bootstrap.Modal(document.getElementById('addStudentModal'));

    let editingStudentId = null;

    saveStudentBtn.addEventListener('click', async () => {
        const fullName = document.getElementById('student-full-name').value.trim();
        const phone = document.getElementById('student-phone').value.trim();
        const email = document.getElementById('student-email').value.trim();
        const parents = document.getElementById('parent-info').value.trim();
        const birthDate = document.getElementById('student-birth-date').value;
        const passport = document.getElementById('student-passport').value.trim();
        const snils = document.getElementById('student-snils').value.trim();

        if (!fullName) {
            alert('Введите ФИО ученика');
            return;
        }

        try {
            const studentData = { full_name: fullName, phone, email, parents, birth_date: birthDate || null, passport, snils };
            let response;
            if (editingStudentId) {
                response = await fetch(`/api/students/${editingStudentId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(studentData)
                });
            } else {
                response = await fetch('/api/students', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(studentData)
                });
            }

            if (!response.ok) throw new Error('Ошибка сохранения ученика');
            modal.hide();
            editingStudentId = null;
            modalTitle.textContent = 'Добавить ученика';
            document.getElementById('student-full-name').value = '';
            document.getElementById('student-phone').value = '';
            document.getElementById('student-email').value = '';
            document.getElementById('parent-info').value = '';
            document.getElementById('student-birth-date').value = '';
            document.getElementById('student-passport').value = '';
            document.getElementById('student-snils').value = '';

            await loadStudents();
        } catch (error) {
            console.error('Ошибка при сохранении ученика:', error);
            alert(`Ошибка: ${error.message}`);
        }
    });

    clearDatabaseBtn.addEventListener('click', async () => {
        if (confirm('Вы уверены, что хотите очистить базу данных? Все данные будут удалены.')) {
            try {
                const response = await fetch('/api/clear-database', { method: 'DELETE' });
                if (!response.ok) throw new Error('Ошибка очистки базы данных');
                await loadStudents();
            } catch (error) {
                console.error('Ошибка очистки базы данных:', error);
                alert(`Ошибка очистки базы данных: ${error.message}`);
            }
        }
    });
}

async function editStudent(studentId) {
    try {
        console.log('Редактирование ученика с ID:', studentId);
        const response = await fetch(`/api/students/${studentId}`);
        if (!response.ok) throw new Error('Ошибка загрузки данных ученика');
        const student = await response.json();

        document.getElementById('student-full-name').value = student.full_name;
        document.getElementById('student-phone').value = student.phone || '';
        document.getElementById('student-email').value = student.email || '';
        document.getElementById('parent-info').value = student.parents || '';
        document.getElementById('student-birth-date').value = student.birth_date ? student.birth_date.split('T')[0] : '';
        document.getElementById('student-passport').value = student.passport || '';
        document.getElementById('student-snils').value = student.snils || '';
        document.getElementById('addStudentModalLabel').textContent = 'Редактировать ученика';
        window.editingStudentId = studentId; // Сохраняем ID в глобальной области

        const modal = new bootstrap.Modal(document.getElementById('addStudentModal'));
        modal.show();
    } catch (error) {
        console.error('Ошибка при редактировании ученика:', error);
        alert(`Ошибка: ${error.message}`);
    }
}

async function deleteStudent(studentId) {
    if (confirm('Вы уверены, что хотите удалить ученика?')) {
        try {
            const response = await fetch(`/api/students/${studentId}`, { method: 'DELETE' });
            if (!response.ok) throw new Error('Ошибка удаления ученика');
            await loadStudents();
        } catch (error) {
            console.error('Ошибка при удалении ученика:', error);
            alert(`Ошибка удаления: ${error.message}`);
        }
    }
}
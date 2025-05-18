console.log('Начало загрузки ui.js');
function initializeTooltips() {
    console.log('Инициализация тултипов');
    const tooltipTriggerList = document.querySelectorAll('[data-bs-tooltip="tooltip"]');
    tooltipTriggerList.forEach(el => new bootstrap.Tooltip(el));
}

function setupEventListeners() {
    console.log('Настройка обработчиков событий');
    const saveSubjectBtn = document.getElementById('save-subject-btn');
    const saveParticipantsBtn = document.getElementById('save-participants-btn');
    const saveResultBtn = document.getElementById('save-result-btn');
    const addSubjectModal = new bootstrap.Modal(document.getElementById('addSubjectModal'));
    const addParticipantsModal = new bootstrap.Modal(document.getElementById('addParticipantsModal'));
    const addResultModal = new bootstrap.Modal(document.getElementById('addResultModal'));

    let currentStage = 'school';

    // Установка текущего этапа при переключении вкладок
    document.querySelectorAll('.nav-link').forEach(tab => {
        tab.addEventListener('shown.bs.tab', (e) => {
            currentStage = e.target.getAttribute('href').replace('#', '').split('-')[0];
            console.log('Переключение вкладки, currentStage:', currentStage);
            loadOlympiads();
        });
    });

    // Добавление предмета
    document.querySelectorAll('[data-bs-target="#addSubjectModal"]').forEach(btn => {
        btn.addEventListener('click', () => {
            const tabPane = btn.closest('.tab-pane');
            if (!tabPane) {
                console.error('Не удалось определить текущую вкладку для кнопки добавления предмета');
                currentStage = 'school';
            } else {
                currentStage = tabPane.id.split('-')[0];
            }
            console.log('Открытие модального окна для добавления предмета, currentStage:', currentStage);
            document.getElementById('subject-name').value = '';
        });
    });

    saveSubjectBtn.addEventListener('click', async () => {
        const subjectName = document.getElementById('subject-name').value.trim();
        if (!subjectName) {
            alert('Введите название предмета');
            return;
        }

        console.log('Добавление предмета:', { stage: currentStage, subject_name: subjectName });

        try {
            const response = await fetch('/api/olympiads/subject', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ stage: currentStage, subject_name: subjectName })
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Ошибка добавления предмета: ${errorText}`);
            }
            const subject = await response.json();
            olympiadData[currentStage].subjects.push(subject);
            addSubjectModal.hide();
            updateButtonsState(currentStage);
            loadOlympiads();
        } catch (error) {
            console.error('Ошибка при добавлении предмета:', error);
            alert(`Ошибка: ${error.message}`);
        }
    });

    // Удаление предмета
    document.querySelectorAll('[id^="delete-subject-btn-"]').forEach(btn => {
        btn.addEventListener('click', async () => {
            const stage = btn.id.split('-')[3]; // Получаем этап из id кнопки (school, municipal, и т.д.)
            currentStage = stage;
            const modal = new bootstrap.Modal(document.getElementById('deleteSubjectModal'));

            // Заполняем список предметов
            const subjectSelect = document.getElementById('delete-subject-select');
            await loadOlympiads(); // Убедимся, что данные загружены
            if (!olympiadData[currentStage] || !olympiadData[currentStage].subjects) {
                console.error('Данные для текущего этапа не загружены:', currentStage);
                subjectSelect.innerHTML = '<option value="">Данные не загружены</option>';
            } else {
                subjectSelect.innerHTML = '<option value="">Выберите предмет</option>' + 
                    olympiadData[currentStage].subjects.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
            }

            document.getElementById('confirm-delete-subject').onclick = async () => {
                const subjectId = parseInt(subjectSelect.value);
                if (!subjectId) {
                    alert('Пожалуйста, выберите предмет для удаления');
                    return;
                }
                try {
                    const response = await fetch(`/api/olympiads/subject/${subjectId}`, {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' }
                    });
                    if (!response.ok) throw new Error('Ошибка удаления предмета');
                    olympiadData[currentStage].subjects = olympiadData[currentStage].subjects.filter(s => s.id !== subjectId);
                    loadOlympiads();
                    modal.hide();
                } catch (error) {
                    console.error('Ошибка при удалении предмета:', error);
                    alert(`Ошибка: ${error.message}`);
                }
            };
            modal.show();
        });
    });

    // Добавление участников
    document.querySelectorAll('[data-bs-target="#addParticipantsModal"]').forEach(btn => {
        btn.addEventListener('click', async () => {
            const tabPane = btn.closest('.tab-pane');
            if (!tabPane) {
                console.error('Не удалось определить текущую вкладку для кнопки добавления участников');
                currentStage = 'school';
            } else {
                currentStage = tabPane.id.split('-')[0];
            }
            console.log('Открытие модального окна для добавления участников, currentStage:', currentStage);

            await loadOlympiads();

            const subjectSelect = document.getElementById('subject-select');
            if (!olympiadData[currentStage] || !olympiadData[currentStage].subjects) {
                console.error('Данные для текущего этапа не загружены:', currentStage);
                subjectSelect.innerHTML = '<option value="">Данные не загружены</option>';
                return;
            }
            subjectSelect.innerHTML = olympiadData[currentStage].subjects.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
            const participantsList = document.getElementById('participants-list');
            if (!olympiadData[currentStage].students) {
                participantsList.innerHTML = '<p>Список студентов не загружен</p>';
                return;
            }
            participantsList.innerHTML = olympiadData[currentStage].students.map(student => `
                <div class="form-check">
                    <input class="form-check-input" type="checkbox" value="${student.id}" id="student-${student.id}">
                    <label class="form-check-label" for="student-${student.id}">${student.full_name}</label>
                </div>
            `).join('');
        });
    });

    saveParticipantsBtn.addEventListener('click', async () => {
        const subjectId = parseInt(document.getElementById('subject-select').value);
        const selectedStudents = Array.from(document.querySelectorAll('#participants-list .form-check-input:checked')).map(input => parseInt(input.value));

        try {
            const response = await fetch('/api/olympiads/participants', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ stage: currentStage, subject_id: subjectId, student_ids: selectedStudents })
            });
            if (!response.ok) throw new Error('Ошибка добавления участников');
            addParticipantsModal.hide();
            await loadOlympiads();
            updateButtonsState(currentStage);
        } catch (error) {
            alert(`Ошибка: ${error.message}`);
        }
    });

    // Удаление участника
    document.querySelectorAll('.delete-participant-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const participantIds = btn.getAttribute('data-participant-ids').split(',');
            const modal = new bootstrap.Modal(document.getElementById('deleteParticipantModal'));
            document.getElementById('confirm-delete-participant').onclick = async () => {
                try {
                    for (const participantId of participantIds) {
                        const [subjectId, studentId] = participantId.split('-');
                        const response = await fetch(`/api/olympiads/participant/${subjectId}/${studentId}`, {
                            method: 'DELETE',
                            headers: { 'Content-Type': 'application/json' }
                        });
                        if (!response.ok) throw new Error('Ошибка удаления участника');
                        delete olympiadData[currentStage].participations[subjectId][studentId];
                    }
                    loadOlympiads();
                    modal.hide();
                } catch (error) {
                    console.error('Ошибка при удалении участника:', error);
                    alert(`Ошибка: ${error.message}`);
                }
            };
            modal.show();
        });
    });

    // Добавление результата
    document.querySelectorAll('[data-bs-target="#addResultModal"]').forEach(btn => {
        btn.addEventListener('click', async () => {
            const tabPane = btn.closest('.tab-pane');
            if (!tabPane) {
                console.error('Не удалось определить текущую вкладку для кнопки добавления результата');
                currentStage = 'school';
            } else {
                currentStage = tabPane.id.split('-')[0];
            }
            console.log('Открытие модального окна для добавления результата, currentStage:', currentStage);

            await loadOlympiads();

            const subjectSelect = document.getElementById('result-subject-select');
            if (!olympiadData[currentStage] || !olympiadData[currentStage].subjects) {
                console.error('Данные для текущего этапа не загружены:', currentStage);
                subjectSelect.innerHTML = '<option value="">Данные не загружены</option>';
                return;
            }
            subjectSelect.innerHTML = olympiadData[currentStage].subjects.map(s => `<option value="${s.id}">${s.name}</option>`).join('');

            const studentSelect = document.getElementById('result-student-select');
            const participants = [];
            Object.keys(olympiadData[currentStage].participations).forEach(subjectId => {
                Object.keys(olympiadData[currentStage].participations[subjectId]).forEach(studentId => {
                    if (!participants.includes(studentId)) {
                        const student = olympiadData[currentStage].students.find(s => s.id === parseInt(studentId));
                        participants.push(studentId);
                        studentSelect.innerHTML += `<option value="${student.id}">${student.full_name}</option>`;
                    }
                });
            });

            if (subjectSelect.options.length > 0 && studentSelect.options.length > 0) {
                updateResultStatus(subjectSelect, studentSelect);
            }
        });
    });

    saveResultBtn.addEventListener('click', async () => {
        const subjectId = parseInt(document.getElementById('result-subject-select').value);
        const studentId = parseInt(document.getElementById('result-student-select').value);
        const status = document.getElementById('result-status').value;

        try {
            const response = await fetch('/api/olympiads/result', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ stage: currentStage, subject_id: subjectId, student_id: studentId, status })
            });
            if (!response.ok) throw new Error('Ошибка обновления результата');
            addResultModal.hide();
            await loadOlympiads();
        } catch (error) {
            alert(`Ошибка: ${error.message}`);
        }
    });

    document.getElementById('result-subject-select').addEventListener('change', () => {
        updateResultStatus(document.getElementById('result-subject-select'), document.getElementById('result-student-select'));
    });

    document.getElementById('result-student-select').addEventListener('change', () => {
        updateResultStatus(document.getElementById('result-subject-select'), document.getElementById('result-student-select'));
    });
}
console.log('Файл ui.js полностью загружен');
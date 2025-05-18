window.init_olimpiads = function () {
    console.log('Инициализация раздела "Олимпиады"');
    initializeTooltips();
    loadOlympiads();
    setupEventListeners();
};

const stages = ['school', 'municipal', 'regional', 'final'];
let olympiadData = {
    school: { subjects: [], participations: {} },
    municipal: { subjects: [], participations: {} },
    regional: { subjects: [], participations: {} },
    final: { subjects: [], participations: {} }
};

function initializeTooltips() {
    const tooltipTriggerList = document.querySelectorAll('[data-bs-tooltip="tooltip"]');
    tooltipTriggerList.forEach(el => new bootstrap.Tooltip(el));
}

function setupEventListeners() {
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
            loadOlympiads();
        });
    });

    // Добавление предмета
    document.querySelectorAll('[data-bs-target="#addSubjectModal"]').forEach(btn => {
        btn.addEventListener('click', () => {
            currentStage = btn.closest('.tab-pane').id.split('-')[0];
            document.getElementById('subject-name').value = '';
        });
    });

    saveSubjectBtn.addEventListener('click', async () => {
        const subjectName = document.getElementById('subject-name').value.trim();
        if (!subjectName) {
            alert('Введите название предмета');
            return;
        }

        try {
            const response = await fetch('/api/olympiads/subject', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ stage: currentStage, subject_name: subjectName })
            });
            if (!response.ok) throw new Error('Ошибка добавления предмета');
            const subject = await response.json();
            olympiadData[currentStage].subjects.push(subject);
            addSubjectModal.hide();
            updateButtonsState(currentStage);
            loadOlympiads();
        } catch (error) {
            alert(`Ошибка: ${error.message}`);
        }
    });

    // Добавление участников
    document.querySelectorAll('[data-bs-target="#addParticipantsModal"]').forEach(btn => {
        btn.addEventListener('click', () => {
            currentStage = btn.id.split('-')[2];
            const subjectSelect = document.getElementById('subject-select');
            subjectSelect.innerHTML = olympiadData[currentStage].subjects.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
            const participantsList = document.getElementById('participants-list');
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

    // Добавление результата
    document.querySelectorAll('[data-bs-target="#addResultModal"]').forEach(btn => {
        btn.addEventListener('click', () => {
            currentStage = btn.id.split('-')[2];
            const subjectSelect = document.getElementById('result-subject-select');
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

function updateResultStatus(subjectSelect, studentSelect) {
    const subjectId = parseInt(subjectSelect.value);
    const studentId = parseInt(studentSelect.value);
    const statusSelect = document.getElementById('result-status');
    const currentStatus = olympiadData[currentStage].participations[subjectId]?.[studentId] || 'Участник';
    statusSelect.value = currentStatus;
}

function updateButtonsState(stage) {
    const hasSubjects = olympiadData[stage].subjects.length > 0;
    const hasParticipants = Object.keys(olympiadData[stage].participations).some(subjectId => 
        Object.keys(olympiadData[stage].participations[subjectId]).length > 0
    );

    const participantsBtn = document.getElementById(`add-participants-btn-${stage}`);
    const resultBtn = document.getElementById(`add-result-btn-${stage}`);

    participantsBtn.disabled = !hasSubjects;
    resultBtn.disabled = !hasParticipants;
}

async function loadOlympiads() {
    for (const stage of stages) {
        const table = document.querySelector(`.olympiad-table[data-stage="${stage}"]`);
        if (!table) continue;

        try {
            const response = await fetch(`/api/olympiads?stage=${stage}`);
            if (!response.ok) throw new Error('Ошибка загрузки данных');
            const { subjects, participations, students } = await response.json();

            olympiadData[stage].subjects = subjects;
            olympiadData[stage].participations = participations;
            olympiadData[stage].students = students;

            const headerRow = table.querySelector('.olympiad-header');
            headerRow.innerHTML = '<th>ФИО</th>' + subjects.map(s => `<th>${s.name}</th>`).join('');

            const tbody = table.querySelector('.olympiad-body');
            tbody.innerHTML = students.map(student => {
                return `
                    <tr>
                        <td>${student.full_name}</td>
                        ${subjects.map(subject => {
                            const status = participations[subject.id]?.[student.id];
                            return `
                                <td class="${status ? 'participant' : ''}">
                                    ${status ? (status === 'Финалист' ? 'Ф' : status === 'Победитель' ? 'П' : '') : ''}
                                </td>
                            `;
                        }).join('')}
                    </tr>
                `;
            }).join('');

            updateButtonsState(stage);
        } catch (error) {
            table.querySelector('.olympiad-body').innerHTML = `<tr><td colspan="${olympiadData[stage].subjects.length + 1}">Ошибка загрузки данных: ${error.message}</td></tr>`;
        }
    }
}
console.log('Начало загрузки table.js');
async function loadOlympiads() {
    for (const stage of stages) {
        const table = document.querySelector(`.olympiad-table[data-stage="${stage}"]`);
        if (!table) continue;

        try {
            const response = await fetch(`/api/olympiads?stage=${stage}`);
            if (!response.ok) throw new Error('Ошибка загрузки данных');
            const { subjects, participations, students } = await response.json();

            olympiadData[stage].subjects = subjects || [];
            olympiadData[stage].participations = participations || {};
            olympiadData[stage].students = students || [];

            // Фильтруем студентов, участвующих в олимпиадах
            const participatingStudents = students.filter(student => {
                return olympiadData[stage].subjects.some(subject => 
                    olympiadData[stage].participations[subject.id]?.[student.id]
                );
            });

            const headerRow = table.querySelector('.olympiad-header');
            headerRow.innerHTML = '<th>ФИО</th>' + (olympiadData[stage].subjects.map(s => `<th>${s.name}</th>`).join('') || '');

            const tbody = table.querySelector('.olympiad-body');
            tbody.innerHTML = (participatingStudents.map(student => {
                const participantIds = olympiadData[stage].subjects
                    .filter(subject => olympiadData[stage].participations[subject.id]?.[student.id])
                    .map(subject => `${subject.id}-${student.id}`);
                return `
                    <tr>
                        <td>
                            ${student.full_name}
                            ${participantIds.length > 0 ? `
                                <i class="bi bi-x text-muted delete-participant-btn" 
                                   data-participant-ids="${participantIds.join(',')}" 
                                   data-bs-toggle="modal" 
                                   data-bs-target="#deleteParticipantModal" 
                                   style="cursor: pointer;"></i>
                            ` : ''}
                        </td>
                        ${olympiadData[stage].subjects.map(subject => {
                            const status = olympiadData[stage].participations[subject.id]?.[student.id];
                            return `
                                <td class="${status ? 'participant' : ''}">
                                    ${status ? (status === 'Победитель' ? 'П' : status === 'Призёр' ? 'Пр' : '') : ''}
                                </td>
                            `;
                        }).join('')}
                    </tr>
                `;
            }).join('') || '');

            updateButtonsState(stage);
        } catch (error) {
            console.error('Ошибка в loadOlympiads для этапа', stage, ':', error);
            table.querySelector('.olympiad-body').innerHTML = `<tr><td colspan="${olympiadData[stage].subjects.length + 1}">Ошибка загрузки данных: ${error.message}</td></tr>`;
        }
    }
}
console.log('Файл table.js полностью загружен');
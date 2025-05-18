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

console.log('Файл utils.js загружен');
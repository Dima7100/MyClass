document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('personal-section')) {
        loadPersonalData();
    }
});

async function loadPersonalData() {
    const tbody = document.querySelector('#personal-table tbody');
    if (!tbody) return;

    try {
        const response = await fetch('/api/students');
        if (!response.ok) throw new Error('Ошибка загрузки данных');
        const students = await response.json();

        tbody.innerHTML = students.map(student => {
            const birthDate = student.birth_date ? new Date(student.birth_date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '';
            return `
                <tr>
                    <td>${student.full_name}</td>
                    <td>${birthDate}</td>
                    <td>${student.passport || ''}</td>
                    <td>${student.snils || ''}</td>
                    <td>${student.phone || ''}</td>
                    <td>${student.email || ''}</td>
                    <td>${student.parents || ''}</td>
                </tr>
            `;
        }).join('');
    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="7">Ошибка загрузки данных: ${error.message}</td></tr>`;
    }
}
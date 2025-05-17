document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('personal-data-section')) {
        loadPersonalData();
    }
});

async function loadPersonalData() {
    const tbody = document.querySelector('#personal-data-table tbody');
    if (!tbody) return;

    // Пока используем статические данные, позже подключим API
    const data = [
        {
            full_name: "Иванов Иван Иванович",
            phone: "+7 (999) 123-45-67",
            email: "ivanov@example.com",
            parents: [
                { name: "Иванова Анна Петровна", phone: "+7 (999) 765-43-21" },
                { name: "Иванов Сергей Иванович", phone: "+7 (999) 987-65-43" }
            ]
        }
    ];

    tbody.innerHTML = data.map(student => `
        <tr>
            <td>${student.full_name}</td>
            <td>${student.phone}</td>
            <td>${student.email}</td>
            <td class="parent-data">
                ${student.parents.map(parent => `<span>${parent.name}</span>`).join('')}
            </td>
            <td class="parent-data">
                ${student.parents.map(parent => `<span>${parent.phone}</span>`).join('')}
            </td>
        </tr>
    `).join('');
}
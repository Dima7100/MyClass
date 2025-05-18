window.init_absences_calendar = function () {
    console.log('Инициализация раздела "Календарь пропусков"');
    initializeFlatpickr();
    initializeCalendar();
    setupEventListeners();
};

function initializeFlatpickr() {
    flatpickr('#datepicker', {
        dateFormat: 'Y-m-d', // Формат для MySQL
        locale: {
            firstDayOfWeek: 1, // Понедельник как первый день недели
            weekdays: {
                shorthand: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
                longhand: ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота']
            },
            months: {
                shorthand: ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'],
                longhand: ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь']
            }
        }
    });
}

function initializeCalendar() {
    const calendar = document.getElementById('calendar');
    if (!calendar) return;

    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay() || 7; // 0 = воскресенье, корректируем под 1-7

    calendar.innerHTML = '';
    const daysOfWeek = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    daysOfWeek.forEach(day => {
        const dayDiv = document.createElement('div');
        dayDiv.textContent = day;
        dayDiv.style.fontWeight = 'bold';
        calendar.appendChild(dayDiv);
    });

    for (let i = 1; i < startingDay; i++) {
        const emptyDiv = document.createElement('div');
        calendar.appendChild(emptyDiv);
    }
    for (let day = 1; day <= daysInMonth; day++) {
        const dayDiv = document.createElement('div');
        dayDiv.textContent = day;
        dayDiv.addEventListener('click', () => {
            const formattedDay = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            loadAttendance(formattedDay);
        });
        calendar.appendChild(dayDiv);
    }
}

function setupEventListeners() {
    document.getElementById('filterBtn').addEventListener('click', () => {
        const studentFilter = document.getElementById('studentFilter').value;
        loadAttendance(null, studentFilter);
    });

    document.getElementById('dateBtn').addEventListener('click', () => {
        const datepicker = document.getElementById('datepicker');
        const selectedDate = datepicker.value;
        if (selectedDate) {
            loadAttendance(selectedDate);
        }
    });
}

async function loadAttendance(day, studentFilter = '') {
    const attendanceList = document.getElementById('attendanceList');
    if (!attendanceList) return;

    try {
        let url = '/api/attendance';
        const params = new URLSearchParams();
        if (day) params.append('day', day);
        if (studentFilter) params.append('student', studentFilter);
        if (params.toString()) url += `?${params.toString()}`;

        const response = await fetch(url);
        if (!response.ok) throw new Error('Ошибка загрузки данных');
        const data = await response.json();

        attendanceList.innerHTML = `
            <table>
                <thead><tr><th>Ученик</th><th>Дата</th><th>Статус</th></tr></thead>
                <tbody>${data.map(item => `
                    <tr><td>${item.student}</td><td>${item.date}</td><td>${item.status}</td></tr>
                `).join('')}</tbody>
            </table>
        `;
    } catch (error) {
        attendanceList.innerHTML = `<p>Ошибка загрузки данных: ${error.message}</p>`;
    }
}
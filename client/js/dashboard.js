document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'index.html';
        return;
    }

    const navLinks = document.querySelectorAll('.nav-link[data-section]');
    const sectionTitle = document.getElementById('sectionTitle');
    const sectionContent = document.getElementById('sectionContent');
    const breadcrumbSection = document.getElementById('breadcrumbSection');

    // Обработчик для навигации
    navLinks.forEach(link => {
        link.addEventListener('click', async (e) => {
            e.preventDefault();
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            const section = link.getAttribute('data-section');
            const sectionText = link.textContent.trim();
            sectionTitle.textContent = sectionText;
            breadcrumbSection.textContent = sectionText;

            // Очистка содержимого
            sectionContent.innerHTML = '<p>Загрузка...</p>';

            // Динамическая загрузка разделов
            switch (section) {
                case 'personal':
                    await loadSection('personal_data');
                    break;
                case 'absences_calendar':
                    await loadSection('absences_calendar');
                    break;
                case 'absences_stats':
                    await loadSection('absences_stats');
                    break;
                case 'events':
                    await loadSection('events');
                    break;
                case 'olympiads':
                    await loadSection('olympiads');
                    break;
                case 'tasks':
                    sectionContent.innerHTML = '<p>Содержимое раздела "Поручения"</p>';
                    break;
                case 'summary':
                    sectionContent.innerHTML = '<p>Содержимое раздела "Сводка" (будет добавлено позже)</p>';
                    break;
                case 'class_management':
                    await loadSection('class_management');
                    break;
                default:
                    sectionContent.innerHTML = '<p>Содержимое раздела не найдено</p>';
            }
        });
    });

    // Обработчик для стрелочки "Пропусков"
    const absencesToggle = document.querySelector('[data-bs-target="#absencesMenu"]');
    const toggleIcon = absencesToggle.querySelector('.toggle-icon');
    if (absencesToggle && toggleIcon) {
        absencesToggle.addEventListener('click', (e) => {
            e.preventDefault();
            const isOpen = document.getElementById('absencesMenu').classList.contains('show');
            toggleIcon.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(90deg)';
        });
    }

    // Функция для динамической загрузки раздела
    async function loadSection(sectionName) {
        try {
            // Загрузка HTML
            const htmlResponse = await fetch(`./${sectionName}.html`);
            if (!htmlResponse.ok) throw new Error('Не удалось загрузить HTML');
            const html = await htmlResponse.text();
            sectionContent.innerHTML = html;

            // Загрузка CSS
            const existingCss = document.querySelector(`link[data-section="${sectionName}"]`);
            if (!existingCss) {
                const cssLink = document.createElement('link');
                cssLink.rel = 'stylesheet';
                cssLink.href = `css/${sectionName}.css`;
                cssLink.dataset.section = sectionName;
                document.head.appendChild(cssLink);
            }

            // Загрузка JS
            const existingScript = document.querySelector(`script[data-section="${sectionName}"]`);
            if (existingScript) existingScript.remove();
            const script = document.createElement('script');
            script.src = `js/${sectionName}.js`;
            script.dataset.section = sectionName;
            document.body.appendChild(script);
        } catch (error) {
            sectionContent.innerHTML = `<p>Ошибка загрузки раздела: ${error.message}</p>`;
        }
    }
});
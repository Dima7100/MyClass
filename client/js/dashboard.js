document.addEventListener('DOMContentLoaded', () => {
    const sidebarLinks = document.querySelectorAll('.nav-link');
    const submenuLinks = document.querySelectorAll('.submenu-item');
    const sectionTitle = document.getElementById('sectionTitle');
    const breadcrumbSection = document.getElementById('breadcrumbSection');
    const sectionContent = document.getElementById('sectionContent');

    sidebarLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.getAttribute('data-section');
            if (section) {
                loadSection(section);
                sectionTitle.textContent = link.textContent.trim();
                breadcrumbSection.textContent = link.textContent.trim();
            }
        });
    });

    submenuLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.getAttribute('data-section');
            loadSection(section);
            sectionTitle.textContent = link.textContent.trim();
            breadcrumbSection.textContent = link.textContent.trim();
        });
    });

    const toggleIcons = document.querySelectorAll('.toggle-icon');
    toggleIcons.forEach(icon => {
        icon.parentElement.addEventListener('click', (e) => {
            const isExpanded = icon.classList.contains('bi-chevron-down');
            toggleIcons.forEach(i => {
                i.classList.remove('bi-chevron-down');
                i.classList.add('bi-chevron-right');
            });
            if (!isExpanded) {
                icon.classList.remove('bi-chevron-right');
                icon.classList.add('bi-chevron-down');
            }
        });
    });

    async function loadSection(section) {
        try {
            const response = await fetch(`${section}.html`);
            if (!response.ok) throw new Error(`Не удалось загрузить ${section}.html`);
            const content = await response.text();
            sectionContent.innerHTML = content;

            // Загружаем и выполняем JS-файл
            const script = document.createElement('script');
            script.src = `js/${section}.js`;
            script.async = true;
            script.onload = () => {
                // Вызываем функцию инициализации, если она определена
                if (typeof window[`init_${section}`] === 'function') {
                    window[`init_${section}`]();
                }
            };
            script.onerror = () => console.error(`Ошибка загрузки скрипта js/${section}.js`);
            document.body.appendChild(script);
        } catch (error) {
            sectionContent.innerHTML = `<p>Ошибка загрузки раздела: ${error.message}</p>`;
        }
    }
});
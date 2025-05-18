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

            // Загружаем зависимости для раздела "olympiads"
            if (section === 'olympiads') {
                const dependencies = [
                    'js/olympiads/data.js',
                    'js/olympiads/ui.js',
                    'js/olympiads/table.js',
                    'js/olympiads/utils.js'
                ];

                for (const src of dependencies) {
                    await new Promise((resolve, reject) => {
                        const script = document.createElement('script');
                        script.src = src;
                        script.async = true;
                        script.onload = resolve;
                        script.onerror = () => {
                            console.error(`Ошибка загрузки скрипта ${src}`);
                            reject(new Error(`Ошибка загрузки ${src}`));
                        };
                        document.body.appendChild(script);
                    });
                }
            }

            // Загружаем зависимости для раздела "olympiad-summary"
            if (section === 'olympiad-summary') {
                const dependencies = [
                    'js/olympiads/data.js',
                    'js/olympiads/table.js'
                ];

                for (const src of dependencies) {
                    await new Promise((resolve, reject) => {
                        const script = document.createElement('script');
                        script.src = src;
                        script.async = true;
                        script.onload = resolve;
                        script.onerror = () => {
                            console.error(`Ошибка загрузки скрипта ${src}`);
                            reject(new Error(`Ошибка загрузки ${src}`));
                        };
                        document.body.appendChild(script);
                    });
                }
            }

            // Загружаем и выполняем основной JS-файл
            await new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = `js/${section}.js`;
                script.async = true;
                script.onload = () => {
                    // Вызываем функцию инициализации, если она определена
                    if (typeof window[`init_${section}`] === 'function') {
                        window[`init_${section}`]();
                    }
                    resolve();
                };
                script.onerror = () => {
                    console.error(`Ошибка загрузки скрипта js/${section}.js`);
                    reject(new Error(`Ошибка загрузки js/${section}.js`));
                };
                document.body.appendChild(script);
            });
        } catch (error) {
            sectionContent.innerHTML = `<p>Ошибка загрузки раздела: ${error.message}</p>`;
        }
    }

    // Загружаем раздел "Личные данные" по умолчанию
    loadSection('personal');
    sectionTitle.textContent = 'Личные данные';
    breadcrumbSection.textContent = 'Личные данные';
});
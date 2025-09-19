class VsoshApp {
    constructor() {
        this.version = "4.2.0";
        this.currentStage = "Школьный";
        this.currentView = "main";
        this.editingParticipant = null;
        this.editingQuantitative = null;

        // Default data
        this.subjects = [
            "Математика", "Русский язык", "Английский язык", "Немецкий язык",
            "Французский язык", "Испанский язык", "Китайский язык", "Итальянский язык",
            "Информатика", "Физика", "Химия", "Биология", "Экология", "География",
            "Астрономия", "Литература", "История", "Обществознание", "Экономика",
            "Право", "Искусство (МХК)", "Физическая культура", "Труд (технология)",
            "Основы безопасности и защиты Родины"
        ];

        this.stages = ["Школьный", "Муниципальный", "Региональный", "Финальный"];
        this.statuses = ["Участник", "Призёр", "Победитель"];

        this.loadData();
        this.migrateData(); // ВАЖНО: Миграция данных для добавления ID
        this.init();
    }

    // ФУНКЦИЯ СОРТИРОВКИ КЛАССОВ ПО НОМЕРУ И БУКВЕ
    sortClassesByNumber(classes) {
        return [...classes].sort((a, b) => {
            // Регулярка для извлечения номера и буквы (например: "5А" -> [5, "А"])
            const classRegex = /^(\d+)([А-Яа-яA-Za-z]*)$/;
            const aMatch = a.name.match(classRegex);
            const bMatch = b.name.match(classRegex);

            if (!aMatch || !bMatch) {
                // Если формат не распознан, сортируем по алфавиту
                return a.name.localeCompare(b.name, 'ru');
            }

            const aNum = parseInt(aMatch[1]);
            const bNum = parseInt(bMatch[1]);
            const aLetter = aMatch[2] || '';
            const bLetter = bMatch[2] || '';

            // Сначала по номеру класса
            if (aNum !== bNum) {
                return aNum - bNum;
            }

            // Потом по букве класса
            return aLetter.localeCompare(bLetter, 'ru');
        });
    }

    init() {
        this.bindEvents();
        this.updateFilters();
        this.switchView("main");
        this.updateStats();
    }

    loadData() {
        const savedData = localStorage.getItem('vsoshData');
        if (savedData) {
            const data = JSON.parse(savedData);
            this.classes = data.classes || this.getDefaultClasses();
            this.teachers = data.teachers || this.getDefaultTeachers();
            this.quantitativeData = data.quantitativeData || [];
            this.participants = data.participants || [];
        } else {
            this.classes = this.getDefaultClasses();
            this.teachers = this.getDefaultTeachers();
            this.quantitativeData = [];
            this.participants = [];
        }
    }

    // ФУНКЦИЯ МИГРАЦИИ - ДОБАВЛЯЕТ ID К ЗАПИСЯМ БЕЗ ID
    migrateData() {
        let needsSave = false;

        // Миграция количественных данных
        this.quantitativeData.forEach(item => {
            if (!item.id) {
                item.id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
                needsSave = true;
            }
        });

        // Миграция участников
        this.participants.forEach(participant => {
            if (!participant.id) {
                participant.id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
                needsSave = true;
            }
        });

        // Сохраняем если были изменения
        if (needsSave) {
            this.saveData();
            console.log('Данные мигрированы: добавлены ID к существующим записям');
        }
    }

    saveData() {
        const data = {
            version: this.version,
            classes: this.classes,
            teachers: this.teachers,
            quantitativeData: this.quantitativeData,
            participants: this.participants
        };
        localStorage.setItem('vsoshData', JSON.stringify(data));
    }

    getDefaultClasses() {
        return [
            { name: "5А", totalStudents: 25, classTeacher: "Иванова А.П." },
            { name: "5Б", totalStudents: 23, classTeacher: "Петрова М.В." },
            { name: "6А", totalStudents: 26, classTeacher: "Сидорова О.И." },
            { name: "6Б", totalStudents: 24, classTeacher: "Козлова Е.Н." },
            { name: "7А", totalStudents: 28, classTeacher: "Смирнова Л.И." },
            { name: "8А", totalStudents: 22, classTeacher: "Кузнецов А.В." },
            { name: "9А", totalStudents: 27, classTeacher: "Попова Н.С." },
            { name: "10А", totalStudents: 24, classTeacher: "Федоров М.П." },
            { name: "11А", totalStudents: 26, classTeacher: "Павлова Е.А." }
        ];
    }

    getDefaultTeachers() {
        return [
            "Волкова Н.А. (математика)",
            "Морозов С.П. (физика)",
            "Лебедева Т.И. (русский язык)",
            "Соколов В.М. (история)",
            "Орлова Л.К. (биология)"
        ];
    }

    bindEvents() {
        // Data menu
        const dataMenuBtn = document.getElementById('dataMenuBtn');
        if (dataMenuBtn) {
            dataMenuBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleDropdown('dataDropdown');
            });
        }

        // Export/Import
        const exportBtn = document.getElementById('exportBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.closeDropdown('dataDropdown');
                this.exportData();
            });
        }

        const importBtn = document.getElementById('importBtn');
        if (importBtn) {
            importBtn.addEventListener('click', () => {
                this.closeDropdown('dataDropdown');
                this.showImportModal();
            });
        }

        const createBackupBtn = document.getElementById('createBackupBtn');
        if (createBackupBtn) {
            createBackupBtn.addEventListener('click', () => {
                this.closeDropdown('dataDropdown');
                this.createBackup();
            });
        }

        const restoreBackupBtn = document.getElementById('restoreBackupBtn');
        if (restoreBackupBtn) {
            restoreBackupBtn.addEventListener('click', () => {
                this.closeDropdown('dataDropdown');
                this.showRestoreModal();
            });
        }

        // Settings
        const classSettingsBtn = document.getElementById('classSettingsBtn');
        if (classSettingsBtn) {
            classSettingsBtn.addEventListener('click', () => {
                this.showModal('classModal');
                this.renderClassesList();
            });
        }

        const teacherSettingsBtn = document.getElementById('teacherSettingsBtn');
        if (teacherSettingsBtn) {
            teacherSettingsBtn.addEventListener('click', () => {
                this.showModal('teacherModal');
                this.renderTeachersList();
            });
        }

        // Reports button
        const reportsBtn = document.getElementById('reportsBtn');
        if (reportsBtn) {
            reportsBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchView('reports');
            });
        }

        // Back to main button
        const backToMainBtn = document.getElementById('backToMainBtn');
        if (backToMainBtn) {
            backToMainBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchView('main');
            });
        }

        // Stage tabs
        document.querySelectorAll('.stage-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchStage(tab.dataset.stage);
            });
        });

        // Filters
        const classFilter = document.getElementById('classFilter');
        if (classFilter) {
            classFilter.addEventListener('change', () => {
                this.renderCurrentStage();
                this.updateStats();
            });
        }

        const subjectFilter = document.getElementById('subjectFilter');
        if (subjectFilter) {
            subjectFilter.addEventListener('change', () => {
                this.renderCurrentStage();
                this.updateStats();
            });
        }

        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', () => {
                this.renderCurrentStage();
                this.updateStats();
            });
        }

        // Add buttons
        const addParticipantBtn = document.getElementById('addParticipantBtn');
        if (addParticipantBtn) {
            addParticipantBtn.addEventListener('click', () => this.showParticipantModal());
        }

        const addQuantitativeBtn = document.getElementById('addQuantitativeBtn');
        if (addQuantitativeBtn) {
            addQuantitativeBtn.addEventListener('click', () => this.showQuantitativeModal());
        }

        // ОБРАБОТЧИКИ ДЛЯ ОТЧЕТОВ
        const reportStageFilter = document.getElementById('reportStageFilter');
        if (reportStageFilter) {
            reportStageFilter.addEventListener('change', () => this.renderAllReports());
        }

        const reportClassFilter = document.getElementById('reportClassFilter');
        if (reportClassFilter) {
            reportClassFilter.addEventListener('change', () => this.renderAllReports());
        }

        const reportSubjectFilter = document.getElementById('reportSubjectFilter');
        if (reportSubjectFilter) {
            reportSubjectFilter.addEventListener('change', () => this.renderAllReports());
        }

        const updateReportsBtn = document.getElementById('updateReportsBtn');
        if (updateReportsBtn) {
            updateReportsBtn.addEventListener('click', () => this.renderAllReports());
        }

        const exportReportsBtn = document.getElementById('exportReportsBtn');
        if (exportReportsBtn) {
            exportReportsBtn.addEventListener('click', () => this.exportAllReports());
        }

        // Modal events
        this.bindModalEvents();

        // Close dropdown on outside click
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.dropdown')) {
                this.closeAllDropdowns();
            }
        });
    }

    bindModalEvents() {
        // Modal close buttons
        document.querySelectorAll('.modal-close, [id$="CancelBtn"], [id$="CloseBtn"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = btn.closest('.modal');
                if (modal) {
                    this.hideModal(modal.id);
                }
            });
        });

        // Save buttons
        const participantSaveBtn = document.getElementById('participantSaveBtn');
        if (participantSaveBtn) {
            participantSaveBtn.addEventListener('click', () => this.saveParticipant());
        }

        const quantitativeSaveBtn = document.getElementById('quantitativeSaveBtn');
        if (quantitativeSaveBtn) {
            quantitativeSaveBtn.addEventListener('click', () => this.saveQuantitative());
        }

        // Import modal events
        const importFileInput = document.getElementById('importFileInput');
        if (importFileInput) {
            importFileInput.addEventListener('change', (e) => this.handleImportFile(e));
        }

        const importConfirmBtn = document.getElementById('importConfirmBtn');
        if (importConfirmBtn) {
            importConfirmBtn.addEventListener('click', () => this.confirmImport());
        }
    }

    // View switching
    switchView(view) {
        this.currentView = view;
        const mainContent = document.getElementById('mainContent');
        const reportsContent = document.getElementById('reportsContent');
        const reportsBtn = document.getElementById('reportsBtn');

        if (view === 'reports') {
            if (mainContent) mainContent.classList.add('hidden');
            if (reportsContent) reportsContent.classList.remove('hidden');
            if (reportsBtn) reportsBtn.textContent = 'Отчеты (активно)';
            this.updateReportFilters();
            this.renderAllReports();
        } else {
            if (mainContent) mainContent.classList.remove('hidden');
            if (reportsContent) reportsContent.classList.add('hidden');
            if (reportsBtn) reportsBtn.textContent = 'Отчеты';
            this.renderCurrentStage();
        }
    }

    // ОБНОВЛЕНИЕ ФИЛЬТРОВ ДЛЯ ОТЧЕТОВ (С СОРТИРОВКОЙ)
    updateReportFilters() {
        const reportClassFilter = document.getElementById('reportClassFilter');
        const reportSubjectFilter = document.getElementById('reportSubjectFilter');

        if (reportClassFilter) {
            reportClassFilter.innerHTML = '<option value="">Все классы</option>';
            this.sortClassesByNumber(this.classes).forEach(cls => {
                const option = document.createElement('option');
                option.value = cls.name;
                option.textContent = cls.name;
                reportClassFilter.appendChild(option);
            });
        }

        if (reportSubjectFilter) {
            reportSubjectFilter.innerHTML = '<option value="">Все предметы</option>';
            this.subjects.forEach(subject => {
                const option = document.createElement('option');
                option.value = subject;
                option.textContent = subject;
                reportSubjectFilter.appendChild(option);
            });
        }
    }

    // РЕНДЕРИНГ ВСЕХ ТРЕХ ОТЧЕТОВ
    renderAllReports() {
        this.renderClassReports();
        this.renderSubjectReports();
        this.renderParticipantsReports();
    }

    // 1. СВОДКА ПО КЛАССАМ
    renderClassReports() {
        const reportStageFilter = document.getElementById('reportStageFilter')?.value || '';
        const reportClassFilter = document.getElementById('reportClassFilter')?.value || '';
        const reportSubjectFilter = document.getElementById('reportSubjectFilter')?.value || '';
        const tableBody = document.getElementById('classReportsTableBody');

        if (!tableBody) return;

        const classData = new Map();

        this.classes.forEach(cls => {
            if (reportClassFilter && cls.name !== reportClassFilter) return;

            classData.set(cls.name, {
                className: cls.name,
                totalStudents: cls.totalStudents,
                participants: 0,
                winners: 0,
                prizeWinners: 0
            });
        });

        if (!reportStageFilter || reportStageFilter === 'Школьный') {
            this.quantitativeData.forEach(item => {
                if (reportClassFilter && item.class !== reportClassFilter) return;
                if (reportSubjectFilter && item.subject !== reportSubjectFilter) return;

                const classInfo = classData.get(item.class);
                if (classInfo) {
                    classInfo.participants += item.participantsCount || 0;
                    classInfo.winners += (item.winnersFio || []).length;
                    classInfo.prizeWinners += (item.prizeWinnersFio || []).length;
                }
            });
        }

        this.participants.forEach(participant => {
            if (reportStageFilter && participant.stage !== reportStageFilter) return;
            if (reportClassFilter && participant.class !== reportClassFilter) return;
            if (reportSubjectFilter && participant.subject !== reportSubjectFilter) return;

            const classInfo = classData.get(participant.class);
            if (classInfo) {
                classInfo.participants += 1;
                if (participant.status === 'Победитель') {
                    classInfo.winners += 1;
                } else if (participant.status === 'Призёр') {
                    classInfo.prizeWinners += 1;
                }
            }
        });

        const classDataArray = Array.from(classData.values()).filter(data => 
            data.participants > 0 || !reportStageFilter && !reportSubjectFilter
        );

        if (classDataArray.length === 0) {
            tableBody.innerHTML = `
                <tr class="empty-row">
                    <td colspan="5">Нет данных для отображения с выбранными фильтрами</td>
                </tr>
            `;
            return;
        }

        // СОРТИРОВКА ОТЧЕТА ПО КЛАССАМ ТОЖЕ ПО НОМЕРУ
        classDataArray.sort((a, b) => {
            const classRegex = /^(\d+)([А-Яа-яA-Za-z]*)$/;
            const aMatch = a.className.match(classRegex);
            const bMatch = b.className.match(classRegex);

            if (!aMatch || !bMatch) {
                return a.className.localeCompare(b.className, 'ru');
            }

            const aNum = parseInt(aMatch[1]);
            const bNum = parseInt(bMatch[1]);
            const aLetter = aMatch[2] || '';
            const bLetter = bMatch[2] || '';

            if (aNum !== bNum) {
                return aNum - bNum;
            }

            return aLetter.localeCompare(bLetter, 'ru');
        });

        tableBody.innerHTML = classDataArray.map(data => {
            const coverage = data.totalStudents > 0 ? Math.round((data.participants / data.totalStudents) * 100) : 0;

            return `
                <tr>
                    <td>${data.className}</td>
                    <td>${data.participants}</td>
                    <td>${data.winners}</td>
                    <td>${data.prizeWinners}</td>
                    <td>${coverage}%</td>
                </tr>
            `;
        }).join('');
    }

    // 2. СВОДКА ПО ПРЕДМЕТАМ
    renderSubjectReports() {
        const reportStageFilter = document.getElementById('reportStageFilter')?.value || '';
        const reportClassFilter = document.getElementById('reportClassFilter')?.value || '';
        const reportSubjectFilter = document.getElementById('reportSubjectFilter')?.value || '';
        const tableBody = document.getElementById('subjectReportsTableBody');

        if (!tableBody) return;

        const subjectData = new Map();

        // Инициализируем все предметы
        this.subjects.forEach(subject => {
            if (reportSubjectFilter && subject !== reportSubjectFilter) return;

            subjectData.set(subject, {
                subjectName: subject,
                participants: 0,
                winners: 0,
                prizeWinners: 0
            });
        });

        // Обрабатываем школьный этап
        if (!reportStageFilter || reportStageFilter === 'Школьный') {
            this.quantitativeData.forEach(item => {
                if (reportClassFilter && item.class !== reportClassFilter) return;
                if (reportSubjectFilter && item.subject !== reportSubjectFilter) return;

                const subjectInfo = subjectData.get(item.subject);
                if (subjectInfo) {
                    subjectInfo.participants += item.participantsCount || 0;
                    subjectInfo.winners += (item.winnersFio || []).length;
                    subjectInfo.prizeWinners += (item.prizeWinnersFio || []).length;
                }
            });
        }

        // Обрабатываем другие этапы
        this.participants.forEach(participant => {
            if (reportStageFilter && participant.stage !== reportStageFilter) return;
            if (reportClassFilter && participant.class !== reportClassFilter) return;
            if (reportSubjectFilter && participant.subject !== reportSubjectFilter) return;

            const subjectInfo = subjectData.get(participant.subject);
            if (subjectInfo) {
                subjectInfo.participants += 1;
                if (participant.status === 'Победитель') {
                    subjectInfo.winners += 1;
                } else if (participant.status === 'Призёр') {
                    subjectInfo.prizeWinners += 1;
                }
            }
        });

        const subjectDataArray = Array.from(subjectData.values()).filter(data => data.participants > 0);

        if (subjectDataArray.length === 0) {
            tableBody.innerHTML = `
                <tr class="empty-row">
                    <td colspan="5">Нет данных для отображения с выбранными фильтрами</td>
                </tr>
            `;
            return;
        }

        subjectDataArray.sort((a, b) => a.subjectName.localeCompare(b.subjectName));

        tableBody.innerHTML = subjectDataArray.map(data => {
            const effectiveness = data.participants > 0 ? Math.round(((data.winners + data.prizeWinners) / data.participants) * 100) : 0;

            return `
                <tr>
                    <td>${data.subjectName}</td>
                    <td>${data.participants}</td>
                    <td>${data.winners}</td>
                    <td>${data.prizeWinners}</td>
                    <td>${effectiveness}%</td>
                </tr>
            `;
        }).join('');
    }

    // 3. РЕЙТИНГ УЧАСТНИКОВ
    renderParticipantsReports() {
        const reportStageFilter = document.getElementById('reportStageFilter')?.value || '';
        const reportClassFilter = document.getElementById('reportClassFilter')?.value || '';
        const reportSubjectFilter = document.getElementById('reportSubjectFilter')?.value || '';
        const tableBody = document.getElementById('participantsReportsTableBody');

        if (!tableBody) return;

        let allParticipants = [];

        // Участники из школьного этапа (из количественных данных)
        if (!reportStageFilter || reportStageFilter === 'Школьный') {
            this.quantitativeData.forEach(item => {
                if (reportClassFilter && item.class !== reportClassFilter) return;
                if (reportSubjectFilter && item.subject !== reportSubjectFilter) return;

                // Добавляем победителей
                (item.winnersFio || []).forEach(fio => {
                    allParticipants.push({
                        fio: fio,
                        class: item.class,
                        subject: item.subject,
                        stage: 'Школьный',
                        status: 'Победитель',
                        points: '-'
                    });
                });

                // Добавляем призеров
                (item.prizeWinnersFio || []).forEach(fio => {
                    allParticipants.push({
                        fio: fio,
                        class: item.class,
                        subject: item.subject,
                        stage: 'Школьный',
                        status: 'Призёр',
                        points: '-'
                    });
                });
            });
        }

        // Участники из других этапов
        this.participants.forEach(participant => {
            if (reportStageFilter && participant.stage !== reportStageFilter) return;
            if (reportClassFilter && participant.class !== reportClassFilter) return;
            if (reportSubjectFilter && participant.subject !== reportSubjectFilter) return;

            allParticipants.push({
                fio: participant.fio,
                class: participant.class,
                subject: participant.subject,
                stage: participant.stage,
                status: participant.status,
                points: participant.points || '-'
            });
        });

        if (allParticipants.length === 0) {
            tableBody.innerHTML = `
                <tr class="empty-row">
                    <td colspan="6">Участники для выбранного этапа отсутствуют</td>
                </tr>
            `;
            return;
        }

        // Сортировка: сначала победители, потом призеры, потом участники, внутри каждой группы по ФИО
        allParticipants.sort((a, b) => {
            const statusOrder = { 'Победитель': 1, 'Призёр': 2, 'Участник': 3 };
            const statusDiff = statusOrder[a.status] - statusOrder[b.status];
            if (statusDiff !== 0) return statusDiff;
            return a.fio.localeCompare(b.fio);
        });

        tableBody.innerHTML = allParticipants.map(participant => `
            <tr>
                <td>${participant.fio}</td>
                <td>${participant.class}</td>
                <td>${participant.subject}</td>
                <td>${participant.stage}</td>
                <td><span class="status status--${this.getStatusClass(participant.status)}">${participant.status}</span></td>
                <td>${participant.points}</td>
            </tr>
        `).join('');
    }

    // ЭКСПОРТ ВСЕХ ОТЧЕТОВ
    exportAllReports() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);

        // Собираем данные всех отчетов
        const reportData = {
            classReports: this.getClassReportsData(),
            subjectReports: this.getSubjectReportsData(),
            participantsReports: this.getParticipantsReportsData()
        };

        // Создаем CSV контент
        let csvContent = '';

        // Сводка по классам
        csvContent += 'СВОДКА ПО КЛАССАМ\n';
        csvContent += 'Класс,Участников,Победителей,Призёров,Охват\n';
        reportData.classReports.forEach(data => {
            const coverage = data.totalStudents > 0 ? Math.round((data.participants / data.totalStudents) * 100) : 0;
            csvContent += `${data.className},${data.participants},${data.winners},${data.prizeWinners},${coverage}%\n`;
        });

        csvContent += '\n';

        // Сводка по предметам
        csvContent += 'СВОДКА ПО ПРЕДМЕТАМ\n';
        csvContent += 'Предмет,Участников,Победителей,Призёров,Эффективность\n';
        reportData.subjectReports.forEach(data => {
            const effectiveness = data.participants > 0 ? Math.round(((data.winners + data.prizeWinners) / data.participants) * 100) : 0;
            csvContent += `"${data.subjectName}",${data.participants},${data.winners},${data.prizeWinners},${effectiveness}%\n`;
        });

        csvContent += '\n';

        // Рейтинг участников
        csvContent += 'РЕЙТИНГ УЧАСТНИКОВ\n';
        csvContent += 'ФИО,Класс,Предмет,Этап,Статус,Баллы\n';
        reportData.participantsReports.forEach(participant => {
            csvContent += `"${participant.fio}",${participant.class},"${participant.subject}",${participant.stage},${participant.status},${participant.points}\n`;
        });

        // Скачиваем файл
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `vsosh-all-reports-${timestamp}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showNotification('success', 'Экспорт завершён', 'Все отчёты сохранены в CSV файл');
    }

    // Вспомогательные функции для получения данных отчетов
    getClassReportsData() {
        const reportStageFilter = document.getElementById('reportStageFilter')?.value || '';
        const reportClassFilter = document.getElementById('reportClassFilter')?.value || '';
        const reportSubjectFilter = document.getElementById('reportSubjectFilter')?.value || '';

        const classData = new Map();
        this.classes.forEach(cls => {
            if (reportClassFilter && cls.name !== reportClassFilter) return;
            classData.set(cls.name, {
                className: cls.name,
                totalStudents: cls.totalStudents,
                participants: 0,
                winners: 0,
                prizeWinners: 0
            });
        });

        if (!reportStageFilter || reportStageFilter === 'Школьный') {
            this.quantitativeData.forEach(item => {
                if (reportClassFilter && item.class !== reportClassFilter) return;
                if (reportSubjectFilter && item.subject !== reportSubjectFilter) return;
                const classInfo = classData.get(item.class);
                if (classInfo) {
                    classInfo.participants += item.participantsCount || 0;
                    classInfo.winners += (item.winnersFio || []).length;
                    classInfo.prizeWinners += (item.prizeWinnersFio || []).length;
                }
            });
        }

        this.participants.forEach(participant => {
            if (reportStageFilter && participant.stage !== reportStageFilter) return;
            if (reportClassFilter && participant.class !== reportClassFilter) return;
            if (reportSubjectFilter && participant.subject !== reportSubjectFilter) return;
            const classInfo = classData.get(participant.class);
            if (classInfo) {
                classInfo.participants += 1;
                if (participant.status === 'Победитель') classInfo.winners += 1;
                else if (participant.status === 'Призёр') classInfo.prizeWinners += 1;
            }
        });

        return Array.from(classData.values()).filter(data => data.participants > 0);
    }

    getSubjectReportsData() {
        const reportStageFilter = document.getElementById('reportStageFilter')?.value || '';
        const reportClassFilter = document.getElementById('reportClassFilter')?.value || '';
        const reportSubjectFilter = document.getElementById('reportSubjectFilter')?.value || '';

        const subjectData = new Map();
        this.subjects.forEach(subject => {
            if (reportSubjectFilter && subject !== reportSubjectFilter) return;
            subjectData.set(subject, {
                subjectName: subject,
                participants: 0,
                winners: 0,
                prizeWinners: 0
            });
        });

        if (!reportStageFilter || reportStageFilter === 'Школьный') {
            this.quantitativeData.forEach(item => {
                if (reportClassFilter && item.class !== reportClassFilter) return;
                if (reportSubjectFilter && item.subject !== reportSubjectFilter) return;
                const subjectInfo = subjectData.get(item.subject);
                if (subjectInfo) {
                    subjectInfo.participants += item.participantsCount || 0;
                    subjectInfo.winners += (item.winnersFio || []).length;
                    subjectInfo.prizeWinners += (item.prizeWinnersFio || []).length;
                }
            });
        }

        this.participants.forEach(participant => {
            if (reportStageFilter && participant.stage !== reportStageFilter) return;
            if (reportClassFilter && participant.class !== reportClassFilter) return;
            if (reportSubjectFilter && participant.subject !== reportSubjectFilter) return;
            const subjectInfo = subjectData.get(participant.subject);
            if (subjectInfo) {
                subjectInfo.participants += 1;
                if (participant.status === 'Победитель') subjectInfo.winners += 1;
                else if (participant.status === 'Призёр') subjectInfo.prizeWinners += 1;
            }
        });

        return Array.from(subjectData.values()).filter(data => data.participants > 0);
    }

    getParticipantsReportsData() {
        const reportStageFilter = document.getElementById('reportStageFilter')?.value || '';
        const reportClassFilter = document.getElementById('reportClassFilter')?.value || '';
        const reportSubjectFilter = document.getElementById('reportSubjectFilter')?.value || '';

        let allParticipants = [];

        if (!reportStageFilter || reportStageFilter === 'Школьный') {
            this.quantitativeData.forEach(item => {
                if (reportClassFilter && item.class !== reportClassFilter) return;
                if (reportSubjectFilter && item.subject !== reportSubjectFilter) return;
                (item.winnersFio || []).forEach(fio => {
                    allParticipants.push({
                        fio: fio,
                        class: item.class,
                        subject: item.subject,
                        stage: 'Школьный',
                        status: 'Победитель',
                        points: '-'
                    });
                });
                (item.prizeWinnersFio || []).forEach(fio => {
                    allParticipants.push({
                        fio: fio,
                        class: item.class,
                        subject: item.subject,
                        stage: 'Школьный',
                        status: 'Призёр',
                        points: '-'
                    });
                });
            });
        }

        this.participants.forEach(participant => {
            if (reportStageFilter && participant.stage !== reportStageFilter) return;
            if (reportClassFilter && participant.class !== reportClassFilter) return;
            if (reportSubjectFilter && participant.subject !== reportSubjectFilter) return;
            allParticipants.push({
                fio: participant.fio,
                class: participant.class,
                subject: participant.subject,
                stage: participant.stage,
                status: participant.status,
                points: participant.points || '-'
            });
        });

        return allParticipants;
    }

    // Dropdown functionality
    toggleDropdown(dropdownId) {
        const dropdown = document.getElementById(dropdownId);
        if (dropdown) {
            dropdown.classList.toggle('show');
        }
    }

    closeDropdown(dropdownId) {
        const dropdown = document.getElementById(dropdownId);
        if (dropdown) {
            dropdown.classList.remove('show');
        }
    }

    closeAllDropdowns() {
        document.querySelectorAll('.dropdown-content').forEach(dropdown => {
            dropdown.classList.remove('show');
        });
    }

    // Modal functionality
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('hidden');
        }
    }

    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('hidden');
        }
        if (modalId === 'participantModal') {
            this.editingParticipant = null;
        }
        if (modalId === 'quantitativeModal') {
            this.editingQuantitative = null;
        }
    }

    // РАСЧЕТ ОХВАТА С УЧЕТОМ ФИЛЬТРОВ
    calculateCoverage() {
        const classFilter = document.getElementById('classFilter')?.value || '';
        const subjectFilter = document.getElementById('subjectFilter')?.value || '';

        let totalStudents = 0;
        let participantCount = 0;

        if (classFilter) {
            const selectedClass = this.classes.find(cls => cls.name === classFilter);
            if (selectedClass) {
                totalStudents = selectedClass.totalStudents;
                if (this.currentStage === 'Школьный') {
                    participantCount = this.quantitativeData
                        .filter(item => item.class === classFilter)
                        .filter(item => !subjectFilter || item.subject === subjectFilter)
                        .reduce((sum, item) => sum + item.participantsCount, 0);
                } else {
                    participantCount = this.participants
                        .filter(p => p.stage === this.currentStage && p.class === classFilter)
                        .filter(p => !subjectFilter || p.subject === subjectFilter)
                        .length;
                }
            }
        } else {
            totalStudents = this.classes.reduce((sum, cls) => sum + cls.totalStudents, 0);
            if (this.currentStage === 'Школьный') {
                participantCount = this.quantitativeData
                    .filter(item => !subjectFilter || item.subject === subjectFilter)
                    .reduce((sum, item) => sum + item.participantsCount, 0);
            } else {
                participantCount = this.participants
                    .filter(p => p.stage === this.currentStage)
                    .filter(p => !subjectFilter || p.subject === subjectFilter)
                    .length;
            }
        }

        if (totalStudents === 0) return 0;
        return Math.round((participantCount / totalStudents) * 100);
    }

    // ОБНОВЛЕНИЕ СТАТИСТИКИ С УЧЕТОМ ФИЛЬТРОВ
    updateStats() {
        const classFilter = document.getElementById('classFilter')?.value || '';
        const subjectFilter = document.getElementById('subjectFilter')?.value || '';
        const searchInput = document.getElementById('searchInput')?.value.toLowerCase() || '';

        const totalParticipantsEl = document.getElementById('totalParticipants');
        const totalWinnersEl = document.getElementById('totalWinners');
        const totalPrizeWinnersEl = document.getElementById('totalPrizeWinners');
        const coveragePercentEl = document.getElementById('coveragePercent');

        let participantCount = 0;
        let winnersCount = 0;
        let prizeWinnersCount = 0;

        if (this.currentStage === 'Школьный') {
            let filteredQuantitative = this.quantitativeData;
            if (classFilter) {
                filteredQuantitative = filteredQuantitative.filter(item => item.class === classFilter);
            }
            if (subjectFilter) {
                filteredQuantitative = filteredQuantitative.filter(item => item.subject === subjectFilter);
            }

            participantCount = filteredQuantitative.reduce((sum, item) => sum + item.participantsCount, 0);
            winnersCount = filteredQuantitative.reduce((sum, item) => sum + (item.winnersFio?.length || 0), 0);
            prizeWinnersCount = filteredQuantitative.reduce((sum, item) => sum + (item.prizeWinnersFio?.length || 0), 0);

            if (searchInput) {
                winnersCount = filteredQuantitative.reduce((sum, item) => {
                    const matchingWinners = (item.winnersFio || []).filter(fio =>
                        fio.toLowerCase().includes(searchInput)
                    );
                    return sum + matchingWinners.length;
                }, 0);

                prizeWinnersCount = filteredQuantitative.reduce((sum, item) => {
                    const matchingPrizeWinners = (item.prizeWinnersFio || []).filter(fio =>
                        fio.toLowerCase().includes(searchInput)
                    );
                    return sum + matchingPrizeWinners.length;
                }, 0);
            }
        } else {
            let filteredParticipants = this.participants.filter(p => p.stage === this.currentStage);
            if (classFilter) {
                filteredParticipants = filteredParticipants.filter(p => p.class === classFilter);
            }
            if (subjectFilter) {
                filteredParticipants = filteredParticipants.filter(p => p.subject === subjectFilter);
            }
            if (searchInput) {
                filteredParticipants = filteredParticipants.filter(p =>
                    p.fio.toLowerCase().includes(searchInput)
                );
            }

            participantCount = filteredParticipants.length;
            winnersCount = filteredParticipants.filter(p => p.status === 'Победитель').length;
            prizeWinnersCount = filteredParticipants.filter(p => p.status === 'Призёр').length;
        }

        if (totalParticipantsEl) {
            totalParticipantsEl.textContent = participantCount;
        }
        if (totalWinnersEl) {
            totalWinnersEl.textContent = winnersCount;
        }
        if (totalPrizeWinnersEl) {
            totalPrizeWinnersEl.textContent = prizeWinnersCount;
        }

        if (coveragePercentEl) {
            const coverage = this.calculateCoverage();
            coveragePercentEl.textContent = `${coverage}%`;
        }
    }

    // Export functionality
    exportData() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
        const exportData = {
            version: this.version,
            exportedAt: new Date().toISOString(),
            classes: this.classes,
            teachers: this.teachers,
            quantitativeData: this.quantitativeData,
            participants: this.participants
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `vsosh-backup-${timestamp}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showNotification('success', 'Экспорт завершён', 'Данные успешно экспортированы');
    }

    // Import functionality
    showImportModal() {
        this.showModal('importModal');
        const fileInput = document.getElementById('importFileInput');
        const preview = document.getElementById('importPreview');
        const confirmBtn = document.getElementById('importConfirmBtn');

        if (fileInput) fileInput.value = '';
        if (preview) preview.style.display = 'none';
        if (confirmBtn) confirmBtn.style.display = 'none';
    }

    handleImportFile(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                this.importData = data;
                this.showImportPreview(data);
            } catch (error) {
                this.showNotification('error', 'Ошибка импорта', 'Неверный формат файла');
            }
        };
        reader.readAsText(file);
    }

    showImportPreview(data) {
        const preview = document.getElementById('importPreview');
        const content = document.getElementById('importPreviewContent');
        const confirmBtn = document.getElementById('importConfirmBtn');

        if (!preview || !content || !confirmBtn) return;

        const stats = {
            classes: data.classes?.length || 0,
            teachers: data.teachers?.length || 0,
            quantitativeData: data.quantitativeData?.length || 0,
            participants: data.participants?.length || 0
        };

        content.innerHTML = `
            <p><strong>Версия:</strong> ${data.version || 'Не указана'}</p>
            <p><strong>Дата экспорта:</strong> ${data.exportedAt ? new Date(data.exportedAt).toLocaleString() : 'Не указана'}</p>
            <hr>
            <p><strong>Содержимое файла:</strong></p>
            <ul>
                <li>Классы: ${stats.classes}</li>
                <li>Учителя: ${stats.teachers}</li>
                <li>Количественные данные: ${stats.quantitativeData}</li>
                <li>Участники: ${stats.participants}</li>
            </ul>
            <div style="background-color: rgba(var(--color-warning-rgb), 0.1); padding: 12px; border-radius: 6px; margin-top: 16px;">
                <strong>Внимание:</strong> Импорт заменит все текущие данные!
            </div>
        `;

        preview.style.display = 'block';
        confirmBtn.style.display = 'inline-flex';
    }

    confirmImport() {
        if (!this.importData) return;

        this.classes = this.importData.classes || this.getDefaultClasses();
        this.teachers = this.importData.teachers || this.getDefaultTeachers();
        this.quantitativeData = this.importData.quantitativeData || [];
        this.participants = this.importData.participants || [];

        // МИГРИРУЕМ ИМПОРТИРОВАННЫЕ ДАННЫЕ
        this.migrateData();

        this.saveData();
        this.updateFilters();
        this.renderCurrentStage();
        this.updateStats();
        this.hideModal('importModal');

        this.showNotification('success', 'Импорт завершён', 'Данные успешно импортированы');
    }

    // Backup functionality
    createBackup() {
        const timestamp = new Date().toISOString();
        const backupData = {
            version: this.version,
            timestamp: timestamp,
            classes: this.classes,
            teachers: this.teachers,
            quantitativeData: this.quantitativeData,
            participants: this.participants
        };

        const backups = JSON.parse(localStorage.getItem('vsoshBackups') || '[]');
        backups.push(backupData);

        if (backups.length > 10) {
            backups.splice(0, backups.length - 10);
        }

        localStorage.setItem('vsoshBackups', JSON.stringify(backups));
        this.showNotification('success', 'Резервная копия создана', 'Копия сохранена в локальном хранилище');
    }

    showRestoreModal() {
        this.showModal('restoreModal');
        const backupsList = document.getElementById('backupsList');

        if (!backupsList) return;

        const backups = JSON.parse(localStorage.getItem('vsoshBackups') || '[]');

        if (backups.length === 0) {
            backupsList.innerHTML = '<p>Нет доступных резервных копий</p>';
            return;
        }

        backupsList.innerHTML = backups
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .map((backup, index) => {
                const date = new Date(backup.timestamp).toLocaleString();
                const stats = {
                    classes: backup.classes?.length || 0,
                    teachers: backup.teachers?.length || 0,
                    quantitativeData: backup.quantitativeData?.length || 0,
                    participants: backup.participants?.length || 0
                };

                return `
                    <div class="backup-item card" style="margin-bottom: 16px;">
                        <div class="card__body">
                            <h4 style="margin: 0 0 8px 0;">Резервная копия</h4>
                            <p style="margin: 0 0 8px 0; color: var(--color-text-secondary);">
                                <strong>Дата:</strong> ${date}<br>
                                <strong>Версия:</strong> ${backup.version || 'Не указана'}
                            </p>
                            <p style="margin: 0 0 16px 0; font-size: 14px;">
                                Классы: ${stats.classes}, Учителя: ${stats.teachers}, 
                                Количественные данные: ${stats.quantitativeData}, Участники: ${stats.participants}
                            </p>
                            <div style="display: flex; gap: 8px;">
                                <button onclick="window.vsoshApp.restoreBackup(${index})" class="btn btn--primary btn--sm">
                                    Восстановить
                                </button>
                                <button onclick="window.vsoshApp.deleteBackup(${index})" class="btn btn--danger btn--sm">
                                    Удалить
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
    }

    restoreBackup(index) {
        const backups = JSON.parse(localStorage.getItem('vsoshBackups') || '[]');
        if (index < 0 || index >= backups.length) return;

        const backup = backups[index];
        this.classes = backup.classes || this.getDefaultClasses();
        this.teachers = backup.teachers || this.getDefaultTeachers();
        this.quantitativeData = backup.quantitativeData || [];
        this.participants = backup.participants || [];

        // МИГРИРУЕМ ВОССТАНОВЛЕННЫЕ ДАННЫЕ
        this.migrateData();

        this.saveData();
        this.updateFilters();
        this.renderCurrentStage();
        this.updateStats();
        this.hideModal('restoreModal');

        this.showNotification('success', 'Данные восстановлены', 'Резервная копия успешно восстановлена');
    }

    deleteBackup(index) {
        const backups = JSON.parse(localStorage.getItem('vsoshBackups') || '[]');
        if (index < 0 || index >= backups.length) return;

        backups.splice(index, 1);
        localStorage.setItem('vsoshBackups', JSON.stringify(backups));
        this.showRestoreModal();

        this.showNotification('success', 'Резервная копия удалена', 'Копия удалена из локального хранилища');
    }

    // Stage switching
    switchStage(stage) {
        this.currentStage = stage;

        document.querySelectorAll('.stage-tab').forEach(tab => {
            if (tab.dataset.stage === stage) {
                tab.classList.remove('btn--secondary');
                tab.classList.add('btn--primary');
            } else {
                tab.classList.remove('btn--primary');
                tab.classList.add('btn--secondary');
            }
        });

        this.renderCurrentStage();
        this.updateStats();
    }

    renderCurrentStage() {
        const schoolContent = document.getElementById('schoolStageContent');
        const otherContent = document.getElementById('otherStageContent');

        if (this.currentStage === 'Школьный') {
            if (schoolContent) schoolContent.classList.remove('hidden');
            if (otherContent) otherContent.classList.add('hidden');
            this.renderQuantitativeData();
        } else {
            if (schoolContent) schoolContent.classList.add('hidden');
            if (otherContent) otherContent.classList.remove('hidden');

            const stageTitle = document.getElementById('stageTitle');
            if (stageTitle) {
                stageTitle.textContent = `Участники ${this.currentStage.toLowerCase()} этапа`;
            }

            this.renderParticipants();
        }
    }

    // ИСПРАВЛЕННАЯ ФУНКЦИЯ РЕНДЕРИНГА КОЛИЧЕСТВЕННЫХ ДАННЫХ С ПРАВИЛЬНЫМИ КНОПКАМИ
    renderQuantitativeData() {
        const tbody = document.getElementById('quantitativeTableBody');
        if (!tbody) return;

        const classFilter = document.getElementById('classFilter')?.value || '';
        const subjectFilter = document.getElementById('subjectFilter')?.value || '';

        let filteredData = this.quantitativeData;

        if (classFilter) {
            filteredData = filteredData.filter(item => item.class === classFilter);
        }
        if (subjectFilter) {
            filteredData = filteredData.filter(item => item.subject === subjectFilter);
        }

        if (filteredData.length === 0) {
            tbody.innerHTML = `
                <tr class="empty-row">
                    <td colspan="6">Добавьте количественные данные по предметам</td>
                </tr>
            `;
            return;
        }

        // ИСПРАВЛЕНО: Проверка на наличие ID и вывод отладочной информации
        tbody.innerHTML = filteredData.map(item => {
            // Если нет ID - используем временный индекс, но выводим предупреждение в консоль
            if (!item.id) {
                console.warn('Найдена запись без ID:', item);
            }
            const itemId = item.id || `temp-${Date.now()}-${Math.random()}`;

            return `
                <tr>
                    <td>${item.class}</td>
                    <td>${item.subject}</td>
                    <td>${item.participantsCount}</td>
                    <td>${(item.winnersFio || []).join(', ')}</td>
                    <td>${(item.prizeWinnersFio || []).join(', ')}</td>
                    <td>
                        <button onclick="window.vsoshApp.editQuantitative('${itemId}')" class="btn btn--sm btn--outline">
                            Изменить
                        </button>
                        <button onclick="window.vsoshApp.deleteQuantitative('${itemId}')" class="btn btn--sm btn--danger">
                            Удалить
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    // ИСПРАВЛЕННАЯ ФУНКЦИЯ РЕНДЕРИНГА УЧАСТНИКОВ С ПРАВИЛЬНЫМИ КНОПКАМИ
    renderParticipants() {
        const tbody = document.getElementById('participantsTableBody');
        if (!tbody) return;

        const classFilter = document.getElementById('classFilter')?.value || '';
        const subjectFilter = document.getElementById('subjectFilter')?.value || '';
        const searchInput = document.getElementById('searchInput')?.value.toLowerCase() || '';

        let filteredParticipants = this.participants.filter(p => p.stage === this.currentStage);

        if (classFilter) {
            filteredParticipants = filteredParticipants.filter(p => p.class === classFilter);
        }
        if (subjectFilter) {
            filteredParticipants = filteredParticipants.filter(p => p.subject === subjectFilter);
        }
        if (searchInput) {
            filteredParticipants = filteredParticipants.filter(p => 
                p.fio.toLowerCase().includes(searchInput)
            );
        }

        if (filteredParticipants.length === 0) {
            tbody.innerHTML = `
                <tr class="empty-row">
                    <td colspan="6">Добавьте участников для данного этапа</td>
                </tr>
            `;
            return;
        }

        // ИСПРАВЛЕНО: Проверка на наличие ID и вывод отладочной информации
        tbody.innerHTML = filteredParticipants.map(participant => {
            // Если нет ID - используем временный индекс, но выводим предупреждение в консоль
            if (!participant.id) {
                console.warn('Найден участник без ID:', participant);
            }
            const participantId = participant.id || `temp-${Date.now()}-${Math.random()}`;

            return `
                <tr>
                    <td>${participant.fio}</td>
                    <td>${participant.class}</td>
                    <td>${participant.subject}</td>
                    <td><span class="status status--${this.getStatusClass(participant.status)}">${participant.status}</span></td>
                    <td>${participant.teacher || ''}</td>
                    <td>
                        <button onclick="window.vsoshApp.editParticipant('${participantId}')" class="btn btn--sm btn--outline">
                            Изменить
                        </button>
                        <button onclick="window.vsoshApp.deleteParticipant('${participantId}')" class="btn btn--sm btn--danger">
                            Удалить
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    getStatusClass(status) {
        switch(status) {
            case 'Победитель': return 'success';
            case 'Призёр': return 'warning';
            case 'Участник': return 'info';
            default: return 'info';
        }
    }

    // Participant management
    showParticipantModal(participantId = null) {
        this.editingParticipant = participantId;
        const modal = document.getElementById('participantModal');
        const title = document.getElementById('participantModalTitle');

        const fioInput = document.getElementById('participantFio');
        const classSelect = document.getElementById('participantClass');
        const subjectSelect = document.getElementById('participantSubject');
        const statusSelect = document.getElementById('participantStatus');
        const teacherInput = document.getElementById('participantTeacher');

        // 1. СНАЧАЛА заполняем списки опциями
        this.populateParticipantModal();

        // 2. ПОТОМ заполняем значения если редактируем
        if (participantId) {
            const participant = this.participants.find(p => p.id === participantId);
            if (participant) {
                if (title) title.textContent = 'Редактировать участника';
                if (fioInput) fioInput.value = participant.fio;
                if (classSelect) classSelect.value = participant.class;  // ТЕПЕРЬ РАБОТАЕТ!
                if (subjectSelect) subjectSelect.value = participant.subject;  // ТЕПЕРЬ РАБОТАЕТ!
                if (statusSelect) statusSelect.value = participant.status;
                if (teacherInput) teacherInput.value = participant.teacher || '';
            }
        } else {
            if (title) title.textContent = 'Добавить участника';
            if (fioInput) fioInput.value = '';
            if (classSelect) classSelect.value = '';
            if (subjectSelect) subjectSelect.value = '';
            if (statusSelect) statusSelect.value = '';
            if (teacherInput) teacherInput.value = '';
        }

        this.showModal('participantModal');
    }

    populateParticipantModal() {
        const classSelect = document.getElementById('participantClass');
        const subjectSelect = document.getElementById('participantSubject');

        if (classSelect) {
            classSelect.innerHTML = '<option value="">Выберите класс</option>';
            // ИСПОЛЬЗУЕМ СОРТИРОВКУ КЛАССОВ
            this.sortClassesByNumber(this.classes).forEach(cls => {
                const option = document.createElement('option');
                option.value = cls.name;
                option.textContent = cls.name;
                classSelect.appendChild(option);
            });
        }

        if (subjectSelect) {
            subjectSelect.innerHTML = '<option value="">Выберите предмет</option>';
            this.subjects.forEach(subject => {
                const option = document.createElement('option');
                option.value = subject;
                option.textContent = subject;
                subjectSelect.appendChild(option);
            });
        }
    }

    saveParticipant() {
        const fioInput = document.getElementById('participantFio');
        const classSelect = document.getElementById('participantClass');
        const subjectSelect = document.getElementById('participantSubject');
        const statusSelect = document.getElementById('participantStatus');
        const teacherInput = document.getElementById('participantTeacher');

        if (!fioInput || !classSelect || !subjectSelect || !statusSelect) return;

        const fio = fioInput.value.trim();
        const className = classSelect.value;
        const subject = subjectSelect.value;
        const status = statusSelect.value;
        const teacher = teacherInput ? teacherInput.value.trim() : '';

        if (!fio || !className || !subject || !status) {
            this.showNotification('error', 'Ошибка', 'Заполните все обязательные поля');
            return;
        }

        if (this.editingParticipant) {
            const index = this.participants.findIndex(p => p.id === this.editingParticipant);
            if (index !== -1) {
                this.participants[index] = {
                    ...this.participants[index],
                    fio,
                    class: className,
                    subject,
                    status,
                    teacher
                };
            }
        } else {
            const newParticipant = {
                id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                fio,
                class: className,
                subject,
                status,
                teacher,
                stage: this.currentStage
            };
            this.participants.push(newParticipant);
        }

        this.saveData();
        this.hideModal('participantModal');
        this.renderCurrentStage();
        this.updateStats();

        this.showNotification('success', 
            this.editingParticipant ? 'Участник изменён' : 'Участник добавлен', 
            'Данные сохранены'
        );
    }

    // ИСПРАВЛЕННЫЕ ФУНКЦИИ РЕДАКТИРОВАНИЯ И УДАЛЕНИЯ
    editParticipant(id) {
        // Дополнительная проверка на случай если ID не найден
        const participant = this.participants.find(p => p.id === id);
        if (!participant) {
            console.error('Участник с ID не найден:', id);
            this.showNotification('error', 'Ошибка', 'Участник не найден');
            return;
        }
        this.showParticipantModal(id);
    }

    deleteParticipant(id) {
        // Дополнительная проверка на случай если ID не найден
        const participant = this.participants.find(p => p.id === id);
        if (!participant) {
            console.error('Участник с ID не найден:', id);
            this.showNotification('error', 'Ошибка', 'Участник не найден');
            return;
        }

        if (confirm('Удалить участника?')) {
            this.participants = this.participants.filter(p => p.id !== id);
            this.saveData();
            this.renderCurrentStage();
            this.updateStats();
            this.showNotification('success', 'Участник удалён', 'Данные сохранены');
        }
    }

    // Quantitative data management - ИСПРАВЛЕНА ПОСЛЕДОВАТЕЛЬНОСТЬ ЗАПОЛНЕНИЯ ФОРМЫ
    showQuantitativeModal(itemId = null) {
        this.editingQuantitative = itemId;
        const modal = document.getElementById('quantitativeModal');
        const title = document.getElementById('quantitativeModalTitle');

        const classSelect = document.getElementById('quantitativeClass');
        const subjectSelect = document.getElementById('quantitativeSubject');
        const participantsInput = document.getElementById('quantitativeParticipants');
        const winnersTextarea = document.getElementById('quantitativeWinners');
        const prizeWinnersTextarea = document.getElementById('quantitativePrizeWinners');

        // 1. СНАЧАЛА заполняем списки опциями - КРИТИЧЕСКИ ВАЖНО!
        this.populateQuantitativeModal();

        // 2. ПОТОМ заполняем значения если редактируем
        if (itemId) {
            const item = this.quantitativeData.find(q => q.id === itemId);
            if (item) {
                if (title) title.textContent = 'Редактировать количественные данные';
                if (classSelect) classSelect.value = item.class;  // ТЕПЕРЬ РАБОТАЕТ!
                if (subjectSelect) subjectSelect.value = item.subject;  // ТЕПЕРЬ РАБОТАЕТ!
                if (participantsInput) participantsInput.value = item.participantsCount;
                if (winnersTextarea) winnersTextarea.value = (item.winnersFio || []).join(', ');
                if (prizeWinnersTextarea) prizeWinnersTextarea.value = (item.prizeWinnersFio || []).join(', ');
            }
        } else {
            if (title) title.textContent = 'Добавить количественные данные';
            if (classSelect) classSelect.value = '';
            if (subjectSelect) subjectSelect.value = '';
            if (participantsInput) participantsInput.value = '';
            if (winnersTextarea) winnersTextarea.value = '';
            if (prizeWinnersTextarea) prizeWinnersTextarea.value = '';
        }

        this.showModal('quantitativeModal');
    }

    populateQuantitativeModal() {
        const classSelect = document.getElementById('quantitativeClass');
        const subjectSelect = document.getElementById('quantitativeSubject');

        if (classSelect) {
            classSelect.innerHTML = '<option value="">Выберите класс</option>';
            // ИСПОЛЬЗУЕМ СОРТИРОВКУ КЛАССОВ
            this.sortClassesByNumber(this.classes).forEach(cls => {
                const option = document.createElement('option');
                option.value = cls.name;
                option.textContent = cls.name;
                classSelect.appendChild(option);
            });
        }

        if (subjectSelect) {
            subjectSelect.innerHTML = '<option value="">Выберите предмет</option>';
            this.subjects.forEach(subject => {
                const option = document.createElement('option');
                option.value = subject;
                option.textContent = subject;
                subjectSelect.appendChild(option);
            });
        }
    }

    saveQuantitative() {
        const classSelect = document.getElementById('quantitativeClass');
        const subjectSelect = document.getElementById('quantitativeSubject');
        const participantsInput = document.getElementById('quantitativeParticipants');
        const winnersTextarea = document.getElementById('quantitativeWinners');
        const prizeWinnersTextarea = document.getElementById('quantitativePrizeWinners');

        if (!classSelect || !subjectSelect || !participantsInput) return;

        const className = classSelect.value;
        const subject = subjectSelect.value;
        const participantsCount = parseInt(participantsInput.value) || 0;
        const winnersText = winnersTextarea ? winnersTextarea.value.trim() : '';
        const prizeWinnersText = prizeWinnersTextarea ? prizeWinnersTextarea.value.trim() : '';

        if (!className || !subject) {
            this.showNotification('error', 'Ошибка', 'Заполните все обязательные поля');
            return;
        }

        const winnersFio = winnersText ? winnersText.split(',').map(s => s.trim()).filter(s => s) : [];
        const prizeWinnersFio = prizeWinnersText ? prizeWinnersText.split(',').map(s => s.trim()).filter(s => s) : [];

        if (this.editingQuantitative) {
            const index = this.quantitativeData.findIndex(q => q.id === this.editingQuantitative);
            if (index !== -1) {
                this.quantitativeData[index] = {
                    ...this.quantitativeData[index],
                    class: className,
                    subject,
                    participantsCount,
                    winnersFio,
                    prizeWinnersFio
                };
            }
        } else {
            const newItem = {
                id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                class: className,
                subject,
                participantsCount,
                winnersFio,
                prizeWinnersFio
            };
            this.quantitativeData.push(newItem);
        }

        this.saveData();
        this.hideModal('quantitativeModal');
        this.renderCurrentStage();
        this.updateStats();

        this.showNotification('success', 
            this.editingQuantitative ? 'Данные изменены' : 'Данные добавлены', 
            'Информация сохранена'
        );
    }

    // ИСПРАВЛЕННЫЕ ФУНКЦИИ РЕДАКТИРОВАНИЯ И УДАЛЕНИЯ КОЛИЧЕСТВЕННЫХ ДАННЫХ
    editQuantitative(id) {
        // Дополнительная проверка на случай если ID не найден
        const item = this.quantitativeData.find(q => q.id === id);
        if (!item) {
            console.error('Количественная запись с ID не найдена:', id);
            this.showNotification('error', 'Ошибка', 'Запись не найдена');
            return;
        }
        this.showQuantitativeModal(id);
    }

    deleteQuantitative(id) {
        // Дополнительная проверка на случай если ID не найден
        const item = this.quantitativeData.find(q => q.id === id);
        if (!item) {
            console.error('Количественная запись с ID не найдена:', id);
            this.showNotification('error', 'Ошибка', 'Запись не найдена');
            return;
        }

        if (confirm('Удалить количественные данные?')) {
            this.quantitativeData = this.quantitativeData.filter(q => q.id !== id);
            this.saveData();
            this.renderCurrentStage();
            this.updateStats();
            this.showNotification('success', 'Данные удалены', 'Информация сохранена');
        }
    }

    // Filter updates (С СОРТИРОВКОЙ)
    updateFilters() {
        const classFilter = document.getElementById('classFilter');
        const subjectFilter = document.getElementById('subjectFilter');

        if (classFilter) {
            const currentValue = classFilter.value;
            classFilter.innerHTML = '<option value="">Все классы</option>';
            // ИСПОЛЬЗУЕМ СОРТИРОВКУ КЛАССОВ
            this.sortClassesByNumber(this.classes).forEach(cls => {
                const option = document.createElement('option');
                option.value = cls.name;
                option.textContent = cls.name;
                classFilter.appendChild(option);
            });
            classFilter.value = currentValue;
        }

        if (subjectFilter) {
            const currentValue = subjectFilter.value;
            subjectFilter.innerHTML = '<option value="">Все предметы</option>';
            this.subjects.forEach(subject => {
                const option = document.createElement('option');
                option.value = subject;
                option.textContent = subject;
                subjectFilter.appendChild(option);
            });
            subjectFilter.value = currentValue;
        }
    }

    // Classes management
    renderClassesList() {
        const classesList = document.getElementById('classesList');
        if (!classesList) return;

        if (this.classes.length === 0) {
            classesList.innerHTML = '<p>Классы не добавлены</p>';
            return;
        }

        // СОРТИРУЕМ КЛАССЫ И В СПИСКЕ УПРАВЛЕНИЯ ТОЖЕ
        const sortedClasses = this.sortClassesByNumber(this.classes);

        classesList.innerHTML = sortedClasses.map((cls, index) => {
            // Находим правильный индекс в исходном массиве для редактирования/удаления
            const originalIndex = this.classes.findIndex(c => c.name === cls.name);

            return `
                <div class="class-item">
                    <div class="class-info">
                        <h4>${cls.name}</h4>
                        <p>Учеников: ${cls.totalStudents}, Классный руководитель: ${cls.classTeacher}</p>
                    </div>
                    <div>
                        <button onclick="window.vsoshApp.editClass(${originalIndex})" class="btn btn--sm btn--outline">Изменить</button>
                        <button onclick="window.vsoshApp.deleteClass(${originalIndex})" class="btn btn--sm btn--danger">Удалить</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    editClass(index) {
        const cls = this.classes[index];
        if (!cls) return;

        const name = prompt('Название класса:', cls.name);
        if (!name) return;

        const totalStudents = parseInt(prompt('Количество учеников:', cls.totalStudents)) || 0;
        const classTeacher = prompt('Классный руководитель:', cls.classTeacher) || '';

        this.classes[index] = { name, totalStudents, classTeacher };
        this.saveData();
        this.renderClassesList();
        this.updateFilters();
        this.showNotification('success', 'Класс изменён', 'Данные сохранены');
    }

    deleteClass(index) {
        if (confirm('Удалить класс?')) {
            this.classes.splice(index, 1);
            this.saveData();
            this.renderClassesList();
            this.updateFilters();
            this.showNotification('success', 'Класс удалён', 'Данные сохранены');
        }
    }

    // Teachers management
    renderTeachersList() {
        const teachersList = document.getElementById('teachersList');
        if (!teachersList) return;

        if (this.teachers.length === 0) {
            teachersList.innerHTML = '<p>Учителя не добавлены</p>';
            return;
        }

        teachersList.innerHTML = this.teachers.map((teacher, index) => `
            <div class="teacher-item">
                <div class="teacher-info">
                    <h4>${teacher}</h4>
                </div>
                <div>
                    <button onclick="window.vsoshApp.editTeacher(${index})" class="btn btn--sm btn--outline">Изменить</button>
                    <button onclick="window.vsoshApp.deleteTeacher(${index})" class="btn btn--sm btn--danger">Удалить</button>
                </div>
            </div>
        `).join('');
    }

    editTeacher(index) {
        const teacher = this.teachers[index];
        if (!teacher) return;

        const newTeacher = prompt('ФИО учителя (предмет):', teacher);
        if (!newTeacher) return;

        this.teachers[index] = newTeacher;
        this.saveData();
        this.renderTeachersList();
        this.showNotification('success', 'Учитель изменён', 'Данные сохранены');
    }

    deleteTeacher(index) {
        if (confirm('Удалить учителя?')) {
            this.teachers.splice(index, 1);
            this.saveData();
            this.renderTeachersList();
            this.showNotification('success', 'Учитель удалён', 'Данные сохранены');
        }
    }

    // Notifications
    showNotification(type, title, message) {
        const container = document.querySelector('.notification-container');
        if (!container) return;

        const notification = document.createElement('div');
        notification.className = `notification notification--${type}`;
        notification.innerHTML = `
            <div class="notification-title">${title}</div>
            <div class="notification-message">${message}</div>
        `;

        container.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 5000);
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.vsoshApp = new VsoshApp();
});
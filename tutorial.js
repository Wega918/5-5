// Система обучения
console.log('🎓 Модуль обучения загружен');

let currentTutorialStep = 0;

// Вспомогательная функция: Парсинг простого Markdown (только **жирный**)
function parseMarkdown(text) {
    // Замена **текст** на <b>текст</b>
    return text.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
}

// Вспомогательная функция: Проверка назначенного рабочего для бизнеса Type 1
function checkBusinessAssigned(type, count) {
    if (!gameData || !gameData.businesses) return false;
    // Находим бизнес по типу
    const business = gameData.businesses.find(b => b.business_type == type);
    // Проверяем, что он существует и имеет нужное количество рабочих
    return business && business.workers_assigned >= count;
}

// Этапы обучения
const tutorialSteps = [
    {
        title: '🏠 Шаг 1: Жилье',
        message: 'Добро пожаловать на Марс! Ваша первая задача — построить **Жилой Комплекс (тип 5)**. Перейдите в раздел "Постройки" и нажмите "Построить" напротив Жилого Комплекса.',
        target: 'buildings',
        subtarget: { type: 'building', id: 5 }, // тип 5 - Жилой Комплекс
        condition: () => checkBuildingOwned(5)
    },
    {
        title: '🌬️ Шаг 2: Кислород',
        message: 'Кислород — самый критичный ресурс. Постройте **Генератор Кислорода (тип 6)**, чтобы начать его производство.',
        target: 'buildings',
        subtarget: { type: 'building', id: 6 }, // тип 6 - Генератор Кислорода
        condition: () => checkBuildingOwned(6)
    },
    {
        title: '💧 Шаг 3: Вода',
        message: 'Постройте **Очиститель Воды (тип 2)** для обеспечения поселения водой.',
        target: 'buildings',
        subtarget: { type: 'building', id: 2 }, // тип 2 - Очиститель Воды
        condition: () => checkBuildingOwned(2)
    },
    {
        title: '🌾 Шаг 4: Еда',
        message: 'Постройте **Ферму (тип 3)** для производства еды.',
        target: 'buildings',
        subtarget: { type: 'building', id: 3 }, // тип 3 - Ферма
        condition: () => checkBuildingOwned(3)
    },
    {
        title: '⚡ Шаг 5: Энергия (КРИТИЧНО)',
        message: 'Ваши постройки не работают без электричества! Постройте **Генератор Энергии (тип 4)**, чтобы запустить всю инфраструктуру. Это жизненно важно перед заселением!',
        target: 'buildings',
        subtarget: { type: 'building', id: 4 }, // тип 4 - Генератор Энергии
        condition: () => checkBuildingOwned(4)
    },
    {
        title: '👷 Шаг 6: Заселение',
        message: 'Производство готово и обеспечено энергией. Перейдите в раздел "Жители". Нажмите кнопку **"Заселить"** (Заселите минимум 1 жителя).',
        target: 'residents',
        subtarget: { type: 'button', id: 'settleResidents' }, // Кнопка "Заселить"
        condition: () => gameData?.user?.residents_settled > 0
    },
    {
        title: '💰 Шаг 7: Доход',
        message: 'Чтобы покрыть расходы, купите ваш первый бизнес. Перейдите в "Бизнесы" и купите **Бизнес I (тип 1)**.',
        target: 'business',
        subtarget: { type: 'button', id: 'buyBusiness(1)' }, // Кнопка "Купить" для Бизнеса I
        condition: () => checkBusinessOwned()
    },
    {
        title: '💼 Шаг 8: Рабочие',
        message: 'Бизнес не приносит доход без рабочих! Нажмите на кнопку **"Нанять 1 рабочих"** в разделе "Бизнесы". Это стабилизирует экономику.',
        target: 'business',
        subtarget: { type: 'button', id: 'hireWorkersForBusiness' }, // Кнопка "Нанять"
        condition: () => checkBusinessAssigned(1, 1) // Проверяем, что 1 рабочий назначен Бизнесу I
    },
    {
        title: '✅ Обучение завершено!',
        message: 'Поздравляем! Ваше поселение теперь **стабильно** (производство ~ потребление) и готово к дальнейшему развитию. Начинайте улучшать генераторы для повышения эффективности!',
        target: null, 
        condition: () => true
    }
];

// Проверка обучения
function checkTutorial() {
    if (!gameData || !gameData.user) {
        removeTutorialBlocking(); 
        return;
    }
    
    const progress = parseInt(localStorage.getItem('tutorialProgress') || '0');
    
    if (progress >= tutorialSteps.length) {
        removeTutorialBlocking();
        return; 
    }
    
    currentTutorialStep = progress;
    const step = tutorialSteps[currentTutorialStep];
    
    if (step.condition()) {
        nextTutorialStep();
    } else {
        showTutorialStep();
        applyTutorialBlocking(step.target);
    }
}

// Вспомогательная функция для прокрутки в модальном окне
function scrollModalToTarget(targetElement) {
    if (targetElement) {
        // Убираем подсветку со всех элементов, кроме целевого
        document.querySelectorAll('.tech-glow').forEach(el => el.classList.remove('tech-glow'));
        
        // Добавляем подсветку к целевому элементу
        targetElement.classList.add('tech-glow');
        
        // Прокрутка элемента в центр модального окна
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

// Новая функция для размещения стрелки на кнопке внутри модального окна
function showModalTargetArrow(subtarget) {
    const arrow = document.getElementById('tutorialArrow');
    
    // 1. Находим целевой элемент внутри открытого модального окна
    let targetElement = null;
    if (subtarget.type === 'building') {
        // Цель: кнопка "Построить" (первая кнопка в flex-контейнере)
        const cardSelector = `#modalContent .resource-card:nth-child(${subtarget.id})`;
        targetElement = document.querySelector(`${cardSelector} .flex.gap-2 button:nth-child(1)`); 
    } else if (subtarget.type === 'button') {
        // Цель: кнопка "Заселить" (для residents) или "Нанять" (для business)
        targetElement = document.querySelector(`[onclick*="${subtarget.id}"]`);
    }

    if (targetElement && targetElement.offsetParent !== null) {
        // 2. Гарантируем, что элемент прокручен в видимую область, прежде чем позиционировать стрелку
        scrollModalToTarget(targetElement); 
        
        // 3. Используем rAF, чтобы дождаться завершения скролла/отрисовки
        window.requestAnimationFrame(() => {
             const rect = targetElement.getBoundingClientRect();
             
             // 4. Позиционируем стрелку над кнопкой
             arrow.style.left = rect.left + rect.width / 2 - 12 + 'px'; // Центрируем (ширина стрелки ~24px)
             arrow.style.top = rect.top - -30 + 'px'; // 40px над кнопкой
             arrow.textContent = '';//👆
             arrow.style.display = 'block';
         });
    } else {
        // Если кнопка не найдена (например, maxed level или ошибка загрузки)
        arrow.style.display = 'none';
    }
}


// Показ текущего шага обучения и стрелки
function showTutorialStep() {
    const step = tutorialSteps[currentTutorialStep];
    if (!step) return;
    
    const overlay = document.getElementById('tutorialOverlay');
    const content = document.getElementById('tutorialContent');
    const arrow = document.getElementById('tutorialArrow');
    
    if (!overlay || !content || !arrow) {
        console.error('❌ Элементы обучения не найдены в DOM.');
        return; 
    }
    
    // ... (Остальная часть логики инициализации оверлея без изменений)
    const stepNumber = currentTutorialStep + 1;
    const totalSteps = tutorialSteps.length - 1; // -1, потому что последний шаг - это завершение
    const progressPercent = (stepNumber / totalSteps) * 100;
    const iconMap = { 
        '🏠': 'text-neon-blue', '🌬️': 'text-cyan-400', '💧': 'text-blue-400', 
        '🌾': 'text-yellow-600', '⚡': 'text-yellow-400', '👷': 'text-orange-400', 
        '💰': 'text-neon-green', '💼': 'text-neon-purple', '✅': 'text-green-500' 
    };
    const titleEmoji = step.title.split(':')[0].trim();
    const iconClass = iconMap[titleEmoji] || 'text-neon-blue';

    if (!overlay.classList.contains('show')) {
        content.innerHTML = `
            <div class="space-y-4">
                
                ${step.target !== null ? `
                <div class="w-full bg-gray-800 rounded-full h-3 mb-4">
                    <div class="h-3 rounded-full bg-gradient-to-r from-neon-green to-neon-blue transition-all" 
                         style="width: ${progressPercent > 100 ? 100 : progressPercent.toFixed(0)}%"></div>
                </div>
                ` : ''}

                <div class="flex items-center space-x-4">
                    <span class="text-2xl ${iconClass}">${titleEmoji}</span>
                    <div>
                        <div class="text-xs font-bold text-neon-green">ШАГ ${stepNumber} ИЗ ${totalSteps}</div>
                        <h3 class="text-xl font-bold text-neon-blue">${step.title.split(':')[1].trim()}</h3>
                    </div>
                </div>

                <div class="resource-card p-4 rounded-xl text-sm leading-relaxed">
                    ${parseMarkdown(step.message).replace(/\n/g, '<br>')}
                </div>

                <div class="flex space-x-3 pt-2">
                    <button onclick="skipTutorial()" class="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-sm transition-colors">
                        Пропустить
                    </button>
                    ${step.target === null ? `
                        <button onclick="nextTutorialStep()" class="flex-1 py-2 bg-gradient-to-r from-neon-green to-neon-blue rounded-lg font-bold hover:scale-105 transition-transform">
                            Завершить
                        </button>
                    ` : `
                        <button onclick="closeTutorialStep()" id="tutorialActionButton" class="flex-1 py-2 bg-gradient-to-r from-neon-blue to-neon-purple rounded-lg font-bold hover:scale-105 transition-transform">
                            ${step.target === 'buildings' ? 'Открыть Постройки' : 
                              step.target === 'residents' ? 'Открыть Жители' : 
                              step.target === 'business' ? 'Открыть Бизнесы' : 'Открыть раздел'}
                        </button>
                    `}
                </div>
            </div>
        `;
        overlay.classList.add('show');
        playSound('notification');
    }
    
    // Активация стрелки
    setTimeout(() => {
        document.querySelectorAll('.tech-glow').forEach(el => el.classList.remove('tech-glow'));
        
        let targetElement = null;

        // 1. ПРИОРИТЕТ: Направляем на кнопку "Открыть раздел" (Фаза 1)
        if (overlay.classList.contains('show') && step.target !== null) {
            targetElement = document.getElementById('tutorialActionButton');
        } else if (step.target) {
            // 2. ВТОРОЙ ПРИОРИТЕТ: Направляем на кнопку в главном меню
            targetElement = document.querySelector(`[onclick="openSection('${step.target}')"]`);
        }
        
        if (targetElement && targetElement.offsetParent !== null) { 
            const rect = targetElement.getBoundingClientRect();
            
            // Расчет позиции для стрелки
            arrow.style.left = rect.left + rect.width / 2 - 12 + 'px'; // Центрируем
            
            // Всегда ставим стрелку над элементом для Фазы 1
            arrow.style.top = rect.top - -30 + 'px'; 
            arrow.textContent = '';//👆
            arrow.style.display = 'block';
            
            targetElement.classList.add('tech-glow');
            
            // Скроллинг только для элементов, которые НЕ являются кнопкой в оверлее
            if (targetElement.id !== 'tutorialActionButton') {
                 targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            
        } else {
            arrow.style.display = 'none';
        }
    }, 500);
}

// Закрытие текущего шага
function closeTutorialStep() {
    const step = tutorialSteps[currentTutorialStep]; // Получаем данные текущего шага
    const overlay = document.getElementById('tutorialOverlay');
    const arrow = document.getElementById('tutorialArrow');
    
    overlay.classList.remove('show');
    arrow.style.display = 'none';
    
    document.querySelectorAll('.tech-glow').forEach(el => el.classList.remove('tech-glow'));
    
    if (step && step.target) {
        if (typeof openSection === 'function') {
            // 1. Открываем целевой раздел
            openSection(step.target);
            
            // 2. ЛОГИКА АВТОПРОКРУТКИ И ФАЗЫ 2
            if (step.subtarget && (step.subtarget.type === 'building' || step.subtarget.type === 'button')) {
                // Ждем, пока контент загрузится (500 мс)
                setTimeout(() => {
                    // Прокручиваем и подсвечиваем нужную кнопку
                    showModalTargetArrow(step.subtarget); 
                }, 500); 
            }
        }
    }
    
    playSound('click');
}

// Переход к следующему шагу
function nextTutorialStep() {
    document.querySelectorAll('.tech-glow').forEach(el => el.classList.remove('tech-glow'));
    
    currentTutorialStep++;
    localStorage.setItem('tutorialProgress', currentTutorialStep.toString());
    
    if (typeof closeModal === 'function') {
         closeModal();
    }
    
    if (currentTutorialStep < tutorialSteps.length) {
        const step = tutorialSteps[currentTutorialStep];
        if (!step.condition()) {
            showTutorialStep();
            applyTutorialBlocking(step.target);
        } else {
            setTimeout(() => nextTutorialStep(), 500);
        }
    } else {
        removeTutorialBlocking();
        showNotification('success', 'Обучение завершено!', 'Теперь ваше поселение стабильно и готово к расширению!');
    }
}

// Пропуск обучения
function skipTutorial() {
    localStorage.setItem('tutorialProgress', tutorialSteps.length.toString());
    closeTutorialStep();
    removeTutorialBlocking();
    playSound('click');
}

// Вспомогательная функция: Проверка наличия постройки
function checkBuildingOwned(type) {
    if (!gameData || !gameData.buildings) return false;
    const building = gameData.buildings.find(b => b.building_type == type);
    return building && building.count > 0;
}

// Вспомогательная функция: Проверка наличия бизнеса
function checkBusinessOwned() {
    if (!gameData || !gameData.businesses) return false;
    return gameData.businesses.some(b => b.count > 0);
}

// Сброс обучения (для кнопки в настройках)
function resetTutorial() {
    if (confirm('Вы уверены, что хотите начать обучение заново?')) {
        localStorage.removeItem('tutorialProgress');
        currentTutorialStep = 0;
        removeTutorialBlocking(); 
        checkTutorial();
    }
}


// --- НОВЫЕ ГЛОБАЛЬНЫЕ ФУНКЦИИ ДЛЯ БЛОКИРОВКИ ---

// Проверяет, активно ли сейчас обязательное обучение
function isTutorialActive() {
    const progress = parseInt(localStorage.getItem('tutorialProgress') || '0');
    return progress < tutorialSteps.length;
}

// Применяет блокировку, чтобы можно было открыть только целевой раздел
function applyTutorialBlocking(allowedSection) {
    const navButtons = document.querySelectorAll('.compact-menu button');
    navButtons.forEach(button => {
        const onclickAttr = button.getAttribute('onclick');
        if (onclickAttr && onclickAttr.includes('openSection')) {
            const sectionName = onclickAttr.match(/openSection\('(.+?)'\)/);
            
            if (sectionName && sectionName[1] !== allowedSection) {
                button.classList.add('opacity-50', 'pointer-events-none');
            } else {
                 button.classList.remove('opacity-50', 'pointer-events-none');
            }
        }
        if (onclickAttr && (onclickAttr.includes('openMyProfile') || onclickAttr.includes('settings') || onclickAttr.includes('help'))) {
            button.classList.remove('opacity-50', 'pointer-events-none');
        }
    });
}

// Снимает все блокировки
function removeTutorialBlocking() {
    const navButtons = document.querySelectorAll('.compact-menu button');
    navButtons.forEach(button => {
        button.classList.remove('opacity-50', 'pointer-events-none');
    });
}
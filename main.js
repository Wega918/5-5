// Основная логика игры
console.log('🎮 Основная система игры загружена');

let gameData = null; // Глобальное хранилище данных

// [МОДИФИЦИРОВАНО] Константа удалена. Значение будет получено с сервера.
let updateTimerInterval = null;
let countdownTime = 0;
let UPDATE_INTERVAL_SECONDS = 1; // Значение по умолчанию, будет перезаписано

// Функция для расчета вместимости жилья за один юнит (используется Math.ceil(5 * 1.5^(L-1)))
function getBuildingCapacityPerUnit(level) {
    const base_capacity = 5;
    const scalingFactor = Math.pow(1.5, level - 1);
    // Используем Math.ceil() для округления до целых мест
    return Math.ceil(base_capacity * scalingFactor);
}

// main.js (Новая функция startUpdateTimer)
function startUpdateTimer() {
    // [МОДИФИЦИРОВАНО] Получаем интервал из данных игры
    if (gameData && gameData.update_interval_seconds) {
        UPDATE_INTERVAL_SECONDS = gameData.update_interval_seconds;
    }
    
    // Очистить любой существующий интервал
    if (updateTimerInterval) {
        clearInterval(updateTimerInterval);
    }

    const progressBar = document.getElementById('updateProgressBar');
    const countdownDisplay = document.getElementById('countdownDisplay');
    const container = document.getElementById('updateTimerContainer');
    
    if (!progressBar || !countdownDisplay || !container) return;
    
    // Инициализация
    countdownTime = UPDATE_INTERVAL_SECONDS;
    progressBar.style.width = '100%';
    countdownDisplay.textContent = UPDATE_INTERVAL_SECONDS;
    
    // Теперь интервал запускается каждую секунду, а обновление происходит при достижении 0.
    updateTimerInterval = setInterval(() => {
        countdownTime = Math.max(0, countdownTime - 1); // Уменьшаем на 1 секунду
        
        // Расчет процента
        const percent = (countdownTime / UPDATE_INTERVAL_SECONDS) * 100;
        
        // Обновление ползунка и счетчика (Отображение округлено до целых секунд)
        progressBar.style.width = `${percent}%`;
        countdownDisplay.textContent = Math.ceil(countdownTime);

        if (countdownTime <= 0) {
            clearInterval(updateTimerInterval);
            progressBar.style.width = '0%'; 
            
            // Вызов обновления ресурсов
            if (gameData) {
                console.log(`🔄 Автообновление данных по таймеру (${UPDATE_INTERVAL_SECONDS}s)...`);
                // loadGameData() перезапустит таймер после успешного обновления
                loadGameData();
            } else {
                 // В случае ошибки, но активной игры, перезапускаем таймер.
                 startUpdateTimer(); 
            }
        }
    }, 1000); // Обновляем каждую секунду
}

/* function formatLargeNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(2) + 'm';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(2) + 'k';
    }
    return parseFloat(num).toFixed(2);
}

 */

// Функция для показа уведомлений
function showNotification(type, title, message) {
    const notificationPopup = document.getElementById('notificationPopup');
    const notificationIcon = document.getElementById('notificationIcon');
    const notificationTitle = document.getElementById('notificationTitle');
    const notificationMessage = document.getElementById('notificationMessage');
    
    // Устанавливаем иконку и цвет в зависимости от типа уведомления
    switch(type) {
        case 'success':
            notificationIcon.textContent = '✅';
            notificationTitle.classList.remove('text-neon-blue', 'text-red-500', 'text-yellow-500');
            notificationTitle.classList.add('text-neon-green');
            break;
        case 'error':
            notificationIcon.textContent = '❌';
            notificationTitle.classList.remove('text-neon-blue', 'text-neon-green', 'text-yellow-500');
            notificationTitle.classList.add('text-red-500');
            break;
        case 'warning':
            notificationIcon.textContent = '⚠️';
            notificationTitle.classList.remove('text-neon-blue', 'text-neon-green', 'text-red-500');
            notificationTitle.classList.add('text-yellow-500');
            break;
        case 'info':
        default:
            notificationIcon.textContent = 'ℹ️';
            notificationTitle.classList.remove('text-red-500', 'text-neon-green', 'text-yellow-500');
            notificationTitle.classList.add('text-neon-blue');
            break;
    }
    
    // Устанавливаем заголовок и сообщение
    notificationTitle.textContent = title;
    notificationMessage.textContent = message;
    
    // Показываем уведомление
    notificationPopup.classList.add('show');
    
    // Автоматически скрываем через 5 секунд
    setTimeout(() => {
        hideNotification();
    }, 5000);
}

// Функция для скрытия уведомления
function hideNotification() {
    const notificationPopup = document.getElementById('notificationPopup');
    notificationPopup.classList.remove('show');
}

// Добавляем обработчик клика на кнопку закрытия
document.addEventListener('DOMContentLoaded', function() {
    const closeBtn = document.querySelector('#notificationPopup button');
    if (closeBtn) {
        closeBtn.addEventListener('click', hideNotification);
    }
});


// Загрузка данных игры
// Изменение в функции loadGameData: вызов fetchUnreadStatus
async function loadGameData() {
    console.log('📊 Загрузка данных поселения...');
    
    try {
        const response = await fetch('main.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: 'action=get_data'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const text = await response.text();
        let data;
        
        try {
            data = JSON.parse(text);
        } catch (e) {
            console.error('❌ Ошибка парсинга JSON:', text);
            throw new Error('Ошибка сервера');
        }
        
        console.log('📈 Данные поселения получены:', data);
        
        if (data.user) {
            gameData = data;
            updateUI();
            updateHappiness(data.happiness || 50);
            updateUserRole(data.user.role);
            updateOnlineStatus();
            
            // NEW: Проверка статуса чата при загрузке данных
            fetchUnreadStatus(); 
            
            setTimeout(() => {
                 checkTutorial();
                 console.log('🎮 Ожидание запуска обучения', data);
             }, 60000);
            
            startUpdateTimer();
        } else if (data.error) {
            showNotification('error', 'Ошибка', data.error);
        } else {
            console.error('❌ Не удалось получить данные пользователя');
        }
    } catch (error) {
        console.error('❌ Ошибка загрузки данных:', error);
        showNotification('error', 'Ошибка подключения', 'Не удалось загрузить данные игры');
    }
}

function openMyProfile() {
    if (!gameData || !gameData.user || !gameData.user.id) {
        showNotification('error', 'Ошибка', 'Не удалось получить ID пользователя.');
        return;
    }

    // --- ИНТЕГРАЦИЯ ОБУЧЕНИЯ ---
    if (typeof isTutorialActive === 'function' && isTutorialActive()) {
         const step = tutorialSteps[currentTutorialStep];
         // Разрешаем открывать профиль, но показываем подсказку
         showTutorialStep(); 
         return;
    }
    // ----------------------------
    
    // Предполагается, что openProfile() доступна через profile.js
    if (typeof openProfile === 'function') {
        openProfile(gameData.user.id);
    } else {
        showNotification('error', 'Ошибка', 'Модуль профилей не загружен.');
    }
}

// Обновление интерфейса
function updateUI() {
    if (!gameData || !gameData.user) return;
    
    const user = gameData.user;
    const flow = gameData.resource_flow || {}; // Получаем новый поток ресурсов
    console.log('🔄 Обновление интерфейса');
    
    // Обновление названия поселения
    document.getElementById('colonyName').textContent = user.colony_name;
    
    // Обновление ресурсов
    document.getElementById('moneyAmount').textContent = formatResource(user.money);
    document.getElementById('waterAmount').textContent = formatResource(user.water);
    document.getElementById('foodAmount').textContent = formatResource(user.food);
    document.getElementById('oxygenAmount').textContent = formatResource(user.oxygen);
    document.getElementById('electricityAmount').textContent = formatResource(user.electricity);
    document.getElementById('materialsAmount').textContent = formatResource(user.materials);
    document.getElementById('rubiesAmount').textContent = formatResource(user.rubies);
    
    // --- НОВОЕ: Обновление потока ресурсов ---
    updateResourceFlow('money', flow.money);
    updateResourceFlow('water', flow.water);
    updateResourceFlow('food', flow.food);
    updateResourceFlow('oxygen', flow.oxygen);
    updateResourceFlow('electricity', flow.electricity);
    updateResourceFlow('materials', flow.materials);
    updateResourceFlow('rubies', flow.rubies);
    
    // --- РАСЧЕТ ВМЕСТИМОСТИ ЖИЛЬЯ ---
    const buildings = gameData?.buildings || [];
    
    let housingCapacity = 0;
    buildings.forEach(b => {
        if (b.building_type == 5) {
            // Использование новой функции для расчета емкости на основе уровня
            const capacityPerUnit = getBuildingCapacityPerUnit(b.level);
            housingCapacity += capacityPerUnit * b.count;
        }
    }); 
    // --------------------------------

    // Обновление жителей
    document.getElementById('residentsWaiting').textContent = user.residents_waiting;
    
    // Отображаем "Заселены / Всего мест"
    document.getElementById('residentsSettled').textContent = `${user.residents_settled} / ${housingCapacity}`;
    
    document.getElementById('residentsWorking').textContent = user.residents_working;
    
    // --- NEW: Отображение кнопки Админа ---
    const adminButton = document.getElementById('adminMenuButton');
    if (adminButton) {
        if (user.role === 'admin') {
            adminButton.style.display = 'block'; 
        } else {
            adminButton.style.display = 'none';
        }
    }
    // -------------------------------------
    
    // Обновление информации об автозаселении
    updateAutoSettleInfo();
    
    // NEW: Отображение активных бустов (если есть)
    displayActiveBoosts(gameData.active_boosts || []);
    
	// NEW: Принудительное обновление индикатора после UI refresh
    fetchUnreadStatus();
	
    // --- ЗАПУСК ЧАСОВ ---
    if (!window.clockInterval) {
        startClockUpdate();
    }
}

function displayActiveBoosts(activeBoosts) {
    const boostDisplay = document.getElementById('boostActiveIndicator');
    if (!boostDisplay) return;
    
    if (activeBoosts.length > 0) {
        boostDisplay.classList.remove('hidden');
        // Обновление текста индикатора
        let tooltipText = "Активны бусты:\n";
        activeBoosts.forEach(boost => {
            const endTime = new Date(boost.end_time);
            const remaining = endTime.getTime() - new Date().getTime();
            const timeText = formatTimeRemaining(remaining);
            tooltipText += ` - ${boost.info.name} (${timeText})\n`;
        });
        boostDisplay.title = tooltipText;

    } else {
        boostDisplay.classList.add('hidden');
    }
}
// NEW: Helper function for time formatting (for boost indicator)
function formatTimeRemaining(ms) {
    if (ms <= 0) return 'Истек';
    
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor((totalSeconds % 360000) / 3600); // 100 hours max
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    const parts = [];
    if (hours > 0) parts.push(`${hours} ч.`);
    if (minutes > 0) parts.push(`${minutes} мин.`);
    if (hours === 0 && minutes === 0 && seconds > 0) parts.push(`${seconds} сек.`);
    
    return parts.join(' ');
}


// Обновление потока ресурсов
function updateResourceFlow(resourceName, flowValue) {
    const flowElement = document.getElementById(resourceName + 'Flow');
    if (!flowElement) return;
    
    // Установка точности 4 для рубинов, 2 для остальных
    const precision = resourceName === 'rubies' ? 4 : 2; 
    
    const flow = parseFloat(flowValue || 0); 
    const formattedFlow = Math.abs(flow).toFixed(precision); // Использование динамической точности
    let flowText = formattedFlow;
    let flowClass = 'text-gray-400';
    
    // Порог для определения положительного/отрицательного потока (0.0001 для точности)
    const flowThreshold = 0.0001; 
    
    if (flow > flowThreshold) { 
        flowText = `+ ${formattedFlow}`;
        flowClass = 'text-neon-green';
    } else if (flow < -flowThreshold) {
        flowText = `- ${formattedFlow}`;
        flowClass = 'text-mars-red';
    } else {
        // Поток около нуля: форматируем 0 с нужной точностью
        flowText = `± ${parseFloat(0).toFixed(precision)}`;
        flowClass = 'text-gray-400';
    }
    
    flowElement.textContent = flowText;
    flowElement.className = `font-semibold ${flowClass}`;
}



// Переменная для хранения смещения времени сервера
let serverTimeOffsetMs = 0;
let lastServerTimestamp = 0;

// Функция форматирования времени (помогает в выводе)
function formatTime(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}



// Функция расчета игрового времени
function calculateGameTime(currentServerTimeMs) {
    if (!gameData || !gameData.user || !gameData.user.created_at) {
        return '---';
    }

    // Время регистрации в миллисекундах (используется как точка отсчета)
    const registrationTime = new Date(gameData.user.created_at).getTime();
    
    // Разница в реальном времени с момента регистрации до текущего времени сервера (в мс)
    const elapsedRealTimeMs = currentServerTimeMs - registrationTime;

    // Коэффициент ускорения: 1 минута реального времени = 1 час игрового времени (x60)
    const accelerationFactor = 60; 
    
    // Игровое время, прошедшее с регистрации, в мс
    // elapsedRealTimeMs (мс) * 60 (игровых часов / реальный час) * 60 (мин/час) / 60 (мин/час) = elapsedRealTimeMs * accelerationFactor
    const elapsedGameTimeMs = elapsedRealTimeMs * accelerationFactor;
    
    // Новый Unix timestamp для игрового времени (в мс)
    const gameCurrentTimestamp = registrationTime + elapsedGameTimeMs;

    const gameDate = new Date(gameCurrentTimestamp);
    
    return formatTime(gameDate);
}
// Запуск и обновление часов каждую секунду
function startClockUpdate() {
    if (window.clockInterval) return;
    
    const serverTimeElement = document.getElementById('serverTimeDisplay');
    const gameTimeElement = document.getElementById('gameTimeDisplay');
    
    if (!serverTimeElement || !gameTimeElement) return;

    // Инициализация смещения времени
    lastServerTimestamp = parseInt(serverTimeElement.dataset.serverTime) * 1000;
    serverTimeOffsetMs = new Date().getTime() - lastServerTimestamp;

    window.clockInterval = setInterval(() => {
        // 1. Расчет текущего времени сервера (с учетом смещения)
        const currentServerTimeMs = new Date().getTime() - serverTimeOffsetMs;
        const serverDate = new Date(currentServerTimeMs);

        // 2. Отображение времени сервера
        serverTimeElement.textContent = formatTime(serverDate) + ' UTC';

        // 3. Расчет и отображение игрового времени
        const gameTime = calculateGameTime(currentServerTimeMs);
        gameTimeElement.textContent = gameTime + ' (x60)';

    }, 1000);
    
    // Вызываем один раз сразу после инициализации для мгновенного отображения
    const currentServerTimeMs = new Date().getTime() - serverTimeOffsetMs;
    serverTimeElement.textContent = formatTime(new Date(currentServerTimeMs)) + ' UTC';
    gameTimeElement.textContent = calculateGameTime(currentServerTimeMs) + ' (x60)';
}

// Остановка часов
function stopClockUpdate() {
    if (window.clockInterval) {
        clearInterval(window.clockInterval);
        window.clockInterval = null;
        // Очищаем отображение
        const serverTimeElement = document.getElementById('serverTimeDisplay');
        if (serverTimeElement) serverTimeElement.textContent = '---'; 
        const gameTimeElement = document.getElementById('gameTimeDisplay');
        if (gameTimeElement) gameTimeElement.textContent = '---'; 
    }
}

// Форматирование ресурсов в сотых
function formatResource(value, precision = 2) {
    return parseFloat(value).toFixed(precision);
}

// Обновление роли пользователя
function updateUserRole(role) {
    const roleElement = document.getElementById('userRole');
    
    if (role === 'admin') {
        roleElement.textContent = '👑 Администратор';
        roleElement.className = 'text-xs px-2 py-1 rounded bg-red-600/20 border border-red-600/50 text-red-300';
        roleElement.classList.remove('hidden');
    } else if (role === 'moderator') {
        roleElement.textContent = '👮 Модератор';
        roleElement.className = 'text-xs px-2 py-1 rounded bg-orange-600/20 border border-orange-600/50 text-orange-300';
        roleElement.classList.remove('hidden');
    } else {
        roleElement.classList.add('hidden');
    }
}

// Обновление статуса онлайн
async function updateOnlineStatus() {
    try {
        const response = await fetch('online.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: 'action=get_online_count'
        });
        
        if (response.ok) {
            const text = await response.text();
            try {
                const data = JSON.parse(text);
                if (data.count !== undefined) {
                    document.getElementById('onlineCount').textContent = `• ${data.count} игроков`;
                }
            } catch (e) {
                console.log('Ошибка обновления онлайн счетчика');
            }
        }
    } catch (error) {
        console.log('Ошибка получения онлайн статуса');
    }
}

// Обновление счастья поселения
function updateHappiness(happiness) {
    console.log('😊 Обновление счастья:', happiness);
    
    const happinessValue = document.getElementById('happinessValue');
    const happinessIndicator = document.getElementById('happinessIndicator');
    const happinessEmoji = document.getElementById('happinessEmoji');
    const happinessDescription = document.getElementById('happinessDescription');
    
    // Обновление значения и индикатора
    happinessValue.textContent = Math.round(happiness);
    happinessIndicator.style.width = happiness + '%';
    
    // Обновление эмодзи и описания (текст изменен)
    if (happiness >= 80) {
        happinessEmoji.textContent = '😍';
        happinessDescription.textContent = 'Жители очень счастливы! Максимальный прирост населения.';
    } else if (happiness >= 60) {
        happinessEmoji.textContent = '😊';
        happinessDescription.textContent = 'Жители довольны. Увеличенный прирост населения.';
    } else if (happiness >= 40) {
        happinessEmoji.textContent = '😐';
        happinessDescription.textContent = 'Нейтральное настроение. Базовый прирост населения.';
    } else if (happiness >= 20) {
        happinessEmoji.textContent = '😟';
        happinessDescription.textContent = 'Жители недовольны. Прирост населения замедлен.';
    } else {
        happinessEmoji.textContent = '😡';
        happinessDescription.textContent = 'Жители очень недовольны! Прирост населения остановлен.';
    }
}

// Обновление информации об автозаселении
function updateAutoSettleInfo() {
    const user = gameData.user;
    const happiness = gameData.happiness || 50;
    const autoSettleInfo = document.getElementById('autoSettleInfo');
    
    let settleChance = 0;
    let chanceText = '';
    
    if (happiness >= 80) {
        settleChance = 80;
        chanceText = '🟢 Высокий шанс автозаселения (80%)';
    } else if (happiness >= 60) {
        settleChance = 50;
        chanceText = '🟡 Умеренный шанс автозаселения (50%)';
    } else if (happiness >= 40) {
        settleChance = 20;
        chanceText = '🟠 Низкий шанс автозаселения (20%)';
    } else {
        settleChance = 0;
        chanceText = '🔴 Автозаселение приостановлено';
    }
    
    // Проверка наличия свободного жилья
    const buildings = gameData.buildings || [];
    
    let housingCapacity = 0;
    buildings.forEach(b => {
        if (b.building_type == 5) {
            const capacityPerUnit = getBuildingCapacityPerUnit(b.level);
            housingCapacity += capacityPerUnit * b.count;
        }
    }); 
    const freeHousing = housingCapacity - user.residents_settled;
    
    if (freeHousing <= 0) {
        chanceText = '🏠 Недостаточно жилья для автозаселения';
    } else if (user.residents_waiting <= 0) {
        chanceText = '👷 Нет жителей для заселения';
    }
    
    autoSettleInfo.textContent = chanceText;
}

function formatNumber(num) {
    if (num >= 1e60) {
        return (num / 1e60).toFixed(2) + 'z';
    } else if (num >= 1e57) {
        return (num / 1e57).toFixed(2) + 'o';
    } else if (num >= 1e54) {
        return (num / 1e54).toFixed(2) + 'p';
    } else if (num >= 1e51) {
        return (num / 1e51).toFixed(2) + 'c';
    } else if (num >= 1e48) {
        return (num / 1e48).toFixed(2) + 'n';
    } else if (num >= 1e45) {
        return (num / 1e45).toFixed(2) + 'g';
    } else if (num >= 1e42) {
        return (num / 1e42).toFixed(2) + 'r';
    } else if (num >= 1e39) {
        return (num / 1e39).toFixed(2) + 'w';
    } else if (num >= 1e36) {
        return (num / 1e36).toFixed(2) + 'v';
    } else if (num >= 1e33) {
        return (num / 1e33).toFixed(2) + 'd';
    } else if (num >= 1e30) {
        return (num / 1e30).toFixed(2) + 's';
    } else if (num >= 1e27) {
        return (num / 1e27).toFixed(2) + 'h';
    } else if (num >= 1e24) {
        return (num / 1e24).toFixed(2) + 'y';
    } else if (num >= 1e21) {
        return (num / 1e21).toFixed(2) + 'x';
    } else if (num >= 1e18) {
        return (num / 1e18).toFixed(2) + 'u';
    } else if (num >= 1e15) {
        return (num / 1e15).toFixed(2) + 'q';
    } else if (num >= 1e12) {
        return (num / 1e12).toFixed(2) + 't';
    } else if (num >= 1e9) {
        return (num / 1e9).toFixed(2) + 'b';
    } else if (num >= 1e6) {
        return (num / 1e6).toFixed(2) + 'm';
    } else if (num >= 1e3) {
        return (num / 1e3).toFixed(2) + 'k';
    }
    return parseFloat(num).toFixed(2);
}






// Открытие раздела
function openSection(section) {
    console.log(`📂 Открытие раздела: ${section}`);

    // --- ИНТЕГРАЦИЯ ОБУЧЕНИЯ (Блокировка других действий) ---
    if (typeof isTutorialActive === 'function' && isTutorialActive()) {
        const step = tutorialSteps[currentTutorialStep];
        
        // Разрешаем Настройки, Справку и Админку
        if (section !== 'settings' && section !== 'help' && section !== 'boosts' && section !== 'admin' && section !== 'messages' && step && step.target !== section) {
            showNotification('warning', 'Обучение', `Пожалуйста, сначала выполните задачу: ${step.title}.`);
            showTutorialStep(); // Показываем оверлей/стрелку снова
            return; // Блокируем действие
        }
    }
    // --------------------------------------------------------
    
    playSound('click');
    
const titles = {
        'buildings': '🏗️ Постройки',
        'business': '💼 Бизнесы', 
        'residents': '👷 Жители',
        'alliance': '🤝 Союзы',
        'rating': '🏆 Рейтинг',
        'online': '🌐 Онлайн',
        'chat': '💬 Чат',
        'news': '📰 Новости',
        'help': '❓ Справка',
        'settings': '⚙️ Настройки',
        'boosts': '✨ Бусты',
        'market': '📈 Межгалактическая Биржа',
        'messages': '✉️ Личные сообщения',
        'admin': '👑 Панель администратора', // ADDED
        'shop': '💰 Магазин Рубинов' // ADDED
    };
    
    document.getElementById('modalTitle').textContent = titles[section] || section;
    document.getElementById('modalOverlay').classList.remove('hidden');
    
    // Загрузка контента раздела
    loadSectionContent(section);
}

// Закрытие модального окна
function closeModal() {
    console.log('❌ Закрытие модального окна');
    document.getElementById('modalOverlay').classList.add('hidden');
    hideEmojiPicker();
    playSound('click');
    
    // --- ИНТЕГРАЦИЯ ОБУЧЕНИЯ (Проверка прогресса после закрытия) ---
    if (typeof checkTutorial === 'function') {
        checkTutorial(); 
    }
    // ----------------------------------------------------------------
}

// Загрузка контента раздела
async function loadSectionContent(section) {
    console.log(`🔄 Загрузка контента раздела: ${section}`);
    
    const contentDiv = document.getElementById('modalContent');
    contentDiv.innerHTML = '<div class="text-center text-neon-blue">Загрузка...</div>';
    
    try {
        // Вызов функции загрузки контента для каждого раздела
        switch (section) {
            case 'buildings':
                await loadBuildings();
                break;
            case 'business':
                await loadBusinesses();
                break;
            case 'residents':
                await loadResidents();
                break;
            case 'alliance':
                await loadAlliance();
                break;
            case 'rating':
                await loadRating();
                break;
            case 'online':
                await loadOnline();
                break;
            case 'chat':
                await loadChat();
                break;
            case 'news':
                await loadNews();
                break;
            case 'help':
                await loadHelp();
                break;
            case 'settings':
                await loadSettings();
                break;
            case 'boosts': // NEW
                await loadBoosts();
                break;
		    case 'market': // НОВОЕ
                await loadMarket();
                break;
            case 'messages': // ADDED
                await loadMessages();
                break;
            case 'shop': // NEW SHOP SECTION
                if (typeof loadShop === 'function') {
                    await loadShop();
                } else {
                    contentDiv.innerHTML = '<div class="text-center text-mars-red">Модуль магазина не загружен. (Требуется payment.js)</div>';
                }
                break;
            case 'admin': // NEW ADMIN SECTION
                if (typeof loadAdminPanel === 'function') {
                    await loadAdminPanel();
                } else {
                    contentDiv.innerHTML = '<div class="text-center text-mars-red">Модуль администрирования не загружен. (Требуется admin.js)</div>';
                }
                break;
            default:
                contentDiv.innerHTML = '<div class="text-center text-gray-400">Раздел в разработке</div>';
        }
    } catch (error) {
        console.error(`❌ Ошибка загрузки раздела ${section}:`, error);
        contentDiv.innerHTML = '<div class="text-center text-mars-red">Ошибка загрузки</div>';
    }
}

// Система эмодзи
function getEmojiList() {
    return ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', 
            '😘', '😗', '☺️', '😚', '😙', '🥲', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔',
            '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😔', '😪', '🤤', '😴', '😷', '🤒',
            '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '😎', '🤓', '🧐', '😕', '😟',
            '🙁', '☹️', '😮', '😯', '😲', '😳', '🥺', '😦', '😧', '😨', '😰', '😥', '😢', '😭', '😱', '😖',
            '😣', '😞', '😓', '😩', '😫', '🥱', '😤', '😡', '😠', '🤬', '😈', '👿', '💀', '☠️', '💩', '🤡',
            '👻', '👽', '👾', '🤖', '🎃', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾',
            '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💖', '💗', '💘', '💝',
            '💯', '💫', '⭐', '🌟', '✨', '💥', '💢', '💨', '💦', '💤', '🕳️', '🎉', '🎊', '🙏', '👍', '👎',
            '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '✋', '🤚', '🖐️', '🖖', '👋',
            '🚀', '🛸', '🌌', '⭐', '🌟', '✨', '☄️', '🌠', '🌍', '🌎', '🌏', '🌐'];
}


function toggleEmojiPicker(type) {
    const picker = document.getElementById(type + 'EmojiPicker');
    
    // NEW: Закрываем все другие пикеры
    document.querySelectorAll('.emoji-picker').forEach(p => {
        if (p.id !== picker.id) {
            p.classList.remove('show');
        }
    });

    if (picker) {
        picker.classList.toggle('show');
    }
}

function hideEmojiPicker() {
    const pickers = document.querySelectorAll('.emoji-picker');
    pickers.forEach(picker => picker.classList.remove('show'));
}

function insertEmoji(inputId, emoji) {
    const input = document.getElementById(inputId);
    if (input) {
        input.value += emoji;
        input.focus();
    }
    hideEmojiPicker();
}

function parseEmojis(text) {
    // Простая функция для отображения эмодзи (они уже поддерживаются браузерами)
    return text;
}



// NEW FUNCTION: Проверяет и обновляет индикатор чата
async function fetchUnreadStatus() {
    try {
        const response = await fetch('chat.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: 'action=get_unread_status'
        });
        const data = await response.json();
        
        // 3. Индикатор администратора (NEW) - проверяем в payment.php для безопасности
        try {
            const adminStatusResponse = await fetch('payment.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: 'action=get_admin_status'
            });
            const adminStatusData = await adminStatusResponse.json();
            
            const adminIndicator = document.getElementById('adminNotificationIndicator');
            if (adminIndicator) {
                // Используем has_unprocessed_payments, возвращаемое payment.php
                if (adminStatusData.has_unprocessed_payments) {
                    adminIndicator.classList.add('active');
                } else {
                    adminIndicator.classList.remove('active');
                }
            }
        } catch (e) {
            console.warn('❌ Не удалось получить статус админ-платежей (это нормально для не-админов):', e);
        }
        
        // 1. Индикатор общего чата
        const chatIndicator = document.getElementById('chatNotificationIndicator');
        if (chatIndicator) {
            if (data.has_unread_chat) { // Only light up if there are unread public messages
                chatIndicator.classList.add('active');
            } else {
                chatIndicator.classList.remove('active');
            }
        }
        
        // 2. Индикатор личных сообщений
        const messagesIndicator = document.getElementById('messagesNotificationIndicator');
        if (messagesIndicator) {
            if (data.has_unread_pm) { // Only light up if there are unread private messages
                messagesIndicator.classList.add('active');
            } else {
                messagesIndicator.classList.remove('active');
            }
        }
        
    } catch (error) {
        console.error('❌ Ошибка получения статуса чата:', error);
    }
}






// Система уведомлений
function showNotification(type, title, message) {
    const popup = document.getElementById('notificationPopup');
    const icon = document.getElementById('notificationIcon');
    const titleEl = document.getElementById('notificationTitle');
    const messageEl = document.getElementById('notificationMessage');
    
    // Установка иконки и цвета в зависимости от типа
    const types = {
        'success': { icon: '✅', class: 'text-neon-green' },
        'error': { icon: '❌', class: 'text-mars-red' },
        'warning': { icon: '⚠️', class: 'text-yellow-400' },
        'info': { icon: '💡', class: 'text-neon-blue' }
    };
    
    const typeInfo = types[type] || types['info'];
    icon.textContent = typeInfo.icon;
    titleEl.textContent = title;
    titleEl.className = `font-bold ${typeInfo.class}`;
    messageEl.textContent = message;
    
    // Показ уведомления
    popup.classList.add('show');
    
    // Воспроизведение звука
    if (type === 'success') {
        playSound('success');
    } else if (type === 'error') {
        playSound('error');
    } else {
        playSound('notification');
    }
    
    // Автоматическое скрытие через 5 секунд
    setTimeout(() => {
        hideNotification();
    }, 5000);
}

function hideNotification() {
    document.getElementById('notificationPopup').classList.remove('show');
}

// [МОДИФИЦИРОВАНО] Обновление онлайн статуса каждые 1 секунду
setInterval(() => {
    if (gameData) {
        updateOnlineStatus();
    }
}, 1000);

// Закрытие модального окна по клику на фон
document.getElementById('modalOverlay').addEventListener('click', function(e) {
    if (e.target === this) {
        closeModal();
    }
});

// Закрытие панели эмодзи по клику вне её
document.addEventListener('click', function(e) {
    if (!e.target.closest('.emoji-picker') && !e.target.matches('[onclick*="toggleEmojiPicker"]')) {
        hideEmojiPicker();
    }
});
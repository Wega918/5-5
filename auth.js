// Система авторизации
console.log('🔐 Модуль авторизации загружен');

// Проверка авторизации при загрузке
document.addEventListener('DOMContentLoaded', function() {
    console.log('📱 Проверка состояния авторизации...');
    checkAuthStatus();
});

// Проверка статуса авторизации
async function checkAuthStatus() {
    try {
        const response = await fetch('auth.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: 'action=check'
        });
        
        const data = await response.json();
        console.log('🔍 Результат проверки авторизации:', data);
        
        if (data.success) {
            showGameScreen();
            loadGameData();
        } else {
            showAuthScreen();
        }
    } catch (error) {
        console.error('❌ Ошибка проверки авторизации:', error);
        showAuthScreen();
    }
}

// Вход в систему
async function login(event) {
    event.preventDefault();
    console.log('🚪 Попытка входа в систему');
    
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    
    if (!username || !password) {
        alert('Заполните все поля');
        return;
    }
    
    try {
        const response = await fetch('auth.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `action=login&username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`
        });
        
        const data = await response.json();
        console.log('📝 Результат входа:', data);
        
        if (data.success) {
            console.log('✅ Успешный вход в систему');
            showGameScreen();
            loadGameData();
            checkTutorial();
            // ДОБАВЛЕНО: Автозапуск обучения после стабилизации UI.
            setTimeout(() => {
                if (typeof checkTutorial === 'function') {
                    console.log('🎮 Автозапуск обучения после стабилизации UI.');
                    
                } else {
                    console.error('❌ Функция checkTutorial не найдена.');
                }
            }, 2500); // 2.5 секунды для максимальной стабильности
            
        } else {
            alert(data.error || 'Ошибка входа');
        }
    } catch (error) {
        console.error('❌ Ошибка при входе:', error);
        alert('Ошибка подключения');
    }
}

// Регистрация
async function register(event) {
    event.preventDefault();
    console.log('📝 Попытка регистрации');
    
    const username = document.getElementById('regUsername').value;
    const email = document.getElementById('regEmail').value;
    const colony = document.getElementById('regColony').value;
    const password = document.getElementById('regPassword').value;
    
    if (!username || !email || !colony || !password) {
        alert('Заполните все поля');
        return;
    }
    
    try {
        const response = await fetch('auth.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `action=register&username=${encodeURIComponent(username)}&email=${encodeURIComponent(email)}&colony=${encodeURIComponent(colony)}&password=${encodeURIComponent(password)}`
        });
        
        const data = await response.json();
        console.log('🏗️ Результат регистрации:', data);
        
        if (data.success) {
            console.log('✅ Успешная регистрация');
            alert('Поселение успешно создано! Теперь войдите в игру.');
            showLogin();
        } else {
            alert(data.error || 'Ошибка регистрации');
        }
    } catch (error) {
        console.error('❌ Ошибка при регистрации:', error);
        alert('Ошибка подключения');
    }
}

// Выход из системы
async function logout() {
    console.log('🚪 Выход из системы');
    
    try {
        await fetch('auth.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: 'action=logout'
        });
        
        console.log('✅ Успешный выход');
        showAuthScreen();
    } catch (error) {
        console.error('❌ Ошибка при выходе:', error);
        showAuthScreen();
    }
}

// Показать экран авторизации
function showAuthScreen() {
    console.log('🖥️ Показ экрана авторизации');
    document.getElementById('authScreen').classList.remove('hidden');
    document.getElementById('gameScreen').classList.add('hidden');
    
    // ОСТАНОВКА ЧАСОВ
    if (typeof stopClockUpdate === 'function') {
        stopClockUpdate();
    }
}

// Показать экран игры
function showGameScreen() {
    console.log('🎮 Показ экрана игры');
    document.getElementById('authScreen').classList.add('hidden');
    document.getElementById('gameScreen').classList.remove('hidden');
    
    // ЗАПУСК ЧАСОВ (будет вызван из updateUI после загрузки данных)
}


// Функция расчета игрового времени
function calculateGameTime() {
    if (!gameData || !gameData.user || !gameData.user.created_at) {
        return '---';
    }

    // Время регистрации в миллисекундах (Unix timestamp)
    const registrationTime = new Date(gameData.user.created_at).getTime();
    
    // Текущее реальное время в миллисекундах
    const currentTime = new Date().getTime();
    
    // Разница в миллисекундах
    const elapsedRealTimeMs = currentTime - registrationTime;

    // Коэффициент ускорения: 1 минута реального времени = 1 час игрового времени
    const accelerationFactor = 60; 
    
    // Игровое время, прошедшее с регистрации, в минутах
    const elapsedGameTimeMinutes = elapsedRealTimeMs / 60000 * accelerationFactor; 
    
    // Время начала игры (Unix timestamp регистрации)
    const gameStartTimestamp = registrationTime;

    // Новый Unix timestamp для игрового времени (в мс)
    const gameCurrentTimestamp = gameStartTimestamp + (elapsedGameTimeMinutes * 60000); 

    const gameDate = new Date(gameCurrentTimestamp);
    
    // Форматирование: Год-Месяц-День Час:Минута:Секунда
    const year = gameDate.getFullYear();
    const month = String(gameDate.getMonth() + 1).padStart(2, '0');
    const day = String(gameDate.getDate()).padStart(2, '0');
    const hours = String(gameDate.getHours()).padStart(2, '0');
    const minutes = String(gameDate.getMinutes()).padStart(2, '0');
    const seconds = String(gameDate.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

// Запуск и обновление часов каждую секунду
function startClockUpdate() {
    // Проверяем, запущен ли уже
    if (window.clockInterval) return;
    
    const clockContainer = document.getElementById('gameTimeContainer'); 
    
    if (!clockContainer) return;

    window.clockInterval = setInterval(() => {
        const gameTime = calculateGameTime();
        document.getElementById('gameTimeDisplay').textContent = gameTime;
    }, 1000);
}

// Остановка часов
function stopClockUpdate() {
    if (window.clockInterval) {
        clearInterval(window.clockInterval);
        window.clockInterval = null;
        // Очищаем отображение, чтобы не показывать старое время
        const timeElement = document.getElementById('gameTimeDisplay');
        if (timeElement) timeElement.textContent = '---'; 
    }
}



// Показать форму входа
function showLogin() {
    console.log('🔄 Переключение на форму входа');
    document.getElementById('loginForm').classList.remove('hidden');
    document.getElementById('registerForm').classList.add('hidden');
}

// Показать форму регистрации
function showRegister() {
    console.log('🔄 Переключение на форму регистрации');
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('registerForm').classList.remove('hidden');
}
// Система настроек
console.log('⚙️ Модуль настроек загружен');

// Система настроек
console.log('⚙️ Модуль настроек загружен');

async function loadSettings() {
    console.log('🔄 Загрузка настроек...');
    
    try {
        const response = await fetch('settings.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: 'action=get_settings'
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
        
        console.log('⚙️ Настройки получены:', data);
        
        displaySettings(data.settings);
    } catch (error) {
        console.error('❌ Ошибка загрузки настроек:', error);
        document.getElementById('modalContent').innerHTML = '<div class="text-center text-mars-red">Ошибка загрузки</div>';
    }
}

function displaySettings(settings) {
    const user = gameData?.user;
    const mortalityRisk = gameData?.mortality_risk; // Получаем статус риска из getColonyData
    const GAME_VERSION = window.GAME_VERSION || 'N/A';
    // --- ИСПРАВЛЕНИЕ СИНТАКСИЧЕСКОЙ ОШИБКИ И РАСЧЕТ ИСТОРИЧЕСКОЙ СМЕРТНОСТИ ---
    const totalPopulationHired = (user?.residents_settled || 0) + (user?.residents_waiting || 0) + (user?.residents_deaths || 0);
    const deathPercentage = totalPopulationHired > 0
        ? ((user.residents_deaths || 0) / totalPopulationHired * 100).toFixed(2) 
        : '0.00';
    // -------------------------------------------------------------------------
        
    let content = `
        <div class="space-y-4">
            <div class="resource-card p-4 rounded-xl">
                <h3 class="font-bold text-neon-green mb-3">👤 Информация об аккаунте</h3>
                <div class="space-y-2 text-sm">
                    <div class="flex justify-between">
                        <span class="text-gray-400">Имя пользователя:</span>
                        <span class="text-neon-blue">${user?.username || 'Неизвестно'}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-400">Email:</span>
                        <span class="text-neon-green">${user?.email || 'Неизвестно'}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-400">Название поселения:</span>
                        <span class="text-neon-green">${user?.colony_name || 'Неизвестно'}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-400">Дата регистрации:</span>
                        <span class="text-yellow-400">${user?.created_at ? new Date(user.created_at).toLocaleDateString('ru-RU') : 'Неизвестно'}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-400">Последняя активность:</span>
                        <span class="text-green-400">${user?.last_active ? new Date(user.last_active).toLocaleString('ru-RU') : 'Неизвестно'}</span>
                    </div>
                </div>
            </div>
            
            <div class="resource-card p-4 rounded-xl">
                <h3 class="font-bold text-neon-green mb-3">🔔 Настройки уведомлений</h3>
                <form onsubmit="saveSettings(event)" class="space-y-4">
                    <div class="flex items-center justify-between">
                        <label class="text-sm text-gray-300">Уведомления</label>
                        <label class="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" id="notifications" ${settings?.notifications ? 'checked' : ''} class="sr-only peer">
                            <div class="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-neon-blue"></div>
                        </label>
                    </div>
                    
                    <div class="flex items-center justify-between">
                        <label class="text-sm text-gray-300">Звуковые эффекты</label>
                        <label class="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" id="sound" ${settings?.sound ? 'checked' : ''} class="sr-only peer" onchange="toggleSound(this.checked)">
                            <div class="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-neon-green"></div>
                        </label>
                    </div>
                    
                    <button type="submit" 
                            class="w-full py-2 bg-gradient-to-r from-neon-blue to-neon-purple rounded-lg font-bold hover:scale-105 transition-transform">
                        Сохранить настройки
                    </button>
                </form>
            </div>
            
            <div class="resource-card p-4 rounded-xl">
                <h3 class="font-bold text-neon-green mb-3">🔐 Безопасность</h3>
                <div class="space-y-3">
                    <button onclick="showChangePassword()" 
                            class="w-full py-2 bg-gradient-to-r from-orange-600 to-red-600 rounded-lg font-bold hover:scale-105 transition-transform">
                        Изменить пароль
                    </button>
                    <button onclick="showVerifyEmail()" 
                            class="w-full py-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg font-bold hover:scale-105 transition-transform">
                        Подтвердить email
                    </button>
                </div>
            </div>
            
            <div class="resource-card p-4 rounded-xl">
                <h3 class="font-bold text-neon-green mb-3">📊 Статистика поселения</h3>
                <div class="grid grid-cols-2 gap-4">
                    <div class="text-center">
                        <div class="text-2xl font-bold text-yellow-400">${formatResource(user?.money || 0)}</div>
                        <div class="text-xs text-gray-400">Монет</div>
                    </div>
                    <div class="text-center">
                        <div class="text-2xl font-bold text-green-400">${user?.residents_settled || 0}</div>
                        <div class="text-xs text-gray-400">Жителей</div>
                    </div>
                    <div class="text-center">
                        <div class="text-2xl font-bold text-blue-400">${getTotalBuildings()}</div>
                        <div class="text-xs text-gray-400">Построек</div>
                    </div>
                    <div class="text-center">
                        <div class="text-2xl font-bold text-purple-400">${getTotalBusinesses()}</div>
                        <div class="text-xs text-gray-400">Бизнесов</div>
                    </div>
                    <div class="text-center">
                        <div class="text-2xl font-bold text-mars-red">${user?.residents_deaths || 0}</div>
                        <div class="text-xs text-gray-400">Всего смертей</div>
                    </div>
                    
                    <div class="text-center">
                        <div class="text-sm text-gray-400">Риск смерти:</div>
                        <div class="text-xl font-bold ${mortalityRisk?.color || 'text-gray-400'}">
                            ${mortalityRisk?.status || 'Нет данных'}
                        </div>
                        <div class="text-xs text-gray-400">
                             (${deathPercentage}% исторически)
                        </div>
                    </div>
                    </div>
            </div>
            
<div class="resource-card p-4 rounded-xl">
    <h3 class="font-bold text-neon-green mb-3">ℹ️ О игре</h3>
    <div class="text-sm text-gray-300 space-y-2">
        <div class="flex justify-between">
            <span>Версия игры:</span>
            <span class="text-neon-blue">${GAME_VERSION}</span>
        </div>
        <div class="flex justify-between">
            <span>Разработчик:</span>
            <span class="text-neon-purple">Mars Colony Team</span>
        </div>
        <div class="flex justify-between">
            <span>Платформа:</span>
            <span class="text-neon-green">Web Browser</span>
        </div>
    </div>
</div>

            
            <div class="resource-card p-4 rounded-xl">
                <h3 class="font-bold text-neon-green mb-3">🆘 Поддержка</h3>
                <div class="text-sm text-gray-300 space-y-3">
                    <div>
                        <div class="font-semibold text-neon-blue">Нашли ошибку?</div>
                        <div>Сообщите о проблеме в общем чате или обратитесь к администрации</div>
                    </div>
                    <div>
                        <div class="font-semibold text-neon-purple">Нужна помощь?</div>
                        <div>Изучите раздел "Справка" для получения подробной информации об игре</div>
                    </div>
                    <button onclick="resetTutorial()" 
                            class="w-full py-2 bg-gradient-to-r from-neon-green to-neon-blue rounded-lg font-bold hover:scale-105 transition-transform">
                        🎓 Начать обучение заново
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('modalContent').innerHTML = content;
}

function showChangePassword() {
    const content = `
        <div class="space-y-4">
            <div class="resource-card p-4 rounded-xl">
                <h3 class="font-bold text-neon-green mb-3">🔐 Изменение пароля</h3>
                <form onsubmit="changePassword(event)" class="space-y-3">
                    <input type="password" id="currentPassword" placeholder="Текущий пароль" required
                           class="w-full p-3 bg-gray-800/50 border border-neon-blue/30 rounded-lg focus:border-neon-blue focus:outline-none">
                    <input type="password" id="newPassword" placeholder="Новый пароль (мин. 6 символов)" minlength="6" required
                           class="w-full p-3 bg-gray-800/50 border border-neon-blue/30 rounded-lg focus:border-neon-blue focus:outline-none">
                    <input type="password" id="confirmPassword" placeholder="Подтвердите новый пароль" required
                           class="w-full p-3 bg-gray-800/50 border border-neon-blue/30 rounded-lg focus:border-neon-blue focus:outline-none">
                    <div class="flex space-x-2">
                        <button type="button" onclick="loadSettings()" 
                                class="flex-1 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors">
                            Отмена
                        </button>
                        <button type="submit" 
                                class="flex-1 py-2 bg-gradient-to-r from-orange-600 to-red-600 rounded-lg font-bold hover:scale-105 transition-transform">
                            Изменить пароль
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    document.getElementById('modalContent').innerHTML = content;
}

function showVerifyEmail() {
    const content = `
        <div class="space-y-4">
            <div class="resource-card p-4 rounded-xl">
                <h3 class="font-bold text-neon-green mb-3">📧 Подтверждение email</h3>
                <div class="text-sm text-gray-300 mb-4">
                    <p>На ваш email будет отправлено письмо с кодом подтверждения.</p>
                    <p class="mt-2 text-gray-400">Email: ${gameData?.user?.email}</p>
                </div>
                <div class="flex space-x-2">
                    <button onclick="loadSettings()" 
                            class="flex-1 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors">
                        Отмена
                    </button>
                    <button onclick="sendVerificationEmail()" 
                            class="flex-1 py-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg font-bold hover:scale-105 transition-transform">
                        Отправить код
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('modalContent').innerHTML = content;
}

async function changePassword(event) {
    event.preventDefault();
    console.log('🔐 Изменение пароля');
    
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (newPassword !== confirmPassword) {
        showNotification('error', 'Ошибка', 'Пароли не совпадают');
        return;
    }
    
    if (newPassword.length < 6) {
        showNotification('error', 'Ошибка', 'Пароль должен содержать минимум 6 символов');
        return;
    }
    
    try {
        const response = await fetch('settings.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `action=change_password&current_password=${encodeURIComponent(currentPassword)}&new_password=${encodeURIComponent(newPassword)}`
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
        
        console.log('🔐 Результат изменения пароля:', data);
        
        if (data.success) {
            console.log('✅ Пароль изменен');
            playSound('success');
            showNotification('success', 'Успешно!', 'Пароль был успешно изменен');
            loadSettings();
        } else {
            playSound('error');
            showNotification('error', 'Ошибка', data.error || 'Ошибка изменения пароля');
        }
    } catch (error) {
        console.error('❌ Ошибка изменения пароля:', error);
        playSound('error');
        showNotification('error', 'Ошибка подключения', 'Не удалось изменить пароль');
    }
}

async function sendVerificationEmail() {
    console.log('📧 Отправка кода подтверждения');
    
    try {
        const response = await fetch('settings.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: 'action=send_verification'
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
        
        console.log('📧 Результат отправки:', data);
        
        if (data.success) {
            console.log('✅ Код отправлен');
            playSound('success');
            showNotification('success', 'Код отправлен!', 'Проверьте свой email');
        } else {
            playSound('error');
            showNotification('error', 'Ошибка', data.error || 'Ошибка отправки кода');
        }
    } catch (error) {
        console.error('❌ Ошибка отправки кода:', error);
        playSound('error');
        showNotification('error', 'Ошибка подключения', 'Не удалось отправить код');
    }
}

async function saveSettings(event) {
    event.preventDefault();
    console.log('💾 Сохранение настроек');
    
    const notifications = document.getElementById('notifications').checked ? 1 : 0;
    const sound = document.getElementById('sound').checked ? 1 : 0;
    
    try {
        const response = await fetch('settings.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `action=update_settings&notifications=${notifications}&sound=${sound}`
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
        
        console.log('💾 Результат сохранения:', data);
        
        if (data.success) {
            console.log('✅ Настройки сохранены');
            playSound('success');
            showNotification('success', 'Сохранено!', 'Настройки успешно обновлены');
        } else {
            playSound('error');
            showNotification('error', 'Ошибка', data.error || 'Ошибка сохранения настроек');
        }
    } catch (error) {
        console.error('❌ Ошибка сохранения настроек:', error);
        playSound('error');
        showNotification('error', 'Ошибка подключения', 'Не удалось сохранить настройки');
    }
}

function getTotalBuildings() {
    if (!gameData || !gameData.buildings) return 0;
    return gameData.buildings.reduce((total, building) => total + (building.count || 0), 0);
}

function getTotalBusinesses() {
    if (!gameData || !gameData.businesses) return 0;
    return gameData.businesses.reduce((total, business) => total + (business.count || 0), 0);
}
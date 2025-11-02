// Система онлайн пользователей
console.log('🌐 Модуль онлайн загружен');

async function loadOnline() {
    console.log('🔄 Загрузка онлайн пользователей...');
    
    try {
        const response = await fetch('online.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: 'action=get_online'
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
        
        console.log('🌐 Онлайн пользователи получены:', data);
        
        displayOnlineUsers(data.users || []);
    } catch (error) {
        console.error('❌ Ошибка загрузки онлайн пользователей:', error);
        document.getElementById('modalContent').innerHTML = '<div class="text-center text-mars-red">Ошибка загрузки</div>';
    }
}

function displayOnlineUsers(users) {
    const currentUser = gameData?.user?.username;
    
    let content = `
        <div class="space-y-4">
            <div class="resource-card p-4 rounded-xl">
                <h3 class="font-bold text-neon-green mb-3">🌐 Активные игроки</h3>
                <div class="text-sm text-gray-400 mb-4">
                    Игроки, активные за последние 15 минут: ${users.length}
                </div>
                
                ${users.length > 0 ? `
                    <div class="space-y-2 max-h-96 overflow-y-auto">
                        ${users.map(user => {
                            const isCurrentUser = user.username === currentUser;
                            const lastActive = new Date(user.last_active);
                            const now = new Date();
                            const minutesAgo = Math.floor((now - lastActive) / (1000 * 60));
                            
                            let statusText = '🟢 Сейчас онлайн';
                            let statusClass = 'text-neon-green';
                            
                            if (minutesAgo > 0) {
                                statusText = `🟡 ${minutesAgo} мин. назад`;
                                statusClass = 'text-yellow-400';
                            }
                            if (minutesAgo > 5) {
                                statusText = `🟠 ${minutesAgo} мин. назад`;
                                statusClass = 'text-orange-400';
                            }
                            if (minutesAgo > 10) {
                                statusText = `🔴 ${minutesAgo} мин. назад`;
                                statusClass = 'text-mars-red';
                            }
                            
                            const roleInfo = getRoleInfo(user.role);
                            
                            return `
                                <div class="p-3 rounded-lg ${isCurrentUser ? 'bg-neon-blue/20 border border-neon-blue/50' : 'bg-gray-800/50'} cursor-pointer hover:bg-gray-700/50" onclick="openProfile(${user.id})">
                                    <div class="flex justify-between items-start">
                                        <div class="flex-1">
                                            <div class="flex items-center space-x-2">
                                                <div class="font-bold text-neon-blue ${isCurrentUser ? 'text-neon-green' : ''}">${user.colony_name}</div>
                                                ${roleInfo ? `<div class="px-1 py-0.5 rounded text-xs ${roleInfo.class}">${roleInfo.text}</div>` : ''}
                                            </div>
                                            <div class="text-sm text-gray-400">@${user.username}</div>
                                            <div class="text-xs ${statusClass} mt-1">${statusText}</div>
                                        </div>
                                        <div class="text-right">
                                            <div class="text-sm font-bold text-yellow-400">${formatNumber(user.total_value)}</div>
                                            <div class="text-xs text-gray-400">стоимость</div>
                                        </div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                ` : `
                    <div class="text-center text-gray-400 py-8">
                        <div class="text-4xl mb-2">😴</div>
                        <p>Все игроки сейчас неактивны</p>
                    </div>
                `}
            </div>
            
            <div class="resource-card p-4 rounded-xl">
                <h3 class="font-bold text-neon-green mb-3">📊 Статистика активности</h3>
                <div class="grid grid-cols-2 gap-4 text-sm">
                    <div class="text-center">
                        <div class="text-2xl font-bold text-neon-green">${users.filter(u => (new Date() - new Date(u.last_active)) / (1000 * 60) <= 1).length}</div>
                        <div class="text-xs text-gray-400">Сейчас онлайн</div>
                    </div>
                    <div class="text-center">
                        <div class="text-2xl font-bold text-yellow-400">${users.filter(u => (new Date() - new Date(u.last_active)) / (1000 * 60) <= 5).length}</div>
                        <div class="text-xs text-gray-400">За 5 минут</div>
                    </div>
                    <div class="text-center">
                        <div class="text-2xl font-bold text-orange-400">${users.filter(u => (new Date() - new Date(u.last_active)) / (1000 * 60) <= 10).length}</div>
                        <div class="text-xs text-gray-400">За 10 минут</div>
                    </div>
                    <div class="text-center">
                        <div class="text-2xl font-bold text-neon-purple">${users.length}</div>
                        <div class="text-xs text-gray-400">За 15 минут</div>
                    </div>
                </div>
            </div>
            
            <div class="resource-card p-4 rounded-xl">
                <h3 class="font-bold text-neon-green mb-3">💡 Подсказка</h3>
                <div class="text-sm text-gray-300">
                    <p>Нажмите на игрока, чтобы посмотреть его профиль и отправить личное сообщение!</p>
                    <p class="mt-2 text-gray-400">🟢 - сейчас онлайн, 🟡 - до 5 мин., 🟠 - до 10 мин., 🔴 - до 15 мин.</p>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('modalContent').innerHTML = content;
}

function getRoleInfo(role) {
    const roles = {
        'moderator': { text: '👮', class: 'bg-orange-600/20 border border-orange-600/50 text-orange-300' },
        'admin': { text: '👑', class: 'bg-red-600/20 border border-red-600/50 text-red-300' }
    };
    return roles[role];
}
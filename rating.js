// Система рейтинга
console.log('🏆 Модуль рейтинга загружен');

let currentRatingTab = 'players'; // 'players' or 'alliances'

async function loadRating() {
    console.log('🔄 Загрузка рейтинга...');
    
    // Отображаем заглушку и загружаем оба рейтинга параллельно
    document.getElementById('modalContent').innerHTML = `
        <div class="space-y-4">
            <div class="flex border-b border-neon-blue/30">
                <button onclick="switchRatingTab('players')" id="playerTabBtn" class="tab-btn active bg-neon-blue/20 text-neon-blue font-bold px-4 py-2 transition-all">
                    👤 Игроки
                </button>
                <button onclick="switchRatingTab('alliances')" id="allianceTabBtn" class="tab-btn text-gray-400 font-bold px-4 py-2 transition-all">
                    🤝 Союзы
                </button>
            </div>
            <div id="playerRatingContent">Загрузка игроков...</div>
            <div id="allianceRatingContent" class="hidden">Загрузка союзов...</div>
        </div>
    `;

    try {
        const [playerData, allianceData] = await Promise.all([
            fetchRatingData('get_rating'),
            fetchRatingData('get_alliance_rating')
        ]);
        
        displayPlayerRating(playerData.rating || [], playerData.user_position || 0);
        displayAllianceRating(allianceData.alliance_rating || []);

        // Устанавливаем активный таб после загрузки данных
        switchRatingTab(currentRatingTab);

    } catch (error) {
        console.error('❌ Ошибка загрузки рейтинга:', error);
        document.getElementById('playerRatingContent').innerHTML = '<div class="text-center text-mars-red">Ошибка загрузки игроков</div>';
        document.getElementById('allianceRatingContent').innerHTML = '<div class="text-center text-mars-red">Ошибка загрузки союзов</div>';
    }
}

async function fetchRatingData(action) {
    const response = await fetch('rating.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `action=${action}`
    });
    
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
}

function switchRatingTab(tab) {
    currentRatingTab = tab;
    const playerBtn = document.getElementById('playerTabBtn');
    const allianceBtn = document.getElementById('allianceTabBtn');
    const playerContent = document.getElementById('playerRatingContent');
    const allianceContent = document.getElementById('allianceRatingContent');

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active', 'bg-neon-blue/20', 'text-neon-blue');
        btn.classList.add('text-gray-400');
    });

    playerContent.classList.add('hidden');
    allianceContent.classList.add('hidden');

    if (tab === 'players') {
        playerBtn.classList.add('active', 'bg-neon-blue/20', 'text-neon-blue');
        playerBtn.classList.remove('text-gray-400');
        playerContent.classList.remove('hidden');
    } else {
        allianceBtn.classList.add('active', 'bg-neon-blue/20', 'text-neon-blue');
        allianceBtn.classList.remove('text-gray-400');
        allianceContent.classList.remove('hidden');
    }
}

function displayPlayerRating(rating, userPosition) {
    let content = `
        <div class="space-y-4">
            <div class="resource-card p-4 rounded-xl">
                <h3 class="font-bold text-neon-green mb-3">📊 Ваша позиция</h3>
                <div class="text-center">
                    <div class="text-3xl font-bold text-neon-blue">#${userPosition}</div>
                    <div class="text-sm text-gray-400">место в общем рейтинге игроков</div>
                </div>
            </div>
            
            <div class="resource-card p-4 rounded-xl">
                <h3 class="font-bold text-neon-green mb-3">🏆 Топ игроков</h3>
                
                ${rating.length > 0 ? `
                    <div class="space-y-2 max-h-64 overflow-y-auto">
                        ${rating.map((player, index) => {
                            const isCurrentUser = player.username === gameData?.user?.username;
                            const medalEmoji = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`;
                            
                            return `
                                <div class="flex items-center justify-between p-3 rounded-lg ${isCurrentUser ? 'bg-neon-blue/20 border border-neon-blue/50' : 'bg-gray-800/50'} cursor-pointer hover:bg-gray-700/50" onclick="openProfileFromRating('${player.username}')">
                                    <div class="flex items-center space-x-3">
                                        <div class="text-2xl">${medalEmoji}</div>
                                        <div>
                                            <div class="font-bold text-neon-blue ${isCurrentUser ? 'text-neon-green' : ''}">${player.colony_name}</div>
                                            <div class="text-xs text-gray-400">${player.username} • ${player.days_played} дней</div>
                                        </div>
                                    </div>
                                    <div class="text-right">
                                        <div class="font-bold text-yellow-400">${formatNumber(player.total_value)}</div>
                                        <div class="text-xs text-gray-400">стоимость</div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                ` : `
                    <div class="text-center text-gray-400 py-8">
                        <div class="text-4xl mb-2">🏜️</div>
                        <p>Рейтинг пуст</p>
                    </div>
                `}
            </div>
        </div>
    `;
    
    document.getElementById('playerRatingContent').innerHTML = content;
}

// [NEW] Функция для отображения рейтинга союзов
function displayAllianceRating(allianceRating) {
    let content = `
        <div class="space-y-4">
            <div class="resource-card p-4 rounded-xl">
                <h3 class="font-bold text-neon-purple mb-3">🤝 Рейтинг Союзов</h3>
                <div class="text-xs text-gray-400 mb-3">
                    Рейтинг по суммарной стоимости всех участников союза.
                </div>
                
                ${allianceRating.length > 0 ? `
                    <div class="space-y-2 max-h-96 overflow-y-auto">
                        ${allianceRating.map((alliance, index) => {
                            const isCurrentUserAlliance = alliance.id == gameData?.user?.alliance_id;
                            const medalEmoji = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`;
                            
                            return `
                                <div class="flex items-center justify-between p-3 rounded-lg ${isCurrentUserAlliance ? 'bg-neon-purple/20 border border-neon-purple/50' : 'bg-gray-800/50'} cursor-pointer hover:bg-gray-700/50" onclick="loadAllianceProfile(${alliance.id})">
                                    <div class="flex items-center space-x-3">
                                        <div class="text-2xl">${medalEmoji}</div>
                                        <div>
                                            <div class="font-bold text-neon-purple ${isCurrentUserAlliance ? 'text-neon-green' : ''}">${alliance.name}</div>
                                            <div class="text-xs text-gray-400">Лидер: ${alliance.leader_colony} • ${alliance.member_count} чел.</div>
                                        </div>
                                    </div>
                                    <div class="text-right">
                                        <div class="font-bold text-yellow-400">${formatNumber(alliance.total_alliance_value)}</div>
                                        <div class="text-xs text-gray-400">общая стоимость</div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                ` : `
                    <div class="text-center text-gray-400 py-8">
                        <div class="text-4xl mb-2">🤝</div>
                        <p>Союзы пока не сформированы</p>
                    </div>
                `}
            </div>
        </div>
    `;

    document.getElementById('allianceRatingContent').innerHTML = content;
}

function showFullRating() {
    console.log('🔄 Загрузка полного рейтинга...');
    
    // Загружаем данные снова, но показываем все
    loadRating().then(() => {
        // После загрузки меняем отображение
        const response = fetch('rating.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: 'action=get_rating'
        }).then(response => response.json())
        .then(data => {
            displayFullRating(data.rating || [], data.user_position || 0);
        });
    });
}

function displayFullRating(rating, userPosition) {
    let content = `
        <div class="space-y-4">
            <div class="resource-card p-4 rounded-xl">
                <div class="flex justify-between items-center mb-3">
                    <h3 class="font-bold text-neon-green">🏆 Полный рейтинг</h3>
                    <button onclick="loadRating()" class="text-neon-blue hover:text-neon-green text-sm">
                        ← Топ 5
                    </button>
                </div>
                
                <div class="text-xs text-gray-400 mb-3">
                    Ваша позиция: #${userPosition} из ${rating.length} игроков
                </div>
                
                <div class="space-y-2 max-h-96 overflow-y-auto">
                    ${rating.map((player, index) => {
                        const isCurrentUser = player.username === gameData?.user?.username;
                        const medalEmoji = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`;
                        
                        return `
                            <div class="flex items-center justify-between p-2 rounded-lg ${isCurrentUser ? 'bg-neon-blue/20 border border-neon-blue/50' : 'bg-gray-800/50'} cursor-pointer hover:bg-gray-700/50" onclick="openProfileFromRating('${player.username}')">
                                <div class="flex items-center space-x-2">
                                    <div class="text-sm ${index < 3 ? 'text-lg' : 'text-gray-400'} w-8">${medalEmoji}</div>
                                    <div>
                                        <div class="font-bold text-sm text-neon-blue ${isCurrentUser ? 'text-neon-green' : ''}">${player.colony_name}</div>
                                        <div class="text-xs text-gray-400">${player.username}</div>
                                    </div>
                                </div>
                                <div class="text-right">
                                    <div class="font-bold text-sm text-yellow-400">${formatNumber(player.total_value)}</div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('modalContent').innerHTML = content;
}

async function openProfileFromRating(username) {
    console.log(`👤 Открытие профиля из рейтинга: ${username}`);
    
    // Получаем ID пользователя по имени
    try {
        const response = await fetch('rating.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `action=get_user_id&username=${encodeURIComponent(username)}`
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
        
        if (data.user_id) {
            openProfile(data.user_id);
        } else {
            showNotification('error', 'Ошибка', 'Профиль пользователя недоступен');
        }
    } catch (error) {
        console.error('❌ Ошибка получения ID пользователя:', error);
        showNotification('error', 'Ошибка', 'Не удалось загрузить профиль');
    }
}
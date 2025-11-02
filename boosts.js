// Система бустов
console.log('✨ Модуль бустов загружен');

async function loadBoosts() {
    console.log('🔄 Загрузка бустов...');
    
    try {
        const response = await fetch('boosts.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: 'action=get_boosts'
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
        
        console.log('✨ Данные бустов получены:', data);
        
        displayBoosts(data.boosts || [], data.active_boosts || []);
    } catch (error) {
        console.error('❌ Ошибка загрузки бустов:', error);
        document.getElementById('modalContent').innerHTML = '<div class="text-center text-mars-red">Ошибка загрузки</div>';
    }
}

function displayBoosts(boosts, activeBoosts) {
    const activeBoostsMap = activeBoosts.reduce((map, boost) => {
        map[boost.boost_type] = boost;
        return map;
    }, {});
    
    let content = `
        <div class="space-y-4">
            <div class="resource-card p-4 rounded-xl mb-4">
                <h3 class="font-bold text-neon-green mb-2">💎 Ваши активные бусты</h3>
                <p class="text-sm text-gray-400 mb-3">
                    Бусты дают временное преимущество и покупаются за рубины.
                </p>
                <div id="activeBoostList" class="space-y-2">
                    ${activeBoosts.length > 0 ? activeBoosts.map(boost => {
                        const remainingTime = new Date(boost.end_time).getTime() - new Date().getTime();
                        const timeText = formatTimeRemaining(remainingTime);
                        
                        return `
                            <div class="bg-neon-purple/20 p-3 rounded-lg flex justify-between items-center border border-neon-purple/50">
                                <div class="font-bold text-neon-blue">${boost.info.name}</div>
                                <div class="text-xs text-yellow-400">Осталось: ${timeText}</div>
                            </div>
                        `;
                    }).join('') : `
                        <div class="text-center text-gray-400 py-4">Нет активных бустов</div>
                    `}
                </div>
            </div>

            <div class="resource-card p-4 rounded-xl">
                <h3 class="font-bold text-neon-green mb-3">🛒 Магазин бустов</h3>
                <div class="space-y-4">
                    ${Object.entries(boosts).map(([type, info]) => {
                        const typeInt = parseInt(type);
                        const isActive = activeBoostsMap[typeInt];
                        
                        return `
                            <div class="p-3 rounded-lg ${isActive ? 'bg-gray-700/50 border border-neon-green/50' : 'bg-gray-800/50 border border-neon-blue/30'}">
                                <div class="flex justify-between items-start mb-2">
                                    <div class="flex-1">
                                        <h4 class="font-bold text-neon-blue">${info.name}</h4>
                                        <p class="text-xs text-gray-400">${info.effect}</p>
                                    </div>
                                    <div class="text-right">
                                        <div class="font-bold text-purple-400 text-lg">💎 ${info.cost}</div>
                                    </div>
                                </div>
                                
                                <div class="flex justify-between items-center text-sm mt-2">
                                    <span class="text-gray-400">Длительность: ${info.duration > 0 ? info.duration + ' мин.' : 'Мгновенно'}</span>
                                    
                                    <button onclick="buyBoost(${typeInt}, '${info.name}', ${info.cost})" 
                                            class="px-4 py-1 bg-gradient-to-r from-neon-purple to-neon-pink rounded-lg text-xs font-bold hover:scale-105 transition-transform ${isActive ? 'opacity-50 pointer-events-none' : ''}">
                                        ${isActive ? 'Активен' : 'Купить'}
                                    </button>
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

async function buyBoost(type, name, cost) {
    if (!confirm(`Вы уверены, что хотите купить буст "${name}" за ${cost} рубинов?`)) {
        return;
    }
    
    console.log(`✨ Покупка буста типа: ${type}`);
    
    try {
        const response = await fetch('boosts.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `action=buy_boost&type=${type}`
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
        
        console.log('✨ Результат покупки буста:', data);
        
        if (data.success) {
            console.log('✅ Буст успешно куплен');
            playSound('success');
            
            if (data.instant) {
                showNotification('success', 'Мгновенный эффект!', 'Доход начислен. Проверьте свои ресурсы.');
            } else {
                 showNotification('success', 'Буст активирован!', `Буст "${name}" активирован.`);
            }
           
            await loadGameData(); // Обновление данных, ресурсов, и бустов
            await loadBoosts();
        } else {
            playSound('error');
            showNotification('error', 'Ошибка', data.error || 'Ошибка покупки буста');
        }
    } catch (error) {
        console.error('❌ Ошибка покупки буста:', error);
        playSound('error');
        showNotification('error', 'Ошибка подключения', 'Не удалось купить буст');
    }
}

// Вспомогательная функция для форматирования оставшегося времени
function formatTimeRemaining(ms) {
    if (ms <= 0) return 'Истек';
    
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    const parts = [];
    if (hours > 0) parts.push(`${hours} ч.`);
    if (minutes > 0) parts.push(`${minutes} мин.`);
    if (hours === 0 && minutes === 0) parts.push(`${seconds} сек.`); // Если меньше минуты, показываем секунды
    
    return parts.join(' ');
}

// Автообновление списка активных бустов
if (window.boostInterval) {
    clearInterval(window.boostInterval);
}

window.boostInterval = setInterval(async () => {
    if (document.getElementById('modalTitle').textContent.includes('Бусты')) {
        // Перезагрузка только данных, если модальное окно открыто
         try {
            const response = await fetch('boosts.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: 'action=get_boosts'
            });
            
            const data = await response.json();
            if (data.boosts) {
                // Вызываем displayBoosts снова
                const activeBoosts = data.active_boosts || [];
                const activeBoostsMap = activeBoosts.reduce((map, boost) => {
                    map[boost.boost_type] = boost;
                    return map;
                }, {});

                // Обновление индикатора в главном меню
                const boostIndicator = document.getElementById('boostActiveIndicator');
                if (boostIndicator) {
                     if (activeBoosts.length > 0) {
                        boostIndicator.classList.remove('hidden');
                     } else {
                        boostIndicator.classList.add('hidden');
                     }
                }
                
                // Только если модальное окно бустов открыто, обновляем его содержимое
                if (!document.getElementById('modalOverlay').classList.contains('hidden') && 
                    document.getElementById('modalTitle').textContent.includes('Бусты')) {
                     displayBoosts(data.boosts || [], activeBoosts);
                }
            }
        } catch (error) {
            console.log('❌ Ошибка автообновления бустов:', error);
        }
    }
}, 5000); // Обновляем каждые 5 секунд
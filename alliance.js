// Система союзов
console.log('🤝 Модуль союзов загружен');

// [NEW] Определение построек (для клиента)
function getAllianceBuildingDefinitionsClient() {
    return {
        1: { name: 'Центр Логистики', effect_desc: 'Снижает стоимость личных построек.', max_level: 5, icon: '🚚', bonus_per_level: 0.03 },
        2: { name: 'Общий Рынок', effect_desc: 'Усиливает денежный доход от личных бизнесов.', max_level: 5, icon: '📈', bonus_per_level: 0.05 },
        3: { name: 'Иссл. Станция', effect_desc: 'Снижает потребление электричества личными постройками.', max_level: 5, icon: '🧪', bonus_per_level: 0.04 },
        4: { name: 'Тренировочный Полигон', effect_desc: 'Повышает эффективность труда в личных бизнесах.', max_level: 5, icon: '💪', bonus_per_level: 0.05 }
    };
}

// [NEW] Вспомогательная функция для расчета бонуса
function calculateAllianceBonusText(type, level) {
    const def = getAllianceBuildingDefinitionsClient()[type];
    if (!def) return '';

    const baseBonus = def.bonus_per_level * level;

    switch (type) {
        case 1:
            return `-${(baseBonus * 100).toFixed(0)}% к стоимости построек`;
        case 2:
            return `+${(baseBonus * 100).toFixed(0)}% к доходу от бизнесов`;
        case 3:
            return `-${(baseBonus * 100).toFixed(0)}% к потреблению электричества`;
        case 4:
            return `+${(baseBonus * 100).toFixed(0)}% к эффективности рабочих`;
        default:
            return '';
    }
}

async function loadAlliance() {
    console.log('🔄 Загрузка союзов...');
    
    try {
        // [NEW] Загружаем общие данные для получения приглашений и бонусов
        if (typeof loadGameData === 'function') {
            await loadGameData();
        }
        
        const response = await fetch('alliance.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: 'action=get_alliances'
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
        
        console.log('🤝 Данные союзов получены:', data);
        
        // [NEW] Передаем дополнительные данные для нового интерфейса
        displayAlliances(
            data.alliances || [], 
            data.user_alliance_id, 
            data.alliance_members || [],
            gameData?.alliance_invitations || [], // Используем глобальные приглашения
            data.my_contributions || {},
            data.total_contributions || [],
            data.alliance_buildings || []
        );
    } catch (error) {
        console.error('❌ Ошибка загрузки союзов:', error);
        document.getElementById('modalContent').innerHTML = '<div class="text-center text-mars-red">Ошибка загрузки</div>';
    }
}

// [NEW] Функция для загрузки профиля союза (для просмотра другими игроками)
async function loadAllianceProfile(allianceId) {
    if (allianceId === gameData?.user?.alliance_id) {
        return loadAlliance(); // Если просматриваем свой, просто перезагружаем основной интерфейс
    }
    
    document.getElementById('modalTitle').textContent = '🤝 Профиль Союза';
    const contentDiv = document.getElementById('modalContent');
    contentDiv.innerHTML = '<div class="text-center text-neon-blue">Загрузка профиля союза...</div>';

    try {
        const response = await fetch('alliance.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `action=get_alliance_profile&alliance_id=${allianceId}`
        });

        const data = await response.json();

        if (data.success) {
            displayAllianceProfile(data.alliance, data.members, data.buildings);
        } else {
            contentDiv.innerHTML = `<div class="text-center text-mars-red">${data.error || 'Союз не найден'}</div>`;
        }
    } catch (error) {
        console.error('❌ Ошибка загрузки профиля союза:', error);
        contentDiv.innerHTML = '<div class="text-center text-mars-red">Ошибка подключения</div>';
    }
}

// [NEW] Функция для отображения профиля союза
function displayAllianceProfile(alliance, members, buildings) {
    const isMember = alliance.id == gameData?.user?.alliance_id;
    const buildingDefinitions = getAllianceBuildingDefinitionsClient();

    let content = `
        <div class="space-y-4">
            <div class="resource-card p-4 rounded-xl border border-neon-green/50">
                <h3 class="font-bold text-neon-green text-xl mb-3">🏛️ ${alliance.name}</h3>
                <div class="text-sm space-y-2">
                    <div class="flex justify-between">
                        <span class="text-gray-400">Лидер:</span>
                        <span class="text-neon-blue">${alliance.leader_colony} (@${alliance.leader_name})</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-400">Участники:</span>
                        <span class="text-neon-green">${members.length} / ${alliance.max_members}</span>
                    </div>
                    <div class="text-gray-300 mt-2">
                        <span class="font-bold">Описание:</span> ${alliance.description || 'Нет описания'}
                    </div>
                    
                    ${isMember ? `
                        <div class="text-center mt-4">
                            <button onclick="leaveAlliance()" 
                                    class="py-2 px-4 bg-mars-red hover:bg-red-600 rounded-lg font-bold transition-colors text-sm">
                                Покинуть союз
                            </button>
                        </div>
                    ` : ''}
                </div>
            </div>

            <div class="resource-card p-4 rounded-xl">
                <h3 class="font-bold text-neon-blue mb-3">🏗️ Постройки Союза</h3>
                <div class="space-y-3">
                    ${Object.values(buildingDefinitions).map(def => {
                        const building = buildings.find(b => b.building_type == def.type) || { level: 0 };
                        const currentLevel = building.level;
                        const statusClass = currentLevel > 0 ? 'text-neon-green' : 'text-gray-500';

                        return `
                            <div class="p-3 rounded-lg bg-gray-800/50 flex justify-between items-center">
                                <div>
                                    <h4 class="font-bold ${statusClass}">${def.icon} ${def.name} (Ур.${currentLevel})</h4>
                                    <p class="text-xs text-gray-400">${currentLevel > 0 ? calculateAllianceBonusText(def.type, currentLevel) : 'Не построена'}</p>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
            
            <div class="resource-card p-4 rounded-xl">
                <h3 class="font-bold text-neon-green mb-3">👥 Участники (${members.length})</h3>
                <div class="space-y-2 max-h-48 overflow-y-auto">
                    ${members.map(member => `
                        <div class="flex justify-between p-2 rounded-lg bg-gray-800/50 cursor-pointer hover:bg-gray-700/50" onclick="openProfile(${member.user_id})">
                            <div>
                                <div class="font-bold text-neon-blue">${member.colony_name} ${member.is_leader ? '👑' : ''}</div>
                                <div class="text-xs text-gray-400">@${member.username}</div>
                            </div>
                            <div class="text-right">
                                <div class="text-xs font-bold text-yellow-400">${formatNumber(member.total_value)}</div>
                                <div class="text-xs text-gray-400">стоимость</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div class="resource-card p-4 rounded-xl border border-mars-red/50">
                <h3 class="font-bold text-mars-red mb-3">⛔ Закрытая информация</h3>
                <div class="text-sm text-gray-400">
                    Баланс фонда и статистика взносов доступны только членам союза.
                </div>
            </div>
        </div>
    `;

    document.getElementById('modalContent').innerHTML = content;
}

// [NEW] Функция для отображения панели построек
function displayAllianceBuildingsPanel(alliance, buildings, isLeader) {
    const buildingDefinitions = getAllianceBuildingDefinitionsClient();

    let content = `
        <div class="space-y-4">
            <h3 class="font-bold text-neon-green text-xl mb-3">🏗️ Управление Постройками Союза</h3>
            <p class="text-sm text-gray-400">Бонусы действуют на всех ${members.length} членов союза.</p>
            
            <div class="resource-card p-4 rounded-xl border border-neon-blue/50">
                <h4 class="font-bold text-neon-blue">💰 Фонд Союза:</h4>
                <div class="grid grid-cols-2 mt-2 font-bold">
                    <span class="text-purple-400">💎 ${formatNumber(alliance.rubies_fund, 4)}</span>
                    <span class="text-gray-400">🪨 ${formatNumber(alliance.materials_fund, 2)}</span>
                </div>
            </div>

            <div class="space-y-4">
                ${Object.entries(buildingDefinitions).map(([type, def]) => {
                    const typeInt = parseInt(type);
                    const building = buildings.find(b => b.building_type == typeInt) || { level: 0 };
                    const currentLevel = building.level;
                    const nextLevel = currentLevel + 1;
                    const maxLevel = def.max_level;
                    const isMaxed = currentLevel >= maxLevel;
                    
                    const cost = getAllianceBuildingCostClient(typeInt, nextLevel);
                    
                    const costText = Object.entries(cost).map(([res, amount]) => {
                        return `${res === 'rubies' ? '💎' : '🪨'} ${formatNumber(amount, res === 'rubies' ? 4 : 2)}`;
                    }).join(' | ');

                    const actionButton = isLeader ? (
                        isMaxed ? `
                            <button class="w-full py-2 bg-gray-600 rounded-lg text-sm font-bold opacity-50 cursor-not-allowed">
                                Макс. Ур.
                            </button>
                        ` : `
                            <button onclick="${currentLevel === 0 ? `buyAllianceBuilding(${typeInt})` : `upgradeAllianceBuilding(${typeInt})`}"
                                    class="w-full py-2 bg-gradient-to-r from-neon-green to-neon-blue rounded-lg text-sm font-bold hover:scale-105 transition-transform">
                                ${currentLevel === 0 ? 'Построить' : 'Улучшить'}
                            </button>
                        `
                    ) : `
                        <div class="text-center text-xs text-mars-red">Только Лидер может управлять</div>
                    `;

                    return `
                        <div class="resource-card p-4 rounded-xl border border-neon-blue/30">
                            <h4 class="font-bold text-neon-blue">${def.icon} ${def.name} (Ур.${currentLevel})</h4>
                            <p class="text-xs text-gray-400 mb-2">${def.effect_desc}</p>

                            <div class="p-2 bg-gray-800/50 rounded-lg text-sm mb-3">
                                <div class="flex justify-between">
                                    <span class="text-gray-400">Текущий бонус:</span>
                                    <span class="text-neon-green font-bold">${calculateAllianceBonusText(typeInt, currentLevel)}</span>
                                </div>
                                ${!isMaxed ? `
                                <div class="flex justify-between mt-1">
                                    <span class="text-gray-400">След. бонус (Ур.${nextLevel}):</span>
                                    <span class="text-yellow-400">${calculateAllianceBonusText(typeInt, nextLevel)}</span>
                                </div>
                                ` : ''}
                            </div>
                            
                            <div class="text-xs mb-3">
                                <div class="text-gray-400 font-semibold mb-1">${isMaxed ? 'Достигнут макс. уровень' : `Стоимость Ур.${nextLevel}:`}</div>
                                <div class="text-orange-400">${isMaxed ? '-' : costText}</div>
                            </div>
                            
                            ${actionButton}
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;

    document.getElementById('modalContent').innerHTML = content;
}

// [NEW] Вспомогательная функция для расчета стоимости (клиентская версия)
function getAllianceBuildingCostClient(type, targetLevel) {
    const definitions = getAllianceBuildingDefinitionsClient();
    const def = definitions[type];
    const baseCosts = { // Должно совпадать с PHP
        1: { materials: 500, rubies: 50 },
        2: { materials: 600, rubies: 70 },
        3: { materials: 700, rubies: 90 },
        4: { materials: 800, rubies: 100 }
    };
    
    const cost = {};
    const LEVEL_MULTIPLIER = 2.0;

    for (const resource in baseCosts[type]) {
        cost[resource] = parseFloat((baseCosts[type][resource] * targetLevel * LEVEL_MULTIPLIER).toFixed(2));
    }
    return cost;
}

// [NEW] Действие: Открыть панель построек
function openAllianceBuildingsPanel() {
    const alliance = alliances.find(a => a.id == gameData.user.alliance_id);
    const buildings = alliance.buildings;
    const isLeader = gameData.user.is_alliance_leader;
    
    document.getElementById('modalTitle').textContent = '🏗️ Постройки Союза';
    displayAllianceBuildingsPanel(alliance, buildings, isLeader);
}

// [NEW] Действие: Купить постройку
async function buyAllianceBuilding(type) {
    if (!confirm(`Вы уверены, что хотите построить ${getAllianceBuildingDefinitionsClient()[type].name} (Ур. 1)? Стоимость будет списана из Фонда Союза.`)) return;

    try {
        const response = await fetch('alliance.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `action=buy_alliance_building&type=${type}`
        });
        const data = await response.json();
        if (data.success) {
            showNotification('success', 'Постройка завершена!', 'Новая постройка начала давать бонусы.');
            await loadGameData();
            loadAlliance();
        } else {
            showNotification('error', 'Ошибка', data.error || 'Ошибка строительства.');
        }
    } catch (e) {
        showNotification('error', 'Ошибка', 'Ошибка подключения.');
    }
}

// [NEW] Действие: Улучшить постройку
async function upgradeAllianceBuilding(type) {
    if (!confirm(`Вы уверены, что хотите улучшить ${getAllianceBuildingDefinitionsClient()[type].name}? Стоимость будет списана из Фонда Союза.`)) return;

    try {
        const response = await fetch('alliance.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `action=upgrade_alliance_building&type=${type}`
        });
        const data = await response.json();
        if (data.success) {
            showNotification('success', 'Улучшение завершено!', `Постройка Ур.${data.new_level} активирована.`);
            await loadGameData();
            loadAlliance();
        } else {
            showNotification('error', 'Ошибка', data.error || 'Ошибка улучшения.');
        }
    } catch (e) {
        showNotification('error', 'Ошибка', 'Ошибка подключения.');
    }
}


async function createAlliance(event) {
    event.preventDefault();
    console.log('➕ Создание союза');
    
    const name = document.getElementById('allianceName').value.trim();
    const description = document.getElementById('allianceDescription').value.trim();
    
    if (!name) {
        showNotification('error', 'Ошибка', 'Введите название союза');
        return;
    }
    
    // [NEW] Добавлено подтверждение стоимости
    if (!confirm('Создание союза стоит 50 Рубинов. Вы уверены?')) {
        return;
    }

    try {
        const response = await fetch('alliance.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `action=create_alliance&name=${encodeURIComponent(name)}&description=${encodeURIComponent(description)}`
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
        
        console.log('➕ Результат создания союза:', data);
        
        if (data.success) {
            console.log('✅ Союз успешно создан');
            playSound('success');
            showNotification('success', 'Союз создан!', 'С вашего счета списано 50💎');
            await loadGameData(); // Обновляем ресурсы
            await loadAlliance();
        } else {
            playSound('error');
            showNotification('error', 'Ошибка', data.error || 'Ошибка создания союза');
        }
    } catch (error) {
        console.error('❌ Ошибка создания союза:', error);
        playSound('error');
        showNotification('error', 'Ошибка подключения', 'Не удалось создать союз');
    }
}


// [NEW] ФУНКЦИЯ ДЛЯ ПРИНЯТИЯ ПРИГЛАШЕНИЯ
async function acceptInvitation(allianceId) {
    if (!confirm('Вы уверены, что хотите принять приглашение и вступить в союз?')) {
        return;
    }
    try {
        const response = await fetch('alliance.php', {
            method: 'POST',
            body: `action=accept_invitation&alliance_id=${allianceId}`,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        const data = await response.json();
        if (data.success) {
            showNotification('success', 'Успех!', 'Вы вступили в союз.');
            await loadGameData();
            await loadAlliance();
        } else {
            showNotification('error', 'Ошибка', data.error || 'Не удалось принять приглашение.');
        }
    } catch (e) {
        showNotification('error', 'Ошибка', 'Ошибка подключения.');
    }
}

// [NEW] ФУНКЦИЯ ДЛЯ ОТКЛОНЕНИЯ ПРИГЛАШЕНИЯ
async function rejectInvitation(allianceId) {
    try {
        const response = await fetch('alliance.php', {
            method: 'POST',
            body: `action=reject_invitation&alliance_id=${allianceId}`,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        const data = await response.json();
        if (data.success) {
            showNotification('info', 'Отклонено', 'Приглашение отклонено.');
            await loadGameData();
            await loadAlliance();
        } else {
            showNotification('error', 'Ошибка', data.error || 'Не удалось отклонить приглашение.');
        }
    } catch (e) {
        showNotification('error', 'Ошибка', 'Ошибка подключения.');
    }
}

// [NEW] ФУНКЦИЯ ДЛЯ ВЗНОСА В ФОНД
async function contributeFund(event) {
    event.preventDefault();
    const rubies = parseFloat(document.getElementById('contributeRubies').value) || 0;
    const materials = parseFloat(document.getElementById('contributeMaterials').value) || 0;

    if (rubies < 0 || materials < 0) {
        showNotification('warning', 'Внимание', 'Сумма взноса не может быть отрицательной.');
        return;
    }

    if (rubies === 0 && materials === 0) {
        showNotification('warning', 'Внимание', 'Введите ненулевую сумму для взноса.');
        return;
    }
    
    if (!confirm(`Подтвердите взнос: 💎${formatNumber(rubies, 4)} и 🪨${formatNumber(materials, 2)}?`)) return;

    try {
        const response = await fetch('alliance.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `action=contribute_fund&rubies=${rubies}&materials=${materials}`
        });
        
        const data = await response.json();
        if (data.success) {
            showNotification('success', 'Вклад внесен!', 'Фонд союза пополнен.');
            await loadGameData();
            await loadAlliance();
        } else {
            showNotification('error', 'Ошибка', data.error || 'Ошибка взноса.');
        }
    } catch (e) {
        showNotification('error', 'Ошибка', 'Ошибка подключения.');
    }
}

// [NEW] ФУНКЦИЯ ДЛЯ РАСШИРЕНИЯ МЕСТ
async function upgradeCapacity() {
    if (!confirm('Вы уверены? Расширение на +1 место стоит 100 💎 из Фонда Союза.')) {
        return;
    }
    
    try {
        const response = await fetch('alliance.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: 'action=upgrade_capacity'
        });
        
        const data = await response.json();
        if (data.success) {
            showNotification('success', 'Расширение!', `Вместимость увеличена до ${data.new_capacity} мест.`);
            await loadGameData();
            await loadAlliance();
        } else {
            showNotification('error', 'Ошибка', data.error || 'Ошибка расширения.');
        }
    } catch (e) {
        showNotification('error', 'Ошибка', 'Ошибка подключения.');
    }
}

async function leaveAlliance() {
    console.log('🚪 Выход из союза');
    
    if (!confirm('Вы уверены, что хотите покинуть союз?')) {
        return;
    }
    
    try {
        const response = await fetch('alliance.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: 'action=leave_alliance'
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
        
        console.log('🚪 Результат выхода:', data);
        
        if (data.success) {
            console.log('✅ Успешный выход из союза');
            playSound('success');
            showNotification('info', 'До свидания!', data.message || 'Вы покинули союз');
            await loadAlliance();
        } else {
            playSound('error');
            showNotification('error', 'Ошибка', data.error || 'Ошибка выхода из союза');
        }
    } catch (error) {
        console.error('❌ Ошибка выхода из союза:', error);
        playSound('error');
        showNotification('error', 'Ошибка подключения', 'Не удалось покинуть союз');
    }
}
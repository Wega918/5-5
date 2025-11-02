// Система жителей
console.log('👷 Модуль жителей загружен');

// Функция для расчета вместимости жилья за один юнит (используется Math.ceil(5 * 1.5^(L-1)))
function getBuildingCapacityPerUnit(level) {
    const base_capacity = 5;
    const scalingFactor = Math.pow(1.5, level - 1);
    return Math.ceil(base_capacity * scalingFactor);
}

async function loadResidents() {
    console.log('🔄 Загрузка данных жителей...');
    
    try {
        const response = await fetch('residents.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: 'action=get_residents'
        });
        
        // Примечание: residents.php возвращает только $user. 
        // Нам нужно убедиться, что gameData обновлено, чтобы получить константы.
        // loadGameData() должен быть вызван перед loadResidents(), что уже происходит в main.js.

        const data = await response.json();
        console.log('👷 Данные жителей получены:', data);
        
        displayResidents(data.residents);
    } catch (error) {
        console.error('❌ Ошибка загрузки жителей:', error);
    }
}

function displayResidents(user) {
    
    // --- ПОЛУЧЕНИЕ КОНСТАНТ ИЗ ГЛОБАЛЬНЫХ ДАННЫХ ИГРЫ (обновлено) ---
    const consumption = gameData?.consumption || { water: 3, food: 2, oxygen: 4 }; // Fallback на случай, если gameData не загружен
    const CONS_WATER = consumption.water; 
    const CONS_FOOD = consumption.food;
    const CONS_OXYGEN = consumption.oxygen;
    // -----------------------------------------------------------
    
    const buildings = gameData?.buildings || [];
    
    // [ИЗМЕНЕНО] Расчет общей вместимости, учитывая уровень
    let housingCapacity = 0;
    buildings.forEach(b => {
        if (b.building_type == 5) {
            housingCapacity += getBuildingCapacityPerUnit(b.level) * b.count;
        }
    });
    const freeHousing = housingCapacity - user.residents_settled;
    
    let content = `
        <div class="space-y-4">
            <div class="resource-card p-4 rounded-xl">
                <h3 class="font-bold text-neon-green mb-3">📊 Статистика населения</h3>
                
                <div class="grid grid-cols-2 gap-4 mb-4">
                    <div class="text-center">
                        <div class="text-2xl font-bold text-orange-400">${user.residents_waiting}</div>
                        <div class="text-xs text-gray-400">Ожидают заселения</div>
                    </div>
                    <div class="text-center">
                        <div class="text-2xl font-bold text-green-400">${user.residents_settled}</div>
                        <div class="text-xs text-gray-400">Заселены</div>
                    </div>
                    <div class="text-center">
                        <div class="text-2xl font-bold text-blue-400">${user.residents_working}</div>
                        <div class="text-xs text-gray-400">Работают</div>
                    </div>
                    <div>
                        <div class="text-2xl font-bold text-purple-400">${user.residents_settled - user.residents_working}</div>
                        <div class="text-xs text-gray-400">Свободны</div>
                    </div>
                </div>
                
                <div class="bg-gray-800/50 p-3 rounded-lg">
                    <div class="text-sm">
                        <div class="flex justify-between">
                            <span class="text-gray-400">Лимит жилья:</span>
                            <span class="text-neon-blue">${housingCapacity} мест</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-400">Свободно жилья:</span>
                            <span class="text-green-400">${freeHousing} мест</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="resource-card p-4 rounded-xl">
                <h3 class="font-bold text-neon-green mb-3">🏠 Заселение жителей</h3>
                <p class="text-sm text-gray-400 mb-4">
                    Заселите жителей в жилые комплексы. Каждый житель потребляет воду, еду и кислород.
                </p>
                
                <div class="flex gap-2 mb-4">
                    <input type="number" id="settleCount" min="1" max="${Math.min(user.residents_waiting, freeHousing)}" value="1" 
                           class="flex-1 p-2 bg-gray-800/50 border border-neon-blue/30 rounded-lg focus:border-neon-blue focus:outline-none">
                    <button onclick="settleResidents()" 
                            class="px-4 py-2 bg-gradient-to-r from-neon-green to-neon-blue rounded-lg font-bold hover:scale-105 transition-transform ${user.residents_waiting < 1 || freeHousing < 1 ? 'opacity-50' : ''}">
                        Заселить
                    </button>
                </div>
                
                ${user.residents_waiting < 1 || freeHousing < 1 ? `
                    <div class="text-sm text-mars-red">
                        ${user.residents_waiting < 1 ? '⚠️ Нет жителей для заселения' : ''}
                        ${freeHousing < 1 ? '⚠️ Недостаточно жилья. Постройте жилые комплексы.' : ''}
                    </div>
                ` : ''}
            </div>
            
            <div class="resource-card p-4 rounded-xl">
                <h3 class="font-bold text-neon-green mb-3">💰 Найм жителей</h3>
                <p class="text-sm text-gray-400 mb-4">
                    Нанимайте новых жителей за монеты. Стоимость: 50 монет за жителя.
                </p>
                
                <div class="flex gap-2 mb-4">
                    <input type="number" id="buyCount" min="1" max="10" value="1" 
                           class="flex-1 p-2 bg-gray-800/50 border border-neon-blue/30 rounded-lg focus:border-neon-blue focus:outline-none">
                    <button onclick="buyResidents()" 
                            class="px-4 py-2 bg-gradient-to-r from-neon-purple to-neon-pink rounded-lg font-bold hover:scale-105 transition-transform">
                        Нанять
                    </button>
                </div>
                
                <div class="text-sm text-yellow-400" id="hireCost">
                    Стоимость: 💰 50 монет
                </div>
            </div>
            
            <div class="resource-card p-4 rounded-xl">
                <h3 class="font-bold text-neon-green mb-3">📈 Потребление ресурсов</h3>
                <div class="text-sm space-y-2">
                    <div class="flex justify-between">
                        <span class="text-gray-400">Вода (в час):</span>
                        <span class="text-blue-400">💧 ${user.residents_settled * CONS_WATER}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-400">Еда (в час):</span>
                        <span class="text-yellow-600">🍞 ${user.residents_settled * CONS_FOOD}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-400">Кислород (в час):</span>
                        <span class="text-cyan-400">🌬️ ${user.residents_settled * CONS_OXYGEN}</span>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('modalContent').innerHTML = content;
    
    // Обновление стоимости найма при изменении количества
    document.getElementById('buyCount').addEventListener('input', function() {
        const count = parseInt(this.value) || 1;
        const cost = count * 50;
        document.getElementById('hireCost').textContent = `Стоимость: 💰 ${cost} монет`;
    });
}

async function settleResidents() {
    const count = parseInt(document.getElementById('settleCount').value) || 1;
    console.log(`🏠 Заселение жителей: ${count}`);
    
    try {
        const response = await fetch('residents.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `action=settle_residents&count=${count}`
        });
        
        const data = await response.json();
        console.log('🏠 Результат заселения:', data);
        
        if (data.success) {
            console.log('✅ Жители успешно заселены');
            await loadGameData();
            await loadResidents();
             // --- ИНТЕГРАЦИЯ ОБУЧЕНИЯ ---
            if (typeof checkTutorial === 'function') {
                setTimeout(() => checkTutorial(), 500);
            }
            // --------------------------
        } else {
            alert(data.error || 'Ошибка заселения');
        }
    } catch (error) {
        console.error('❌ Ошибка заселения жителей:', error);
        alert('Ошибка подключения');
    }
}

async function buyResidents() {
    const count = parseInt(document.getElementById('buyCount').value) || 1;
    console.log(`💰 Найм жителей: ${count}`);
    
    try {
        const response = await fetch('residents.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `action=buy_residents&count=${count}`
        });
        
        const data = await response.json();
        console.log('💰 Результат найма:', data);
        
        if (data.success) {
            console.log('✅ Жители успешно наняты');
            await loadGameData();
            await loadResidents();
        } else {
            alert(data.error || 'Ошибка найма');
        }
    } catch (error) {
        console.error('❌ Ошибка найма жителей:', error);
        alert('Ошибка подключения');
    }
}
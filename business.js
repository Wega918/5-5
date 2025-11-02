// Система бизнесов
console.log('💼 Модуль бизнесов загружен');

const MAX_BUSINESS_COUNT = 100;

async function loadBusinesses() {
    console.log('🔄 Загрузка бизнесов...');
    
    try {
        const response = await fetch('business.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: 'action=get_businesses'
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
        
        console.log('💼 Данные бизнесов получены:', data);
        
        displayBusinesses(data.businesses || []);
    } catch (error) {
        console.error('❌ Ошибка загрузки бизнесов:', error);
        document.getElementById('modalContent').innerHTML = '<div class="text-center text-mars-red">Ошибка загрузки</div>';
    }
}
function displayBusinesses(businesses) {
    const businessTypes = {
        1: { name: '💵 Бизнес I', description: 'Простой бизнес' },
        2: { name: '💰 Бизнес II', description: 'Средний бизнес' },
        3: { name: '💼 Бизнес III', description: 'Крупный бизнес' },
        4: { name: '🏭 Бизнес IV', description: 'Корпорация' }
    };
    
    const user = gameData?.user;
    
    // Считаем общее количество работающих
    const totalAssignedWorkers = businesses.reduce((sum, b) => sum + (b.workers_assigned || 0), 0);
    const freeResidents = user ? (user.residents_settled - totalAssignedWorkers) : 0;
    
    // [NEW] Получение бонусов Союза
    const allianceBonuses = gameData?.alliance_bonuses || {};
    const moneyBonus = allianceBonuses.money_income_multiplier ? ((allianceBonuses.money_income_multiplier - 1) * 100).toFixed(0) : 0;
    const efficiencyBonus = allianceBonuses.worker_efficiency_multiplier ? ((allianceBonuses.worker_efficiency_multiplier - 1) * 100).toFixed(0) : 0;
    
    // [NEW] Бонус на скидку
    const costDiscount = allianceBonuses.cost_discount ? ((1 - allianceBonuses.cost_discount) * 100).toFixed(0) : 0;
    
    let content = `
        <div class="mb-4 p-3 bg-gray-800/50 rounded-lg">
            <div class="text-sm text-neon-green">👷 Свободных жителей для работы: ${freeResidents}</div>
        </div>
        ${moneyBonus > 0 || efficiencyBonus > 0 || costDiscount > 0 ? `
        <div class="resource-card p-3 rounded-xl mb-3 text-center text-neon-green font-bold">
            🤝 Бонус Союза: 
            ${moneyBonus > 0 ? `+${moneyBonus}% Доход` : ''} 
            ${efficiencyBonus > 0 ? `+${efficiencyBonus}% Эффективность труда` : ''}
            ${costDiscount > 0 ? `-${costDiscount}% Скидка на бизнесы` : ''}
        </div>
        ` : ''}
        <div class="space-y-4">
    `;
    
    for (let type = 1; type <= 4; type++) {
        const business = businesses.find(b => b.business_type == type) || { id: null, count: 0, level: 1, workers_required: 0, workers_assigned: 0 };
        const typeInfo = businessTypes[type];
        
        const currentMaxLevel = business.count > 0 ? business.level : 0;
        
        // [ИСПРАВЛЕНО] Ограничение уровня покупки до 5 
        const targetPurchaseLevel = Math.min(5, currentMaxLevel === 0 ? 1 : currentMaxLevel); 
        
        // Стоимость покупки = Кумулятивная стоимость + Экспоненциальный множитель + Скидка
        const purchasePrice = getBusinessCumulativeCostClient(type, targetPurchaseLevel, business.count); 
        
        // --- ОБНОВЛЕНО: Умножаем базовую стоимость апгрейда на количество юнитов и скидку ---
        const costMultiplier = allianceBonuses.cost_discount || 1.0;
        const upgradePrice = parseFloat((getBusinessCostClient(type, business.level + 1) * business.count * costMultiplier).toFixed(2));
        
        const income = getBusinessIncomeClient(type, business.level);

        // --- НОВОЕ: Расчет выгоды от покупки (если уже есть) ---
        let purchaseBenefitText = '';
        if (business.count >= 0) { // Показываем выгоду даже для первой покупки (level 1)
            const purchaseLevel = business.count === 0 ? 1 : business.level;
            const purchaseBenefit = getBusinessPurchaseBenefitClient(type, purchaseLevel);
            purchaseBenefitText = `<div class="text-neon-blue mt-1">${purchaseBenefit.text}</div>`;
        }

        // --- НОВОЕ: Расчет выгоды от улучшения ---
        let upgradeBenefitText = '';
        if (business.count > 0 && business.level < 5) {
            const upgradeBenefit = getBusinessUpgradeBenefitClient(type, business.level, business.count);
            upgradeBenefitText = `<div class="text-neon-blue mt-1">Выгода: ${upgradeBenefit.text}</div>`;
        }
        
        // --- ИСПРАВЛЕНИЕ 2: Кумулятивные рабочие для покупки ---
        const workersForPurchase = getWorkersRequiredForUnitPurchaseClient(type, targetPurchaseLevel); 
        
        const additionalWorkersPerUnit = getAdditionalWorkersForUpgradeUnitClient(type, business.level);
        const upgradeWorkersNeeded = business.count > 0 ? business.count * additionalWorkersPerUnit : 0; 
        
        // ИЗМЕНЕННЫЙ БЛОК ДЛЯ ОТОБРАЖЕНИЯ ТРЕБУЕМЫХ/РАБОТАЮЩИХ
        const requiredWorkersTotal = business.workers_required;
        const assignedWorkersTotal = business.workers_assigned;
        let workersDisplay = '';
        
        if (business.count > 0) {
            workersDisplay = `Требуется: 👷 ${requiredWorkersTotal} рабочих | Работает: 👷 ${assignedWorkersTotal}`;
        } else {
            // Если не куплено: показываем требование для покупки (L1)
            workersDisplay = `Требуется: 👷 ${workersForPurchase} рабочих`;
        }
        
        // Логика кнопки "Нанять рабочих"
        const missingWorkers = requiredWorkersTotal - assignedWorkersTotal;
        const canHire = business.id !== null && missingWorkers > 0 && freeResidents > 0;
        const workersToHire = Math.min(missingWorkers, freeResidents);
        
        // 2. ПРОВЕРКА ЛИМИТА НА КЛИЕНТЕ
        const isCountMaxed = business.count >= MAX_BUSINESS_COUNT;
        
        content += `
            <div class="resource-card p-4 rounded-xl">
                <div class="flex justify-between items-start mb-3">
                    <div>
                        <h3 class="font-bold text-neon-green">${typeInfo.name}</h3>
                        <p class="text-xs text-gray-400">${typeInfo.description}</p>
                        <div class="text-sm text-neon-blue mt-1">
                            Уровень: ${business.level} | Количество: ${business.count}
                        </div>
                    </div>
                </div>
                
                <div class="text-sm mb-3">
                    <div class="text-neon-purple">Доход (1 шт.): 💰 ${income.toFixed(2)} монет</div>
                    <div class="text-neon-green">Общий доход (час): 💰 ${formatNumber((income * business.count * (allianceBonuses.money_income_multiplier || 1.0)))} монет</div>
                    <div class="text-orange-400">
                        ${workersDisplay}
                    </div>
                    ${business.count > 0 && missingWorkers > 0 ? `
                        <div class="text-mars-red mt-2">
                            Недостаток: 👷 ${missingWorkers} рабочих.
                        </div>
                    ` : ''}
                    ${isCountMaxed ? `
                        <div class="text-mars-red mt-2">
                            Достигнут максимальный лимит (${MAX_BUSINESS_COUNT} шт.)!
                        </div>
                    ` : ''}
                </div>
                
                <div class="grid grid-cols-2 gap-2 text-xs mb-3">
                    <div>
                        <div class="text-gray-400">Стоимость покупки (№${business.count + 1}, Ур.${targetPurchaseLevel}):</div>
                        <div class="text-yellow-400">💰 ${formatNumber(purchasePrice)} монет</div>
                        <div class="text-gray-400 mt-1">Рабочих для покупки: ${workersForPurchase}</div>
                        ${purchaseBenefitText}
                    </div>
                    ${business.count > 0 && business.level < 5 ? `
                    <div>
                        <div class="text-gray-400">Стоимость улучшения (${business.count} шт.):</div>
                        <div class="text-orange-400">💰 ${formatNumber(upgradePrice)} монет</div>
                        <div class="text-gray-400 mt-1">Рабочих для улучшения: ${upgradeWorkersNeeded}</div>
                        ${upgradeBenefitText}
                    </div>
                    ` : ''}
                </div>
                
                <div class="flex gap-2 flex-wrap">
                    <button onclick="buyBusiness(${type})" 
                            class="flex-1 py-2 px-3 bg-gradient-to-r from-neon-blue to-neon-purple rounded-lg text-sm font-bold hover:scale-105 transition-transform ${freeResidents < workersForPurchase || isCountMaxed ? 'opacity-50 pointer-events-none' : ''}">
                        Купить
                    </button>
                    ${business.count > 0 && business.level < 5 ? `
                    <button onclick="upgradeBusiness(${type})" 
                            class="flex-1 py-2 px-3 bg-gradient-to-r from-neon-green to-neon-blue rounded-lg text-sm font-bold hover:scale-105 transition-transform ${freeResidents < upgradeWorkersNeeded ? 'opacity-50' : ''}">
                        Улучшить
                    </button>
                    ` : ''}
                    
                    ${canHire ? `
                    <button onclick="hireWorkersForBusiness(${business.id}, ${workersToHire})" 
                            class="w-full py-2 bg-gradient-to-r from-orange-400 to-mars-red rounded-lg text-sm font-bold hover:scale-105 transition-transform mt-2">
                        Нанять ${workersToHire} рабочих
                    </button>
                    ` : ''}
                </div>
            </div>
        `;
    }
    
    content += '</div>';
    document.getElementById('modalContent').innerHTML = content;
}

// --- НОВАЯ ФУНКЦИЯ: Расчет выгоды от покупки нового юнита ---
function getBusinessPurchaseBenefitClient(type, level) {
    // Выгода = доход одной единицы на текущем уровне
    const income = getBusinessIncomeClient(type, level);
    return { 
        value: income, 
        text: `💰 +${income.toFixed(2)}/час`
    };
}

// --- НОВАЯ ФУНКЦИЯ: Расчет выгоды от улучшения (общей) ---
function getBusinessUpgradeBenefitClient(type, currentLevel, count) {
    const nextLevel = currentLevel + 1;
    const currentIncome = getBusinessIncomeClient(type, currentLevel);
    const nextIncome = getBusinessIncomeClient(type, nextLevel);

    const benefitPerUnit = nextIncome - currentIncome;
    const totalBenefit = benefitPerUnit * count;

    if (totalBenefit > 0.005) {
        return { 
            value: totalBenefit, 
            text: `💰 +${totalBenefit.toFixed(2)}/час (общий)` 
        };
    }
    return { value: 0, text: 'Нет прироста' };
}
// -------------------------------------------------------------

// ... (existing helper functions)

// НОВАЯ ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ: Расчет кумулятивного требования к рабочим для покупки
function getWorkersRequiredForUnitPurchaseClient(type, maxLevel) {
    let totalWorkers = 0;
    // Ограничиваем уровень 5
    const finalLevel = Math.min(5, maxLevel); 
    
    for (let level = 1; level <= finalLevel; level++) {
        // Рабочий для L=l требуется: Type + l - 1
        totalWorkers += type + level - 1;
    }
    return totalWorkers;
}




async function buyBusiness(type) {
    console.log(`💼 Покупка бизнеса типа: ${type}`);
    
    try {
        const response = await fetch('business.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `action=buy_business&type=${type}`
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
        
        console.log('💼 Результат покупки:', data);
        
        if (data.success) {
console.log('✅ Бизнес успешно куплен');
            playSound('success');
            showNotification('success', 'Бизнес куплен!', 'Новый бизнес начал приносить доход');
            await loadGameData();
            await loadBusinesses();
            
            // Проверка обучения
            if (typeof checkTutorial === 'function') { // Вызываем checkTutorial
                 setTimeout(() => checkTutorial(), 500);
            }
        } else {
            playSound('error');
            showNotification('error', 'Ошибка', data.error || 'Ошибка покупки');
        }
    } catch (error) {
        console.error('❌ Ошибка покупки бизнеса:', error);
        playSound('error');
        showNotification('error', 'Ошибка подключения', 'Не удалось купить бизнес');
    }
}

async function upgradeBusiness(type) {
    console.log(`⬆️ Улучшение бизнеса типа: ${type}`);
    
    try {
        const response = await fetch('business.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `action=upgrade_business&type=${type}`
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
        
        console.log('⬆️ Результат улучшения:', data);
        
        if (data.success) {
            console.log('✅ Бизнес успешно улучшен');
            playSound('success');
            showNotification('success', 'Улучшение завершено!', 'Доходность бизнеса увеличена');
            await loadGameData();
            await loadBusinesses();
        } else {
            playSound('error');
            showNotification('error', 'Ошибка', data.error || 'Ошибка улучшения');
        }
    } catch (error) {
        console.error('❌ Ошибка улучшения бизнеса:', error);
        playSound('error');
        showNotification('error', 'Ошибка подключения', 'Не удалось улучшить бизнес');
    }
}

async function hireWorkersForBusiness(businessId, count) {
    console.log(`👷 Наем ${count} рабочих для бизнеса ID: ${businessId}`);
    
    try {
        const response = await fetch('business.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `action=hire_workers&business_id=${businessId}&count=${count}`
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
        
        console.log('👷 Результат найма:', data);
        
        if (data.success) {
console.log('✅ Рабочие успешно наняты');
            playSound('success');
            showNotification('success', 'Рабочие наняты!', `Назначено ${count} жителей`);
            await loadGameData();
            await loadBusinesses(); // Reload the business list
            
            // --- ИНТЕГРАЦИЯ ОБУЧЕНИЯ ---
             if (typeof checkTutorial === 'function') { // Вызываем checkTutorial
                setTimeout(() => checkTutorial(), 500);
            }
        } else {
            playSound('error');
            showNotification('error', 'Ошибка', data.error || 'Ошибка найма рабочих');
        }
    } catch (error) {
        console.error('❌ Ошибка найма рабочих:', error);
        playSound('error');
        showNotification('error', 'Ошибка подключения', 'Не удалось нанять рабочих');
    }
}

// --- ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ДЛЯ СТОИМОСТИ ---
const BUSINESS_COSTS_DATA = {
    1: [1, 2, 3, 4, 5],
    2: [10, 20, 40, 80, 100],
    3: [100, 200, 400, 800, 1000],
    4: [1000, 2000, 4000, 8000, 10000]
};

// (ORIGINAL) getBusinessCostClient: Возвращает стоимость одного шага (покупки L1 или апгрейда L(N)->L(N+1))
function getBusinessCostClient(type, level) {
    return BUSINESS_COSTS_DATA[type][level - 1] || 999999;
}

// НОВАЯ ФУНКЦИЯ: Расчет кумулятивной стоимости покупки до текущего уровня (включает L1)
// ПРИМЕНЯЕТСЯ ЭКСПОНЕНЦИАЛЬНЫЙ МНОЖИТЕЛЬ
function getBusinessCumulativeCostClient(type, maxLevel, count) {
    if (maxLevel < 1) return 0;
    
    let baseCost = 0;
    // 1. Base Cost (сумма всех уровней до maxLevel)
    for (let level = 1; level <= maxLevel; level++) {
        baseCost += getBusinessCostClient(type, level); 
    }
    
    // 2. Экспоненциальный множитель: 2^count
    const multiplier = Math.pow(2, count);

    // 3. [MODIFIED] Применение скидки Союза
    const allianceBonuses = gameData?.alliance_bonuses || {};
    const costMultiplier = allianceBonuses.cost_discount || 1.0;
    
    // [MODIFIED] Apply both multipliers
    return parseFloat((baseCost * multiplier * costMultiplier).toFixed(2));
}
// --- КОНЕЦ ВСПОМОГАТЕЛЬНЫХ ФУНКЦИЙ ДЛЯ СТОИМОСТИ ---

function getBusinessIncomeClient(type, level) {
    const incomes = {
        1: [1, 2, 3, 4, 5],
        2: [2, 4, 6, 8, 10],
        3: [4, 8, 16, 32, 64],
        4: [8, 16, 32, 64, 128]
    };
    
    return incomes[type][level - 1] || 0;
}

// Новая вспомогательная функция: требуется для покупки (L1)
function getWorkersRequiredPerUnitClient(type, level) {
    // Требование для L1 равно типу бизнеса
    return type;
}

// Новая вспомогательная функция: требуется для улучшения (+N рабочих)
function getAdditionalWorkersForUpgradeUnitClient(type, currentLevel) {
    // $nextLevel = $currentLevel + 1
    const nextLevel = currentLevel + 1;
    // Дополнительное требование = (Тип + Следующий Уровень - 1)
    return type + nextLevel - 1; 
}
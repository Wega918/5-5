// Система построек
console.log('🏗️ Модуль построек загружен');

const MAX_BUILDING_COUNT = 100;

async function loadBuildings() {
	console.log('🔄 Загрузка построек...');
	
	try {
		const response = await fetch('buildings.php', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			},
			body: 'action=get_buildings'
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
		
		console.log('🏗️ Данные построек получены:', data);
		
		displayBuildings(data.buildings || []);
	} catch (error) {
		console.error('❌ Ошибка загрузки построек:', error);
		document.getElementById('modalContent').innerHTML = '<div class="text-center text-mars-red">Ошибка загрузки</div>';
	}
}

function getBuildingPurchaseCostClient(type, maxLevel, count) {
	let totalCost = { money: 0, materials: 0, rubies: 0 };
	if (maxLevel < 1) return totalCost;

	// 1. Расчет базовой кумулятивной стоимости (Сумма стоимостей Ур. 1 до $maxLevel)
	for (let level = 1; level <= maxLevel; level++) {
		const stepCost = getBuildingCostClient(type, level);
		for (let resource in stepCost) {
			totalCost[resource] = (totalCost[resource] || 0) + (stepCost[resource] || 0);
		}
	}
	
	// 2. Применение множителя за количество (2^count)
	const multiplier = Math.pow(2, count);
    
    // [MODIFIED] Применение скидки Союза
    const allianceBonuses = gameData?.alliance_bonuses || {};
    const costMultiplier = allianceBonuses.cost_discount || 1.0;

	let finalCost = {};
	for (let resource in totalCost) {
		// Округление до двух знаков после запятой
		finalCost[resource] = parseFloat((totalCost[resource] * multiplier * costMultiplier).toFixed(2));
	}
	
	// Очищаем нулевые значения для корректного отображения
	for (let resource in finalCost) {
		if (finalCost[resource] === 0 && resource !== 'money') {
			delete finalCost[resource];
		}
	}

	return finalCost;
}

// НОВАЯ ФУНКЦИЯ: Расчет выгоды от покупки нового юнита (если уже куплено)
function getPurchaseBenefitClient(type, level) {
	// Выгода = Производительность/Емкость ОДНОГО юнита на текущем уровне
	const benefit = getBuildingIncomeClient(type, level);
	const emojiMap = { 2: '💧', 3: '🍞', 4: '⚡', 5: '🏠', 6: '🌬️' };
	
	if (type === 1) { // Шахта
		const parts = [];
		if (benefit.materials > 0.005) parts.push(`🪨 +${benefit.materials.toFixed(2)}/час`);
		if (benefit.rubies > 0.00005) parts.push(`💎 +${benefit.rubies.toFixed(4)}/час`);
		return { text: parts.join(' | ') };
	} else if (type === 5) { // Жилой комплекс (Capacity)
		return { text: `${emojiMap[type]} +${benefit} мест жилья` };
	} else { // Вода, Еда, Генератор, Кислород (Production)
		return { text: `${emojiMap[type]} +${benefit.toFixed(2)}/час` };
	}
}


// ФУНКЦИЯ: Расчет прироста/емкости для следующего уровня (выгода от улучшения)
function getUpgradeBenefitClient(type, currentLevel, buildingCount) {
	if (currentLevel >= 5) return { value: 0, text: 'Макс. уровень' };
	
	const nextLevel = currentLevel + 1;
	const currentIncome = getBuildingIncomeClient(type, currentLevel);
	const nextIncome = getBuildingIncomeClient(type, nextLevel);
	
	let parts = [];
	
	if (type === 5) {
		// Жилой комплекс
		const currentCapacity = currentIncome; // income = capacity for type 5
		const nextCapacity = nextIncome;
		const benefitPerUnit = nextCapacity - currentCapacity; 
		
		// !!! ПРАВИЛЬНЫЙ РАСЧЕТ: Умножаем выгоду на количество построек !!!
		const totalBenefit = benefitPerUnit * buildingCount; 
		
		return { 
			value: totalBenefit, 
			text: `+${totalBenefit} мест жилья (общее)`,
			current: `${currentCapacity} мест`
		};
	}
	
	// Прочие постройки (Производство)
	if (typeof currentIncome === 'object') { // Шахта
		for (const resource in currentIncome) {
			const diffPerUnit = nextIncome[resource] - currentIncome[resource];
			const totalDiff = diffPerUnit * buildingCount; // Умножаем на count
			
			if (totalDiff > 0.005) {
				let emoji = resource === 'materials' ? '🪨' : '💎';
				parts.push(`${emoji} +${totalDiff.toFixed(2)}/час`);
			}
		}
	} else { // Вода, Еда, Энергия, Кислород, Генератор
		const diffPerUnit = nextIncome - currentIncome;
		const totalDiff = diffPerUnit * buildingCount; // Умножаем на count
		const emojiMap = { 2: '💧', 3: '🍞', 4: '⚡', 6: '🌬️' };
		
		if (totalDiff > 0.005) {
			parts.push(`${emojiMap[type]} +${totalDiff.toFixed(2)}/час`);
		}
	}
	
	return { 
		text: parts.join(' | '),
		current: formatBuildingIncome(type, currentIncome)
	};
}

// НОВАЯ ФУНКЦИЯ: Расчет потребления энергии на клиенте
function getBuildingElectricityConsumptionClient(type, level) {
	const consumption = gameData?.consumption || {};
	// Fallback значения констант
	const CONS_ELEC_BASE = consumption.electricity_base || 0.67; 
	const CONS_ELEC_MINE = consumption.electricity_mine || 1.0; 
	
	const baseConsumptions = {
		1: CONS_ELEC_MINE, // Шахта
		2: CONS_ELEC_BASE, // Очиститель
		3: CONS_ELEC_BASE, // Ферма
		4: 0, // Генератор
		5: 0, // Жилой комплекс
		6: CONS_ELEC_BASE // Генератор кислорода
	};

	const base = baseConsumptions[type] || CONS_ELEC_BASE;

	// Потребление масштабируется линейно с уровнем: Base * Level
	let finalConsumption = base * level;
    
    // [NEW] Применение бонуса Союза
    const allianceBonuses = gameData?.alliance_bonuses || {};
    const elecConsumpMultiplier = allianceBonuses.electricity_consumption_multiplier || 1.0;
    
    finalConsumption *= elecConsumpMultiplier;

	return parseFloat(finalConsumption.toFixed(2));
}
function displayBuildings(buildings) {
	// Получение констант потребления электричества
	const consumption = gameData?.consumption || {};
    
    // [NEW] Получение бонуса для вывода
    const allianceBonuses = gameData?.alliance_bonuses || {};
    const costDiscount = allianceBonuses.cost_discount ? ((1 - allianceBonuses.cost_discount) * 100).toFixed(0) : 0;
	
	// Удалены хардкоженные константы из объекта buildingTypes
	const buildingTypes = {
		1: { name: '⛏️ Шахта', description: 'Добывает материалы и рубины' },
		2: { name: '💧 Очиститель воды', description: 'Производит воду' },
		3: { name: '🌾 Ферма', description: 'Производит еду' },
		4: { name: '⚡ Генератор энергии', description: 'Производит электричество' },
		5: { name: '🏠 Жилой комплекс', description: 'Увеличивает лимит жителей' },
		6: { name: '🌬️ Генератор кислорода', description: 'Производит кислород' }
	};
	
	let content = '<div class="space-y-4">';
    
    if (costDiscount > 0) {
         content += `<div class="resource-card p-3 rounded-xl mb-3 text-center text-neon-green font-bold">
                        🤝 Бонус Союза: Скидка на постройки -${costDiscount}%!
                      </div>`;
    }
	
	for (let type = 1; type <= 6; type++) {
		const building = buildings.find(b => b.building_type == type) || { count: 0, level: 1 };
		const typeInfo = buildingTypes[type];
		
		// Определяем максимальный достигнутый уровень и текущее количество для расчета цены
		const maxLevel = building.count > 0 ? building.level : 1;
		const currentCount = building.count;
		
		// --- ПРОВЕРКА ЛИМИТА ---
		const isCountMaxed = building.count >= MAX_BUILDING_COUNT;
		// ------------------------

		// Стоимость покупки = Кумулятивная стоимость до maxLevel * Множитель за количество (2^count)
		const purchaseCost = getBuildingPurchaseCostClient(type, maxLevel, currentCount);
		
// Стоимость улучшения берется для следующего уровня и умножается на количество
		const upgradeCostBase = getBuildingCostClient(type, building.level + 1);
		const UPGRADE_COST_MULTIPLIER = 2.0; // NEW MULTIPLIER
		const upgradeCost = {};
        
        // [MODIFIED] Применение скидки к цене улучшения (обязательно)
        const costMultiplier = allianceBonuses.cost_discount || 1.0;
        
		for (let resource in upgradeCostBase) {
			upgradeCost[resource] = parseFloat((upgradeCostBase[resource] * building.count * UPGRADE_COST_MULTIPLIER * costMultiplier).toFixed(2));
		}
		
		const income = getBuildingIncomeClient(type, building.level);
		
		// Расчет выгоды от следующего улучшения
		const upgradeBenefit = getUpgradeBenefitClient(type, building.level, building.count);
		
		// Расчет выгоды от покупки (если уже куплено)
		let purchaseBenefitText = '';
		if (currentCount > 0) {
			const purchaseBenefit = getPurchaseBenefitClient(type, maxLevel);
			purchaseBenefitText = `<div class="text-neon-blue mt-1">Выгода: ${purchaseBenefit.text}</div>`;
		}
		
		// --- НОВЫЕ РАСЧЕТЫ ДЛЯ ОТОБРАЖЕНИЯ ---
		const consumptionPerUnit = getBuildingElectricityConsumptionClient(type, building.level);
		const totalConsumption = building.count * consumptionPerUnit;
		const formattedIncome = formatBuildingIncome(type, income, building.count);
		const isConsuming = consumptionPerUnit > 0;

		// --- ОБНОВЛЕННЫЙ HTML ШАБЛОН ---
		content += `
			<div class="resource-card p-4 rounded-xl space-y-3">
				
				<div class="flex justify-between items-start">
					<div>
						<h3 class="font-bold text-neon-green">${typeInfo.name}</h3>
						<p class="text-xs text-gray-400">${typeInfo.description}</p>
						<div class="text-sm text-neon-blue mt-1">
							Уровень: ${building.level} | Количество: ${building.count}
						</div>
					</div>
					<div class="text-right">
						${isCountMaxed ? `
							<div class="text-xs font-bold text-mars-red">Лимит: ${MAX_BUILDING_COUNT}</div>
						` : ''}
					</div>
				</div>
				
				<div class="p-3 bg-gray-800/50 rounded-lg space-y-2">
					
					${isConsuming ? `
						<div class="flex justify-between items-center text-sm border-b border-gray-700/50 pb-2">
							<span class="text-yellow-400">⚡ Потребление (общее):</span>
							<span class="font-bold">${totalConsumption.toFixed(2)}/час</span>
						</div>
						 <div class="flex justify-end text-xs text-gray-400">
							<span class="italic"> (1 шт.): ${consumptionPerUnit.toFixed(2)}/час</span>
						</div>
					` : `<div class="text-sm text-gray-500">⚡ Потребление: Нет</div>`}
					
					<div class="flex justify-between items-center text-sm ${isConsuming ? 'border-t border-gray-700/50 pt-2' : ''}">
						<span class="text-neon-purple">${type === 5 ? 'Общая емкость:' : 'Общая производительность:'}</span>
						<span class="font-bold text-green-400">${formattedIncome.total}</span>
					</div>
					
					 <div class="flex justify-end text-xs text-gray-400">
						<span class="italic"> (1 шт.): ${formattedIncome.perUnit}</span>
					</div>
				</div>
				
				
				<div class="grid grid-cols-2 gap-3 text-xs pt-2 border-t border-gray-700/50">
					
					<div>
						<div class="text-gray-400 font-semibold mb-1">Построить (№${currentCount + 1}, Ур.${maxLevel}):</div>
						<div class="text-yellow-400 text-sm">${formatBuildingCost(purchaseCost)}</div>
						${purchaseBenefitText}
					</div>
					
					${building.count > 0 && building.level < 5 ? `
					<div>
						<div class="text-gray-400 font-semibold mb-1">Улучшить (${building.count} шт.):</div>
						<div class="text-orange-400 text-sm">${formatBuildingCost(upgradeCost)}</div>
						<div class="text-neon-blue mt-1">Выгода: ${upgradeBenefit.text}</div> 
					</div>
					` : `
					<div>
						<div class="text-gray-400 font-semibold mb-1">Улучшение:</div>
						<div class="text-gray-500 mt-1">Макс. уровень достигнут (Ур.5)</div>
					</div>
					`}
				</div>
				
				<div class="flex gap-2 pt-2 border-t border-gray-700/50">
					<button onclick="buyBuilding(${type})" 
							class="flex-1 py-2 px-3 bg-gradient-to-r from-neon-blue to-neon-purple rounded-lg text-sm font-bold hover:scale-105 transition-transform ${isCountMaxed ? 'opacity-50 pointer-events-none' : ''}">
						Построить
					</button>
					${building.count > 0 && building.level < 5 ? `
					<button onclick="upgradeBuilding(${type})" 
							class="flex-1 py-2 px-3 bg-gradient-to-r from-neon-green to-neon-blue rounded-lg text-sm font-bold hover:scale-105 transition-transform">
						Улучшить
					</button>
					` : ''}
				</div>
			</div>
		`;
	}
	
	content += '</div>';
	document.getElementById('modalContent').innerHTML = content;
}

























async function buyBuilding(type) {
	console.log(`🏗️ Покупка постройки типа: ${type}`);
	
	try {
		const response = await fetch('buildings.php', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			},
			body: `action=buy_building&type=${type}`
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
		
		console.log('🏗️ Результат покупки:', data);
		
		if (data.success) {
			console.log('✅ Постройка успешно куплена');
			playSound('success');
			showNotification('success', 'Постройка куплена!', 'Новая постройка была успешно возведена');
			await loadGameData();
			await loadBuildings();
			
			// Проверка обучения
			setTimeout(() => checkTutorial(), 500);
		} else {
			playSound('error');
			showNotification('error', 'Ошибка', data.error || 'Ошибка покупки');
		}
	} catch (error) {
		console.error('❌ Ошибка покупки постройки:', error);
		playSound('error');
		showNotification('error', 'Ошибка подключения', 'Не удалось купить постройку');
	}
}

async function upgradeBuilding(type) {
	console.log(`⬆️ Улучшение постройки типа: ${type}`);
	
	try {
		const response = await fetch('buildings.php', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			},
			body: `action=upgrade_building&type=${type}`
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
			console.log('✅ Постройка успешно улучшена');
			playSound('success');
			showNotification('success', 'Улучшение завершено!', 'Постройка была успешно улучшена');
			await loadGameData();
			await loadBuildings();
		} else {
			playSound('error');
			showNotification('error', 'Ошибка', data.error || 'Ошибка улучшения');
		}
	} catch (error) {
		console.error('❌ Ошибка улучшения постройки:', error);
		playSound('error');
		showNotification('error', 'Ошибка подключения', 'Не удалось улучшить постройку');
	}
}

function getBuildingCostClient(type, level) {
	const baseCosts = {
		1: { money: 50, materials: 10, rubies: 1 }, // Шахта
		2: { money: 30, materials: 5 }, // Очиститель
		3: { money: 40, materials: 8 }, // Ферма
		4: { money: 60, materials: 12 }, // Генератор
		5: { money: 80, materials: 15 }, // Жилой комплекс
		6: { money: 70, materials: 10 } // Генератор кислорода
	};
	
	const cost = { ...baseCosts[type] };
	for (let resource in cost) {
		cost[resource] *= level;
	}
	
	return cost;
}

// Новая функция, которая соответствует PHP-логике с масштабированием 1.5x
function getBuildingIncomeClient(type, level) {
	const scalingFactor = Math.pow(1.5, level - 1);
	
	switch (type) {
		case 1: // Шахта
			const base_materials = 2; 
			const base_rubies = 0.001;
			return {
				// ИСПРАВЛЕНО: Материалы округляем до 2 знаков
				materials: parseFloat((base_materials * scalingFactor).toFixed(2)), 
				// Рубины округляем до 4 знаков
				rubies: parseFloat((base_rubies * scalingFactor).toFixed(4)) 
			};
		case 2: // Очиститель воды
			const water_income = 3;
			return parseFloat((water_income * scalingFactor).toFixed(2));
		case 3: // Ферма
			const food_income = 2;
			return parseFloat((food_income * scalingFactor).toFixed(2));
		case 4: // Генератор
			const elec_income = 4;
			return parseFloat((elec_income * scalingFactor).toFixed(2));
		case 5: // Жилой комплекс (Capacity)
			const base_capacity = 5;
			// Use Math.ceil() to match PHP
			return Math.ceil(base_capacity * scalingFactor);
		case 6: // Генератор кислорода
			const oxygen_income = 3;
			return parseFloat((oxygen_income * scalingFactor).toFixed(2));
		default:
			return 0;
	}
}

function formatNumber_rubies(num) {
if (num >= 1000) {
		return (num / 1000).toFixed(2) + 'k';
	}
	return parseFloat(num).toFixed(4);
}

function formatBuildingCost(cost) {
	const parts = [];
	if (cost.money && cost.money > 0.005) parts.push(`💰 ${formatNumber(cost.money)}`);
	if (cost.materials && cost.materials > 0.005) parts.push(`🪨 ${formatNumber(cost.materials)}`);
	if (cost.rubies && cost.rubies > 0.005) parts.push(`💎 ${formatNumber_rubies(cost.rubies)}`);
	return parts.join(' | ');
}

// МОДИФИЦИРОВАННАЯ ФУНКЦИЯ ДЛЯ ВКЛЮЧЕНИЯ ОБЩЕЙ ПРОИЗВОДИТЕЛЬНОСТИ/ЕМКОСТИ
function formatBuildingIncome(type, income, count) {
	let parts = [];
	let totalParts = [];
	
	// Вспомогательная функция для форматирования ресурсов (2 знака или сокращение)
	const formatGeneralResource = (value) => {
		if (typeof formatNumber === 'function' && value >= 1000) {
			 return formatNumber(value);
		}
		// Для не-рубинов всегда 2 знака
		return parseFloat(value).toFixed(2);
	};
    
    // Вспомогательная функция для форматирования рубинов (4 знака или сокращение)
    const formatRubies = (value) => {
        if (typeof formatNumber === 'function' && value >= 1000) {
            return formatNumber(value);
        }
        // Для рубинов всегда 4 знака
        return parseFloat(value).toFixed(4);
    };


	switch (type) {
		case 1: // Шахта (Materials and Rubies)
			if (income.materials > 0) {
				// perUnit: Materials (2 decimals)
				parts.push(`🪨 ${income.materials.toFixed(2)}/час`);
				// Total: Materials (2 decimals or abbreviated)
				totalParts.push(`🪨 ${formatGeneralResource(income.materials * count)}/час`);
			}
			if (income.rubies > 0) {
				// perUnit: Rubies (4 decimals)
				parts.push(`💎 ${income.rubies.toFixed(4)}/час`); 
				// Total: Rubies (4 decimals or abbreviated)
				totalParts.push(`💎 ${formatRubies(income.rubies * count)}/час`);
			}
			return { perUnit: parts.join(' | '), total: totalParts.join(' | ') };

		case 5: // Жилой комплекс (Capacity)
			return { 
				perUnit: `${income} мест жилья`, 
				total: `${income * count} мест жилья`
			};

		case 2: // Очиститель воды
		case 3: // Ферма
		case 4: // Генератор
		case 6: // Генератор кислорода
			const emojiMap = { 2: '💧', 3: '🍞', 4: '⚡', 6: '🌬️' };
			const emoji = emojiMap[type];
			return { 
				perUnit: `${emoji} ${income.toFixed(2)}/час`, 
				// Total: 2 decimals or abbreviated
				total: `${emoji} ${formatGeneralResource(income * count)}/час`
			};
		default:
			return { perUnit: '', total: '' };
	}
}
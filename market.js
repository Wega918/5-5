// Система Межгалактической Биржи
console.log('📈 Модуль Биржи загружен');

const marketResources = [
    { name: 'water', label: 'Вода', icon: '💧', unit: 'ед.', type: 'resource' },
    { name: 'food', label: 'Еда', icon: '🍞', unit: 'ед.', type: 'resource' },
    { name: 'oxygen', label: 'Кислород', icon: '🌬️', unit: 'ед.', type: 'resource' },
    { name: 'electricity', label: 'Электричество', icon: '⚡', unit: 'ед.', type: 'resource' },
    { name: 'materials', label: 'Материалы', icon: '🪨', unit: 'ед.', type: 'resource' },
    { name: 'rubies', label: 'Рубины', icon: '💎', unit: 'ед.', type: 'ruby' }
];

async function loadMarket() {
    console.log('🔄 Загрузка данных Биржи...');
    
    document.getElementById('modalContent').innerHTML = `
        <div class="flex justify-center items-center h-48">
            <div class="text-neon-blue">Загрузка данных Биржи...</div>
        </div>
    `;
    
    try {
        const response = await fetch('market.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: 'action=get_market_data'
        });
        
        const data = await response.json();
        console.log('📈 Данные Биржи получены:', data);
        
        if (data.resources && data.rubies) {
            displayMarket(data);
        } else {
            document.getElementById('modalContent').innerHTML = '<div class="text-center text-mars-red">Ошибка загрузки данных биржи</div>';
        }
    } catch (error) {
        console.error('❌ Ошибка загрузки Биржи:', error);
        document.getElementById('modalContent').innerHTML = '<div class="text-center text-mars-red">Ошибка подключения</div>';
    }
}

function displayMarket(data) {
    const resourceData = data.resources;
    const rubyData = data.rubies;
    
    let content = `
        <div class="space-y-6">
            <div class="p-3 bg-gray-800/50 rounded-lg flex justify-between items-center">
                <div class="text-neon-green font-bold">💰 Ваш капитал:</div>
                <div class="text-yellow-400 text-lg">${formatNumber(gameData?.user?.money || 0)} монет</div>
            </div>

            <div class="flex border-b border-neon-blue/30">
                <button onclick="switchMarketTab(this, 'resourceTab')" class="tab-btn active bg-neon-blue/20 text-neon-blue font-bold px-4 py-2 transition-all">
                    💧 Биржа Ресурсов
                </button>
                <button onclick="switchMarketTab(this, 'rubyTab')" class="tab-btn text-gray-400 font-bold px-4 py-2 transition-all">
                    💎 Рубиновый Рынок
                </button>
            </div>

            <div id="resourceTab" class="tab-content">
                ${displayResourceExchange(resourceData)}
            </div>
            
            <div id="rubyTab" class="tab-content hidden">
                ${displayRubyExchange(rubyData)}
            </div>
            
            ${displayMarketHelp()}
        </div>
    `;
    
    // --- ИСПРАВЛЕНИЕ: Удаление лишних пробелов и &nbsp; ---
    content = content.replace(/[\n\r\t]/g, '').replace(/\s\s+/g, ' ').trim();
    content = content.replace(/&nbsp;/g, ''); 
    // ----------------------------------------------------
    
    document.getElementById('modalContent').innerHTML = content;
    
    // Добавляем стили для вкладок
    document.querySelectorAll('.tab-btn:not(.active)').forEach(btn => {
        btn.classList.remove('bg-neon-blue/20', 'text-neon-blue');
    });

    // Принудительно запускаем расчет для дефолтного значения '1' после рендера
    setTimeout(() => {
        marketResources.forEach(r => {
            updateTradeResult('sell', r.name);
            updateTradeResult('buy', r.name);
        });
    }, 100);
}

function switchMarketTab(element, tabId) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active', 'bg-neon-blue/20', 'text-neon-blue');
        btn.classList.add('text-gray-400');
    });
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.add('hidden');
    });
    
    element.classList.add('active', 'bg-neon-blue/20', 'text-neon-blue');
    element.classList.remove('text-gray-400');
    document.getElementById(tabId).classList.remove('hidden');
}


function displayResourceExchange(resourceData) {
    const rows = marketResources
        .filter(r => r.type === 'resource')
        .map(r => {
        const data = resourceData[r.name];
        const statusClass = data.status === 'КРИЗИС' ? 'text-mars-red font-bold' : 
                            data.status === 'ДЕФИЦИТ' ? 'text-orange-400' : 
                            data.status === 'ИЗБЫТОК' ? 'text-neon-green' : 'text-neon-blue';
        const buyArrow = data.status === 'КРИЗИС' ? '⬆️ (x2.0)' : data.status === 'ДЕФИЦИТ' ? '↗️ (x1.25)' : '— (x1.0)';
        const sellArrow = data.status === 'КРИЗИС' ? '⬇️ (x0.5)' : data.status === 'ДЕФИЦИТ' ? '↘️ (x0.75)' : data.status === 'НОРМА' ? '— (x0.9)' : '— (x0.8)';
        
        let timeText = '∞';
        if (data.time_in_hours < 1000) {
            const days = Math.floor(data.time_in_hours / 24);
            const hours = Math.round(data.time_in_hours % 24);
            if (days > 0) {
                timeText = `~${days} д.`;
            } else {
                 timeText = `~${hours} ч.`;
            }
        }
        
        return `
            <div class="resource-card p-4 rounded-xl">
                <div class="flex justify-between items-center mb-2">
                    <h4 class="font-bold text-lg">${r.icon} ${r.label}</h4>
                    <div class="text-xs text-gray-400">
                        Запас: <span class="${statusClass}">${data.status}</span>
                        (${timeText} ${data.flow_rate < 0 ? 'до исчерпания' : 'накопления'})
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-3 text-sm">
                    <div>
                        <div class="text-gray-400">💰 Цена продажи (1 ${r.unit}):</div>
                        <div class="text-neon-green font-bold text-base">${formatResource(data.sell_price, 2)} монет ${sellArrow}</div>
                        <div class="text-xs text-gray-400">Ваш запас: ${formatResource(data.user_amount, 2)} ${r.unit}</div>
                        
                        <div class="flex flex-col mt-2 gap-1">
                            <div class="flex mt-2 gap-2">
                                <input type="number" id="trade_sell_${r.name}_amount" value="1" min="0.01" step="0.01"
                                     data-rate="${data.sell_price}"
                                     oninput="updateTradeResult('sell', '${r.name}')"
                                    class="w-20 bg-gray-900/50 border border-gray-700 rounded-lg text-xs text-center">
                                <button onclick="confirmTrade('${r.name}', 'sell')"
                                    class="px-3 py-1 bg-gradient-to-r from-neon-green to-neon-blue rounded-lg text-xs font-bold hover:scale-105 transition-transform">
                                    ПРОДАТЬ
                                </button>
                            </div>
                            <div id="trade_sell_${r.name}_result" class="text-xs text-gray-400"></div>
                        </div>
                    </div>

                    <div>
                        <div class="text-gray-400">💰 Цена покупки (1 ${r.unit}):</div>
                        <div class="text-mars-red font-bold text-base">${formatResource(data.buy_price, 2)} монет ${buyArrow}</div>
                        <div class="text-xs text-gray-400">Поток: ${formatFlowRate(data.flow_rate)}/час</div>

                        <div class="flex flex-col mt-2 gap-1">
                            <div class="flex mt-2 gap-2">
                                <input type="number" id="trade_buy_${r.name}_amount" value="1" min="0.01" step="0.01"
                                     data-rate="${data.buy_price}"
                                     oninput="updateTradeResult('buy', '${r.name}')"
                                    class="w-20 bg-gray-900/50 border border-gray-700 rounded-lg text-xs text-center">
                                <button onclick="confirmTrade('${r.name}', 'buy')"
                                    class="px-3 py-1 bg-gradient-to-r from-neon-purple to-neon-pink rounded-lg text-xs font-bold hover:scale-105 transition-transform">
                                    КУПИТЬ
                                </button>
                            </div>
                            <div id="trade_buy_${r.name}_result" class="text-xs text-gray-400"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    return `<div class="space-y-4">${rows}</div>`;
}

function displayRubyExchange(rubyData) {
    return `
        <div class="space-y-4">
            <div class="p-4 rounded-xl border border-neon-blue/30 bg-gray-800/50">
                <h3 class="font-bold text-neon-green mb-3">💎 Ваш запас Рубинов: ${formatResource(rubyData.user_amount, 4)}</h3>
                <p class="text-sm text-gray-400 mb-4">
                    Рубины - это финансовый акселератор. Цена продажи высока и позволяет получить крупный капитал. Цена покупки экстремально высока.
                </p>

                <div class="grid grid-cols-2 gap-4">
                    <div class="p-3 bg-gray-900/50 rounded-lg">
                        <div class="text-gray-400 mb-1">ПРОДАТЬ 1💎:</div>
                        <div class="text-neon-green font-bold text-lg">${formatNumber(rubyData.sell_price)} монет</div>
                        <div class="text-xs text-gray-400">Выгодно: конвертация прогресса майнинга в капитал.</div>
                        <div class="flex flex-col mt-2 gap-1">
                            <div class="flex mt-2 gap-2">
                                <input type="number" id="trade_sell_rubies_amount" value="1" min="0.0001" step="0.0001"
                                     data-rate="${rubyData.sell_price}"
                                     oninput="updateTradeResult('sell', 'rubies')"
                                    class="w-20 bg-gray-800/50 border border-gray-700 rounded-lg text-xs text-center">
                                <button onclick="confirmRubyTrade('sell')"
                                    class="px-3 py-1 bg-gradient-to-r from-neon-green to-neon-blue rounded-lg text-xs font-bold hover:scale-105 transition-transform">
                                    ПРОДАТЬ
                                </button>
                            </div>
                            <div id="trade_sell_rubies_result" class="text-xs text-gray-400"></div>
                        </div>
                    </div>

                    <div class="p-3 bg-gray-900/50 rounded-lg">
                        <div class="text-gray-400 mb-1">КУПИТЬ 1💎:</div>
                        <div class="text-mars-red font-bold text-lg">${formatNumber(rubyData.buy_price)} монет</div>
                        <div class="text-xs text-gray-400">Только для экстренного финансирования или покупки Бустов.</div>
                        <div class="flex flex-col mt-2 gap-1">
                            <div class="flex mt-2 gap-2">
                                <input type="number" id="trade_buy_rubies_amount" value="1" min="1" step="1"
                                     data-rate="${rubyData.buy_price}"
                                     oninput="updateTradeResult('buy', 'rubies')"
                                    class="w-20 bg-gray-800/50 border border-gray-700 rounded-lg text-xs text-center">
                                <button onclick="confirmRubyTrade('buy')"
                                    class="px-3 py-1 bg-gradient-to-r from-neon-purple to-neon-pink rounded-lg text-xs font-bold hover:scale-105 transition-transform">
                                    КУПИТЬ
                                </button>
                            </div>
                            <div id="trade_buy_rubies_result" class="text-xs text-gray-400"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// --- НОВАЯ ФУНКЦИЯ: Справка по рынку ---
function displayMarketHelp() {
    return `
        <div class="resource-card p-4 rounded-xl border border-neon-blue/30 bg-gray-800/50 mt-4">
            <h3 class="font-bold text-neon-blue mb-2">💡 Справка по Бирже Ресурсов</h3>
            <div class="text-xs text-gray-300 space-y-2">
                <p>Курс продажи/покупки ресурсов зависит от запаса ресурса относительно вашего потребления (в игровых часах, где 1 час = 1 реальная минута). Это сделано для поощрения баланса:</p>
                
                <div class="grid grid-cols-2 gap-x-4 gap-y-1">
                    <div class="font-bold text-neon-green">НОРМА (10-50 ч.)</div>
                    <div class="text-gray-400">Покупка/Продажа по базовому курсу (минимальная комиссия).</div>
                    
                    <div class="font-bold text-orange-400">ДЕФИЦИТ (1-10 ч.)</div>
                    <div class="text-gray-400">Цена покупки <span class="text-mars-red">поднята на 25%</span> (x1.25). Цена продажи снижена.</div>
                    
                    <div class="font-bold text-mars-red">КРИЗИС (< 1 ч.)</div>
                    <div class="text-gray-400">Цена покупки <span class="text-mars-red">удвоена (x2.0)</span>. Цена продажи сильно снижена.</div>
                    
                    <div class="font-bold text-neon-green">ИЗБЫТОК (> 50 ч.)</div>
                    <div class="text-gray-400">Цена продажи <span class="text-neon-blue">снижена на 20%</span> (x0.8). Стимул к трате.</div>
                    
                    <div class="font-bold text-neon-blue">РУБИНЫ (💎)</div>
                    <div class="text-gray-400">Используются как финансовый акселератор. Их продажа приносит крупный капитал (~30k монет/шт), покупка — экстренно дорогая.</div>
                </div>
            </div>
        </div>
    `;
}

// --- НОВАЯ ФУНКЦИЯ: Live обновление результата ---
function updateTradeResult(type, resource) {
    const inputId = `trade_${type}_${resource}_amount`;
    const resultId = `trade_${type}_${resource}_result`;
    
    const input = document.getElementById(inputId);
    const resultSpan = document.getElementById(resultId);
    
    if (!input || !resultSpan) return;
    
    const amount = parseFloat(input.value) || 0;
    const rate = parseFloat(input.getAttribute('data-rate'));
    
    // Определяем тип ресурса для форматирования
    const isRuby = (resource === 'rubies');
    
    if (isNaN(rate)) {
        resultSpan.textContent = 'Ошибка цены';
        return;
    }
    
    const total = rate * amount;
    
    // Форматирование результата
    let formattedTotal;
    let colorClass = (type === 'sell') ? 'text-neon-green' : 'text-mars-red';
    
    if (isRuby) {
        formattedTotal = formatNumber(total);
    } else {
        formattedTotal = formatResource(total, 2);
    }
    
    // Обновление HTML
    resultSpan.className = colorClass;
    
    if (amount <= 0) {
        resultSpan.textContent = 'Введите сумму';
    } else if (type === 'sell') {
        resultSpan.textContent = `Получите: ${formattedTotal} монет`;
    } else {
        resultSpan.textContent = `Потратите: ${formattedTotal} монет`;
    }
}

// --- ФУНКЦИИ ТОРГОВЛИ (ИСПРАВЛЕНЫ ДЛЯ НЕНАВЯЗЧИВОГО ПОДТВЕРЖДЕНИЯ) ---

async function confirmTrade(resource, type) {
    const amountInput = document.getElementById(`trade_${type}_${resource}_amount`);
    const amount = parseFloat(amountInput.value) || 0;
    
    if (amount <= 0) {
        showNotification('warning', 'Ошибка', 'Введите сумму для обмена.');
        return;
    }
    
    // Получаем текущую стоимость
    const data = await getMarketDataInternal();
    const rate = data.resources[resource][`${type}_price`];
    const totalCost = formatResource(rate * amount, 2);
    
    // Выводим уведомление и сразу выполняем транзакцию (заменяет confirm)
    showNotification('info', 'Транзакция в обработке', `${type === 'buy' ? 'Покупка' : 'Продажа'} ${formatResource(amount, 2)} ${resource} за ${totalCost} монет.`);
    
    await executeTrade('trade_resource', { resource, type, amount });
}

async function confirmRubyTrade(type) {
    const amountInput = document.getElementById(`trade_${type}_rubies_amount`);
    const amount = parseFloat(amountInput.value) || 0;

    if (amount <= 0) {
        showNotification('warning', 'Ошибка', 'Введите сумму для обмена.');
        return;
    }
    
    // Получаем текущую стоимость
    const data = await getMarketDataInternal();
    const rate = data.rubies[`${type}_price`];
    const totalCost = formatNumber(rate * amount);
    
    // Выводим уведомление и сразу выполняем транзакцию (заменяет confirm)
    showNotification('info', 'Транзакция в обработке', `${type === 'buy' ? 'Покупка' : 'Продажа'} ${formatResource(amount, 4)} 💎 за ${totalCost} монет.`);

    await executeTrade('trade_ruby', { type, amount });
}

async function executeTrade(action, params) {
    console.log(`📈 Выполнение транзакции: ${action}`, params);
    
    const body = new URLSearchParams();
    body.append('action', action);
    for (const key in params) {
        body.append(key, params[key]);
    }
    
    try {
        const response = await fetch('market.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body
        });
        
        const data = await response.json();
        
        if (data.success) {
            playSound('success');
            showNotification('success', 'Транзакция успешна!', data.message || 'Обмен завершен');
            await loadGameData(); // Обновить ресурсы
            await loadMarket(); // Обновить интерфейс рынка
        } else {
            playSound('error');
            showNotification('error', 'Ошибка торговли', data.error || 'Произошла ошибка при обмене');
        }
    } catch (error) {
        console.error('❌ Ошибка транзакции:', error);
        playSound('error');
        showNotification('error', 'Ошибка подключения', 'Не удалось завершить транзакцию');
    }
}

// --- ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ---

function getMarketDataInternal() {
    return fetch('market.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'action=get_market_data'
    }).then(response => response.json());
}

function formatResource(value, precision = 2) {
    return parseFloat(value).toFixed(precision);
}

function formatFlowRate(flowValue) {
    const flow = parseFloat(flowValue || 0); 
    const isNegative = flow < 0;
    const formattedFlow = Math.abs(flow).toFixed(2);
    
    if (flow > 0.005) {
        return `+${formattedFlow}`;
    } else if (flow < -0.005) {
        return `-${formattedFlow}`;
    } else {
        return `±0.00`;
    }
}
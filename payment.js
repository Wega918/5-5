// Система магазина Рубинов
console.log('✨ Модуль магазина Рубинов загружен');

let shopData = {};

async function loadShop() {
    console.log('🔄 Загрузка магазина...');
    
    try {
        const response = await fetch('payment.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: 'action=get_shop_data'
        });
        
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const data = await response.json();
        shopData = data;
        
        // Переключение на вкладку магазина по умолчанию
        displayShop();
        
    } catch (error) {
        console.error('❌ Ошибка загрузки магазина:', error);
        document.getElementById('modalContent').innerHTML = '<div class="text-center text-mars-red">Ошибка загрузки магазина</div>';
    }
}

function displayShop() {
    let content = `
        <div class="space-y-4">
            
            <div class="p-3 bg-gray-800/50 rounded-lg flex justify-between items-center">
                <div class="text-neon-green font-bold">💎 Ваш баланс:</div>
                <div class="text-purple-400 text-lg">${formatResource(shopData.user_rubies, 4)} Рубинов</div>
            </div>

            <div class="flex border-b border-neon-blue/30">
                <button onclick="switchShopTab(this, 'packagesTab')" class="shop-tab-btn active bg-neon-blue/20 text-neon-blue font-bold px-4 py-2 transition-all">
                    💰 Купить Рубины
                </button>
                <button onclick="switchShopTab(this, 'paymentsTab')" class="shop-tab-btn text-gray-400 font-bold px-4 py-2 transition-all">
                    🧾 Мои платежи
                </button>
            </div>

            <div id="packagesTab" class="shop-tab-content">
                ${displayRubyPackages()}
                ${displayCustomInput()}
                ${displayPaymentInfo()}
            </div>
            
            <div id="paymentsTab" class="shop-tab-content hidden">
                 <div class="text-center text-neon-blue">Загрузка ваших платежей...</div>
            </div>
        </div>
    `;
    
    document.getElementById('modalContent').innerHTML = content;
    
    // Принудительная загрузка платежей
    document.getElementById('paymentsTab').onload = loadMyPayments();
    
    // Инициализация расчета для ручного ввода
    document.getElementById('customAmountRubies').addEventListener('input', calculateCustomRubyCost);
    document.getElementById('customCurrency').addEventListener('change', calculateCustomRubyCost);
    calculateCustomRubyCost();
}

function switchShopTab(element, tabId) {
    document.querySelectorAll('.shop-tab-btn').forEach(btn => {
        btn.classList.remove('active', 'bg-neon-blue/20', 'text-neon-blue');
        btn.classList.add('text-gray-400');
    });
    document.querySelectorAll('.shop-tab-content').forEach(content => {
        content.classList.add('hidden');
    });
    
    element.classList.add('active', 'bg-neon-blue/20', 'text-neon-blue');
    element.classList.remove('text-gray-400');
    document.getElementById(tabId).classList.remove('hidden');
    
    // Если переключились на платежи, загружаем их
    if (tabId === 'paymentsTab') {
        loadMyPayments();
    }
}

function displayRubyPackages() {
    const packages = shopData.packages;
    const rubPackages = packages.rub;
    const uahPackages = packages.uah;
    const baseRubPrice = shopData.rates.rub_price;
    const baseUahPrice = shopData.rates.uah_price;
    
    let rubContent = rubPackages.map(pkg => {
        const [amount, rubies, bonus] = pkg;
        return `
            <div class="p-3 rounded-lg bg-gray-800/50 border border-neon-blue/30 relative">
                <div class="font-bold text-neon-blue text-lg">💎 ${formatResource(rubies, 2)} Рубинов</div>
                ${bonus > 0 ? `<span class="absolute top-[-10px] right-[-10px] bg-neon-green text-black font-bold text-xs px-2 py-1 rounded-full">+${bonus}% БОНУС</span>` : ''}
                <div class="text-xs text-gray-400 mt-1">Стоимость: ${formatResource(amount / rubies * baseRubPrice, 2)} RUB/💎</div>
                <button onclick="confirmPurchasePackage(${amount}, 'RUB', ${rubies})"
                        class="w-full mt-2 py-2 bg-gradient-to-r from-neon-purple to-neon-pink rounded-lg font-bold hover:scale-105 transition-transform text-sm">
                    Купить за ${amount} RUB
                </button>
            </div>
        `;
    }).join('');
    
    let uahContent = uahPackages.map(pkg => {
        const [amount, rubies, bonus] = pkg;
        return `
            <div class="p-3 rounded-lg bg-gray-800/50 border border-neon-blue/30 relative">
                <div class="font-bold text-neon-blue text-lg">💎 ${formatResource(rubies, 2)} Рубинов</div>
                ${bonus > 0 ? `<span class="absolute top-[-10px] right-[-10px] bg-neon-green text-black font-bold text-xs px-2 py-1 rounded-full">+${bonus}% БОНУС</span>` : ''}
                <div class="text-xs text-gray-400 mt-1">Стоимость: ${formatResource(amount / rubies * baseUahPrice, 2)} UAH/💎</div>
                <button onclick="confirmPurchasePackage(${amount}, 'UAH', ${rubies})"
                        class="w-full mt-2 py-2 bg-gradient-to-r from-neon-purple to-neon-pink rounded-lg font-bold hover:scale-105 transition-transform text-sm">
                    Купить за ${amount} UAH
                </button>
            </div>
        `;
    }).join('');
    
    return `
        <div class="resource-card p-4 rounded-xl">
            <h3 class="font-bold text-neon-green mb-3">Базовая стоимость: 1 💎 = ${formatResource(baseRubPrice, 2)} RUB / ${formatResource(baseUahPrice, 2)} UAH</h3>
            <h3 class="font-bold text-neon-green mb-3">Пакеты Рубинов (RUB)</h3>
            <div class="grid grid-cols-2 gap-4">
                ${rubContent}
            </div>
            
            <h3 class="font-bold text-neon-green mt-6 mb-3">Пакеты Рубинов (UAH)</h3>
            <div class="grid grid-cols-2 gap-4">
                ${uahContent}
            </div>
        </div>
    `;
}

function displayCustomInput() {
    const rates = shopData.rates;
    return `
        <div class="resource-card p-4 rounded-xl">
            <h3 class="font-bold text-neon-blue mb-3">Ручной ввод</h3>
            <div class="space-y-3">
                <input type="number" id="customAmountRubies" min="0.1" step="0.1" value="10" required
                       class="w-full p-3 bg-gray-800/50 border border-neon-blue/30 rounded-lg focus:border-neon-blue focus:outline-none text-white"
                       placeholder="Количество Рубинов">
                
                <select id="customCurrency" 
                        class="w-full p-3 bg-gray-800/50 border border-neon-blue/30 rounded-lg focus:border-neon-blue focus:outline-none text-white">
                    <option value="RUB">RUB - Российский рубль</option>
                    <option value="UAH">UAH - Украинская гривна</option>
                </select>
                
                <div id="customCostOutput" class="text-center text-lg font-bold text-yellow-400">
                    Стоимость: 100.00 RUB
                </div>
                
                <button onclick="confirmCustomPurchase()"
                        class="w-full py-2 bg-gradient-to-r from-neon-green to-neon-blue rounded-lg font-bold hover:scale-105 transition-transform">
                    Создать платеж
                </button>
            </div>
            <div class="text-xs text-gray-400 mt-2 text-center">
                 1 💎 = ${formatResource(rates.rub_price, 2)} RUB / ${formatResource(rates.uah_price, 2)} UAH
            </div>
        </div>
    `;
}

function calculateCustomRubyCost() {
    const rubies = parseFloat(document.getElementById('customAmountRubies').value) || 0;
    const currency = document.getElementById('customCurrency').value;
    const output = document.getElementById('customCostOutput');
    const rates = shopData.rates;
    
    let cost = 0;
    
    if (currency === 'RUB') {
        cost = rubies * rates.rub_price;
        output.innerHTML = `Стоимость: <span class="text-yellow-400">${formatResource(cost, 2)} RUB</span>`;
    } else {
        cost = rubies * rates.uah_price;
        output.innerHTML = `Стоимость: <span class="text-yellow-400">${formatResource(cost, 2)} UAH</span>`;
    }
}


function displayPaymentInfo() {
    const info = shopData.payment_info;
    return `
        <div class="resource-card p-4 rounded-xl border border-mars-red/50">
            <h3 class="font-bold text-mars-red mb-3">⚠️ Инструкция по оплате (ВНИМАНИЕ: Мок-данные)</h3>
            <div class="text-sm text-gray-300 space-y-2">
                <p>1. Создайте платежное поручение выше.</p>
                <p>2. Переведите точную сумму с учетом валюты на следующие реквизиты:</p>
                <div class="ml-2 mt-2 p-2 bg-gray-900/50 rounded">
                    <div class="font-bold text-neon-blue">Банк: ${info.card_bank}</div>
                    <div class="text-yellow-400">Номер карты: ${info.card_number}</div>
                    <div class="text-neon-green">Получатель: ${info.card_holder}</div>
                </div>
                <p class="mt-2 text-mars-red font-bold">3. После перевода ваш платеж будет находиться в статусе "Оплачено" и администрация подтвердит его в течение 24 часов.</p>
            </div>
        </div>
    `;
}

// --- Обработка покупки (Модальное окно и статусы) ---

function showPaymentConfirmationModal(amount, currency, rubies) {
    const info = shopData.payment_info;
    
    let content = `
        <div class="space-y-4">
            <div class="resource-card p-4 rounded-xl border border-mars-red/50">
                <h3 class="font-bold text-mars-red mb-3">⚠️ Подтверждение платежа (Мок-данные)</h3>
                
                <p class="text-sm text-gray-300">
                    Для покупки <span class="text-purple-400 font-bold">${formatResource(rubies, 2)} 💎</span> необходимо перевести точную сумму:
                </p>
                <div class="text-2xl font-bold text-yellow-400 text-center my-3">
                    ${formatResource(amount, 2)} ${currency}
                </div>

                <div class="text-sm text-gray-300 space-y-2">
                    <p>Перевод осуществляется на следующие реквизиты:</p>
                    <div class="ml-2 mt-2 p-2 bg-gray-900/50 rounded">
                        <div class="font-bold text-neon-blue">Банк: ${info.card_bank}</div>
                        <div class="text-yellow-400">Номер карты: ${info.card_number}</div>
                        <div class="text-neon-green">Получатель: ${info.card_holder}</div>
                    </div>
                    <p class="mt-2 text-mars-red font-bold">После совершения перевода, нажмите "Подтверждаю оплату". Администрация проверит платеж и начислит рубины.</p>
                </div>
                
                <div class="flex gap-2 mt-4">
                    <button onclick="closeModal()" 
                            class="flex-1 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg font-bold transition-transform">
                        Отмена
                    </button>
                    <button onclick="confirmPaymentAndSetStatus(${rubies}, '${currency}', ${amount})"
                            class="flex-1 py-2 bg-gradient-to-r from-neon-green to-neon-blue rounded-lg font-bold hover:scale-105 transition-transform">
                        Подтверждаю оплату
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('modalTitle').textContent = '🧾 Создание платежа';
    document.getElementById('modalContent').innerHTML = content;
    document.getElementById('modalOverlay').classList.remove('hidden');
}


function confirmPurchasePackage(amount, currency, rubies) {
    showPaymentConfirmationModal(amount, currency, rubies);
}

function confirmCustomPurchase() {
    const rubies = parseFloat(document.getElementById('customAmountRubies').value) || 0;
    const currency = document.getElementById('customCurrency').value;
    
    if (rubies < 0.1) {
        showNotification('error', 'Ошибка', 'Введите минимум 0.1 Рубина.');
        return;
    }
    
    const rates = shopData.rates;
    let amount = 0;
    
    if (currency === 'RUB') {
        amount = rubies * rates.rub_price;
    } else {
        amount = rubies * rates.uah_price;
    }
    amount = parseFloat(amount.toFixed(2));
    
    showPaymentConfirmationModal(amount, currency, rubies);
}

// Executes payment creation (status 0) and sets status to 1 (Paid/Awaiting Admin)
async function confirmPaymentAndSetStatus(rubies, currency, amount) {
    // 1. Create payment entry in DB (status 0)
    const body = new URLSearchParams();
    body.append('action', 'create_payment');
    body.append('rubies', rubies);
    body.append('currency', currency);
    body.append('amount', amount);
    
    let data;
    try {
        const response = await fetch('payment.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body
        });
        data = await response.json();
    } catch (error) {
        showNotification('error', 'Ошибка', 'Не удалось создать платеж.');
        closeModal();
        return;
    }
    
    if (data.success && data.payment_id) {
        // 2. Immediately update status to 1 (Paid/Awaiting Admin) - This is the "confirm" action
        const updateBody = new URLSearchParams();
        updateBody.append('action', 'update_payment_status'); 
        updateBody.append('payment_id', data.payment_id);
        updateBody.append('status', 1);
        
        try {
            const updateResponse = await fetch('payment.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: updateBody
            });
            const updateData = await updateResponse.json();
            
            if (updateData.success) {
                 playSound('success');
                 showNotification('success', 'Платеж отправлен!', `ID ${data.payment_id}. Ожидайте подтверждения от администрации.`);
                 
                 closeModal();
                 await loadGameData();
                 loadShop();
            } else {
                showNotification('error', 'Ошибка', updateData.error || `Платеж создан, но статус не обновлен. ID: ${data.payment_id}`);
                closeModal();
            }
        } catch (e) {
            showNotification('error', 'Ошибка', 'Не удалось обновить статус платежа.');
            closeModal();
        }
    } else {
         showNotification('error', 'Ошибка', data.error || 'Ошибка создания платежа.');
         closeModal();
    }
}

// --- Мои платежи (Вкладка) ---

async function loadMyPayments() {
    try {
        const response = await fetch('payment.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: 'action=get_payments'
        });
        
        const data = await response.json();
        if (data.payments) {
            displayMyPayments(data.payments);
        }
    } catch (error) {
        console.error('❌ Ошибка загрузки платежей:', error);
    }
}

function displayMyPayments(payments) {
    const statusMap = {
        0: '🟡 Ожидает оплаты',
        1: '🟠 Оплачено (ожидает админа)',
        2: '🟢 Подтверждено',
        3: '❌ Отклонено'
    };
    
    let content = `
        <h3 class="font-bold text-neon-green mb-3">Мои платежи</h3>
        <div class="space-y-2">
            ${payments.length > 0 ? payments.map(p => {
                const statusText = statusMap[p.status] || '❓ Неизвестно';
                const statusClass = p.status == 2 ? 'border-neon-green/50' : p.status == 3 ? 'border-mars-red/50' : 'border-yellow-400/50';
                
                return `
                    <div class="p-3 rounded-lg bg-gray-800/50 border ${statusClass}">
                        <div class="flex justify-between items-center text-sm">
                            <span class="font-bold text-neon-blue">ID: ${p.id}</span>
                            <span class="text-xs text-gray-400">${new Date(p.created_at).toLocaleString()}</span>
                        </div>
                        <div class="text-xs mt-1">
                            <span class="text-purple-400">💎 ${formatResource(p.rubies_count, 2)}</span> за 
                            <span class="text-yellow-400">${formatResource(p.amount, 2)} ${p.currency}</span>
                        </div>
                        <div class="text-sm font-bold mt-1">${statusText}</div>
                        ${p.status == 0 ? `
                             <div class="text-xs text-gray-400 mt-1">Не забудьте перевести средства для подтверждения.</div>
                        ` : ''}
                    </div>
                `;
            }).join('') : `
                <div class="text-center text-gray-400 py-4">У вас нет созданных платежей.</div>
            `}
        </div>
    `;
    
    document.getElementById('paymentsTab').innerHTML = content;
}

// Вспомогательная функция (требуется для formatResource)
function formatResource(value, precision = 2) {
    return parseFloat(value).toFixed(precision);
}
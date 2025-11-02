// Система администрирования
console.log('👑 Модуль администрирования загружен');

async function deleteChatMessage(messageId) {
    console.log(`🗑️ Удаление сообщения чата: ${messageId}`);
    
    if (!confirm('Вы уверены, что хотите удалить это сообщение?')) {
        return;
    }
    
    try {
        const response = await fetch('admin.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `action=delete_chat_message&message_id=${messageId}`
        });
        
        const data = await response.json();
        console.log('🗑️ Результат удаления:', data);
        
        if (data.success) {
            console.log('✅ Сообщение удалено');
            // Обновляем чат
            setTimeout(() => loadChat(), 500);
        } else {
            alert(data.error || 'Ошибка удаления сообщения');
        }
    } catch (error) {
        console.error('❌ Ошибка удаления сообщения:', error);
        alert('Ошибка подключения');
    }
}

async function openMuteUser(userId) {
    console.log(`🔇 Открытие панели молчанки для пользователя: ${userId}`);
    
    const duration = prompt('Введите длительность молчанки в минутах (по умолчанию 60):');
    if (duration === null) return;
    
    const muteDuration = parseInt(duration) || 60;
    
    try {
        const response = await fetch('admin.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `action=mute_user&user_id=${userId}&duration=${muteDuration}`
        });
        
        const data = await response.json();
        console.log('🔇 Результат молчанки:', data);
        
        if (data.success) {
            console.log('✅ Пользователь заглушен');
            alert(`Пользователь заглушен до ${new Date(data.muted_until).toLocaleString('ru-RU')}`);
            closeModal();
        } else {
            alert(data.error || 'Ошибка установки молчанки');
        }
    } catch (error) {
        console.error('❌ Ошибка установки молчанки:', error);
        alert('Ошибка подключения');
    }
}

async function blockUser(userId) {
    console.log(`🚫 Блокировка пользователя: ${userId}`);
    
    const duration = prompt('Введите длительность блокировки в минутах (по умолчанию 1440 = 24 часа):');
    if (duration === null) return;
    
    const blockDuration = parseInt(duration) || 1440;
    
    if (!confirm(`Вы уверены, что хотите заблокировать пользователя на ${blockDuration} минут?`)) {
        return;
    }
    
    try {
        const response = await fetch('admin.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `action=block_user&user_id=${userId}&duration=${blockDuration}`
        });
        
        const data = await response.json();
        console.log('🚫 Результат блокировки:', data);
        
        if (data.success) {
            console.log('✅ Пользователь заблокирован');
            alert(`Пользователь заблокирован до ${new Date(data.blocked_until).toLocaleString('ru-RU')}`);
            closeModal();
        } else {
            alert(data.error || 'Ошибка блокировки пользователя');
        }
    } catch (error) {
        console.error('❌ Ошибка блокировки пользователя:', error);
        alert('Ошибка подключения');
    }
}

async function unblockUser(userId) {
    console.log(`✅ Разблокировка пользователя: ${userId}`);
    
    if (!confirm('Вы уверены, что хотите разблокировать пользователя?')) {
        return;
    }
    
    try {
        const response = await fetch('admin.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `action=unblock_user&user_id=${userId}`
        });
        
        const data = await response.json();
        console.log('✅ Результат разблокировки:', data);
        
        if (data.success) {
            console.log('✅ Пользователь разблокирован');
            alert('Пользователь успешно разблокирован');
            closeModal();
        } else {
            alert(data.error || 'Ошибка разблокировки пользователя');
        }
    } catch (error) {
        console.error('❌ Ошибка разблокировки пользователя:', error);
        alert('Ошибка подключения');
    }
}

async function openCreateNews() {
    console.log('📰 Открытие панели создания новостей');
    
    document.getElementById('modalTitle').textContent = '📰 Создать новость';
    document.getElementById('modalOverlay').classList.remove('hidden');
    
    let content = `
        <div class="space-y-4">
            <div class="resource-card p-4 rounded-xl">
                <h3 class="font-bold text-neon-green mb-3">Создание новости</h3>
                <form onsubmit="createNews(event)" class="space-y-4">
                    <input type="text" id="newsTitle" placeholder="Заголовок новости" maxlength="200" required
                           class="w-full p-3 bg-gray-800/50 border border-neon-blue/30 rounded-lg focus:border-neon-blue focus:outline-none">
                    
                    <textarea id="newsContent" placeholder="Содержание новости..." rows="6" required
                              class="w-full p-3 bg-gray-800/50 border border-neon-blue/30 rounded-lg focus:border-neon-blue focus:outline-none resize-none"></textarea>
                    
                    <label class="flex items-center space-x-2">
                        <input type="checkbox" id="isNotification" class="rounded">
                        <span class="text-sm text-gray-300">Отправить как уведомление всем игрокам</span>
                    </label>
                    
                    <button type="submit" 
                            class="w-full py-3 bg-gradient-to-r from-neon-green to-neon-blue rounded-lg font-bold hover:scale-105 transition-transform">
                        Создать новость
                    </button>
                </form>
            </div>
        </div>
    `;
    
    document.getElementById('modalContent').innerHTML = content;
}

async function createNews(event) {
    event.preventDefault();
    console.log('📰 Создание новости');
    
    const title = document.getElementById('newsTitle').value;
    const content = document.getElementById('newsContent').value;
    const isNotification = document.getElementById('isNotification').checked;
    
    try {
        const response = await fetch('admin.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `action=create_news&title=${encodeURIComponent(title)}&content=${encodeURIComponent(content)}&is_notification=${isNotification ? 1 : 0}`
        });
        
        const data = await response.json();
        console.log('📰 Результат создания:', data);
        
        if (data.success) {
            console.log('✅ Новость создана');
            alert('Новость успешно создана!');
            closeModal();
            // Обновляем новости
            setTimeout(() => {
                if (isNotification) {
                    checkNotifications();
                }
            }, 1000);
        } else {
            alert(data.error || 'Ошибка создания новости');
        }
    } catch (error) {
        console.error('❌ Ошибка создания новости:', error);
        alert('Ошибка подключения');
    }
}

async function openAdminEditProfile(userId) {
    console.log(`⚙️ Открытие панели редактирования ресурсов для пользователя: ${userId}`);
    
    // Сначала получаем профиль пользователя
    try {
        const response = await fetch('profile.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `action=get_profile&user_id=${userId}`
        });
        
        const profileData = await response.json();
        
        if (!profileData.user) {
            alert('Ошибка загрузки данных пользователя');
            return;
        }
        
        const user = profileData.user;
        
        document.getElementById('modalTitle').textContent = '⚙️ Редактировать ресурсы';
        
        let content = `
            <div class="space-y-4">
                <div class="resource-card p-4 rounded-xl">
                    <h3 class="font-bold text-neon-green mb-3">Редактирование: ${user.colony_name}</h3>
                    <form onsubmit="saveUserResources(event, ${userId})" class="space-y-3">
                        <div class="grid grid-cols-2 gap-3">
                            <div>
                                <label class="block text-xs text-gray-400 mb-1">💰 Монеты</label>
                                <input type="number" id="editMoney" value="${user.money}" min="0"
                                       class="w-full p-2 bg-gray-800/50 border border-neon-blue/30 rounded-lg focus:border-neon-blue focus:outline-none">
                            </div>
                            <div>
                                <label class="block text-xs text-gray-400 mb-1">💧 Вода</label>
                                <input type="number" id="editWater" value="${user.water}" min="0"
                                       class="w-full p-2 bg-gray-800/50 border border-neon-blue/30 rounded-lg focus:border-neon-blue focus:outline-none">
                            </div>
                            <div>
                                <label class="block text-xs text-gray-400 mb-1">🍞 Еда</label>
                                <input type="number" id="editFood" value="${user.food}" min="0"
                                       class="w-full p-2 bg-gray-800/50 border border-neon-blue/30 rounded-lg focus:border-neon-blue focus:outline-none">
                            </div>
                            <div>
                                <label class="block text-xs text-gray-400 mb-1">🌬️ Кислород</label>
                                <input type="number" id="editOxygen" value="${user.oxygen}" min="0"
                                       class="w-full p-2 bg-gray-800/50 border border-neon-blue/30 rounded-lg focus:border-neon-blue focus:outline-none">
                            </div>
                            <div>
                                <label class="block text-xs text-gray-400 mb-1">⚡ Электричество</label>
                                <input type="number" id="editElectricity" value="${user.electricity}" min="0"
                                       class="w-full p-2 bg-gray-800/50 border border-neon-blue/30 rounded-lg focus:border-neon-blue focus:outline-none">
                            </div>
                            <div>
                                <label class="block text-xs text-gray-400 mb-1">🪨 Материалы</label>
                                <input type="number" id="editMaterials" value="${user.materials}" min="0"
                                       class="w-full p-2 bg-gray-800/50 border border-neon-blue/30 rounded-lg focus:border-neon-blue focus:outline-none">
                            </div>
                            <div>
                                <label class="block text-xs text-gray-400 mb-1">💎 Рубины</label>
                                <input type="number" id="editRubies" value="${user.rubies}" min="0"
                                       class="w-full p-2 bg-gray-800/50 border border-neon-blue/30 rounded-lg focus:border-neon-blue focus:outline-none">
                            </div>
                            <div>
                                <label class="block text-xs text-gray-400 mb-1">👷 Ожидают</label>
                                <input type="number" id="editResidentsWaiting" value="${user.residents_waiting}" min="0"
                                       class="w-full p-2 bg-gray-800/50 border border-neon-blue/30 rounded-lg focus:border-neon-blue focus:outline-none">
                            </div>
                            <div>
                                <label class="block text-xs text-gray-400 mb-1">🏠 Заселены</label>
                                <input type="number" id="editResidentsSettled" value="${user.residents_settled}" min="0"
                                       class="w-full p-2 bg-gray-800/50 border border-neon-blue/30 rounded-lg focus:border-neon-blue focus:outline-none">
                            </div>
                            <div>
                                <label class="block text-xs text-gray-400 mb-1">💼 Работают</label>
                                <input type="number" id="editResidentsWorking" value="${user.residents_working}" min="0"
                                       class="w-full p-2 bg-gray-800/50 border border-neon-blue/30 rounded-lg focus:border-neon-blue focus:outline-none">
                            </div>
                        </div>
                        
                        <button type="submit" 
                                class="w-full py-3 bg-gradient-to-r from-mars-red to-red-600 rounded-lg font-bold hover:scale-105 transition-transform">
                            Сохранить изменения
                        </button>
                    </form>
                </div>
            </div>
        `;
        
        document.getElementById('modalContent').innerHTML = content;
        
    } catch (error) {
        console.error('❌ Ошибка загрузки профиля:', error);
        alert('Ошибка загрузки данных пользователя');
    }
}

async function saveUserResources(event, userId) {
    event.preventDefault();
    console.log(`💾 Сохранение ресурсов пользователя: ${userId}`);
    
    const resources = {
        money: document.getElementById('editMoney').value,
        water: document.getElementById('editWater').value,
        food: document.getElementById('editFood').value,
        oxygen: document.getElementById('editOxygen').value,
        electricity: document.getElementById('editElectricity').value,
        materials: document.getElementById('editMaterials').value,
        rubies: document.getElementById('editRubies').value,
        residents_waiting: document.getElementById('editResidentsWaiting').value,
        residents_settled: document.getElementById('editResidentsSettled').value,
        residents_working: document.getElementById('editResidentsWorking').value
    };
    
    try {
        const formData = new URLSearchParams();
        formData.append('action', 'edit_user_resources');
        formData.append('user_id', userId);
        
        for (const [key, value] of Object.entries(resources)) {
            formData.append(`resources[${key}]`, value);
        }
        
        const response = await fetch('admin.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData
        });
        
        const data = await response.json();
        console.log('💾 Результат сохранения:', data);
        
        if (data.success) {
            console.log('✅ Ресурсы обновлены');
            alert('Ресурсы успешно обновлены!');
            closeModal();
        } else {
            alert(data.error || 'Ошибка обновления ресурсов');
        }
    } catch (error) {
        console.error('❌ Ошибка обновления ресурсов:', error);
        alert('Ошибка подключения');
    }
}

// --- НОВЫЙ РАЗДЕЛ: АДМИН ПАНЕЛЬ ---

async function loadAdminPanel() {
    const userRole = gameData?.user?.role;
    if (userRole !== 'admin' && userRole !== 'moderator') {
        document.getElementById('modalContent').innerHTML = '<div class="text-center text-mars-red">Недостаточно прав доступа.</div>';
        return;
    }
    
    document.getElementById('modalTitle').textContent = '👑 Панель администратора';
    
    displayAdminPanel(userRole);
}

function displayAdminPanel(userRole) {
    const isAdmin = userRole === 'admin';
    
    let content = `
        <div class="space-y-4">
            
            <div class="resource-card p-4 rounded-xl border border-neon-green/50">
                <h3 class="font-bold text-neon-green mb-3">🛠️ Общие инструменты</h3>
                <div class="space-y-2">
                    <button onclick="openSection('news'); setTimeout(() => openCreateNews(), 300);" 
                            class="w-full py-2 bg-gradient-to-r from-neon-purple to-neon-pink rounded-lg font-bold hover:scale-105 transition-transform">
                        📰 Создать новость / Уведомление
                    </button>
                    ${isAdmin ? `
                    <button onclick="loadAdminPayments()" 
                            class="w-full py-2 bg-gradient-to-r from-neon-blue to-neon-purple rounded-lg font-bold hover:scale-105 transition-transform">
                        🧾 Управление платежами
                    </button>
                    ` : ''}
                </div>
            </div>

            <div class="resource-card p-4 rounded-xl border border-mars-red/50">
                <h3 class="font-bold text-mars-red mb-3">🚨 Модерация</h3>
                <p class="text-xs text-gray-400 mb-3">Для этих действий используйте Профиль игрока.</p>
                <div class="grid grid-cols-2 gap-2">
                    <button onclick="alert('Откройте Профиль пользователя -> Управление -> Заглушить')" 
                            class="py-2 bg-orange-600/50 hover:bg-orange-700 rounded-lg text-sm transition-colors">
                        Заглушить (Чат)
                    </button>
                    <button onclick="${isAdmin ? 'alert(\'Откройте Профиль пользователя -> Управление -> Заблокировать\')' : 'alert(\'Недостаточно прав\')'}" 
                            class="py-2 bg-red-700/50 hover:bg-red-800 rounded-lg text-sm transition-colors ${!isAdmin ? 'opacity-50 cursor-not-allowed' : ''}">
                        ${isAdmin ? 'Заблокировать' : 'Блокировка (Admin)'}
                    </button>
                </div>
            </div>
            
            ${isAdmin ? `
            <div class="resource-card p-4 rounded-xl border border-yellow-400/50">
                <h3 class="font-bold text-yellow-400 mb-3">⚙️ Администрирование (Full Access)</h3>
                <p class="text-xs text-gray-400 mb-3">Действия с ресурсами доступны через Профиль игрока.</p>
                <div class="space-y-2">
                     <button onclick="alert('Функционал редактирования зданий в разработке')" 
                            class="w-full py-2 bg-yellow-600/50 hover:bg-yellow-700 rounded-lg text-sm transition-colors">
                        Редактировать Здания/Бизнесы
                    </button>
                </div>
            </div>
            ` : ''}

        </div>
    `;
    
    document.getElementById('modalContent').innerHTML = content;
}

async function loadAdminPayments() {
    const contentDiv = document.getElementById('modalContent');
    contentDiv.innerHTML = '<div class="text-center text-neon-blue">Загрузка платежей...</div>';
    
    try {
        const response = await fetch('admin.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: 'action=get_all_payments'
        });
        
        const data = await response.json();
        
        if (data.payments) {
            displayAdminPayments(data.payments);
        } else {
            contentDiv.innerHTML = `<div class="text-center text-mars-red">${data.error || 'Ошибка загрузки платежей'}</div>`;
        }
    } catch (error) {
        console.error('❌ Ошибка загрузки платежей админом:', error);
        contentDiv.innerHTML = '<div class="text-center text-mars-red">Ошибка подключения</div>';
    }
}

function displayAdminPayments(payments) {
    const statusMap = {
        0: { text: '🟡 Ожидает оплаты', color: 'text-yellow-400' },
        1: { text: '🟠 Оплачено (Проверка)', color: 'text-orange-400' },
        2: { text: '🟢 Подтверждено', color: 'text-neon-green' },
        3: { text: '❌ Отклонено', color: 'text-mars-red' }
    };
    
    let content = `
        <div class="space-y-4">
            <div class="resource-card p-4 rounded-xl">
                <h3 class="font-bold text-neon-green mb-3">🧾 Все платежи (${payments.length})</h3>
                <div class="space-y-3 max-h-96 overflow-y-auto">
                    ${payments.map(p => {
                        const statusInfo = statusMap[p.status] || statusMap[0];
                        const isActionable = p.status === '1' || p.status === 0; // Можно обработать, если 0 или 1
                        
                        return `
                            <div class="p-3 rounded-lg bg-gray-800/50 border border-neon-blue/30">
                                <div class="flex justify-between items-start text-sm mb-1">
                                    <span class="font-bold text-neon-blue">ID: ${p.id}</span>
                                    <span class="text-xs text-gray-400">${new Date(p.created_at).toLocaleString()}</span>
                                </div>
                                <div class="text-xs ${statusInfo.color} font-bold">${statusInfo.text}</div>
                                <div class="text-sm mt-1">
                                    Пользователь: <span class="text-neon-green">${p.colony_name} (@${p.username})</span>
                                </div>
                                <div class="text-sm mt-1">
                                    Сумма: <span class="text-purple-400">💎 ${formatResource(p.rubies_count, 2)}</span> за 
                                    <span class="text-yellow-400">${formatResource(p.amount, 2)} ${p.currency}</span>
                                </div>
                                
                                ${isActionable ? `
                                    <div class="flex gap-2 mt-3">
                                        <button onclick="processPayment(${p.id}, 2)"
                                                class="flex-1 py-1 bg-neon-green hover:bg-green-600 rounded text-xs font-bold transition-colors">
                                            Подтвердить (Начислить)
                                        </button>
                                        <button onclick="processPayment(${p.id}, 3)"
                                                class="flex-1 py-1 bg-mars-red hover:bg-red-600 rounded text-xs font-bold transition-colors">
                                            Отклонить
                                        </button>
                                    </div>
                                ` : ''}
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('modalContent').innerHTML = content;
}

async function processPayment(paymentId, status) {
    const actionText = status === 2 ? 'подтвердить и начислить' : 'отклонить';
    if (!confirm(`Вы уверены, что хотите ${actionText} платеж ID ${paymentId}?`)) {
        return;
    }
    
    try {
        const response = await fetch('admin.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `action=process_payment&payment_id=${paymentId}&status=${status}`
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('success', 'Успех', `Платеж ${paymentId} успешно обработан.`);
            await loadGameData();
            loadAdminPayments();
        } else {
            showNotification('error', 'Ошибка', data.error || 'Ошибка обработки платежа.');
        }
    } catch (error) {
        console.error('❌ Ошибка обработки платежа:', error);
        showNotification('error', 'Ошибка', 'Ошибка подключения к серверу.');
    }
}
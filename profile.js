// Система профилей игроков
console.log('👤 Модуль профилей загружен');

async function openProfile(userId) {
    console.log(`👤 Открытие профиля пользователя: ${userId}`);
    
    document.getElementById('modalTitle').textContent = '👤 Профиль игрока';
    document.getElementById('modalOverlay').classList.remove('hidden');
    
    await loadProfile(userId);
}

async function openProfile(userId) {
    console.log(`👤 Открытие профиля пользователя: ${userId}`);
    
    document.getElementById('modalTitle').textContent = '👤 Профиль игрока';
    document.getElementById('modalOverlay').classList.remove('hidden');
    
    await loadProfile(userId);
}

async function loadProfile(userId) {
    console.log('🔄 Загрузка профиля...');
    
    const contentDiv = document.getElementById('modalContent');
    contentDiv.innerHTML = '<div class="text-center text-neon-blue">Загрузка профиля...</div>';
    
    try {
        const response = await fetch('profile.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `action=get_profile&user_id=${userId}`
        });
        
        const data = await response.json();
        console.log('👤 Данные профиля получены:', data);
        
        if (data.user) {
            displayProfile(data);
        } else {
            contentDiv.innerHTML = `<div class="text-center text-mars-red">${data.error || 'Ошибка загрузки профиля'}</div>`;
        }
    } catch (error) {
        console.error('❌ Ошибка загрузки профиля:', error);
        contentDiv.innerHTML = '<div class="text-center text-mars-red">Ошибка загрузки</div>';
    }
}
function displayProfile(data) {
    const user = data.user;
    const businesses = data.businesses || [];
    const buildings = data.buildings || [];
    const alliance = data.alliance; // Contains {alliance_name: 'Name'} or null
    const isOwnProfile = data.can_edit;
    const canManage = gameData?.user?.role === 'admin';
    
    // NEW LOGIC FOR INVITATION BUTTON
    const viewerIsLeader = gameData?.user?.is_alliance_leader; 
    const viewerHasAlliance = gameData?.user?.alliance_id;
    const targetIsInAlliance = !!alliance; // Check if alliance data exists
    
    // Получение роли пользователя
    const roleInfo = getRoleInfo(user.role);
    
    // Расчет дней игры
    const daysPlayed = Math.floor((new Date() - new Date(user.created_at)) / (1000 * 60 * 60 * 24));
    
    let content = `
        <div class="space-y-4">
            <div class="resource-card p-4 rounded-xl">
                <div class="flex justify-between items-start mb-3">
                    <div>
                        <h3 class="font-bold text-neon-green text-lg">${user.colony_name}</h3>
                        <p class="text-sm text-gray-400">@${user.username}</p>
                        ${roleInfo ? `<div class="inline-block px-2 py-1 mt-1 rounded text-xs ${roleInfo.class}">${roleInfo.text}</div>` : ''}
                    </div>
                    <div class="text-right">
                        <div class="text-sm text-gray-400">Рейтинг</div>
                        <div class="text-2xl font-bold text-yellow-400">#${data.rating_position}</div>
                    </div>
                </div>
                
                <div class="text-sm text-gray-300 mb-3">
                    <div class="flex justify-between">
                        <span>Дней в игре:</span>
                        <span class="text-neon-blue">${daysPlayed}</span>
                    </div>
                    <div class="flex justify-between">
                        <span>Общая стоимость:</span>
                        <span class="text-yellow-400">${formatNumber(data.total_value)} очков</span>
                    </div>
                    ${alliance ? `
                    <div class="flex justify-between">
                        <span>Союз:</span>
                        <span class="text-neon-purple" onclick="loadAllianceProfile(${alliance.alliance_id})" style="cursor: pointer; text-decoration: underline;">${alliance.alliance_name}</span>
                    </div>
                    ` : '<div class="flex justify-between"><span>Союз:</span><span class="text-gray-500">Не состоит</span></div>'}
                </div>
                
                <div class="border-t border-gray-700 pt-3">
                    ${isOwnProfile ? `
                        <textarea id="profileDescription" placeholder="Расскажите о своем поселении..." maxlength="500"
                                  class="w-full p-2 bg-gray-800/50 border border-neon-blue/30 rounded-lg focus:border-neon-blue focus:outline-none text-sm resize-none"
                                  rows="3">${user.profile_description || ''}</textarea>
                        <div class="flex justify-between items-center mt-2">
                            <span class="text-xs text-gray-400" id="descLength">${(user.profile_description || '').length}/500</span>
                            <button onclick="updateProfile()" class="px-3 py-1 bg-neon-blue hover:bg-neon-blue/80 rounded text-xs transition-colors">
                                Сохранить
                            </button>
                        </div>
                    ` : `
                        <div class="text-sm text-gray-300">
                            ${user.profile_description || '<em>Колонист предпочитает молчать о своих достижениях...</em>'}
                        </div>
                    `}
                </div>
            </div>
            
            <div class="resource-card p-4 rounded-xl">
                <h3 class="font-bold text-neon-green mb-3">💎 Ресурсы поселения</h3>
                <div class="grid grid-cols-2 gap-3 text-sm">
                    <div class="flex justify-between">
                        <span class="text-yellow-400">💰 Монеты:</span>
                        <span>${formatNumber(user.money)}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-blue-400">💧 Вода:</span>
                        <span>${formatNumber(user.water)}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-yellow-600">🍞 Еда:</span>
                        <span>${formatNumber(user.food)}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-cyan-400">🌬️ Кислород:</span>
                        <span>${formatNumber(user.oxygen)}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-yellow-500">⚡ Энергия:</span>
                        <span>${formatNumber(user.electricity)}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-400">🪨 Материалы:</span>
                        <span>${formatNumber(user.materials)}</span>
                    </div>
                    ${user.rubies > 0 ? `
                    <div class="flex justify-between col-span-2">
                        <span class="text-purple-400">💎 Рубины:</span>
                        <span class="text-purple-300">${formatNumber(user.rubies)}</span>
                    </div>
                    ` : ''}
                </div>
            </div>
            
            <div class="resource-card p-4 rounded-xl">
                <h3 class="font-bold text-neon-green mb-3">👷 Население</h3>
                <div class="grid grid-cols-3 gap-4 text-center">
                    <div>
                        <div class="text-lg font-bold text-orange-400">${user.residents_waiting}</div>
                        <div class="text-xs text-gray-400">Ожидают</div>
                    </div>
                    <div>
                        <div class="text-lg font-bold text-green-400">${user.residents_settled}</div>
                        <div class="text-xs text-gray-400">Заселены</div>
                    </div>
                    <div>
                        <div class="text-lg font-bold text-blue-400">${user.residents_working}</div>
                        <div class="text-xs text-gray-400">Работают</div>
                    </div>
                </div>
            </div>
            
            <div class="resource-card p-4 rounded-xl">
                <h3 class="font-bold text-neon-green mb-3">🏗️ Постройки</h3>
                ${buildings.length > 0 ? `
                    <div class="space-y-2 text-sm">
                        ${buildings.map(building => {
                            const buildingName = getBuildingName(building.building_type);
                            return `
                                <div class="flex justify-between">
                                    <span class="text-gray-300">${buildingName}</span>
                                    <span class="text-neon-blue">Ур.${building.level} × ${building.count}</span>
                                </div>
                            `;
                        }).join('')}
                    </div>
                ` : '<div class="text-center text-gray-400">Постройки отсутствуют</div>'}
            </div>
            
            <div class="resource-card p-4 rounded-xl">
                <h3 class="font-bold text-neon-green mb-3">💼 Бизнесы</h3>
                ${businesses.length > 0 ? `
                    <div class="space-y-2 text-sm">
                        ${businesses.map(business => {
                            const businessName = getBusinessName(business.business_type);
                            return `
                                <div class="flex justify-between">
                                    <span class="text-gray-300">${businessName}</span>
                                    <span class="text-neon-purple">Ур.${business.level} × ${business.count}</span>
                                </div>
                            `;
                        }).join('')}
                    </div>
                ` : '<div class="text-center text-gray-400">Бизнесы отсутствуют</div>'}
            </div>
            
            ${!isOwnProfile ? `
                <div class="resource-card p-4 rounded-xl">
                    <h3 class="font-bold text-neon-green mb-3">✉️ Связь</h3>
                    <button onclick="openPrivateChat(${user.id})" 
                            class="w-full py-2 bg-gradient-to-r from-neon-blue to-neon-purple rounded-lg font-bold hover:scale-105 transition-transform">
                        Написать сообщение
                    </button>
                    
                    ${viewerHasAlliance && viewerIsLeader && !targetIsInAlliance ? `
                        <button onclick="sendAllianceInvitation(${user.id}, '${user.username}')" 
                                class="w-full py-2 mt-2 bg-gradient-to-r from-neon-green to-neon-blue rounded-lg font-bold hover:scale-105 transition-transform">
                            Пригласить в союз
                        </button>
                    ` : ''}
                </div>
            ` : ''}
            
            ${canManage ? `
                <div class="resource-card p-4 rounded-xl border border-mars-red/50">
                    <h3 class="font-bold text-mars-red mb-3">⚙️ Управление</h3>
                    <div class="space-y-2">
                        <button onclick="openAdminEditProfile(${user.id})" 
                                class="w-full py-2 bg-mars-red hover:bg-red-600 rounded-lg text-sm transition-colors">
                            Редактировать ресурсы
                        </button>
                        <button onclick="openMuteUser(${user.id})" 
                                class="w-full py-2 bg-orange-600 hover:bg-orange-700 rounded-lg text-sm transition-colors">
                            Заглушить пользователя
                        </button>
                        ${user.blocked_until && new Date(user.blocked_until) > new Date() ? `
                            <button onclick="unblockUser(${user.id})" 
                                    class="w-full py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm transition-colors">
                                Разблокировать
                            </button>
                        ` : `
                            <button onclick="blockUser(${user.id})" 
                                    class="w-full py-2 bg-red-700 hover:bg-red-800 rounded-lg text-sm transition-colors">
                                Заблокировать
                            </button>
                        `}
                    </div>
                </div>
            ` : ''}
        </div>
    `;
  
    document.getElementById('modalContent').innerHTML = content;
    
    // Обновление счетчика символов для описания
    if (isOwnProfile) {
        const textarea = document.getElementById('profileDescription');
        const counter = document.getElementById('descLength');
        textarea.addEventListener('input', function() {
            counter.textContent = `${this.value.length}/500`;
        });
    }
}


// НОВАЯ ФУНКЦИЯ ДЛЯ ОТПРАВКИ ПРИГЛАШЕНИЯ
async function sendAllianceInvitation(userId, username) {
    if (!confirm(`Вы уверены, что хотите пригласить пользователя ${username} в свой союз?`)) {
        return;
    }
    
    try {
        // [MODIFIED] Вызываем action=send_invitation из alliance.php
        const response = await fetch('alliance.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `action=send_invitation&user_id=${userId}`
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('success', 'Приглашение отправлено!', `Пользователь ${username} получил приглашение.`);
        } else {
            showNotification('error', 'Ошибка', data.error || 'Ошибка отправки приглашения.');
        }
    } catch (error) {
        console.error('❌ Ошибка отправки приглашения:', error);
        showNotification('error', 'Ошибка подключения', 'Не удалось отправить приглашение.');
    }
}

// НОВАЯ ФУНКЦИЯ ДЛЯ ОТПРАВКИ ПРИГЛАШЕНИЯ
async function sendAllianceInvitation(userId, username) {
    if (!confirm(`Вы уверены, что хотите пригласить пользователя ${username} в свой союз?`)) {
        return;
    }
    
    try {
        const response = await fetch('alliance.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `action=send_invitation&user_id=${userId}`
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('success', 'Приглашение отправлено!', `Пользователь ${username} получил приглашение.`);
        } else {
            showNotification('error', 'Ошибка', data.error || 'Ошибка отправки приглашения.');
        }
    } catch (error) {
        console.error('❌ Ошибка отправки приглашения:', error);
        showNotification('error', 'Ошибка подключения', 'Не удалось отправить приглашение.');
    }
}


async function updateProfile() {
    const description = document.getElementById('profileDescription').value;
    console.log('💾 Обновление профиля');
    
    try {
        const response = await fetch('profile.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `action=update_profile&description=${encodeURIComponent(description)}`
        });
        
        const data = await response.json();
        console.log('💾 Результат обновления:', data);
        
        if (data.success) {
            console.log('✅ Профиль обновлен');
            alert('Профиль успешно обновлен!');
        } else {
            alert(data.error || 'Ошибка обновления профиля');
        }
    } catch (error) {
        console.error('❌ Ошибка обновления профиля:', error);
        alert('Ошибка подключения');
    }
}

// ==========================================================
// --- NEW: ФУНКЦИИ ЛИЧНЫХ СООБЩЕНИЙ/ДИАЛОГОВ ---
// ==========================================================

async function loadMessages() {
    console.log('🔄 Загрузка списка диалогов...');
    
    document.getElementById('modalTitle').textContent = '✉️ Личные сообщения';
    const contentDiv = document.getElementById('modalContent');
    contentDiv.innerHTML = '<div class="text-center text-neon-blue">Загрузка диалогов...</div>';
    
    try {
        const response = await fetch('profile.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: 'action=get_conversations'
        });
        
        const data = await response.json();
        console.log('✉️ Диалоги получены:', data);
        
        if (data.conversations) {
            displayConversations(data.conversations);
        } else {
            // При фатальной ошибке, если JSON.parse упал, мы попадаем сюда с data == undefined.
            // Но в этом случае, JS-ошибка была бы брошена раньше.
            // Если response.json() успешно прошел, но data.conversations пуст (из-за ошибки PHP до jsonResponse), 
            // тогда data.error может быть undefined.
            if (data.error) {
                 contentDiv.innerHTML = `<div class="text-center text-mars-red">${data.error || 'Ошибка загрузки диалогов'}</div>`;
            } else {
                 contentDiv.innerHTML = `<div class="text-center text-gray-400">Нет активных диалогов.</div>`;
            }
        }
    } catch (error) {
        console.error('❌ Ошибка загрузки диалогов:', error);
        contentDiv.innerHTML = '<div class="text-center text-mars-red">Ошибка загрузки</div>';
    }
}

function displayConversations(conversations) {
    let content = `
        <div class="space-y-4">
            <div class="resource-card p-4 rounded-xl">
                <h3 class="font-bold text-neon-green mb-3">✉️ Ваши диалоги</h3>
                ${conversations.length > 0 ? `
                    <div class="space-y-2 max-h-96 overflow-y-auto">
                        ${conversations.map(conv => {
                            const isUnread = parseInt(conv.unread_count) > 0;
                            const lastMessageTime = new Date(conv.last_message_time).toLocaleString('ru-RU', {
                                day: '2-digit',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit'
                            });
                            
                            return `
                                <div class="flex items-center justify-between p-3 rounded-lg bg-gray-800/50 cursor-pointer hover:bg-gray-700/50 ${isUnread ? 'border border-neon-pink/50' : ''}" 
                                     onclick="openPrivateChat(${conv.user_id})">
                                    <div class="flex-1 min-w-0">
                                        <div class="flex items-center space-x-2">
                                            <div class="font-bold text-neon-blue truncate ${isUnread ? 'text-neon-pink' : ''}">${conv.colony_name} (@${conv.username})</div>
                                            ${isUnread ? `<span class="px-2 py-0.5 rounded-full bg-neon-pink text-xs font-bold text-black">${conv.unread_count}</span>` : ''}
                                        </div>
                                        <div class="text-xs text-gray-400 truncate mt-1">
                                            ${escapeHtml(conv.last_message)}
                                        </div>
                                    </div>
                                    <div class="text-right text-xs text-gray-500 ml-4 flex-shrink-0">
                                        ${lastMessageTime}
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                ` : `
                    <div class="text-center text-gray-400 py-8">
                        <div class="text-4xl mb-2">💬</div>
                        <p>Начните диалог с другим колонистом!</p>
                    </div>
                `}
            </div>
        </div>
    `;
    
    document.getElementById('modalContent').innerHTML = content;
    // После загрузки диалогов, обновляем индикатор
    if (typeof fetchUnreadStatus === 'function') {
        fetchUnreadStatus();
    }
}

async function openPrivateChat(userId) {
    console.log(`💬 Открытие приватного чата с пользователем: ${userId}`);
    
    document.getElementById('modalTitle').textContent = '💬 Личные сообщения';
    await loadPrivateMessages(userId);
}

async function loadPrivateMessages(userId) {
    console.log('🔄 Загрузка личных сообщений...');
    
    const contentDiv = document.getElementById('modalContent');
    contentDiv.innerHTML = '<div class="text-center text-neon-blue">Загрузка сообщений...</div>';
    
    try {
        const response = await fetch('profile.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `action=get_messages&with_user_id=${userId}`
        });
        
        const data = await response.json();
        console.log('💬 Сообщения получены:', data);
        
        if (data.messages) {
            displayPrivateMessages(data.messages, userId);
        } else {
            contentDiv.innerHTML = `<div class="text-center text-mars-red">${data.error || 'Ошибка загрузки сообщений'}</div>`;
        }
    } catch (error) {
        console.error('❌ Ошибка загрузки сообщений:', error);
        contentDiv.innerHTML = '<div class="text-center text-mars-red">Ошибка загрузки</div>';
    }
}

// NEW FUNCTION: Отправляет запрос на сервер, чтобы отметить личные сообщения как прочитанные
function markPrivateMessagesAsReadRequest(senderId) {
    fetch('profile.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'action=mark_private_read&sender_id=' + senderId
    }).then(() => {
        // После отметки как прочитанного, немедленно обновляем индикатор
        if (typeof fetchUnreadStatus === 'function') {
            fetchUnreadStatus();
        }
    }).catch(error => {
        console.error('❌ Ошибка при отметке лички как прочитанной:', error);
    });
}

function displayPrivateMessages(messages, userId) {
    const currentUser = gameData?.user?.username;
    
    let content = `
        <div class="space-y-4">
            <div class="resource-card p-4 rounded-xl">
                <div id="privateMessages" class="h-64 overflow-y-auto mb-4 space-y-2 bg-gray-900/50 p-3 rounded-lg">
                    ${messages.length > 0 ? messages.map(message => {
                        const isCurrentUser = message.from_username === currentUser;
                        const messageTime = new Date(message.created_at).toLocaleTimeString('ru-RU', {
                            hour: '2-digit',
                            minute: '2-digit'
                        });
                        
                        return `
                            <div class="flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'}">
                                <div class="${isCurrentUser ? 'bg-neon-blue/20 border-neon-blue/50' : 'bg-gray-800/50 border-gray-600/50'} border rounded-lg p-2 max-w-[80%]">
                                    <div class="text-xs ${isCurrentUser ? 'text-neon-blue' : 'text-neon-green'} mb-1">
                                        ${isCurrentUser ? message.from_colony : message.from_colony} (${isCurrentUser ? message.from_username : message.from_username})
                                    </div>
                                    <div class="text-sm text-white break-words chat-message-content">${parseEmojis(escapeHtml(message.message))}</div>
                                    <div class="text-xs text-gray-400 mt-1">${messageTime}</div>
                                </div>
                            </div>
                        `;
                    }).join('') : `
                        <div class="text-center text-gray-400 py-8">
                            <div class="text-4xl mb-2">💭</div>
                            <p>Начните общение!</p>
                        </div>
                    `}
                </div>
                
                <div class="relative">
                    <form onsubmit="sendPrivateMessage(event, ${userId})" class="flex gap-2">
                        <div class="flex-1 relative">
                            <input type="text" id="privateMessageInput" placeholder="Введите сообщение..." maxlength="500" required
                                   class="w-full p-2 pr-10 bg-gray-800/50 border border-neon-blue/30 rounded-lg focus:border-neon-blue focus:outline-none">
                            <button type="button" onclick="toggleEmojiPicker('private')" 
                                    class="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-neon-blue">
                                😊
                            </button>
                        </div>
                        <button type="submit" 
                                class="px-4 py-2 bg-gradient-to-r from-neon-green to-neon-blue rounded-lg font-bold hover:scale-105 transition-transform">
                            📤
                        </button>
                    </form>
                    
                    <div id="privateEmojiPicker" class="emoji-picker">
                        <div class="emoji-grid">
                            ${getEmojiList().map(emoji => `<button type="button" class="emoji-btn" onclick="insertEmoji('privateMessageInput', '${emoji}')">${emoji}</button>`).join('')}
                        </div>
                    </div>
                </div>
                
                <div class="text-xs text-gray-400 mt-2">
                    ⚠️ Соблюдайте правила общения. Спам и оскорбления запрещены.
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('modalContent').innerHTML = content;
    
    // >>> ЛОГИКА ПРОКРУТКИ ВНИЗ ПРИ ОТКРЫТИИ ЛИЧКИ <<<
    const messagesContainer = document.getElementById('privateMessages');
    if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
	
	// NEW: Отмечаем сообщения от этого пользователя как прочитанные
    markPrivateMessagesAsReadRequest(userId);
}

async function sendPrivateMessage(event, userId) {
    event.preventDefault();
    console.log('📤 Отправка личного сообщения');
    
    const messageInput = document.getElementById('privateMessageInput');
    const message = messageInput.value.trim();
    
    if (!message) {
        return;
    }
    
    try {
        const response = await fetch('profile.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `action=send_message&to_user_id=${userId}&message=${encodeURIComponent(message)}`
        });
        
        const data = await response.json();
        console.log('📤 Результат отправки:', data);
        
        if (data.success) {
            console.log('✅ Сообщение отправлено');
            messageInput.value = '';
            hideEmojiPicker();
            // Обновляем сообщения
            setTimeout(() => loadPrivateMessages(userId), 500);
        } else {
            alert(data.error || 'Ошибка отправки сообщения');
        }
    } catch (error) {
        console.error('❌ Ошибка отправки сообщения:', error);
        alert('Ошибка подключения');
    }
}

// Вспомогательные функции
function getBuildingName(type) {
    const names = {
        1: '⛏️ Шахта',
        2: '💧 Очиститель воды',
        3: '🌾 Ферма', 
        4: '⚡ Генератор энергии',
        5: '🏠 Жилой комплекс',
        6: '🌬️ Генератор кислорода'
    };
    return names[type] || 'Неизвестная постройка';
}

function getBusinessName(type) {
    const names = {
        1: '💵 Бизнес I',
        2: '💰 Бизнес II',
        3: '💼 Бизнес III',
        4: '🏭 Бизнес IV'
    };
    return names[type] || 'Неизвестный бизнес';
}

function getRoleInfo(role) {
    const roles = {
        'moderator': { text: '👮 Модератор', class: 'bg-orange-600/20 border border-orange-600/50 text-orange-300' },
        'admin': { text: '👑 Администратор', class: 'bg-red-600/20 border border-red-600/50 text-red-300' }
    };
    return roles[role];
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
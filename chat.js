// Система чата
console.log('💬 Модуль чата загружен');

async function loadChat() {
    console.log('🔄 Загрузка чата...');
    
    try {
        const response = await fetch('chat.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: 'action=get_messages'
        });
        
        const data = await response.json();
        console.log('💬 Сообщения чата получены:', data);
        
        displayChat(data.messages || []);
    } catch (error) {
        console.error('❌ Ошибка загрузки чата:', error);
    }
}

// NEW FUNCTION: Отправляет запрос на сервер, чтобы отметить общий чат как прочитанный
function markPublicChatAsRead() {
    fetch('chat.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'action=mark_public_read'
    }).then(() => {
        // После отметки как прочитанного, немедленно обновляем индикатор
        if (typeof fetchUnreadStatus === 'function') {
            fetchUnreadStatus();
        }
    }).catch(error => {
        console.error('❌ Ошибка при отметке чата как прочитанного:', error);
    });
}


function displayChat(messages) {
    const currentUser = gameData?.user?.username;
    const userRole = gameData?.user?.role;
    const canModerate = userRole === 'admin' || userRole === 'moderator';
    
    let content = `
        <div class="space-y-4">
            <div class="resource-card p-4 rounded-xl">
                <h3 class="font-bold text-neon-green mb-3">💬 Общий чат</h3>
                
                <div id="chatMessages" class="h-64 overflow-y-auto mb-4 space-y-2 bg-gray-900/50 p-3 rounded-lg">
                    ${messages.length > 0 ? messages.map(message => {
                        const isCurrentUser = message.username === currentUser;
                        const messageTime = new Date(message.created_at).toLocaleTimeString('ru-RU', {
                            hour: '2-digit',
                            minute: '2-digit'
                        });
                        
                        return `
                            <div class="flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'}">
                                <div class="${isCurrentUser ? 'bg-neon-blue/20 border-neon-blue/50' : 'bg-gray-800/50 border-gray-600/50'} border rounded-lg p-2 max-w-[80%] relative">
                                    <div class="flex justify-between items-start mb-1">
                                        <button onclick="openProfile(${message.user_id})" class="text-xs ${isCurrentUser ? 'text-neon-blue' : 'text-neon-green'} hover:underline">
                                            ${message.colony_name} (${message.username})
                                        </button>
                                        ${canModerate && !isCurrentUser ? `
                                            <button onclick="deleteChatMessage(${message.id})" class="text-xs text-mars-red hover:text-red-400 ml-2">
                                                🗑️
                                            </button>
                                        ` : ''}
                                    </div>
                                    <div class="text-sm text-white break-words chat-message-content">${parseEmojis(escapeHtml(message.message))}</div>
                                    <div class="text-xs text-gray-400 mt-1">${messageTime}</div>
                                </div>
                            </div>
                        `;
                    }).join('') : `
                        <div class="text-center text-gray-400 py-8">
                            <div class="text-4xl mb-2">💭</div>
                            <p>Чат пуст. Напишите первое сообщение!</p>
                        </div>
                    `}
                </div>
                
                <div class="relative">
                    <form onsubmit="sendMessage(event)" class="flex gap-2">
                        <div class="flex-1 relative">
                            <input type="text" id="messageInput" placeholder="Введите сообщение..." maxlength="500" required
                                   class="w-full p-2 pr-10 bg-gray-800/50 border border-neon-blue/30 rounded-lg focus:border-neon-blue focus:outline-none">
                            <button type="button" onclick="toggleEmojiPicker('message')" 
                                    class="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-neon-blue">
                                😊
                            </button>
                        </div>
                        <button type="submit" 
                                class="px-4 py-2 bg-gradient-to-r from-neon-green to-neon-blue rounded-lg font-bold hover:scale-105 transition-transform">
                            📤
                        </button>
                    </form>
                    
                    <div id="messageEmojiPicker" class="emoji-picker">
                        <div class="emoji-grid">
                            ${getEmojiList().map(emoji => `<button type="button" class="emoji-btn" onclick="insertEmoji('messageInput', '${emoji}')">${emoji}</button>`).join('')}
                        </div>
                    </div>
                </div>
                
                <div class="text-xs text-gray-400 mt-2">
                    ⚠️ Соблюдайте правила общения. Спам и оскорбления запрещены.
                </div>
            </div>
            
            ${userRole === 'admin' ? `
                <div class="resource-card p-4 rounded-xl border border-mars-red/50">
                    <h3 class="font-bold text-mars-red mb-3">👑 Панель администратора</h3>
                    <button onclick="openCreateNews()" 
                            class="w-full py-2 bg-gradient-to-r from-neon-purple to-neon-pink rounded-lg font-bold hover:scale-105 transition-transform">
                        📰 Создать новость
                    </button>
                </div>
            ` : ''}
        </div>
    `;
    
    document.getElementById('modalContent').innerHTML = content;
    
    // >>> ЛОГИКА ПРОКРУТКИ ВНИЗ ПРИ ОТКРЫТИИ ЧАТА <<<
    const chatContainer = document.getElementById('chatMessages');
    if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }
	
// NEW: Отмечаем чат как прочитанный
    markPublicChatAsRead();
	
    // Автообновление чата каждые 10 секунд
    if (window.chatInterval) {
        clearInterval(window.chatInterval);
    }
    
    window.chatInterval = setInterval(async () => {
        try {
            const response = await fetch('chat.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: 'action=get_messages'
            });
            
            const data = await response.json();
            if (data.messages && data.messages.length > 0) {
                updateChatMessages(data.messages);
            }
        } catch (error) {
            console.log('❌ Ошибка автообновления чата:', error);
        }
    }, 10000);
}

function updateChatMessages(messages) {
    const chatContainer = document.getElementById('chatMessages');
    if (!chatContainer) return;
    
    const currentUser = gameData?.user?.username;
    const userRole = gameData?.user?.role;
    const canModerate = userRole === 'admin' || userRole === 'moderator';
    
    // Проверяем, был ли пользователь прокручен до самого низа (с небольшим запасом 20px)
    const wasScrolledToBottom = chatContainer.scrollTop >= chatContainer.scrollHeight - chatContainer.offsetHeight - 20;
    
    chatContainer.innerHTML = messages.map(message => {
        const isCurrentUser = message.username === currentUser;
        const messageTime = new Date(message.created_at).toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        return `
            <div class="flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'}">
                <div class="${isCurrentUser ? 'bg-neon-blue/20 border-neon-blue/50' : 'bg-gray-800/50 border-gray-600/50'} border rounded-lg p-2 max-w-[80%] relative">
                    <div class="flex justify-between items-start mb-1">
                        <button onclick="openProfile(${message.user_id})" class="text-xs ${isCurrentUser ? 'text-neon-blue' : 'text-neon-green'} hover:underline">
                            ${message.colony_name} (${message.username})
                        </button>
                        ${canModerate && !isCurrentUser ? `
                            <button onclick="deleteChatMessage(${message.id})" class="text-xs text-mars-red hover:text-red-400 ml-2">
                                🗑️
                            </button>
                        ` : ''}
                    </div>
                    <div class="text-sm text-white break-words chat-message-content">${parseEmojis(escapeHtml(message.message))}</div>
                    <div class="text-xs text-gray-400 mt-1">${messageTime}</div>
                </div>
            </div>
        `;
    }).join('');
    
    // >>> ЛОГИКА ПРОКРУТКИ ВНИЗ ПРИ ОБНОВЛЕНИИ <<<
    // Если пользователь был внизу, прокручиваем к новым сообщениям
    if (wasScrolledToBottom) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }
}

async function sendMessage(event) {
    event.preventDefault();
    console.log('📤 Отправка сообщения');
    
    const messageInput = document.getElementById('messageInput');
    const message = messageInput.value.trim();
    
    if (!message) {
        return;
    }
    
    try {
        const response = await fetch('chat.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `action=send_message&message=${encodeURIComponent(message)}`
        });
        
        const data = await response.json();
        console.log('📤 Результат отправки:', data);
        
        if (data.success) {
            console.log('✅ Сообщение отправлено');
            messageInput.value = '';
            hideEmojiPicker();
            // Обновляем чат
            setTimeout(() => loadChat(), 500);
        } else {
            alert(data.error || 'Ошибка отправки сообщения');
        }
    } catch (error) {
        console.error('❌ Ошибка отправки сообщения:', error);
        alert('Ошибка подключения');
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
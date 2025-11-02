// Система новостей
console.log('📰 Модуль новостей загружен');

async function loadNews() {
    console.log('🔄 Загрузка новостей...');
    
    try {
        const response = await fetch('news.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: 'action=get_news'
        });
        
        const data = await response.json();
        console.log('📰 Новости получены:', data);
        
        displayNews(data.news || []);
    } catch (error) {
        console.error('❌ Ошибка загрузки новостей:', error);
    }
}

function displayNews(news) {
    let content = `
        <div class="space-y-4">
            <div class="resource-card p-4 rounded-xl">
                <h3 class="font-bold text-neon-green mb-3">📰 Новости игры</h3>
                
                ${news.length > 0 ? `
                    <div class="space-y-4">
                        ${news.map(item => {
                            const newsDate = new Date(item.created_at).toLocaleDateString('ru-RU', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            });
                            
                            return `
                                <div class="bg-gray-800/50 p-4 rounded-lg border-l-4 border-neon-blue">
                                    <div class="flex justify-between items-start mb-2">
                                        <h4 class="font-bold text-neon-blue">${escapeHtml(item.title)}</h4>
                                        <div class="text-xs text-gray-400">${newsDate}</div>
                                    </div>
                                    <div class="text-sm text-gray-300 leading-relaxed">
                                        ${escapeHtml(item.content).replace(/\n/g, '<br>')}
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                ` : `
                    <div class="text-center text-gray-400 py-8">
                        <div class="text-4xl mb-2">📰</div>
                        <p>Новостей пока нет</p>
                    </div>
                `}
            </div>
            
            <div class="resource-card p-4 rounded-xl">
                <h3 class="font-bold text-neon-green mb-3">🔔 Обновления</h3>
                <div class="text-sm space-y-3 text-gray-300">
                    <div class="flex items-start space-x-2">
                        <span class="text-neon-blue">•</span>
                        <div>
                            <div class="font-semibold">Система экономики</div>
                            <div class="text-gray-400">Добавлены бизнесы и постройки для развития поселения</div>
                        </div>
                    </div>
                    <div class="flex items-start space-x-2">
                        <span class="text-neon-green">•</span>
                        <div>
                            <div class="font-semibold">Союзы поселений</div>
                            <div class="text-gray-400">Теперь можно создавать и вступать в союзы</div>
                        </div>
                    </div>
                    <div class="flex items-start space-x-2">
                        <span class="text-neon-purple">•</span>
                        <div>
                            <div class="font-semibold">Рейтинг поселения</div>
                            <div class="text-gray-400">Соревнуйтесь с другими игроками за лучшее поселение</div>
                        </div>
                    </div>
                    <div class="flex items-start space-x-2">
                        <span class="text-yellow-400">•</span>
                        <div>
                            <div class="font-semibold">Общий чат</div>
                            <div class="text-gray-400">Общайтесь с другими колонистами в реальном времени</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('modalContent').innerHTML = content;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
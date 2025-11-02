<?php
require_once 'func.php';
// Добавляем проверку авторизации, чтобы получать данные о времени сервера только для авторизованных
if (!isset($_SESSION['user_id'])) {
    // Не выходим, просто не устанавливаем переменную time() для неавторизованных
}
define('GAME_VERSION', '1.0.121');

?>
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Жизнь на Марсе</title>
    
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="Colony.vipmars.online">
    <meta property="og:title" content="Выживание на Марсе: Жизнь на Красной Планете">
    <meta property="og:description" content="Постройте и управляйте своим поселением на Марсе в этой футуристичной экономической игре. Выживание, бизнес и неоновые технологии!">
    <meta property="og:url" content="https://colony.vipmars.online/">
    <meta property="og:locale" content="ru_RU">
    
    <meta property="og:image" content="https://colony.vipmars.online/game.jpg?v=<?php echo GAME_VERSION; ?>">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:type" content="image/jpeg">

    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="Выживание на Марсе: Жизнь на Красной Планете">
    <meta name="twitter:description" content="Постройте и управляйте своим поселением на Марсе в этой футуристичной экономической игре.">
    <meta name="twitter:image" content="https://colony.vipmars.online/game.jpg?v=<?php echo GAME_VERSION; ?>">
    
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        mars: {
                            red: '#CD5C5C',
                            orange: '#FF6347',
                            brown: '#8B4513',
                            dark: '#2F1B14'
                        },
                        neon: {
                            blue: '#00FFFF',
                            green: '#00FF00',
                            purple: '#9D4EDD',
                            pink: '#FF69B4'
                        }
                    },
                    fontFamily: {
                        'tech': ['Synthetica', 'sans-serif']
                    },
                    width: {
                        'game': '460px'
                    },
                    maxWidth: {
                        'game': '460px'
                    }
                }
            }
        }
    </script>
	<link href="https://fonts.googleapis.com/css2?family=Synthetica&display=swap" rel="stylesheet">

    <style>

/* --- НАЧАЛО: Очищенные стили уведомлений --- */
.notification-popup {
	position: fixed;
	top: 20px;
	right: 20px;
	z-index: 9999;
	max-width: 350px;
	/* Изначально скрыто: сдвинуто вправо, невидимо и неактивно */
	transform: translateX(110%);
	opacity: 0;
	visibility: hidden;
	transition: transform 0.3s ease-in-out, opacity 0.3s ease-in-out, visibility 0.3s;
}

.notification-popup.show {
	/* Отображается, когда класс добавлен */
	transform: translateX(0);
	opacity: 1;
	visibility: visible;
}

.notification-popup .bg-black\/90 {
	background: rgba(0, 0, 0, 0.95) !important;
	backdrop-filter: blur(20px);
	border: 1px solid;
	box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
}
/* --- КОНЕЦ: Очищенные стили уведомлений --- */


		.tech-border {
			border: 2px solid transparent;
			background: linear-gradient(45deg, #00FFFF, #9D4EDD) border-box;
			border-radius: 12px;
		}
		.tech-glow {
			box-shadow: 0 0 20px rgba(0, 255, 255, 0.3);
		}
		.modal-backdrop {
			backdrop-filter: blur(10px);
			background: rgba(0, 0, 0, 0.7);
		}
		.resource-card {
			background: linear-gradient(135deg, rgba(0, 255, 255, 0.1), rgba(157, 78, 221, 0.1));
			border: 1px solid rgba(0, 255, 255, 0.3);
		}
		.happiness-bar {
			background: linear-gradient(90deg, 
				#ef4444 0%, 
				#f97316 25%, 
				#eab308 50%, 
				#84cc16 75%, 
				#22c55e 100%);
			border-radius: 9999px;
			overflow: hidden;
		}
		.happiness-indicator {
			background: rgba(255, 255, 255, 0.3);
			transition: width 0.5s ease;
		}
		
		/* Улучшенные анимированные звезды */
@keyframes twinkle {
	0%, 100% { opacity: 0.3; }
	50% { opacity: 1; }
}

.star {
	position: absolute;
	background: white;
	border-radius: 50%;
	animation: twinkle 4s infinite ease-in-out;
}

		
		.star {
			position: absolute;
			background: white;
			border-radius: 50%;
			animation: twinkle 4s infinite ease-in-out;
		}
		
		.star-large {
			width: 3px;
			height: 3px;
			box-shadow: 0 0 6px 2px rgba(255, 255, 255, 0.8);
		}
		
		.star-medium {
			width: 2px;
			height: 2px;
			box-shadow: 0 0 4px 1px rgba(255, 255, 255, 0.6);
		}
		
		.star-small {
			width: 1px;
			height: 1px;
			box-shadow: 0 0 3px 1px rgba(255, 255, 255, 0.4);
		}
		
		/* ОБНОВЛЕННЫЕ СТИЛИ ДЛЯ РЕАЛИСТИЧНОЙ ПАДАЮЩЕЙ ЗВЕЗДЫ */
		.shooting-star {
			position: absolute;
			width: 60px;
			height: 2px;
			background: linear-gradient(90deg, transparent, white);
			border-radius: 50%;
			/* Используем 'forwards' для остановки на 100% keyframe (opacity: 0) */
			animation: shooting var(--duration) linear var(--delay) forwards;	
			opacity: 0;
			/* Точка поворота в начале элемента */
			transform-origin: 0% 50%;	
		}
		
		@keyframes shooting {
			0% {	
				opacity: 0;	
				/* Начинаем с небольшого отрицательного смещения, чтобы звезда появлялась плавно */
				transform: rotate(var(--rotation)) translateX(-150px);	
			}
			/* Быстрое появление */
			5% { opacity: 1; }	
			
			/* Удерживаем полную яркость, пока не достигнем края экрана (80% пути) */
			80% { opacity: 1; }
			
			/* Плавное затухание при выходе за пределы экрана */
			100% {	
				opacity: 0;	
				/* Двигаем на большую фиксированную дистанцию */
				transform: rotate(var(--rotation)) translateX(var(--distance));	
			}
		}
		
		.emoji-picker {
			display: none;
			position: absolute;
			bottom: 40px;
			right: 0;
			background: rgba(0, 0, 0, 0.9);
			border: 1px solid rgba(0, 255, 255, 0.3);
			border-radius: 8px;
			padding: 8px;
			max-width: 300px; /* Увеличено для более широкого отображения смайлов */
			z-index: 1000;
		}
		
		.emoji-picker.show {
			display: block;
		}
		
.emoji-grid {
			display: grid;
			grid-template-columns: repeat(12, 1fr); /* Увеличение колонок для компактности */
			gap: 4px;
			max-height: 200px; /* Ограничение высоты */
			overflow-y: auto; /* Только вертикальная прокрутка */
			overflow-x: hidden; /* Явное скрытие горизонтальной прокрутки */
		}
		
		.emoji-btn {
			padding: 4px;
			border: none;
			background: none;
			cursor: pointer;
			border-radius: 4px;
			font-size: 16px;
		}
		
		.emoji-btn:hover {
			background: rgba(0, 255, 255, 0.2);
		}
		
		
		/* --- ИНДИКАТОР УВЕДОМЛЕНИЙ (СТАНДАРТИЗИРОВАН) --- */
.notification-indicator {
    position: absolute;
    top: 5px;
    right: 5px;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: rgba(255, 105, 180, 0.3); /* Полупрозрачный базовый цвет */
    box-shadow: none;
    display: none;
    transition: all 0.3s ease;
}

.notification-indicator.active {
    /* Активное состояние: Неоновый цвет и эффект свечения */
    display: block;
    background-color: #FF69B4; /* Neon Pink */
    box-shadow: 0 0 4px #FF69B4, 0 0 8px #FF69B4;
}

		
		
			.chat-message-content {
    word-break: break-word; /* Для длинных слов/смайлов */
    overflow-wrap: break-word; /* Альтернатива */
}
.emoji-picker {
			display: none;
			position: absolute;
			bottom: 40px;
			right: 0;
			background: rgba(0, 0, 0, 0.9);
			border: 1px solid rgba(0, 255, 255, 0.3);
			border-radius: 8px;
			padding: 8px;
			max-width: 300px; /* Увеличено для более широкого отображения смайлов */
			z-index: 1000;
		}

		/* Игровая область */
		.game-container {
			width: 100%;
			max-width: 460px;
			margin: 0 auto;
		}
		
		/* Исправленный скролл */
		.game-scroll {
			/*#min-height: calc(100vh - 140px);*/
			/*#padding-bottom: 100px;*/
			overflow-y: auto;
			-webkit-overflow-scrolling: touch;
		}
		
		/* Компактное меню */
		.compact-menu {
			/*#position: fixed;
			bottom: 0;
			left: 0;
			right: 0;*/
				background: rgb(12 17 27 / 68%);
			backdrop-filter: blur(10px);
			border-top: 1px solid rgba(0, 255, 255, 0.3);
			padding: 6px 4px;
			z-index: 30;
		}
		
		.compact-menu-grid {
			display: grid;
			grid-template-columns: repeat(5, 1fr);
			gap: 4px;
		}
		
		.compact-menu-item {
			padding: 6px 2px;
			border-radius: 6px;
			text-align: center;
			font-size: 0.65rem;
			background: rgba(255, 255, 255, 0.05);
			border: 1px solid rgba(255, 255, 255, 0.1);
			transition: all 0.2s ease;
            position: relative;
		}
		
		.compact-menu-item:hover {
			background: rgba(0, 255, 255, 0.1);
			transform: translateY(-2px);
		}
		
		/* Компактные ресурсы */
		.compact-resources {
			display: grid;
			grid-template-columns: repeat(3, 1fr);
			gap: 6px;
			margin-bottom: 12px;
		}
		
		.compact-resource {
			padding: 6px;
			border-radius: 6px;
			background: rgba(0, 0, 0, 0.3);
			border: 1px solid rgba(0, 255, 255, 0.2);
			text-align: center;
		}
		
		/* Обучение */
		.tutorial-overlay {
			position: fixed;
			inset: 0;
			background: rgba(0, 0, 0, 0.8);
			backdrop-filter: blur(5px);
			z-index: 10000;
			display: none;
		}
		
		.tutorial-overlay.show {
			display: flex;
		}
		
		.tutorial-popup {
			background: linear-gradient(135deg, rgba(0, 20, 40, 0.95), rgba(20, 0, 40, 0.95));
			border: 2px solid rgba(0, 255, 255, 0.5);
			border-radius: 16px;
			padding: 24px;
			max-width: 400px;
			margin: auto;
			text-align: center;
			box-shadow: 0 0 30px rgba(0, 255, 255, 0.3);
		}
		
		.tutorial-arrow {
			position: fixed;
			z-index: 10001;
			font-size: 24px;
			color: #00FFFF;
			animation: pulse 1s infinite;
		}
		
		@keyframes pulse {
			0%, 100% { opacity: 1; transform: scale(1); }
			50% { opacity: 0.7; transform: scale(1.1); }
		}
		
	</style>
</head>







<body class="bg-gradient-to-br from-mars-dark via-gray-900 to-black text-white min-h-screen font-tech">

    <div id="stars-container" class="fixed inset-0 pointer-events-none" style="z-index: 5;"></div>
    
    <div id="notificationPopup" class="notification-popup">
        <div class="bg-black/90 backdrop-blur-md border border-neon-blue/50 rounded-xl p-4 shadow-lg">
            <div class="flex items-center justify-between">
                <div class="flex items-center space-x-3">
                    <span id="notificationIcon" class="text-2xl">🔔</span>
                    <div>
                        <div id="notificationTitle" class="font-bold text-neon-blue">Уведомление</div>
                        <div id="notificationMessage" class="text-sm text-gray-300">Сообщение</div>
                    </div>
                </div>
                <button onclick="hideNotification()" class="text-gray-400 hover:text-white text-xl">×</button>
            </div>
        </div>
    </div>
    
    <div id="tutorialOverlay" class="tutorial-overlay">
        <div class="tutorial-popup">
            <div id="tutorialContent">
                </div>
        </div>
    </div>
    <div id="tutorialArrow" class="tutorial-arrow"></div>
    <div id="authScreen" class="fixed inset-0 flex items-center justify-center z-10">
        <div class="bg-black/50 backdrop-blur-md p-8 rounded-2xl border border-neon-blue/30 w-full max-w-md mx-4 tech-glow">
            <h1 class="text-3xl font-bold text-center mb-8 text-neon-blue">🚀 Жизнь на Марсе</h1>
            
            <div id="loginForm">
                <h2 class="text-xl mb-6 text-center text-neon-green">Вход в игру</h2>
                <form onsubmit="login(event)">
                    <input type="text" id="loginUsername" placeholder="Логин или Email" 
                           class="w-full p-3 mb-4 bg-gray-800/50 border border-neon-blue/30 rounded-lg focus:border-neon-blue focus:outline-none">
                    <input type="password" id="loginPassword" placeholder="Пароль" 
                           class="w-full p-3 mb-6 bg-gray-800/50 border border-neon-blue/30 rounded-lg focus:border-neon-blue focus:outline-none">
                    <button type="submit" class="w-full py-3 bg-gradient-to-r from-neon-blue to-neon-purple rounded-lg font-bold hover:scale-105 transition-transform">
                        Войти
                    </button>
                </form>
                <p class="text-center mt-4 text-gray-400">
                    Нет аккаунта? <button onclick="showRegister()" class="text-neon-green hover:text-neon-blue">Регистрация</button>
                </p>
            </div>
            
            <div id="registerForm" class="hidden">
                <h2 class="text-xl mb-6 text-center text-neon-green">Создание поселения</h2>
                <form onsubmit="register(event)">
                    <input type="text" id="regUsername" placeholder="Имя пользователя" required
                           class="w-full p-3 mb-4 bg-gray-800/50 border border-neon-blue/30 rounded-lg focus:border-neon-blue focus:outline-none">
                    <input type="email" id="regEmail" placeholder="Email" required
                           class="w-full p-3 mb-4 bg-gray-800/50 border border-neon-blue/30 rounded-lg focus:border-neon-blue focus:outline-none">
                    <input type="text" id="regColony" placeholder="Название поселения" required
                           class="w-full p-3 mb-4 bg-gray-800/50 border border-neon-blue/30 rounded-lg focus:border-neon-blue focus:outline-none">
                    <input type="password" id="regPassword" placeholder="Пароль" required
                           class="w-full p-3 mb-6 bg-gray-800/50 border border-neon-blue/30 rounded-lg focus:border-neon-blue focus:outline-none">
                    <button type="submit" class="w-full py-3 bg-gradient-to-r from-neon-green to-neon-blue rounded-lg font-bold hover:scale-105 transition-transform">
                        Создать поселение
                    </button>
                </form>
                <p class="text-center mt-4 text-gray-400">
                    Есть аккаунт? <button onclick="showLogin()" class="text-neon-blue hover:text-neon-green">Вход</button>
                </p>
            </div>
        </div>
    </div>






    <div id="gameScreen" class="hidden relative z-10">
        <div class="game-container">
            <header class="p-3 bg-black/30 backdrop-blur-sm border-b border-neon-blue/30 sticky top-0 z-20">
                <div class="flex justify-between items-center">
                    <div>
                        <h1 class="text-lg font-bold text-neon-blue">🏛️ <span id="colonyName">Мое поселение</span></h1>
                        <div class="flex items-center space-x-2 text-xs">
                            <span id="onlineStatus" class="text-neon-green">🟢 Онлайн</span>
                            <span id="onlineCount" class="text-gray-400">• 0 игроков</span>
                        </div>
                    </div>
                    <div class="flex items-center space-x-2">
                        <div id="userRole" class="hidden text-xs px-2 py-1 rounded bg-neon-purple/20 border border-neon-purple/50"></div>
                        <button onclick="logout()" class="text-mars-red hover:text-red-400 transition-colors text-sm">Выход</button>
                    </div>
                </div>
            </header>

            <div class="game-scroll px-3 pt-3">
                <div>
                    
                    <div id="updateTimerContainer" class="resource-card p-3 rounded-xl mb-3 hidden">
                        <div class="flex items-center justify-between mb-2">
                            <h3 class="text-sm font-bold text-neon-blue">📊 Обновление ресурсов</h3>
                            <div class="text-sm text-gray-400">Через: <span id="countdownDisplay" class="text-neon-green font-bold"></span> сек</div>
                        </div>
                        <div class="w-full bg-gray-800 rounded-full h-2">
                            <div id="updateProgressBar" class="bg-gradient-to-r from-neon-green to-neon-blue h-full rounded-full transition-all duration-1000 ease-linear" style="width: 100%"></div>
                        </div>
                    </div>
                    <div class="resource-card p-3 rounded-xl mb-3">
                        <h3 class="font-bold text-neon-green mb-2 flex items-center text-sm">
                            <span id="happinessEmoji">😐</span> Счастье поселения
                        </h3>
                        <div class="flex items-center space-x-2">
                            <div class="flex-1 h-3 happiness-bar relative">
                                <div id="happinessIndicator" class="happiness-indicator h-full" style="width: 50%;"></div>
                            </div>
                            <div class="text-base font-bold" id="happinessValue">50</div>
                        </div>
                        <div class="text-xs text-gray-400 mt-1" id="happinessDescription">
                            Нейтральное настроение
                        </div>
                    </div>




<div class="compact-resources grid grid-cols-2 gap-3 mb-4">
                        
                        <div class="compact-resource col-span-2 text-left">
                            <div class="flex justify-between items-center">
                                <span class="text-xs text-gray-400">💰 Монеты</span>
                                <span class="font-bold text-base" id="moneyAmount">0.00</span>
                            </div>
                            <div class="flex justify-between items-center text-xs mt-1">
                                <span class="text-gray-500">Поток/час:</span>
                                <span id="moneyFlow" class="font-semibold text-neon-green">± 0.00</span>
                            </div>
                        </div>

                        <div class="compact-resource text-left">
                            <div class="flex justify-between items-center">
                                <span class="text-xs text-gray-400">💧 Вода</span>
                                <span class="font-bold text-sm" id="waterAmount">0.00</span>
                            </div>
                            <div class="flex justify-between items-center text-xs mt-1">
                                <span class="text-gray-500">Баланс/час:</span>
                                <span id="waterFlow" class="font-semibold">± 0.00</span>
                            </div>
                        </div>

                        <div class="compact-resource text-left">
                            <div class="flex justify-between items-center">
                                <span class="text-xs text-gray-400">🍞 Еда</span>
                                <span class="font-bold text-sm" id="foodAmount">0.00</span>
                            </div>
                            <div class="flex justify-between items-center text-xs mt-1">
                                <span class="text-gray-500">Баланс/час:</span>
                                <span id="foodFlow" class="font-semibold">± 0.00</span>
                            </div>
                        </div>

                        <div class="compact-resource text-left">
                            <div class="flex justify-between items-center">
                                <span class="text-xs text-gray-400">🌬️ Кислород</span>
                                <span class="font-bold text-sm" id="oxygenAmount">0.00</span>
                            </div>
                            <div class="flex justify-between items-center text-xs mt-1">
                                <span class="text-gray-500">Баланс/час:</span>
                                <span id="oxygenFlow" class="font-semibold">± 0.00</span>
                            </div>
                        </div>

                        <div class="compact-resource text-left">
                            <div class="flex justify-between items-center">
                                <span class="text-xs text-gray-400">⚡ Электричество</span>
                                <span class="font-bold text-sm" id="electricityAmount">0.00</span>
                            </div>
                            <div class="flex justify-between items-center text-xs mt-1">
                                <span class="text-gray-500">Баланс/час:</span>
                                <span id="electricityFlow" class="font-semibold">± 0.00</span>
                            </div>
                        </div>

                        <div class="compact-resource col-span-1 text-left">
                            <div class="flex justify-between items-center">
                                <span class="text-xs text-gray-400">🪨 Материалы</span>
                                <div class="font-bold text-sm" id="materialsAmount">0.00</div>
                            </div>
                            <div class="flex justify-between items-center text-xs mt-1">
                                <span class="text-gray-500">Доход/час:</span>
                                <span id="materialsFlow" class="font-semibold text-neon-green">± 0.00</span>
                            </div>
                        </div>
                        
                        <div class="compact-resource col-span-1 text-left">
                            <div class="flex justify-between items-center">
                                <span class="text-xs text-gray-400">💎 Рубины</span>
                                <div class="font-bold text-sm" id="rubiesAmount">0.00</div>
                            </div>
                            <div class="flex justify-between items-center text-xs mt-1">
                                <span class="text-gray-500">Доход/час:</span>
                                <span id="rubiesFlow" class="font-semibold text-neon-green">± 0.00</span>
                            </div>
                        </div>
                    </div>
					
					
                        <div class="grid grid-cols-2 md:grid-cols-4 gap-4" id="resourceOverview">
                        </div>

                        <div class="resource-card p-3 rounded-xl mb-4">
                            <h3 class="text-neon-green font-bold mb-2 text-sm">👷 Население поселения</h3>
                            <div class="grid grid-cols-3 gap-2 text-center">
                                <div>
                                    <div class="text-lg font-bold text-orange-400" id="residentsWaiting">0</div>
                                    <div class="text-xs text-gray-400">Ожидают</div>
                                </div>
                                <div>
                                    <div class="text-lg font-bold text-green-400" id="residentsSettled">0</div>
                                    <div class="text-xs text-gray-400">Заселены</div>
                                </div>
                                <div>
                                    <div class="text-lg font-bold text-blue-400" id="residentsWorking">0</div>
                                    <div class="text-xs text-gray-400">Работают</div>
                                </div>
                            </div>
                            <div class="text-xs text-gray-400 mt-2 text-center" id="autoSettleInfo">
                                Автозаселение зависит от счастья поселения
                            </div>
                        </div>

                </div>
            </div>

            <nav class="compact-menu">
                <div class="compact-menu-grid">
                    <button onclick="openSection('buildings')" class="compact-menu-item">
                        <div class="text-lg">🏗️</div>
                        <div>Постройки</div>
                    </button>
                    <button onclick="openSection('business')" class="compact-menu-item">
                        <div class="text-lg">💼</div>
                        <div>Бизнесы</div>
                    </button>
                    <button onclick="openSection('residents')" class="compact-menu-item">
                        <div class="text-lg">👷</div>
                        <div>Жители</div>
                    </button>
                    
                    <button onclick="openSection('market')" class="compact-menu-item"> 
					    <div class="text-lg">📈</div>
                        <div>Рынок</div>
                    </button>
                    <button onclick="openSection('shop')" class="compact-menu-item"> 
					    <div class="text-lg">💎</div>
                        <div>Магазин</div>
                    </button>
                    <button onclick="openSection('boosts')" class="compact-menu-item">
                        <div class="text-lg">✨</div>
                        <div>Бусты</div>
                        <span id="boostActiveIndicator" class="hidden absolute top-0 right-0 h-2 w-2 bg-neon-green rounded-full" title="Активные бусты"></span>
                    </button>
                    
                    <button onclick="openSection('chat')" class="compact-menu-item">
                        <div class="text-lg">💬</div>
                        <div>Чат</div>
                        <span id="chatNotificationIndicator" class="notification-indicator absolute top-0 right-0 h-2 w-2 rounded-full"></span> 
                    </button>
                    <button onclick="openSection('messages')" class="compact-menu-item">
                        <div class="text-lg">✉️</div>
                        <div>Сообщения</div>
                        <span id="messagesNotificationIndicator" class="notification-indicator absolute top-0 right-0 h-2 w-2 rounded-full"></span> 
                    </button>
                    <button onclick="openSection('alliance')" class="compact-menu-item">
                        <div class="text-lg">🤝</div>
                        <div>Союзы</div>
                    </button>
                    
                    <button onclick="openSection('rating')" class="compact-menu-item">
                        <div class="text-lg">🏆</div>
                        <div>Рейтинг</div>
                    </button>
                    <button onclick="openSection('online')" class="compact-menu-item">
                        <div class="text-lg">🌐</div>
                        <div>Онлайн</div>
                    </button>
                    
                    <button onclick="openSection('news')" class="compact-menu-item">
                        <div class="text-lg">📰</div>
                        <div>Новости</div>
                    </button>
                    <button onclick="openSection('settings')" class="compact-menu-item">
                        <div class="text-lg">⚙️</div>
                        <div>Настройки</div>
                    </button>
                    <button onclick="openSection('help')" class="compact-menu-item">
                        <div class="text-lg">❓</div>
                        <div>Справка</div>
                    </button>
                    
                    <button onclick="openSection('admin')" class="compact-menu-item" id="adminMenuButton" style="display: none;">
                        <div class="text-lg text-mars-red">👑</div>
                        <div class="text-mars-red">Админ</div>
                        <span id="adminNotificationIndicator" class="notification-indicator absolute top-0 right-0 h-2 w-2 rounded-full"></span>
                    </button>
                    
                    <button onclick="openMyProfile()" class="compact-menu-item">
                        <div class="text-lg">👤</div>
                        <div>Профиль</div>
                    </button>
                </div>
            </nav>
			


            <div id="timeDisplayBlock" class="text-xs px-3 py-1 bg-black/30 backdrop-blur-sm border-b border-neon-blue/30 flex justify-between">
                <div class="flex items-center space-x-1">
                    <span class="text-gray-400">Сервер:</span>
                    <span id="serverTimeDisplay" 
                          class="text-neon-green font-mono" 
                          data-server-time="<?php echo time(); ?>"
                          data-timezone="UTC">
                          ---
                    </span>
                </div>
                <div class="flex items-center space-x-1">
                    <span class="text-gray-400">Игровое:</span>
                    <span id="gameTimeDisplay" class="text-neon-green font-mono">---</span>
                </div>
            </div>
			
			
        </div>

        <div id="modalOverlay" class="fixed inset-0 modal-backdrop hidden z-50 flex items-center justify-center p-4">
            <div class="bg-black/80 backdrop-blur-md rounded-2xl border border-neon-blue/50 w-full max-w-md max-h-[80vh] flex flex-col">
                <div class="sticky top-0 bg-black/50 p-4 border-b border-neon-blue/30 flex justify-between items-center flex-shrink-0">
                    <h2 id="modalTitle" class="text-xl font-bold text-neon-blue">Раздел</h2>
                    <button onclick="closeModal()" class="text-mars-red hover:text-red-400 text-2xl">×</button>
                </div>
                <div id="modalContent" class="p-4 overflow-y-auto flex-1">
                    </div>
            </div>
        </div>
    </div>

    <audio id="soundClick" preload="auto">
        <source src="click.mp3" type="audio/mpeg">
    </audio>
    <audio id="soundNotification" preload="auto">
        <source src="notification.mp3" type="audio/mpeg">
    </audio>
    <audio id="soundSuccess" preload="auto">
        <source src="/success.wav" type="audio/mpeg">
    </audio>
    <audio id="soundError" preload="auto">
        <source src="error.mp3" type="audio/mpeg">
    </audio>

    <audio id="backgroundMusic" preload="auto"></audio>
<script>
    // Инъекция версии игры в глобальную область видимости JS
    window.GAME_VERSION = "<?php echo GAME_VERSION; ?>";
</script>
    <script src="auth.js?v=<?php echo GAME_VERSION; ?>"></script>
    <script src="main.js?v=<?php echo GAME_VERSION; ?>"></script>
    <script src="buildings.js?v=<?php echo GAME_VERSION; ?>"></script>
    <script src="business.js?v=<?php echo GAME_VERSION; ?>"></script>
    <script src="residents.js?v=<?php echo GAME_VERSION; ?>"></script>
    <script src="alliance.js?v=<?php echo GAME_VERSION; ?>"></script>
    <script src="rating.js?v=<?php echo GAME_VERSION; ?>"></script>
    <script src="online.js?v=<?php echo GAME_VERSION; ?>"></script>
    <script src="chat.js?v=<?php echo GAME_VERSION; ?>"></script>
    <script src="news.js?v=<?php echo GAME_VERSION; ?>"></script>
    <script src="help.js?v=<?php echo GAME_VERSION; ?>"></script>
    <script src="settings.js?v=<?php echo GAME_VERSION; ?>"></script>
    <script src="profile.js?v=<?php echo GAME_VERSION; ?>"></script>
    <script src="admin.js?v=<?php echo GAME_VERSION; ?>"></script>
    <script src="tutorial.js?v=<?php echo GAME_VERSION; ?>"></script>
    <script src="sounds.js?v=<?php echo GAME_VERSION; ?>"></script>
    <script src="boosts.js?v=<?php echo GAME_VERSION; ?>"></script>
	<script src="market.js?v=<?php echo GAME_VERSION; ?>"></script>
	<script src="payment.js?v=<?php echo GAME_VERSION; ?>"></script> <script>
    let starInterval = null; // Для управления интервалом появления звезд

    // Улучшенное создание звезд для фона
    document.addEventListener('DOMContentLoaded', function() {
        const starsContainer = document.getElementById('stars-container');
        const starCount = 150;
        
        // Создаем мерцающие звезды разных размеров
        for (let i = 0; i < starCount; i++) {
            const star = document.createElement('div');
            const size = Math.random();
            
            if (size > 0.7) {
                star.className = 'star star-large';
            } else if (size > 0.4) {
                star.className = 'star star-medium';
            } else {
                star.className = 'star star-small';
            }
            
            star.style.left = Math.random() * 100 + '%';
            star.style.top = Math.random() * 100 + '%';
            star.style.animationDelay = Math.random() * 5 + 's';
            star.style.animationDuration = (3 + Math.random() * 4) + 's';
            starsContainer.appendChild(star);
        }
        
        // Запускаем цикл создания падающих звезд
        startShootingStarCycle();
    });
    
    // Функция создания одной реалистичной падающей звезды
    function createShootingStar() {
        const starsContainer = document.getElementById('stars-container');
        if (!starsContainer) return;
        
        const shootingStar = document.createElement('div');
        shootingStar.className = 'shooting-star';
        
        // 1. Угол падения (наиболее реалистичный диапазон: падение вниз-вправо)
        // Выбираем случайное падение, преимущественно вправо (140-220 градусов)
        const rotation = 140 + Math.random() * 80; 
        
        // 2. Время полета (медленнее: 7-12 секунд)
        const duration = 7 + Math.random() * 5; 
        
        // 3. Дистанция полета (2500px гарантированно пересекает экран и дает запас на затухание)
        const distance = 2500; 
        
        // 4. Расчет стартовой позиции (Звезда должна начинаться ЗА пределами экрана)
        
        // Выбираем случайную точку на верхней (70% шанс) или правой (30% шанс) границе
        const startEdge = Math.random();
        let startX, startY;

        if (startEdge < 0.7) {
            // Верхний край
            // x: от -20% до 120% экрана
            startX = -20 + Math.random() * 140; 
            // y: -20% высоты (гарантированно за пределами)
            startY = -20; 
        } else {
            // Правый край
            // x: 120% ширины (гарантированно за пределами)
            startX = 120;
            // y: от -20% до 80% высоты
            startY = -20 + Math.random() * 100;
        }
        
        // 5. Применение CSS переменных
        shootingStar.style.setProperty('--rotation', rotation + 'deg');
        shootingStar.style.setProperty('--duration', duration + 's');
        shootingStar.style.setProperty('--delay', '0s'); // Задержка 0, интервал контролируется JS
        shootingStar.style.setProperty('--distance', distance + 'px');
        
        // Стартовая позиция
        shootingStar.style.left = startX + '%';
        shootingStar.style.top = startY + '%';
        
        starsContainer.appendChild(shootingStar);
        
        // 6. Удаляем падающую звезду после завершения анимации
        const totalTimeMs = duration * 1000;
        
        setTimeout(() => {
            if (shootingStar.parentNode) {
                shootingStar.remove();
            }
            // 7. Перезапускаем цикл после удаления
            startShootingStarCycle(); 
        }, totalTimeMs);
    }
    
    // Функция запуска цикла создания падающих звезд с рандомным интервалом
    function startShootingStarCycle() {
        // Рандомный интервал от 500 мс (0.5 сек) до 1000 мс (1 сек)
        const nextDelay = 500 + Math.random() * 1000; 
        
        // Очищаем старый интервал, если он есть (для безопасности)
        if (starInterval) {
            clearTimeout(starInterval);
        }
        
        // Устанавливаем новый таймер для создания звезды
        starInterval = setTimeout(() => {
            createShootingStar();
        }, nextDelay);
    }
</script>

</body>
</html>
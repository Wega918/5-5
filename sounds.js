// Система звуковых эффектов
console.log('🔊 Модуль звуков загружен');

// Настройки звука
let soundEnabled = true;

// --- НОВЫЕ СТАТУСНЫЕ ПЕРЕМЕННЫЕ ДЛЯ BGM ---
let bgmAutoPlayBlocked = false; // Флаг, указывающий, что браузер заблокировал BGM
let bgmUserPaused = false;      // Флаг, указывающий, что пользователь сам поставил паузу (через настройки)
// ------------------------------------------

// --- КОНСТАНТЫ И ПЕРЕМЕННЫЕ ДЛЯ ФОНОВОЙ МУЗЫКИ ---
const BGM_VOLUME = 0.1; // 10% громкости
const BGM_TRACKS = [
    // !!! ЗАМЕНИТЕ ЭТОТ СПИСОК НА ИМЕНА ВАШИХ ФАЙЛОВ ФОНОВОЙ МУЗЫКИ !!!
    '1.mp3', 
    '2.mp3',
    '3.mp3' 
];
let currentTrackIndex = -1; // ИЗМЕНЕНО: Инициализируем -1, чтобы первый трек был рандомным.
let bgmAudio = null;
// --------------------------------------------------------

// Инициализация звуков
function initSounds() {
    // 1. Проверяем сохраненные настройки пользователя
    const settings = JSON.parse(localStorage.getItem('gameSettings') || '{}');
    soundEnabled = settings.sound !== false; 
    
    // 2. Инициализация фоновой музыки
    initBGM(); 

    // 3. Обработчик первого взаимодействия для обхода блокировки браузером
    document.addEventListener('click', handleFirstInteraction, { once: true });
    document.addEventListener('touchstart', handleFirstInteraction, { once: true });
    
    // 4. --- НОВОЕ: Обработчик смены видимости вкладки ---
    document.addEventListener('visibilitychange', handleVisibilityChange);
    // -----------------------------------------------------
}

// --- ФУНКЦИЯ: Обработка первого взаимодействия пользователя ---
function handleFirstInteraction() {
    // Если BGM была заблокирована при загрузке И звук включен в настройках
    if (bgmAutoPlayBlocked && soundEnabled && bgmAudio && bgmAudio.paused && !bgmUserPaused) {
        console.log('🎶 Обнаружено первое взаимодействие пользователя, попытка запустить BGM...');
        // Попытка возобновить/начать воспроизведение
        playNextTrack(true); 
    }
}
// ------------------------------------------------------------

// --- НОВАЯ ФУНКЦИЯ: Управление воспроизведением при смене видимости ---
function handleVisibilityChange() {
    if (!bgmAudio || bgmUserPaused) return;

    if (document.hidden) {
        // Вкладка неактивна (свернута, переключена, заблокирована)
        if (!bgmAudio.paused) {
            bgmAudio.pause();
            console.log('🎶 Музыка приостановлена (вкладка скрыта).');
        }
    } else {
        // Вкладка снова активна
        if (soundEnabled) {
            bgmAudio.play().catch(e => {
                console.log('🔊 Возобновление BGM заблокировано:', e);
            });
            console.log('🎶 Музыка возобновлена (вкладка активна).');
        }
    }
}
// ----------------------------------------------------------------------


// --- ФУНКЦИЯ: Инициализация BGM ---
function initBGM() {
    // Получаем элемент BGM (из index.php)
    bgmAudio = document.getElementById('backgroundMusic');

    if (!bgmAudio) {
        bgmAudio = new Audio();
        bgmAudio.id = 'backgroundMusic';
        document.body.appendChild(bgmAudio);
    }

    // Установка дефолтной громкости 10%
    bgmAudio.volume = BGM_VOLUME;

    // Настраиваем событие окончания трека для переключения на следующий
    bgmAudio.removeEventListener('ended', playNextTrack); 
    bgmAudio.addEventListener('ended', playNextTrack);
    
    // Если звук включен в настройках, пытаемся запустить первый трек (может быть заблокировано)
    if (soundEnabled) {
        if (bgmAudio.src === '' || bgmAudio.paused) { 
             playNextTrack(); // Попытка запуска
        }
    } else {
        bgmAudio.pause();
        bgmUserPaused = true; // Считаем, что пользователь выключил звук при инициализации
    }
}
// --- КОНЕЦ ФУНКЦИИ initBGM ---


// --- ФУНКЦИЯ: Воспроизведение следующего трека (Теперь рандомное) ---
function playNextTrack(forcePlayFromSource = false) {
    // Если звук выключен пользователем, не пытаемся играть
    if (!soundEnabled || bgmUserPaused) {
        return;
    }

    if (!bgmAudio) {
        initBGM();
        if (!bgmAudio) return;
    }
    
    // ЛОГИКА РАНДОМНОГО ВЫБОРА ТРЕКА
    let shouldPickNewTrack = (!bgmAudio.src || !bgmAudio.paused || forcePlayFromSource);

    if (shouldPickNewTrack) {
        let newIndex;
        
        // 1. Выбираем случайный индекс, отличный от текущего (если треков > 1)
        if (BGM_TRACKS.length > 1) {
            do {
                newIndex = Math.floor(Math.random() * BGM_TRACKS.length);
            } while (newIndex === currentTrackIndex);
        } else {
            newIndex = 0; // Если только один трек
        }
        
        // 2. Устанавливаем новый трек
        currentTrackIndex = newIndex;
        bgmAudio.src = BGM_TRACKS[currentTrackIndex];
        console.log(`🎶 Воспроизведение BGM: ${BGM_TRACKS[currentTrackIndex]}`);
    }
    
    // Начинаем воспроизведение
    bgmAudio.play().then(() => {
        // Успешное воспроизведение (в том числе после взаимодействия)
        bgmAutoPlayBlocked = false;
        console.log('🎶 BGM успешно запущена.');
    }).catch(e => {
         // Браузеры блокируют автовоспроизведение
         bgmAutoPlayBlocked = true;
         console.log('🔊 Автовоспроизведение BGM заблокировано браузером. Требуется взаимодействие пользователя или активация вкладки:', e.name);
    });
}
// --- КОНЕЦ ФУНКЦИИ playNextTrack ---


// Воспроизведение звука (оставляем звуковые эффекты на громкости 0.3)
function playSound(type) {
    if (!soundEnabled) return;
    
    const soundMap = {
        'click': 'soundClick',
        'success': 'soundSuccess',
        'error': 'soundError',
        'notification': 'soundNotification'
    };
    
    const soundId = soundMap[type];
    if (soundId) {
        const audio = document.getElementById(soundId);
        if (audio) {
            audio.currentTime = 0;
            audio.volume = 0.3;
            audio.play().catch(e => {
                console.log('Звук не может быть воспроизведен:', e);
            });
        }
    }
}

// Включение/отключение звука (Модифицирована для BGM)
function toggleSound(enabled) {
    soundEnabled = enabled;
    
    // Обновляем флаг, чтобы знать, что это было действие пользователя
    bgmUserPaused = !enabled;
    
    // Управление фоновой музыкой
    if (!bgmAudio) {
        initBGM(); 
    }
    
    if (bgmAudio) {
        if (enabled) {
            // Если включено, пытаемся возобновить
            if (bgmAudio.paused) {
                 if (bgmAudio.src === '') {
                     playNextTrack();
                 } else {
                     // Устанавливаем forcePlayFromSource=true, чтобы просто продолжить
                     playNextTrack(true); 
                 }
            }
        } else {
            // Если выключено, ставим на паузу немедленно
            bgmAudio.pause();
        }
    }
    
    // Сохраняем настройку в localStorage
    const settings = JSON.parse(localStorage.getItem('gameSettings') || '{}');
    settings.sound = enabled;
    localStorage.setItem('gameSettings', JSON.stringify(settings));
}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', initSounds);
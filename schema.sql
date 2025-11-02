-- База данных для игры "Выживание на Марсе"
CREATE DATABASE IF NOT EXISTS mars_survival CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE mars_survival;

-- Таблица игроков
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    colony_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Ресурсы поселения
    money BIGINT DEFAULT 200,
    water INT DEFAULT 50,
    food INT DEFAULT 50,
    oxygen INT DEFAULT 50,
    electricity INT DEFAULT 20,
    materials INT DEFAULT 50,
    rubies INT DEFAULT 0,
    
    -- Жители
    residents_waiting INT DEFAULT 5,
    residents_settled INT DEFAULT 0,
    residents_working INT DEFAULT 0,
    residents_deaths INT DEFAULT 0,
	
    -- Время последнего сбора ресурсов
    last_income_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Система администрации
    role ENUM('user', 'moderator', 'admin') DEFAULT 'user',
    muted_until TIMESTAMP NULL DEFAULT NULL,
    blocked_until TIMESTAMP NULL DEFAULT NULL,
    
    -- Профиль
    profile_description TEXT,
    profile_avatar VARCHAR(255) DEFAULT NULL
);

-- Таблица бизнесов игрока
CREATE TABLE user_businesses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    business_type INT NOT NULL, -- 1-4 типы бизнесов
    level INT DEFAULT 1,
    count INT DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_business (user_id, business_type)
);

-- Таблица построек игрока
CREATE TABLE user_buildings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    building_type INT NOT NULL, -- 1=шахта, 2=очиститель, 3=ферма, 4=генератор, 5=жилой, 6=кислород
    level INT DEFAULT 1,
    count INT DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_building (user_id, building_type)
);

-- Таблица союзов
CREATE TABLE alliances (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    leader_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (leader_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Участники союзов
CREATE TABLE alliance_members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    alliance_id INT NOT NULL,
    user_id INT NOT NULL,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (alliance_id) REFERENCES alliances(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_membership (user_id)
);

-- Чат сообщения
CREATE TABLE chat_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    deleted_by INT NULL DEFAULT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (deleted_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Личные сообщения
CREATE TABLE private_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    from_user_id INT NOT NULL,
    to_user_id INT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP NULL DEFAULT NULL,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    deleted_by INT NULL DEFAULT NULL,
    FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (to_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (deleted_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Новости игры
CREATE TABLE news (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    created_by INT DEFAULT NULL,
    is_notification BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Настройки пользователя
CREATE TABLE user_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    notifications BOOLEAN DEFAULT TRUE,
    sound BOOLEAN DEFAULT TRUE,
    language VARCHAR(10) DEFAULT 'ru',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_settings (user_id)
);

-- Уведомления пользователей
CREATE TABLE user_notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    news_id INT NOT NULL,
    read_at TIMESTAMP NULL DEFAULT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (news_id) REFERENCES news(id) ON DELETE CASCADE,
    UNIQUE KEY unique_notification (user_id, news_id)
);

-- Создание первого администратора (логин: admin, пароль: admin123)
INSERT INTO users (username, email, password_hash, colony_name, role, money, water, food, oxygen, electricity, materials, rubies) VALUES 
('admin', 'admin@mars.game', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Центр Управления', 'admin', 10000, 1000, 1000, 1000, 1000, 1000, 100);

-- Вставка тестовых новостей
INSERT INTO news (title, content) VALUES 
('Добро пожаловать на Марс!', 'Начните свое путешествие по колонизации красной планеты. Стройте, развивайтесь и выживайте!'),
('Обновление системы бизнесов', 'Добавлены новые возможности для развития экономики вашего поселения.'),
('Система союзов активна', 'Теперь вы можете объединяться с другими игроками для совместного развития.');
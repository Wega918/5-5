<?php
session_start();
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Конфигурация базы данных
define('DB_HOST', 'localhost');
define('DB_USER', 'sergivan1_colony');
define('DB_PASS', 'j2eJeQLj8QkkF1');
define('DB_NAME', 'sergivan1_colony');

// ==========================================================
// --- 0. ГЛОБАЛЬНЫЕ НАСТРОЙКИ ОБНОВЛЕНИЯ (ЦЕНТРАЛЬНАЯ КОНСТАНТА) ---
// ==========================================================

// Частота обновления ресурсов и интерфейса в реальных секундах
define('UPDATE_INTERVAL_SECONDS', 1.5); 

// ==========================================================
// --- 1. КОНСТАНТЫ ПОТРЕБЛЕНИЯ И СМЕРТНОСТИ (MORTALITY WEIGHTS) ---
// ==========================================================

// Константы потребления ресурсов (в час на 1 жителя)
define('CONSUMPTION_WATER', 0.3); 
define('CONSUMPTION_FOOD', 0.2);  
define('CONSUMPTION_OXYGEN', 0.4);

// Константы потребления электричества (в час на 1 постройку)
define('CONSUMPTION_ELECTRICITY_BASE', 0.67); // Базовое потребление для большинства зданий
define('CONSUMPTION_ELECTRICITY_MINE', 1.0); // Потребление для Шахты

// Веса смертности: Определяют максимальный шанс смерти при полном исчерпании 6-минутного буфера
// Кислород (0.20) > Вода (0.15) > Еда (0.05) - для отражения реальной критичности
define('MORTALITY_WEIGHT_OXYGEN', 0.20); // 20% максимального шанса при полном дефиците
define('MORTALITY_WEIGHT_WATER', 0.15);  // 15% максимального шанса
define('MORTALITY_WEIGHT_FOOD', 0.05);   // 5% максимального шанса

// ==========================================================
// --- 1. КОНСТАНТЫ СЧАСТЬЯ И РИСКОВ (ДОБАВЛЕНО) ---
// ==========================================================
// Время в реальных минутах, при котором достигается 100% счастья (2 часа)
define('HAPPINESS_MAX_TIME_MIN', 120.0);
// Время в реальных минутах, при котором начинается смертность (6 минут)
define('MORTALITY_CRITICAL_TIME_MIN', 6);


// ==========================================================
// --- 3. КОНСТАНТЫ РЫНКА (MARKET CONSTANTS) ---
// ==========================================================
// Фиксированные курсы Рубинов (Монеты/ед.)
define('RUBY_SELL_PRICE', 30000.00); // Цена продажи 1 Рубина
define('RUBY_BUY_PRICE', 100000.00); // Цена покупки 1 Рубина (высокая)
function getMarketConstants() {
     return [
        'sell' => RUBY_SELL_PRICE,
        'buy' => RUBY_BUY_PRICE
    ];
}


// ==========================================================
// --- 4. КОНСТАНТЫ РЕАЛЬНЫХ ПЛАТЕЖЕЙ (NEW) ---
// ==========================================================

// Курсы: Базовый курс 1 RUB = X UAH (для упрощения расчетов, где 1 RUB = 10 копеек)
define('RUBY_BASE_PRICE_RUB', 1.00); // ИЗМЕНЕНО: 1 Рубин = 1 RUB
define('UAH_TO_RUB_RATE', 2.50); // Курс: 1 UAH = 2.50 RUB (для обратного расчета UAH)
define('RUBY_BASE_PRICE_UAH', RUBY_BASE_PRICE_RUB / UAH_TO_RUB_RATE); // 0.40 UAH

// Платежные данные (МОК-ДАННЫЕ)
define('PAYMENT_CARD_NUMBER', '5168 1111 2222 3333');
define('PAYMENT_CARD_HOLDER', 'IVAN I. I.');
define('PAYMENT_CARD_BANK', 'ПриватБанк');

function getRubyPackages() {
    return [
        // RUB пакеты: [Сумма RUB, Рубины, Бонус %]
        'rub' => [
            ['10', 10.0, 0],   
            ['50', 55.0, 10],  
            ['100', 115.0, 15], 
            ['500', 600.0, 20],  
            ['1000', 1250.0, 25], 
            ['2000', 2600.0, 30], 
            ['5000', 6750.0, 35], 
        ],

        // UAH пакеты: Расчет основан на 1 💎 = 0.40 UAH (1 RUB / 2.5 UAH/RUB)
        'uah' => [
            ['10', 25.0 * 1.0, 0], // 10 UAH / 0.40 UAH/💎 = 25 💎
            ['50', 125.0 * 1.1, 10],
            ['100', 250.0 * 1.15, 15],
            ['500', 1250.0 * 1.2, 20],
            ['1000', 2500.0 * 1.25, 25],
            ['2000', 5000.0 * 1.3, 30],
            ['5000', 12500.0 * 1.35, 35],
        ]
    ];
}
// END OF REAL PAYMENT CONSTANTS

// ==========================================================
// --- 5. КОНСТАНТЫ ПОСТРОЕК СОЮЗА (NEW) ---
// ==========================================================
define('ALLIANCE_BUILDING_COST_MULTIPLIER', 2.0); // Множитель стоимости Ур.
function getAllianceBuildingDefinitions() {
    // bonus_per_level - это множитель (например, 0.03 = 3%)
    return [
        1 => [ 'name' => 'Центр Логистики', 'effect' => 'Скидка на постройки', 'max_level' => 5, 'cost_base' => ['materials' => 500, 'rubies' => 50], 'bonus_per_level' => 0.03, 'icon' => '🚚', 'type' => 1 ], // Скидка на cost
        2 => [ 'name' => 'Общий Рынок', 'effect' => 'Усиление денежного дохода', 'max_level' => 5, 'cost_base' => ['materials' => 600, 'rubies' => 70], 'bonus_per_level' => 0.05, 'icon' => '📈', 'type' => 2 ], // Множитель income
        3 => [ 'name' => 'Иссл. Станция', 'effect' => 'Энергоэффективность', 'max_level' => 5, 'cost_base' => ['materials' => 700, 'rubies' => 90], 'bonus_per_level' => 0.04, 'icon' => '🧪', 'type' => 3 ], // Скидка на потребление Elec
        4 => [ 'name' => 'Тренировочный Полигон', 'effect' => 'Эффективность труда', 'max_level' => 5, 'cost_base' => ['materials' => 800, 'rubies' => 100], 'bonus_per_level' => 0.05, 'icon' => '💪', 'type' => 4 ] // Бонус к workerEfficiency
    ];
}

function getAllianceBuildingCost($type, $targetLevel) {
    $defs = getAllianceBuildingDefinitions();
    if (!isset($defs[$type])) return [];
    $baseCosts = $defs[$type]['cost_base'];
    $cost = [];
    
    // Стоимость = Базовая * Уровень * Множитель
    foreach ($baseCosts as $resource => $amount) {
        $cost[$resource] = round($amount * $targetLevel * ALLIANCE_BUILDING_COST_MULTIPLIER, 2);
    }
    return $cost;
}

function getAllianceBuildings($allianceId) {
    $db = getDB();
    $stmt = $db->prepare("SELECT * FROM alliance_buildings WHERE alliance_id = ?"); 
    $stmt->bind_param("i", $allianceId);
    $stmt->execute();
    return $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
}
function getAllianceBonuses($userId) {
    $db = getDB();
    $defs = getAllianceBuildingDefinitions();
    $bonuses = [
        'cost_discount' => 1.0, // Скидка: 1.0 = 0% скидка, 0.9 = 10% скидка
        'money_income_multiplier' => 1.0,
        'electricity_consumption_multiplier' => 1.0, // Множитель: 1.0 = 0% снижение, 0.9 = 10% снижение потребления
        'worker_efficiency_multiplier' => 1.0,
    ];

    $stmt = $db->prepare("SELECT ab.building_type, ab.level FROM alliance_buildings ab 
                          JOIN alliance_members am ON ab.alliance_id = am.alliance_id 
                          WHERE am.user_id = ?");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $allianceBuildings = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

    // Начальный расчет скидки
    $totalDiscount = 0.0;
    
    foreach ($allianceBuildings as $b) {
        $type = $b['building_type'];
        $level = $b['level'];
        $bonus = $defs[$type]['bonus_per_level'] * $level;

        switch ($type) {
            case 1: // Центр Логистики (Скидка на cost)
                // Общая скидка суммируется до лимита
                $totalDiscount += $bonus;
                break;
            case 2: // Общий Рынок (Множитель income)
                $bonuses['money_income_multiplier'] += $bonus;
                break;
            case 3: // Иссл. Станция (Скидка на потребление Elec)
                // Снижение потребления: 1.0 - (бонус). Макс. 20% снижение.
                $bonuses['electricity_consumption_multiplier'] = max(0.80, $bonuses['electricity_consumption_multiplier'] * (1 - $bonus)); 
                break;
            case 4: // Тренировочный Полигон (Бонус к workerEfficiency)
                $bonuses['worker_efficiency_multiplier'] += $bonus;
                break;
        }
    }
    
    // Применение лимита скидки (макс. 15% скидка -> 0.85 множитель стоимости)
    $finalDiscountRate = min(0.15, $totalDiscount);
    $bonuses['cost_discount'] = 1.0 - $finalDiscountRate;
    
    return $bonuses;
}

// ==========================================================
// --- 2. КОНСТАНТЫ И ЛОГИКА БУСТОВ (NEW) ---
// ==========================================================
define('BOOST_TYPE_TIME_X2', 1);
define('BOOST_TYPE_INCOME', 2);
define('BOOST_TYPE_DISCOUNT', 3);
define('BOOST_TYPE_ELECTRICITY', 4);
define('BOOST_TYPE_GROWTH', 5);
define('BOOST_TYPE_INSTANT_INCOME', 6); 

function getBoostsDefinitions() {
    return [
        BOOST_TYPE_TIME_X2 => [
            'name' => '🚀 Ускорение времени x2', 
            'effect' => 'Удваивает скорость получения дохода.', 
            'duration' => 60, // минут
            'cost' => 4, // ИЗМЕНЕНО: 4 RUB
            'multiplier' => 2.0
        ],
        BOOST_TYPE_INCOME => [
            'name' => '💰 Мега-доход', 
            'effect' => 'Увеличивает денежный доход от всех бизнесов на +75%.', 
            'duration' => 240, // минут
            'cost' => 7, // ИЗМЕНЕНО: 7 RUB
            'multiplier' => 1.75
        ],
        BOOST_TYPE_DISCOUNT => [
            'name' => '🏗️ Эффективный инженер', 
            'effect' => 'Снижает стоимость покупки и улучшения построек и бизнесов на -30%.', 
            'duration' => 30, // минут
            'cost' => 8, // ИЗМЕНЕНО: 8 RUB
            'multiplier' => 0.70
        ],
        BOOST_TYPE_ELECTRICITY => [
            'name' => '💡 Энергетический щит', 
            'effect' => 'Удваивает эффективность электричества, игнорируя дефицит.', 
            'duration' => 120, // минут
            'cost' => 3, // ИЗМЕНЕНО: 3 RUB
            'multiplier' => 2.0
        ],
        BOOST_TYPE_GROWTH => [
            'name' => '👶 Демографический взрыв', 
            'effect' => 'Ускоряет рост жителей x5 и дает бонус +25 к Счастью.', 
            'duration' => 60, // минут
            'cost' => 2, // ИЗМЕНЕНО: 2 RUB
            'multiplier' => 5,
            'happiness_bonus' => 25
        ],
        BOOST_TYPE_INSTANT_INCOME => [
            'name' => '🛠️ Мгновенный доход', 
            'effect' => 'Мгновенно начисляет весь доход за 24 игровых часа.', 
            'duration' => 0, // мгновенный
            'cost' => 1, // ИЗМЕНЕНО: 1 RUB
            'hours' => 24
        ]
    ];
}

function getActiveBoosts() {
    if (!isset($_SESSION['user_id'])) return [];
    $db = getDB();
    
    // Удаляем просроченные бусты
    $db->query("DELETE FROM user_boosts WHERE end_time < NOW()");
    
    $sql = "SELECT * FROM user_boosts WHERE user_id = ? AND end_time > NOW()";
    $stmt = $db->prepare($sql);
    $stmt->bind_param("i", $_SESSION['user_id']);
    $stmt->execute();
    $activeBoosts = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    
    // Комбинируем с определениями
    $definitions = getBoostsDefinitions();
    foreach ($activeBoosts as &$boost) {
        $boost['info'] = $definitions[$boost['boost_type']] ?? null;
    }
    
    return $activeBoosts;
}

function applyBoostsToCost($cost, $activeBoosts) {
    $costMultiplier = 1.0;
    
    foreach ($activeBoosts as $boost) {
        if ($boost['boost_type'] == BOOST_TYPE_DISCOUNT) {
            $costMultiplier *= ($boost['info']['multiplier'] ?? 1.0);
        }
    }
    
    if ($costMultiplier < 1.0) {
        foreach ($cost as $resource => &$amount) {
            $amount = round($amount * $costMultiplier, 2);
        }
    }
    
    return $cost;
}

function purchaseBoost($boostType) {
    $definitions = getBoostsDefinitions();
    if (!isset($definitions[$boostType])) {
        return ['error' => 'Неверный тип буста'];
    }
    
    $boostInfo = $definitions[$boostType];
    $cost = $boostInfo['cost'];
    $durationMinutes = $boostInfo['duration'];
    $userId = $_SESSION['user_id'];
    
    $db = getDB();
    $user = getCurrentUser(); 
    
    if ($user['rubies'] < $cost) {
        return ['error' => 'Недостаточно рубинов'];
    }
    
    // Списание рубинов
    $stmt = $db->prepare("UPDATE users SET rubies = rubies - ? WHERE id = ?");
    $stmt->bind_param("ii", $cost, $userId);
    $stmt->execute();
    
    if ($boostType == BOOST_TYPE_INSTANT_INCOME) {
        $gameHours = $boostInfo['hours'];
        updateResources(time(), $gameHours * 60); 
        return ['success' => true, 'instant' => true];
    }
    
    // Временный буст: добавление в таблицу user_boosts
    $endTime = date('Y-m-d H:i:s', time() + ($durationMinutes * 60));
    
    // ON DUPLICATE KEY UPDATE для продления буста
    $stmt = $db->prepare("INSERT INTO user_boosts (user_id, boost_type, end_time) VALUES (?, ?, ?)
                          ON DUPLICATE KEY UPDATE end_time = DATE_ADD(end_time, INTERVAL ? MINUTE)");
    $stmt->bind_param("iisi", $userId, $boostType, $endTime, $durationMinutes);
    
    if ($stmt->execute()) {
        return ['success' => true, 'instant' => false];
    }
    
    return ['error' => 'Ошибка покупки буста'];
}
// END OF BOOST CORE FUNCTIONS


// Подключение к базе данных
function getDB() {
    static $connection = null;
    if ($connection === null) {
        $connection = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
        if ($connection->connect_error) {
            die("Ошибка подключения к БД: " . $connection->connect_error);
        }
        $connection->set_charset("utf8mb4");
    }
    return $connection;
}

// Безопасность - проверка авторизации
function checkAuth() {
    if (!isset($_SESSION['user_id'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Необходима авторизация']);
        exit;
    }
}

// Получение текущего пользователя
function getCurrentUser() {
    checkAuth();
    $db = getDB();
    $sql = "SELECT id, username, email, password_hash, colony_name, created_at, last_active, 
                   money, water, food, oxygen, electricity, materials, rubies, 
                   residents_waiting, residents_settled, residents_working, residents_deaths, 
                   last_income_time, last_growth_time, role, muted_until, blocked_until, profile_description, profile_avatar,
                   last_read_chat_timestamp 
            FROM users WHERE id = ?";
    $stmt = $db->prepare($sql);
    $stmt->bind_param("i", $_SESSION['user_id']);
    $stmt->execute();
    return $stmt->get_result()->fetch_assoc();
}

// Безопасный JSON ответ
function jsonResponse($data) {
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
}

// Валидация входных данных
function sanitizeInput($input) {
    return htmlspecialchars(trim($input), ENT_QUOTES, 'UTF-8');
}

// Регистрация пользователя
function registerUser($username, $email, $password, $colonyName) {
    $db = getDB();
    
    // Проверка существования пользователя
    $stmt = $db->prepare("SELECT id FROM users WHERE username = ? OR email = ?");
    $stmt->bind_param("ss", $username, $email);
    $stmt->execute();
    if ($stmt->get_result()->num_rows > 0) {
        return ['error' => 'Пользователь с таким именем или email уже существует'];
    }
    
    $passwordHash = password_hash($password, PASSWORD_DEFAULT);
    
    // Создание пользователя
    $stmt = $db->prepare("INSERT INTO users (username, email, password_hash, colony_name) VALUES (?, ?, ?, ?)");
    $stmt->bind_param("ssss", $username, $email, $passwordHash, $colonyName);
    
    if ($stmt->execute()) {
        $userId = $db->insert_id;
        
        // Создание настроек по умолчанию
        $stmt = $db->prepare("INSERT INTO user_settings (user_id) VALUES (?)");
        $stmt->bind_param("i", $userId);
        $stmt->execute();
        
        return ['success' => true, 'user_id' => $userId];
    }
    
    return ['error' => 'Ошибка при регистрации'];
}


// Авторизация пользователя
function loginUser($login, $password) {
    $db = getDB();
    $stmt = $db->prepare("SELECT id, password_hash FROM users WHERE username = ? OR email = ?");
    $stmt->bind_param("ss", $login, $login);
    $stmt->execute();
    $result = $stmt->get_result()->fetch_assoc();
    
    if ($result && password_verify($password, $result['password_hash'])) {
        $_SESSION['user_id'] = $result['id'];
        
        // Обновление времени последней активности
        $stmt = $db->prepare("UPDATE users SET last_active = NOW() WHERE id = ?");
        $stmt->bind_param("i", $result['id']);
        $stmt->execute();
        
        return ['success' => true];
    }
    
    return ['error' => 'Неверные данные для входа'];
}

// Выход из системы
function logoutUser() {
    session_destroy();
    return ['success' => true];
}


// --- НОВАЯ ФУНКЦИЯ: Расчет времени до истощения ресурса (в реальных минутах) ---
function calculateResourceFlow($user, $buildings, $businesses) {
    
    $activeBoosts = getActiveBoosts(); 
    $incomeMultiplier = 1.0; 
    $electricBoostMultiplier = 1.0; 

    foreach ($activeBoosts as $boost) { 
        if ($boost['boost_type'] == BOOST_TYPE_INCOME) {
            $incomeMultiplier *= ($boost['info']['multiplier'] ?? 1.0);
        }
        if ($boost['boost_type'] == BOOST_TYPE_ELECTRICITY) {
            $electricBoostMultiplier *= ($boost['info']['multiplier'] ?? 1.0);
        }
    }
    
    // --- ПОЛУЧЕНИЕ БОНУСОВ СОЮЗА (NEW) ---
    $allianceBonuses = getAllianceBonuses($user['id']);
    $moneyIncomeMultiplier = $incomeMultiplier * $allianceBonuses['money_income_multiplier']; // NEW: Комбинированный множитель дохода
    $workerEfficiencyMultiplier = $allianceBonuses['worker_efficiency_multiplier']; // NEW: Множитель эффективности труда
    $elecConsumpMultiplier = $allianceBonuses['electricity_consumption_multiplier']; // NEW: Множитель потребления Elec
    // -------------------------------------
    
    // 1. Расчет электропотребления и эффективности (За 1 час)
    $electricityConsumption = 0.0;
    foreach ($buildings as $building) {
        if ($building['building_type'] != 5) {
            $consumption = getBuildingElectricityConsumption($building['building_type'], $building['level']) * $building['count'];
            $electricityConsumption += $consumption * $elecConsumpMultiplier; // [MODIFIED] Применение скидки потребления
        }
    }
    
    $electricityIncome = 0.0;
    $generatorBuilding = array_filter($buildings, function($b) { return $b['building_type'] == 4; });
    
    if (!empty($generatorBuilding)) {
        foreach($generatorBuilding as $gb) {
            $electricityIncome += getBuildingIncome($gb['building_type'], $gb['level']) * $gb['count'];
        }
    }
    
    $netElectricity = $electricityIncome - $electricityConsumption;
    $electricityEfficiency = 1.0;
    
    if ($electricityConsumption > 0.0 && $netElectricity < 0.0) {
        $efficiencyRatio = $electricityIncome / $electricityConsumption;
        $electricityEfficiency = max(0.1, $efficiencyRatio);
    }
    
    $electricityEfficiency *= $electricBoostMultiplier;
    $electricityEfficiency = min(1.0, $electricityEfficiency);
    
    // 2. Расчет дохода (за 1 час)
    $moneyIncome = 0.0;
    $waterIncome = 0.0;
    $foodIncome = 0.0;
    $oxygenIncome = 0.0;
    $materialsIncome = 0.0;
    $rubiesIncome = 0.0;
    
    // Доходы от бизнесов
    $totalAssignedWorkers = 0;
    
    foreach ($businesses as $business) {
        $income = getBusinessIncome($business['business_type'], $business['level']);
        
        $workerEfficiency = 1.0;
        if (isset($business['workers_required']) && $business['workers_required'] > 0) {
            $workerEfficiency = (float)$business['workers_assigned'] / (float)$business['workers_required'];
            $workerEfficiency = min(1.0, $workerEfficiency); 
        }
        
        $workerEfficiency *= $workerEfficiencyMultiplier; // [MODIFIED] Применение множителя эффективности труда
        $workerEfficiency = min(1.0, $workerEfficiency); 
        
        // [MODIFIED] Применение общего множителя дохода (включает буст и бонус Союза)
        $moneyIncome += $income * $business['count'] * $electricityEfficiency * $workerEfficiency * $moneyIncomeMultiplier;
    }
    
    // Доходы от построек
    foreach ($buildings as $building) {
        $incomeOrCapacity = getBuildingIncome($building['building_type'], $building['level']);
        $count = $building['count'];
        $efficiency = $electricityEfficiency;
        
        switch ($building['building_type']) {
            case 1: 
                $materialsIncome += $incomeOrCapacity['materials'] * $count * $efficiency;
                $rubiesIncome += $incomeOrCapacity['rubies'] * $count * $efficiency;
                break;
            case 2: 
                $waterIncome += $incomeOrCapacity * $count * $efficiency;
                break;
            case 3: 
                $foodIncome += $incomeOrCapacity * $count * $efficiency;
                break;
            case 6: 
                $oxygenIncome += $incomeOrCapacity * $count * $efficiency;
                break;
        }
    }
    
    // 3. Расчет потребления (за 1 час)
    $totalResidents = (int)$user['residents_settled'];
    $waterConsumption = (float)$totalResidents * CONSUMPTION_WATER;
    $foodConsumption = (float)$totalResidents * CONSUMPTION_FOOD;
    $oxygenConsumption = (float)$totalResidents * CONSUMPTION_OXYGEN;
    
    // 4. Итоговый поток
    return [
        'money' => round($moneyIncome, 2),
        'water' => round($waterIncome - $waterConsumption, 2),
        'food' => round($foodIncome - $foodConsumption, 2),
        'oxygen' => round($oxygenIncome - $oxygenConsumption, 2),
        'electricity' => round($netElectricity, 2),
        'materials' => round($materialsIncome, 2),
        'rubies' => round($rubiesIncome, 4) 
    ];
}




// --- НОВАЯ ФУНКЦИЯ: Расчет времени до истощения ресурса (в реальных минутах) ---
function calculateResourceTimeRemaining($user, $buildings, $businesses) {
    $totalResidents = $user['residents_settled'];
    if ($totalResidents <= 0) {
        // Если жителей нет, ресурсы не расходуются
        return ['minTime' => PHP_INT_MAX, 'waterTime' => PHP_INT_MAX, 'foodTime' => PHP_INT_MAX, 'oxygenTime' => PHP_INT_MAX];
    }
    
    // Получаем текущий поток ресурсов (производство - потребление)
    // NOTE: Предполагается, что функция calculateResourceFlow() доступна
    $resourceFlow = calculateResourceFlow($user, $buildings, $businesses);

    $waterFlow = $resourceFlow['water'];
    $foodFlow = $resourceFlow['food'];
    $oxygenFlow = $resourceFlow['oxygen'];
    
    $timeRemainingWater = PHP_INT_MAX;
    $timeRemainingFood = PHP_INT_MAX;
    $timeRemainingOxygen = PHP_INT_MAX;
    
    // Расчет: если поток отрицательный (дефицит), рассчитываем, на сколько минут хватит запаса.
    // Время = (Запас / Абсолютное значение потока) * 60 (конвертация из часов в минуты)
    if ($waterFlow < 0) {
        $timeRemainingWater = max(0, $user['water'] / abs($waterFlow)) * 60;
    } else {
        // Если поток положительный, ресурса хватит навсегда
        $timeRemainingWater = PHP_INT_MAX;
    }
    if ($foodFlow < 0) {
        $timeRemainingFood = max(0, $user['food'] / abs($foodFlow)) * 60;
    } else {
        $timeRemainingFood = PHP_INT_MAX;
    }
    if ($oxygenFlow < 0) {
        $timeRemainingOxygen = max(0, $user['oxygen'] / abs($oxygenFlow)) * 60;
    } else {
        $timeRemainingOxygen = PHP_INT_MAX;
    }

    $minTimeRemaining = min($timeRemainingWater, $timeRemainingFood, $timeRemainingOxygen);
    
    return [
        'minTime' => $minTimeRemaining, 
        'waterTime' => $timeRemainingWater, 
        'foodTime' => $timeRemainingFood, 
        'oxygenTime' => $timeRemainingOxygen
    ];
}


// ==========================================================
// --- 2. ФУНКЦИЯ checkAndApplyMortality (ОБНОВЛЕНО: Только при критическом дефиците) ---
// ==========================================================

function checkAndApplyMortality($user) {
    if (!function_exists('getDB')) return 0;
    if (!function_exists('calculateResourceFlow')) return 0;
    if (!function_exists('getBuildings')) return 0;
    if (!function_exists('getBusinesses')) return 0;
    
    $totalResidents = $user['residents_settled'];
    if ($totalResidents <= 0) return 0;

    $db = getDB();

    // Получаем актуальное число назначенного персонала
    $stmt = $db->prepare("SELECT SUM(workers_assigned) as total_assigned FROM user_businesses WHERE user_id = ?");
    $stmt->bind_param("i", $_SESSION['user_id']);
    $stmt->execute();
    $totalAssignedWorkers = (int)($stmt->get_result()->fetch_assoc()['total_assigned'] ?? 0);

    // *ОБНОВЛЕННАЯ ЛОГИКА СМЕРТНОСТИ:*
    // Критический порог: ресурсы должны быть в запасе МЕНЕЕ чем на 6 минут
    $criticalThresholdMinutes = MORTALITY_CRITICAL_TIME_MIN; 
    
    // Получаем время, оставшееся до исчерпания критичного ресурса (в реальных минутах)
    $buildings = getBuildings($db);
    $businesses = getBusinesses($db);
    $metrics = calculateResourceTimeRemaining($user, $buildings, $businesses);
    $minTimeRemaining = $metrics['minTime'];

    // Если запасов хватает на больше, чем критическое время, смертность не применяется.
    if ($minTimeRemaining > $criticalThresholdMinutes) {
        return 0;
    }

    // Если запасов хватает на 0 минут, дефицит = 100%. Если на 6 минут, дефицит = 0%.
    $mortalityFactor = max(0, min(1.0, 1.0 - ($minTimeRemaining / $criticalThresholdMinutes)));
    
    // Определяем, какой ресурс самый критичный, для применения взвешенной вероятности
    $isWaterCritical = $metrics['waterTime'] < $criticalThresholdMinutes;
    $isFoodCritical = $metrics['foodTime'] < $criticalThresholdMinutes;
    $isOxygenCritical = $metrics['oxygenTime'] < $criticalThresholdMinutes;
    
    // --- РАСЧЕТ ВЕРОЯТНОСТИ СМЕРТНОСТИ С УЧТОМ ВЕСОВ ---
    
    $weightedProbabilityWater = $isWaterCritical ? $mortalityFactor * MORTALITY_WEIGHT_WATER : 0.0;
    $weightedProbabilityFood = $isFoodCritical ? $mortalityFactor * MORTALITY_WEIGHT_FOOD : 0.0;
    $weightedProbabilityOxygen = $isOxygenCritical ? $mortalityFactor * MORTALITY_WEIGHT_OXYGEN : 0.0;
    
    // Итоговая вероятность - это максимальная из взвешенных вероятностей
    $mortalityProbability = max($weightedProbabilityWater, $weightedProbabilityFood, $weightedProbabilityOxygen);

    // Ограничиваем вероятность максимумом 100%
    $mortalityProbability = min(1.0, $mortalityProbability);
    
    // 3. Определяем максимальное количество смертей за этот цикл (не более 10% населения, минимум 1)
    $maxDeathsPerCheck = max(1, ceil($totalResidents * 0.1));
    $residentsToKill = 0;

    // 4. Проводим случайную проверку для каждого жителя
    for ($i = 0; $i < $totalResidents; $i++) {
        if (mt_rand(0, 999) / 1000 < $mortalityProbability && $residentsToKill < $maxDeathsPerCheck) {
            $residentsToKill++;
        }
    }
    
    // --- КОНЕЦ РАСЧЕТА ВЕРОЯТНОСТИ СМЕРТНОСТИ ---

    if ($residentsToKill > 0) {
        // --- ЛОГИКА ПРИМЕНЕНИЯ СМЕРТИ (освобождение рабочих и обновление БД) ---
        $killedInWorking = min($totalAssignedWorkers, $residentsToKill);
        $workersToFree = $killedInWorking;
        
        if ($workersToFree > 0) {
            $stmt = $db->prepare("SELECT id, workers_assigned FROM user_businesses WHERE user_id = ? AND workers_assigned > 0 ORDER BY level DESC, count DESC");
            $stmt->bind_param("i", $_SESSION['user_id']);
            $stmt->execute();
            $businesses_to_free = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

            foreach ($businesses_to_free as $business) {
                if ($workersToFree <= 0) break;
                $assigned = $business['workers_assigned']; 
                $workersToRemoveFromThisBusiness = min($workersToFree, $assigned); 

                if ($workersToRemoveFromThisBusiness > 0) {
                    $newWorkersAssigned = $assigned - $workersToRemoveFromThisBusiness;
                    $updateStmt = $db->prepare("UPDATE user_businesses SET workers_assigned = ? WHERE id = ?");
                    $updateStmt->bind_param("ii", $newWorkersAssigned, $business['id']);
                    $updateStmt->execute();
                    $workersToFree -= $workersToRemoveFromThisBusiness;
                }
            }
        }
        
        $newResidentsSettled = max(0, $user['residents_settled'] - $residentsToKill);
        $newResidentsWorking = max(0, $user['residents_working'] - $killedInWorking);
        
        $stmt = $db->prepare("UPDATE users SET residents_settled = ?, residents_working = ?, residents_deaths = residents_deaths + ? WHERE id = ?");
        $stmt->bind_param("iiii", $newResidentsSettled, $newResidentsWorking, $residentsToKill, $_SESSION['user_id']);
        $stmt->execute();
        
        return $residentsToKill; 
    }
    
    return 0;
}


function getBuildings($db) {
    $stmt = $db->prepare("SELECT * FROM user_buildings WHERE user_id = ?");
    $stmt->bind_param("i", $_SESSION['user_id']);
    $stmt->execute();
    return $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
}

function getBusinesses($db) {
    $stmt = $db->prepare("SELECT * FROM user_businesses WHERE user_id = ?");
    $stmt->bind_param("i", $_SESSION['user_id']);
    $stmt->execute();
    return $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
}



// Расчет риска смертности на основе остатка ресурсов
function getMortalityRiskStatus($user) {
    $totalResidents = $user['residents_settled'];
    if ($totalResidents <= 0) {
        return ['status' => 'Нет жителей', 'color' => 'text-neon-green'];
    }

    $db = getDB();
    $businesses = getBusinesses($db);
    $buildings = getBuildings($db);
    $metrics = calculateResourceTimeRemaining($user, $buildings, $businesses);
    $minTimeRemaining = $metrics['minTime']; // в реальных минутах
    
    // Оценка риска
    if ($minTimeRemaining >= HAPPINESS_MAX_TIME_MIN) { // > 2 реальных часов
        $status = 'Отсутствует (2+ ч.)';
        $color = 'text-neon-green';
    } elseif ($minTimeRemaining >= 60) { // > 1 реального часа
        $status = 'Низкий (1+ ч.)';
        $color = 'text-yellow-400';
    } elseif ($minTimeRemaining >= MORTALITY_CRITICAL_TIME_MIN) { // >= 6 реальных минут
        $status = 'Средний (' . floor($minTimeRemaining) . ' мин.)';
        $color = 'text-orange-400';
    } elseif ($minTimeRemaining > 0) { // < 6 реальных минут
        $status = 'Высокий (' . round($minTimeRemaining, 1) . ' мин.)';
        $color = 'text-mars-red';
    } else {
        $status = 'Критический (Дефицит!)';
        $color = 'text-mars-red font-bold';
    }
    
    return ['status' => $status, 'color' => $color];
}

// ==========================================================
// --- ФУНКЦИЯ getColonyData (MODIFIED) ---
// ==========================================================

function getColonyData() {
    $user = getCurrentUser();
    $db = getDB(); 
    
    // 1. Обновление ресурсов перед проверкой
    updateResources(); 
    
    // Получение обновленных данных после income/consumption
    $user = getCurrentUser(); 
    
    // 2. Применение смертности
    $deaths = checkAndApplyMortality($user); 

    // Получение обновленных данных после смертности
    if ($deaths > 0) {
        $user = getCurrentUser(); 
    }
    
    // 3. Получение актуальных бизнесов и построек (нужны для расчета потока и счастья)
    $stmt = $db->prepare("SELECT * FROM user_businesses WHERE user_id = ?");
    $stmt->bind_param("i", $_SESSION['user_id']);
    $stmt->execute();
    $businesses = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

    $stmt = $db->prepare("SELECT * FROM user_buildings WHERE user_id = ?");
    $stmt->bind_param("i", $_SESSION['user_id']);
    $stmt->execute();
    $buildings = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

    // 4. Расчет потока и других показателей
    $resourceFlow = calculateResourceFlow($user, $buildings, $businesses);

    // ИСПРАВЛЕНО: calculateHappiness вызывается с правильными аргументами
    $happiness = calculateHappiness($user, $buildings, $businesses); 
    
    $mortalityRisk = getMortalityRiskStatus($user); 
    
    // 5. Активные бусты
    $activeBoosts = getActiveBoosts();

    // 6. Получение информации о союзе пользователя (MODIFIED)
    // NOTE: Предполагаем, что таблица `alliance_members` и `alliances` существуют
    $stmt = $db->prepare("SELECT am.alliance_id, a.leader_id FROM alliance_members am 
                          JOIN alliances a ON am.alliance_id = a.id 
                          WHERE am.user_id = ?");
    $stmt->bind_param("i", $user['id']);
    $stmt->execute();
    $allianceInfo = $stmt->get_result()->fetch_assoc();

    if ($allianceInfo) {
        $user['alliance_id'] = $allianceInfo['alliance_id'];
        $user['is_alliance_leader'] = ($allianceInfo['leader_id'] == $user['id']);
    } else {
        $user['alliance_id'] = null;
        $user['is_alliance_leader'] = false;
    }
    
    // 7. Получение приглашений в союзы (NEW)
    // NOTE: Предполагаем, что таблица `alliance_invitations` существует
    $stmt = $db->prepare("SELECT ai.alliance_id, a.name as alliance_name, u.colony_name as inviter_name 
                          FROM alliance_invitations ai
                          JOIN alliances a ON ai.alliance_id = a.id
                          JOIN users u ON ai.invited_by = u.id
                          WHERE ai.user_id = ?");
    $stmt->bind_param("i", $_SESSION['user_id']);
    $stmt->execute();
    $invitations = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    
    // 8. Получение активных бонусов союза (NEW)
    $allianceBonuses = getAllianceBonuses($user['id']);


    return [
        'user' => $user,
        'businesses' => $businesses,
        'buildings' => $buildings,
        'happiness' => $happiness,
        'mortality_risk' => $mortalityRisk,
        'resource_flow' => $resourceFlow,
        'active_boosts' => $activeBoosts,
        'alliance_invitations' => $invitations,
        'alliance_bonuses' => $allianceBonuses, // NEW

        // --- ПЕРЕДАЧА КОНСТАНТ В JAVASCRIPT ---
        'consumption' => [ 
            'water' => CONSUMPTION_WATER,
            'food' => CONSUMPTION_FOOD,
            'oxygen' => CONSUMPTION_OXYGEN,
            'electricity_base' => CONSUMPTION_ELECTRICITY_BASE,
            'electricity_mine' => CONSUMPTION_ELECTRICITY_MINE,
        ],
        // [НОВОЕ] Передача центральной константы обновления
        'update_interval_seconds' => UPDATE_INTERVAL_SECONDS
        // -------------------------------------
    ];
}


// Расчет счастья поселения
function calculateHappiness($user, $buildings, $businesses) {
    $db = getDB();
    $happiness = 50; // Базовое значение
    
    $activeBoosts = getActiveBoosts(); // NEW
    $happinessBonus = 0; // NEW

    foreach ($activeBoosts as $boost) { // NEW
        if ($boost['boost_type'] == BOOST_TYPE_GROWTH) {
            $happinessBonus += ($boost['info']['happiness_bonus'] ?? 25);
        }
    }
    $happiness += $happinessBonus; // NEW
    
    // --- НОВАЯ ЛОГИКА: Расчет фактического числа работающих ---
    $stmt = $db->prepare("SELECT SUM(workers_assigned) as total_assigned FROM user_businesses WHERE user_id = ?");
    $stmt->bind_param("i", $_SESSION['user_id']);
    $stmt->execute();
    $totalAssignedWorkers = (int)($stmt->get_result()->fetch_assoc()['total_assigned'] ?? 0);
    // ------------------------------------------------------------
    
    // 1. Достаток ресурсов (ВЕРНУТЬ: Влияет на счастье, даже если поток отрицательный)
    $metrics = calculateResourceTimeRemaining($user, $buildings, $businesses);
    $minTimeRemaining = $metrics['minTime']; // в реальных минутах

    if ($user['residents_settled'] > 0) {
        // Зависимость: 0 мин = 0, HAPPINESS_MAX_TIME_MIN = 30 очков.
        $resourceHappiness = ($minTimeRemaining / HAPPINESS_MAX_TIME_MIN) * 30;
        $happiness += min(30, max(0, $resourceHappiness));
    } else {
        $happiness = 100;
    }
    
    // 2. Безработица снижает счастье
    $unemployed = max(0, $user['residents_settled'] - $totalAssignedWorkers);
    // Снижает на 2 очка за безработного
    $happiness -= $unemployed * 2; 
    
    // 3. Электричество
    $totalBuildings = 0;
    foreach ($buildings as $building) {
        if ($building['building_type'] != 5) { // Жилые комплексы не потребляют электричество
            $totalBuildings += $building['count'];
        }
    }
    $electricityNeeded = $totalBuildings * CONSUMPTION_ELECTRICITY_BASE; 
    $resourceFlow = calculateResourceFlow($user, $buildings, $businesses);
    
    // 4. Проверка обеспеченности электричеством: сравниваем запас с потребностью 
    if ($user['electricity'] >= $electricityNeeded) {
        $happiness += 10;
    } else {
        $happiness -= 15;
    }
    
    // 5. Бонус за разнообразие бизнесов
    $businessTypes = count(array_filter($businesses, function($b) { return $b['count'] > 0; }));
    $happiness += $businessTypes * 3;
    
    // Ограничиваем значение от 0 до 100
    return max(0, min(100, $happiness));
}


function updateResources($manualCheckTime = null, $manualSecondsPassed = null) {
    $db = getDB();
    $user = getCurrentUser();
    
    $activeBoosts = getActiveBoosts(); // NEW
    $timeMultiplier = 1.0; // NEW
    $growthMultiplier = 1.0; // NEW

    foreach ($activeBoosts as $boost) { // NEW
        if ($boost['boost_type'] == BOOST_TYPE_TIME_X2) {
            $timeMultiplier *= ($boost['info']['multiplier'] ?? 2.0);
        }
        if ($boost['boost_type'] == BOOST_TYPE_GROWTH) {
            $growthMultiplier *= ($boost['info']['multiplier'] ?? 5.0);
        }
    }
    
    // Используем microtime(true) для более точного расчета прошедшего времени
    $currentTime = $manualCheckTime ?? microtime(true);
    $lastIncomeTime = strtotime($user['last_income_time']);
    
    // Вычисляем количество прошедших секунд
    $secondsPassed = $manualSecondsPassed ?? ($currentTime - $lastIncomeTime);
    
    // Применяем буст времени (если он не мгновенный)
    if (!$manualSecondsPassed) {
         $secondsPassed *= $timeMultiplier;
    }

    // [МОДИФИЦИРОВАНО] Устанавливаем порог на 90% интервала
    if (!$manualSecondsPassed && $secondsPassed < UPDATE_INTERVAL_SECONDS * 0.9) return;

    // --- ВЫСОКОТОЧНЫЙ РАСЧЕТ ВРЕМЕННОГО ФАКТОРА ---
    // 60 реальных секунд = 1 игровой час
    $gameHoursPassed = $secondsPassed / 60.0;
    // ---------------------------------------------

    // --- ПЕРЕНЕСЕНЫЙ БЛОК: Получение данных для дальнейших расчетов ---
    $stmt = $db->prepare("SELECT * FROM user_businesses WHERE user_id = ? AND count > 0");
    $stmt->bind_param("i", $_SESSION['user_id']);
    $stmt->execute();
    $businesses = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    
    $stmt = $db->prepare("SELECT * FROM user_buildings WHERE user_id = ? AND count > 0");
    $stmt->bind_param("i", $_SESSION['user_id']);
    $stmt->execute();
    $buildings = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    // ------------------------------------------------------------------

    // --- БЛОК: АВТОМАТИЧЕСКИЙ РОСТ ЖИТЕЛЕЙ (residents_waiting) ---
    $lastGrowthTime = strtotime($user['last_growth_time']);
    $secondsSinceLastGrowth = $currentTime - $lastGrowthTime; 

    if ($secondsSinceLastGrowth >= 1 && !$manualSecondsPassed) {
        
        $happiness = calculateHappiness($user, $buildings, $businesses);

        $baseGrowthPerHour = 1; 
        $maxGrowth = 10; 
        $growthRatePerHour = 0; 

        if ($happiness >= 80) {
            $growthRatePerHour = $baseGrowthPerHour * 4; 
        } elseif ($happiness >= 60) {
            $growthRatePerHour = $baseGrowthPerHour * 2; 
        } elseif ($happiness >= 40) {
            $growthRatePerHour = $baseGrowthPerHour * 1; 
        } else {
            $growthRatePerHour = 0; 
        }
        
        $growthRatePerHour *= $growthMultiplier; // Apply growth boost
        
        $growthPerSecond = $growthRatePerHour / 3600;
        $newResidents = floor($growthPerSecond * $secondsSinceLastGrowth);
        
        if ($newResidents > 0) {
            $newResidents = min($maxGrowth, $newResidents);
            
            $updateStmt = $db->prepare("UPDATE users SET residents_waiting = residents_waiting + ?, last_growth_time = NOW() WHERE id = ?");
            $updateStmt->bind_param("ii", $newResidents, $_SESSION['user_id']);
            $updateStmt->execute();
            
            $user = getCurrentUser();
        }
    }
    // --- КОНЕЦ БЛОКА АВТОМАТИЧЕСКОГО РОСТА ---
    
    $moneyIncome = 0;
    $waterIncome = 0;
    $foodIncome = 0;
    $oxygenIncome = 0;
    $electricityIncome = 0;
    $materialsIncome = 0;
    $rubiesIncome = 0;
    
// Расчет электропотребления
    $electricityConsumption = 0;
    foreach ($buildings as $building) {
        if ($building['building_type'] != 5) { 
            // ИСПОЛЬЗУЕМ УРОВЕНЬ
            $electricityConsumption += getBuildingElectricityConsumption($building['building_type'], $building['level']) * $building['count'] * $gameHoursPassed;
        }
    }
    
    // Проверка достаточности электричества
    $electricityEfficiency = 1.0;
    
    // Временно вызываем calculateResourceFlow для получения актуальной эффективности с учетом бустов
    $resourceFlow = calculateResourceFlow($user, $buildings, $businesses);
    
    // Сравниваем общее количество электроэнергии с тем, что потреблено за прошедшее время.
    if ($user['electricity'] < $electricityConsumption) {
        
        // Если электропотребление > 0, рассчитываем эффективность, иначе 1.0 (полная)
        if (($electricityConsumption / $gameHoursPassed) > 0) {
            $efficiencyRatio = $resourceFlow['electricity'] / ($electricityConsumption / $gameHoursPassed);
            $electricityEfficiency = min(1.0, max(0.1, $efficiencyRatio));
        }
    }
    
    // Доходы от бизнесов
    $incomeMultiplier = 1.0; // Recalculate income multiplier for this context
    foreach ($activeBoosts as $boost) {
        if ($boost['boost_type'] == BOOST_TYPE_INCOME) {
            $incomeMultiplier *= ($boost['info']['multiplier'] ?? 1.0);
        }
    }
    
    // --- ПОЛУЧЕНИЕ БОНУСОВ СОЮЗА (NEW) ---
    $allianceBonuses = getAllianceBonuses($user['id']);
    $moneyIncomeMultiplier = $incomeMultiplier * $allianceBonuses['money_income_multiplier']; // NEW: Комбинированный множитель дохода
    $workerEfficiencyMultiplier = $allianceBonuses['worker_efficiency_multiplier']; // NEW: Множитель эффективности труда
    $elecConsumpMultiplier = $allianceBonuses['electricity_consumption_multiplier']; // NEW: Множитель потребления Elec
    // -------------------------------------

    foreach ($businesses as $business) {
        $income = getBusinessIncome($business['business_type'], $business['level']);
        
        $workerEfficiency = 1.0;
        if (isset($business['workers_required']) && $business['workers_required'] > 0) {
            $workerEfficiency = $business['workers_assigned'] / $business['workers_required'];
            $workerEfficiency = min(1.0, $workerEfficiency); 
        } else {
            $workerEfficiency = 1.0; 
        }
        
        $workerEfficiency *= $workerEfficiencyMultiplier; // [MODIFIED] Применение множителя эффективности труда
        $workerEfficiency = min(1.0, $workerEfficiency); 
        
        // [MODIFIED] Применение общего множителя дохода (включает буст и бонус Союза)
        $moneyIncome += $income * $business['count'] * $gameHoursPassed * $electricityEfficiency * $workerEfficiency * $moneyIncomeMultiplier; // Use income multiplier
    }
    
    // Доходы от построек
    foreach ($buildings as $building) {
        // Доход/Емкость от постройки (getBuildingIncome)
        $incomeOrCapacity = getBuildingIncome($building['building_type'], $building['level']);
        $count = $building['count'];
        $efficiency = $electricityEfficiency;
        
        switch ($building['building_type']) {
            case 1: // Шахта
                $materialsIncome += $incomeOrCapacity['materials'] * $count * $gameHoursPassed * $efficiency;
                $rubiesIncome += $incomeOrCapacity['rubies'] * $count * $gameHoursPassed * $efficiency;
                break;
            case 2: // Очиститель воды
                $waterIncome += $incomeOrCapacity * $count * $gameHoursPassed * $efficiency;
                break;
            case 3: // Ферма
                $foodIncome += $incomeOrCapacity * $count * $gameHoursPassed * $efficiency;
                break;
            case 4: // Генератор
                $electricityIncome += $incomeOrCapacity * $count * $gameHoursPassed;
                break;
            case 6: // Генератор кислорода
                $oxygenIncome += $incomeOrCapacity * $count * $gameHoursPassed * $efficiency;
                break;
        }
    }
    
    // Потребление ресурсов жителями - ИСПОЛЬЗУЕМ КОНСТАНТЫ
    $totalResidents = $user['residents_settled'];
    $waterConsumption = $totalResidents * CONSUMPTION_WATER * $gameHoursPassed;
    $foodConsumption = $totalResidents * CONSUMPTION_FOOD * $gameHoursPassed;
    $oxygenConsumption = $totalResidents * CONSUMPTION_OXYGEN * $gameHoursPassed;
    
    // Обновление ресурсов в базе
    $newMoney = max(0, $user['money'] + $moneyIncome);
    $newWater = max(0, $user['water'] + $waterIncome - $waterConsumption);
    $newFood = max(0, $user['food'] + $foodIncome - $foodConsumption);
    $newOxygen = max(0, $user['oxygen'] + $oxygenIncome - $oxygenConsumption);
    // Применяем фактическое потребление
    $newElectricity = max(0, $user['electricity'] + $electricityIncome - ($electricityConsumption / $elecConsumpMultiplier) );
    $newMaterials = max(0, $user['materials'] + $materialsIncome);
    $newRubies = max(0, $user['rubies'] + $rubiesIncome);
    
    // Форматируем microtime(true) в нужный формат для MySQL
    $lastIncomeTimeFormatted = date('Y-m-d H:i:s', (int)$currentTime) . substr((string)($currentTime - (int)$currentTime), 1, 4);

    $stmt = $db->prepare("UPDATE users SET money = ?, water = ?, food = ?, oxygen = ?, electricity = ?, materials = ?, rubies = ?, last_income_time = ? WHERE id = ?");
    $stmt->bind_param("dddddddsi", $newMoney, $newWater, $newFood, $newOxygen, $newElectricity, $newMaterials, $newRubies, $lastIncomeTimeFormatted, $_SESSION['user_id']);
    $stmt->execute();
}

// Получение потребления электричества постройкой (ОБНОВЛЕНО)
function getBuildingElectricityConsumption($type, $level = 1) {
    // Базовое потребление (с уровнем 1)
    $baseConsumptions = [
        1 => CONSUMPTION_ELECTRICITY_MINE, // Шахта
        2 => CONSUMPTION_ELECTRICITY_BASE, // Очиститель воды
        3 => CONSUMPTION_ELECTRICITY_BASE, // Ферма
        4 => 0, // Генератор
        5 => 0, // Жилой комплекс
        6 => CONSUMPTION_ELECTRICITY_BASE  // Генератор кислорода
    ];
    
    $base = $baseConsumptions[$type] ?? CONSUMPTION_ELECTRICITY_BASE;
    
    // Новая логика: потребление масштабируется линейно с уровнем (Base * Level)
    if ($base > 0) {
        return round($base * $level, 2);
    }
    return 0;
}

// Получение дохода от бизнеса
function getBusinessIncome($type, $level) {
    $incomes = [
        1 => [1, 2, 3, 4, 5],
        2 => [2, 4, 6, 8, 10],
        3 => [4, 8, 16, 32, 64],
        4 => [8, 16, 32, 64, 128]
    ];
    
    return $incomes[$type][$level - 1] ?? 0;
}


/**
 * Рассчитывает кумулятивную стоимость для покупки нового юнита постройки.
 * Стоимость зависит от максимального достигнутого уровня и количества уже купленных юнитов.
 * * Логика: (Сумма стоимостей Ур. 1 до $maxLevel) * (2^$count) * $costMultiplier
 */
function getBuildingPurchaseCost($type, $maxLevel, $count) {
    $totalCost = ['money' => 0.0, 'materials' => 0.0, 'rubies' => 0.0];
    if ($maxLevel < 1) return $totalCost;

    // 1. Расчет базовой кумулятивной стоимости
    for ($l = 1; $l <= $maxLevel; $l++) {
        $stepCost = getBuildingCost($type, $l);
        foreach ($stepCost as $resource => $amount) {
            $totalCost[$resource] = ($totalCost[$resource] ?? 0.0) + (float)$amount;
        }
    }
    
    // 2. Применение множителя за количество (2^count)
    $multiplier = pow(2, $count);
    
    // --- ПРИМЕНЕНИЕ БОНУСОВ СОЮЗА (СКИДКА) ---
    $allianceBonuses = getAllianceBonuses($_SESSION['user_id']);
    $costMultiplier = $allianceBonuses['cost_discount'];
    // ----------------------------------------

    $finalCost = [];
    foreach ($totalCost as $resource => $amount) {
        // Применяем оба множителя: множитель количества и множитель скидки
        $finalCost[$resource] = round($amount * $multiplier * $costMultiplier, 2); 
    }
    
    // Удаляем ресурсы с нулевой стоимостью для чистоты
    foreach ($finalCost as $resource => $amount) {
        if ($amount == 0.0) { 
            unset($finalCost[$resource]);
        }
    }
    
    $activeBoosts = getActiveBoosts(); 
    return applyBoostsToCost($finalCost, $activeBoosts);
}


// Новый расчет требуемых рабочих
// Получение общего количества рабочих, необходимых для ОДНОГО юнита данного типа до заданного уровня
function getWorkersRequiredForUnit($type, $level) {
    if ($level < 1) return 0;
    // Формула: сумма (Тип + Уровень - 1) для L=1 до L=$level
    $required = 0;
    for ($l = 1; $l <= $level; $l++) {
        $required += ($type + $l - 1);
    }
    return $required;
}


// Получение требуемых рабочих для ОДНОГО юнита на заданном уровне
// Формула: Type + Level - 1
function getWorkersRequiredForLevel($type, $level) {
    if ($level < 1) return 0;
    return $type + $level - 1;
}

// Получение ДОПОЛНИТЕЛЬНЫХ рабочих, необходимых для улучшения ОДНОГО юнита до следующего уровня
// Рабочие для L(N+1) = Type + (N+1) - 1
function getAdditionalWorkersForUpgradeUnit($type, $currentLevel) {
    $nextLevel = $currentLevel + 1;
    return getWorkersRequiredForLevel($type, $nextLevel); 
}
function getBusinessCumulativeCost($type, $maxLevel) {
    $totalCost = 0;
    // Ограничиваем уровень 5
    $finalLevel = min(5, $maxLevel);
    
    for ($l = 1; $l <= $finalLevel; $l++) {
        $totalCost += getBusinessCost($type, $l); 
    }
    
    // [MODIFIED] Apply Alliance Cost Discount here for the final money cost
    $allianceBonuses = getAllianceBonuses($_SESSION['user_id']);
    $costMultiplier = $allianceBonuses['cost_discount'];
    $finalTotalCost = round($totalCost * $costMultiplier, 2);
    
    // Возвращаем как массив для совместимости с applyBoostsToCost
    $finalCost = ['money' => $finalTotalCost];
    
    $activeBoosts = getActiveBoosts(); // Apply Boosts
    return applyBoostsToCost($finalCost, $activeBoosts);
}

function getWorkersRequiredForUnitPurchase($type, $maxLevel) {
    $totalWorkers = 0;
    // Ограничиваем уровень 5
    $finalLevel = min(5, $maxLevel);
    
    for ($l = 1; $l <= $finalLevel; $l++) {
        // Рабочий для L=l требуется: Type + l - 1
        $totalWorkers += getWorkersRequiredForLevel($type, $l);
    }
    return $totalWorkers;
}

// Получение требуемых рабочих для ОДНОГО бизнеса данного уровня
function getWorkersRequiredPerUnit($level) {
    // 1 бизнес N-го уровня требует N рабочих
    return $level;
}

// Получение дохода от постройки
function getBuildingIncome($type, $level) {
    // Scaling factor (1.5 for each level after L1)
    $scalingFactor = pow(1.5, $level - 1);
    
    switch ($type) {
        case 1: // Шахта (Materials and Rubies)
            $base_materials = 2; 
            $base_rubies = 0.001;
            return [
                'materials' => round($base_materials * $scalingFactor, 2),
                'rubies' => round($base_rubies * $scalingFactor, 4)
            ];
        case 2: // Очиститель воды
            $base_income = 3;
            return round($base_income * $scalingFactor, 2);
        case 3: // Ферма
            $base_income = 2;
            return round($base_income * $scalingFactor, 2);
        case 4: // Генератор
            $base_income = 4;
            return round($base_income * $scalingFactor, 2);
        case 5: // Жилой комплекс (Capacity)
            $base_capacity = 5;
            // Use ceil() for integer places
            return (int)ceil($base_capacity * $scalingFactor);
        case 6: // Генератор кислорода
            $base_income = 3;
            return round($base_income * $scalingFactor, 2);
        default:
            return 0;
    }
}

// Получение стоимости бизнеса
function getBusinessCost($type, $level) {
    $costs = [
        1 => [1, 2, 3, 4, 5],
        2 => [10, 20, 40, 80, 100],
        3 => [100, 200, 400, 800, 1000],
        4 => [1000, 2000, 4000, 8000, 10000]
    ];
    
    return $costs[$type][$level - 1] ?? 0;
}

// Получение стоимости постройки
function getBuildingCost($type, $level) {
    $baseCosts = [
        1 => ['money' => 50, 'materials' => 10, 'rubies' => 1], // Шахта
        2 => ['money' => 30, 'materials' => 5], // Очиститель
        3 => ['money' => 40, 'materials' => 8], // Ферма
        4 => ['money' => 60, 'materials' => 12], // Генератор
        5 => ['money' => 80, 'materials' => 15], // Жилой комплекс
        6 => ['money' => 70, 'materials' => 10] // Генератор кислорода
    ];
    
    $cost = $baseCosts[$type];
    $multiplier = $level;
    
    foreach ($cost as &$value) {
        $value *= $multiplier;
    }
    
    return $cost;
}

// Проверка достаточности ресурсов
function hasEnoughResources($user, $cost) {
    foreach ($cost as $resource => $amount) {
        if ($user[$resource] < $amount) {
            return false;
        }
    }
    return true;
}

// Списание ресурсов
function deductResources($cost) {
    $db = getDB();
    $setParts = [];
    $values = [];
    
    foreach ($cost as $resource => $amount) {
        $setParts[] = "$resource = $resource - ?";
        $values[] = $amount;
    }
    
    $values[] = $_SESSION['user_id'];
    
    $sql = "UPDATE users SET " . implode(', ', $setParts) . " WHERE id = ?";
    $stmt = $db->prepare($sql);
    $stmt->bind_param(str_repeat('d', count($values) - 1) . 'i', ...$values);
    $stmt->execute();
}








// Проверяет наличие непрочитанных сообщений в общем и личном чатах
function getUnreadChatStatus() {
    $db = getDB();
    $user = getCurrentUser(); 
    $user_id = $user['id'];

    // 1. Проверка общего чата (используем chat_messages)
    // NOTE: Предполагается, что в таблице users есть колонка 'last_read_chat_timestamp'
    $last_read_timestamp = $user['last_read_chat_timestamp'] ?? '2000-01-01 00:00:00';
    
    // Считаем сообщения, которые новее, чем то, что читал пользователь, не удалены и не являются его собственными
    $sql_public = "SELECT COUNT(id) FROM chat_messages WHERE created_at > ? AND user_id != ? AND deleted_at IS NULL";
    $stmt_public = $db->prepare($sql_public);
    $stmt_public->bind_param("si", $last_read_timestamp, $user_id);
    $stmt_public->execute();
    $public_unread_count = $stmt_public->get_result()->fetch_row()[0];
    $stmt_public->close();

    // 2. Проверка личных сообщений (где to_user_id = user_id AND read_at IS NULL)
    $sql_private = "SELECT COUNT(id) FROM private_messages WHERE to_user_id = ? AND read_at IS NULL AND deleted_at IS NULL";
    $stmt_private = $db->prepare($sql_private);
    $stmt_private->bind_param("i", $user_id);
    $stmt_private->execute();
    $private_unread_count = $stmt_private->get_result()->fetch_row()[0];
    $stmt_private->close();
    
    return [
        'has_unread_chat' => $public_unread_count > 0,
        'has_unread_pm' => $private_unread_count > 0,
        'total_unread_count' => $public_unread_count + $private_unread_count
    ];
}

// Отмечает общий чат как прочитанный (обновляет timestamp в таблице users)
function updateLastReadChatTimestamp() {
    $db = getDB();
    $user_id = getCurrentUser()['id'];
    
    // Находим время самого последнего сообщения в общем чате
    $stmt = $db->prepare("SELECT MAX(created_at) FROM chat_messages WHERE deleted_at IS NULL");
    $stmt->execute();
    $latest_message_time = $stmt->get_result()->fetch_row()[0];
    $stmt->close();
    
    $update_time = $latest_message_time ?: date('Y-m-d H:i:s'); // Если чат пуст, используем NOW()

    $stmt = $db->prepare("UPDATE users SET last_read_chat_timestamp = ? WHERE id = ?");
    $stmt->bind_param("si", $update_time, $user_id);
    $stmt->execute();
    $stmt->close();
}

// Отмечает личные сообщения от конкретного пользователя как прочитанные (используем логику из profile.php)
function markPrivateMessagesAsRead($other_user_id) {
    $db = getDB();
    $user_id = getCurrentUser()['id'];
    
    // Логика из profile.php: UPDATE private_messages SET read_at = NOW() WHERE from_user_id = ? AND to_user_id = ? AND read_at IS NULL
    $stmt = $db->prepare("UPDATE private_messages SET read_at = NOW() WHERE from_user_id = ? AND to_user_id = ? AND read_at IS NULL");
    $stmt->bind_param("ii", $other_user_id, $user_id);
    $stmt->execute();
    $stmt->close();
}



// Проверяет наличие необработанных платежей для уведомления администратора
function getUnprocessedPaymentsCount() {
    if (!isset($_SESSION['user_id'])) return 0;
    $user = getCurrentUser();
    // Проверяем, является ли пользователь администратором
    if ($user['role'] !== 'admin') return 0;
    
    $db = getDB();
    
    // Status 0: Ожидает оплаты, 1: Оплачено (ожидает админа)
    $sql = "SELECT COUNT(id) AS count FROM user_payments WHERE status IN (0, 1)";
    $result = $db->query($sql);
    
    return (int)($result->fetch_assoc()['count'] ?? 0);
}

// [NEW] Отправка системного сообщения (SMS в личку)
function sendSystemPM($fromUserId, $toUserId, $message) {
    if (empty($message) || $toUserId < 1) {
        return ['error' => 'Неверные параметры сообщения'];
    }
    
    $db = getDB();
    
    // Отправка сообщения
    // NOTE: Предполагаем, что отправитель является системным аккаунтом (например, admin)
    $stmt = $db->prepare("INSERT INTO private_messages (from_user_id, to_user_id, message) VALUES (?, ?, ?)");
    $stmt->bind_param("iis", $fromUserId, $toUserId, $message);
    
    if ($stmt->execute()) {
        return ['success' => true];
    }
    
    return ['error' => 'Ошибка отправки системного сообщения'];
}




function getAllianceDataForUser($userId) {
    $db = getDB();
    $data = [
        'alliance' => null, // null if not in alliance
        'leader' => null,
        'members' => [],
        'buildings' => [],
        'contributions' => [
            'my_contribution' => ['rubies' => 0.0, 'materials' => 0.0],
            'total_contribution_rubies' => 0.0,
            'total_contribution_materials' => 0.0
        ]
    ];

    // 1. Проверить, состоит ли пользователь в Союзе, и получить ID Союза
    $stmt = $db->prepare("SELECT alliance_id FROM alliance_members WHERE user_id = ?");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    $membership = $result->fetch_assoc();

    if (!$membership) {
        // [FIX] Пользователь не в Союзе, возвращаем NULL
        return ['user_alliance' => null]; 
    }

    $allianceId = $membership['alliance_id'];

    // 2. Получить основную информацию о Союзе
    $stmt = $db->prepare("SELECT a.*, u.username AS leader_username FROM alliances a 
                          JOIN users u ON a.leader_id = u.id 
                          WHERE a.id = ?");
    $stmt->bind_param("i", $allianceId);
    $stmt->execute();
    $data['alliance'] = $stmt->get_result()->fetch_assoc();
    
    // Получить информацию о лидере
    if ($data['alliance']) {
        $data['leader'] = ['user_id' => $data['alliance']['leader_id'], 'username' => $data['alliance']['leader_username']];
        unset($data['alliance']['leader_username']); // Очистка
    } else {
        // Крайний случай: членство есть, но самого союза нет (ошибка БД)
        return ['user_alliance' => null];
    }


    // 3. Получить членов Союза
    $stmt = $db->prepare("SELECT u.id AS user_id, u.username, u.colony_name, am.joined_at FROM alliance_members am 
                          JOIN users u ON am.user_id = u.id 
                          WHERE am.alliance_id = ?");
    $stmt->bind_param("i", $allianceId);
    $stmt->execute();
    $data['members'] = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

    // 4. Получить постройки Союза
    $stmt = $db->prepare("SELECT building_type, level, count FROM alliance_buildings WHERE alliance_id = ?");
    $stmt->bind_param("i", $allianceId);
    $stmt->execute();
    $data['buildings'] = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    
    // 5. Получить информацию о взносах (вклад текущего игрока)
    $stmt = $db->prepare("SELECT SUM(rubies_amount) AS total_rubies, SUM(materials_amount) AS total_materials FROM alliance_contributions WHERE alliance_id = ? AND user_id = ?");
    $stmt->bind_param("ii", $allianceId, $userId);
    $stmt->execute();
    $myCont = $stmt->get_result()->fetch_assoc();
    if ($myCont) {
        $data['contributions']['my_contribution']['rubies'] = (float)$myCont['total_rubies'];
        $data['contributions']['my_contribution']['materials'] = (float)$myCont['total_materials'];
    }
    
    // Общий вклад
    $stmt = $db->prepare("SELECT SUM(rubies_amount) AS total_rubies, SUM(materials_amount) AS total_materials FROM alliance_contributions WHERE alliance_id = ?");
    $stmt->bind_param("i", $allianceId);
    $stmt->execute();
    $totalCont = $stmt->get_result()->fetch_assoc();
    if ($totalCont) {
        $data['contributions']['total_contribution_rubies'] = (float)$totalCont['total_rubies'];
        $data['contributions']['total_contribution_materials'] = (float)$totalCont['total_materials'];
    }

    return ['user_alliance' => $data];
}
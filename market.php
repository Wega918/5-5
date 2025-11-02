<?php
require_once 'func.php';

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Метод не поддерживается']);
    exit;
}

checkAuth();

$action = $_POST['action'] ?? '';

// Константы динамического расчета (в часах)
define('MARKET_CRISIS_TIME', 1.0); // Менее 1 часа запаса
define('MARKET_NORMAL_TIME', 10.0); // 10 - 50 часов запаса
define('MARKET_SURPLUS_TIME', 50.0); // Более 50 часов запаса

switch ($action) {
    case 'get_market_data':
        $result = getMarketData();
        jsonResponse($result);
        break;
        
    case 'trade_resource':
        $resource = sanitizeInput($_POST['resource'] ?? '');
        $type = sanitizeInput($_POST['type'] ?? ''); // 'buy' or 'sell'
        $amount = floatval($_POST['amount'] ?? 0);
        $result = tradeResource($resource, $type, $amount);
        jsonResponse($result);
        break;
        
    case 'trade_ruby':
        $type = sanitizeInput($_POST['type'] ?? ''); // 'buy' or 'sell'
        $amount = floatval($_POST['amount'] ?? 0);
        $result = tradeRuby($type, $amount);
        jsonResponse($result);
        break;
        
    default:
        jsonResponse(['error' => 'Неизвестное действие']);
}

// --- БАЗОВЫЕ ФУНКЦИИ РЫНКА ---

function getMarketData() {
    $data = getColonyData();
    $user = $data['user'];
    $buildings = $data['buildings'];
    $businesses = $data['businesses'];
    $flow = $data['resource_flow'];
    
    $tradableResources = ['water', 'food', 'oxygen', 'electricity', 'materials'];
    $marketData = ['resources' => []];

    // 1. Получаем время жизни (для воды, еды, кислорода)
    $timeRemaining = calculateResourceTimeRemaining($user, $buildings, $businesses);
    
    // 2. Рассчитываем время жизни/аккумуляции для Электричества и Материалов
    $flowElectricity = $flow['electricity'] ?? 0.0;
    $flowMaterials = $flow['materials'] ?? 0.0;
    
    $electricTime = PHP_INT_MAX;
    if ($flowElectricity < 0) {
        // Время до истощения (как для воды/еды)
        $electricTime = max(0, $user['electricity'] / abs($flowElectricity)) * 60; // в минутах
    }

    $materialsTime = PHP_INT_MAX;
    if ($flowMaterials <= 0) {
        // Если добыча нулевая или отрицательная, время накопления стремится к бесконечности.
        if ($flowMaterials < 0) {
             $materialsTime = 0;
        } else {
             $materialsTime = MARKET_NORMAL_TIME * 60;
        }
    } else {
        // Время, чтобы намайнить "много" (например, 50 часов производства)
        $targetStock = $flowMaterials * MARKET_SURPLUS_TIME;
        $materialsTime = ($user['materials'] / $flowMaterials) * 60; // Текущий запас в минутах производства
    }
    
    $marketResources = [
        'water' => ['time' => $timeRemaining['waterTime'] ?? PHP_INT_MAX, 'icon' => '💧', 'BMR' => 2.50],
        'food' => ['time' => $timeRemaining['foodTime'] ?? PHP_INT_MAX, 'icon' => '🍞', 'BMR' => 3.50],
        'oxygen' => ['time' => $timeRemaining['oxygenTime'] ?? PHP_INT_MAX, 'icon' => '🌬️', 'BMR' => 3.00],
        'electricity' => ['time' => $electricTime, 'icon' => '⚡', 'BMR' => 3.50],
        'materials' => ['time' => $materialsTime, 'icon' => '🪨', 'BMR' => 6.00],
    ];

    foreach ($marketResources as $res => $info) {
        $hours = $info['time'] / 60.0;
        $status = 'НОРМА';
        $buyMultiplier = 1.0;
        $sellMultiplier = 0.9;

        if ($hours < MARKET_CRISIS_TIME) {
            $status = 'КРИЗИС';
            $buyMultiplier = 2.0;
            $sellMultiplier = 0.5;
        } elseif ($hours <= MARKET_NORMAL_TIME) {
            $status = 'ДЕФИЦИТ';
            $buyMultiplier = 1.25;
            $sellMultiplier = 0.75;
        } elseif ($hours >= MARKET_SURPLUS_TIME) {
            $status = 'ИЗБЫТОК';
            $buyMultiplier = 1.0;
            $sellMultiplier = 0.8;
        }

        $marketData['resources'][$res] = [
            'icon' => $info['icon'],
            'status' => $status,
            'user_amount' => floatval($user[$res]),
            'buy_price' => round($info['BMR'] * $buyMultiplier, 2),
            'sell_price' => round($info['BMR'] * $sellMultiplier, 2),
            'flow_rate' => $flow[$res] ?? 0.0,
            'time_in_hours' => round($hours, 2)
        ];
    }
    
    // Рубины - фиксированные цены. Используем функцию, определенную в func.php
    $rubyRates = getMarketConstants();
    
    $marketData['rubies'] = [
        'sell_price' => $rubyRates['sell'],
        'buy_price' => $rubyRates['buy'],
        'user_amount' => floatval($user['rubies'])
    ];

    return $marketData;
}

function tradeResource($resource, $type, $amount) {
    if ($amount <= 0) return ['error' => 'Неверное количество'];
    if (!in_array($resource, ['water', 'food', 'oxygen', 'electricity', 'materials'])) {
        return ['error' => 'Неверный ресурс'];
    }

    $db = getDB();
    $user = getCurrentUser();
    $marketData = getMarketData();
    $rate = $marketData['resources'][$resource];

    if ($type === 'buy') {
        $cost = round($rate['buy_price'] * $amount, 2);
        $finalCostArray = ['money' => $cost];
        
        if (!hasEnoughResources($user, $finalCostArray)) {
            return ['error' => 'Недостаточно монет для покупки'];
        }

        // Транзакция
        deductResources($finalCostArray);
        $stmt = $db->prepare("UPDATE users SET $resource = $resource + ? WHERE id = ?");
        $stmt->bind_param("di", $amount, $_SESSION['user_id']);
        $stmt->execute();
        
        return ['success' => true, 'message' => "Куплено $amount {$rate['icon']} за $cost монет"];

    } elseif ($type === 'sell') {
        if ($user[$resource] < $amount) {
            return ['error' => 'Недостаточно ресурса для продажи'];
        }

        $income = round($rate['sell_price'] * $amount, 2);
        
        // Транзакция
        $stmt = $db->prepare("UPDATE users SET $resource = $resource - ?, money = money + ? WHERE id = ?");
        $stmt->bind_param("ddi", $amount, $income, $_SESSION['user_id']);
        $stmt->execute();

        return ['success' => true, 'message' => "Продано $amount {$rate['icon']} за $income монет"];
    }

    return ['error' => 'Неизвестный тип операции'];
}

function tradeRuby($type, $amount) {
    if ($amount <= 0) return ['error' => 'Неверное количество'];

    $db = getDB();
    $user = getCurrentUser();
    $rates = getMarketConstants(); 

    if ($type === 'sell') {
        if ($user['rubies'] < $amount) {
            return ['error' => 'Недостаточно рубинов для продажи'];
        }
        
        $income = round($rates['sell'] * $amount, 2);
        
        // Транзакция: Рубины -> Монеты
        $stmt = $db->prepare("UPDATE users SET rubies = rubies - ?, money = money + ? WHERE id = ?");
        $stmt->bind_param("ddi", $amount, $income, $_SESSION['user_id']);
        $stmt->execute();
        
        return ['success' => true, 'message' => "Продано {$amount}💎 за $income монет"];

    } elseif ($type === 'buy') {
        $cost = round($rates['buy'] * $amount, 2);
        $finalCostArray = ['money' => $cost];

        if (!hasEnoughResources($user, $finalCostArray)) {
            return ['error' => 'Недостаточно монет для покупки'];
        }

        // Транзакция: Монеты -> Рубины
        deductResources($finalCostArray);
        $stmt = $db->prepare("UPDATE users SET rubies = rubies + ? WHERE id = ?");
        $stmt->bind_param("di", $amount, $_SESSION['user_id']);
        $stmt->execute();

        return ['success' => true, 'message' => "Куплено {$amount}💎 за $cost монет"];
    }
    
    return ['error' => 'Неизвестный тип операции'];
}
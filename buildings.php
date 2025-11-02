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

switch ($action) {
    case 'get_buildings':
        $data = getColonyData();
        jsonResponse(['buildings' => $data['buildings']]);
        break;
        
    case 'buy_building':
        $type = intval($_POST['type'] ?? 0);
        $result = buyBuilding($type);
        jsonResponse($result);
        break;
        
    case 'upgrade_building':
        $type = intval($_POST['type'] ?? 0);
        $result = upgradeBuilding($type);
        jsonResponse($result);
        break;
        
    default:
        jsonResponse(['error' => 'Неизвестное действие']);
}

function buyBuilding($type) {
    if ($type < 1 || $type > 6) {
        return ['error' => 'Неверный тип постройки'];
    }
    
    $db = getDB();
    
    // 1. Определяем текущий уровень и количество для расчета стоимости
    $stmt = $db->prepare("SELECT level, count FROM user_buildings WHERE user_id = ? AND building_type = ?");
    $stmt->bind_param("ii", $_SESSION['user_id'], $type);
    $stmt->execute();
    $result = $stmt->get_result()->fetch_assoc();
    
    // Если постройка уже есть, новая будет того же уровня.
    $targetLevel = $result['level'] ?? 1;
    $currentCount = $result['count'] ?? 0;
    
    // --- ПРОВЕРКА ЛИМИТА ---
    $MAX_BUILDING_COUNT = 100;
    if ($currentCount >= $MAX_BUILDING_COUNT) {
        return ['error' => 'Достигнут максимальный лимит (' . $MAX_BUILDING_COUNT . ') построек этого типа.'];
    }
    // ------------------------
    
    // 2. Рассчитываем кумулятивную стоимость покупки (с учетом скидок)
    $cost = getBuildingPurchaseCost($type, $targetLevel, $currentCount);
    
    $user = getCurrentUser();
    
    if (!hasEnoughResources($user, $cost)) {
        return ['error' => 'Недостаточно ресурсов'];
    }
    
    // Обновление/создание записи
    if ($result) {
        // Увеличиваем количество
        $stmt = $db->prepare("UPDATE user_buildings SET count = count + 1 WHERE user_id = ? AND building_type = ?");
        $stmt->bind_param("ii", $_SESSION['user_id'], $type);
        $stmt->execute();
    } else {
        // Создаем новую запись (Уровень 1)
        $stmt = $db->prepare("INSERT INTO user_buildings (user_id, building_type, count, level) VALUES (?, ?, 1, 1)");
        $stmt->bind_param("ii", $_SESSION['user_id'], $type);
        $stmt->execute();
    }
    
    // Списание ресурсов
    deductResources($cost);
    
    // Для жилых комплексов - увеличиваем количество ожидающих жителей на базовое значение (5)
    if ($type == 5) {
        $stmt = $db->prepare("UPDATE users SET residents_waiting = residents_waiting + 5 WHERE id = ?");
        $stmt->bind_param("i", $_SESSION['user_id']);
        $stmt->execute();
    }
    
    return ['success' => true];
}

function upgradeBuilding($type) {
    if ($type < 1 || $type > 6) {
        return ['error' => 'Неверный тип постройки'];
    }
    
    $db = getDB();
    $stmt = $db->prepare("SELECT level, count FROM user_buildings WHERE user_id = ? AND building_type = ? AND count > 0");
    $stmt->bind_param("ii", $_SESSION['user_id'], $type);
    $stmt->execute();
    $result = $stmt->get_result()->fetch_assoc();
    
    if (!$result) {
        return ['error' => 'У вас нет такой постройки'];
    }
    
    if ($result['level'] >= 5) {
        return ['error' => 'Максимальный уровень достигнут'];
    }
    
    $currentLevel = $result['level'];
    $newLevel = $currentLevel + 1;
    $user = getCurrentUser();
    $baseCost = getBuildingCost($type, $newLevel);
    $buildingCount = $result['count'];
    
    // --- КУМУЛЯТИВНАЯ СТОИМОСТЬ УЛУЧШЕНИЯ ---
    $totalCost = [];
    $UPGRADE_COST_MULTIPLIER = 2.0;
    
    // [MODIFIED] Fetch Alliance Bonuses and apply cost multiplier
    $allianceBonuses = getAllianceBonuses($_SESSION['user_id']);
    $costMultiplier = $allianceBonuses['cost_discount'];
    // ----------------------------------------
    
    foreach ($baseCost as $resource => $amount) {
        // Применяем множитель улучшения, множитель количества и множитель скидки союза
        $totalCost[$resource] = round($amount * $buildingCount * $UPGRADE_COST_MULTIPLIER * $costMultiplier, 2); 
    }
    
    // NEW: Применение буста скидки
    $cost = applyBoostsToCost($totalCost, getActiveBoosts());
    // ----------------------------------------
    
    if (!hasEnoughResources($user, $cost)) {
        return ['error' => 'Недостаточно ресурсов'];
    }
    
    // Улучшение постройки
    $stmt = $db->prepare("UPDATE user_buildings SET level = ? WHERE user_id = ? AND building_type = ?");
    $stmt->bind_param("iii", $newLevel, $_SESSION['user_id'], $type);
    $stmt->execute();
    
    // Списание ресурсов
    deductResources($cost);
    
    return ['success' => true];
}
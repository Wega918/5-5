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
    case 'get_businesses':
        $data = getColonyData();
        jsonResponse(['businesses' => $data['businesses']]);
        break;
        
    case 'buy_business':
        $type = intval($_POST['type'] ?? 0);
        $result = buyBusiness($type);
        jsonResponse($result);
        break;
        
    case 'upgrade_business':
        $type = intval($_POST['type'] ?? 0);
        $result = upgradeBusiness($type);
        jsonResponse($result);
        break;
    case 'hire_workers': // НОВОЕ ДЕЙСТВИЕ
        $businessId = intval($_POST['business_id'] ?? 0);
        $count = intval($_POST['count'] ?? 0);
        $result = hireWorkers($businessId, $count);
        jsonResponse($result);
        break;   
    default:
        jsonResponse(['error' => 'Неизвестное действие']);
}

// --- НОВАЯ ФУНКЦИЯ: НАЙМ РАБОЧИХ ---
function hireWorkers($businessId, $count) {
    if ($businessId < 1 || $count < 1) {
        return ['error' => 'Неверные параметры'];
    }
    
    $db = getDB();
    $user = getCurrentUser();
    
    // 1. Проверяем существование бизнеса и его статус
    $stmt = $db->prepare("SELECT workers_required, workers_assigned FROM user_businesses WHERE id = ? AND user_id = ?");
    $stmt->bind_param("ii", $businessId, $_SESSION['user_id']);
    $stmt->execute();
    $business = $stmt->get_result()->fetch_assoc();
    
    if (!$business) {
        return ['error' => 'Бизнес не найден'];
    }
    
    $missingWorkers = $business['workers_required'] - $business['workers_assigned'];
    if ($missingWorkers <= 0) {
        return ['error' => 'Рабочие не требуются'];
    }
    
    // 2. Определяем реальное количество для найма
    // Получаем общее количество работающих, чтобы рассчитать свободных жителей
    $totalAssignedWorkers = getTotalAssignedWorkers(); 
    $freeResidents = $user['residents_settled'] - $totalAssignedWorkers;
    
    // Ограничено: запрашиваемым количеством, недостающими рабочими, свободными жителями
    $hireCount = min($count, $missingWorkers, $freeResidents);
    
    if ($hireCount <= 0) {
        return ['error' => 'Недостаточно свободных жителей'];
    }
    
    // 3. Обновляем user_businesses
    $stmt = $db->prepare("UPDATE user_businesses SET workers_assigned = workers_assigned + ? WHERE id = ? AND user_id = ?");
    $stmt->bind_param("iii", $hireCount, $businessId, $_SESSION['user_id']);
    $stmt->execute();
    
    // 4. Обновляем users (residents_working)
    $stmt = $db->prepare("UPDATE users SET residents_working = residents_working + ? WHERE id = ?");
    $stmt->bind_param("ii", $hireCount, $_SESSION['user_id']);
    $stmt->execute();
    
    return ['success' => true];
}

// Вспомогательная функция для получения общего числа работающих
function getTotalAssignedWorkers() {
    $db = getDB();
    $stmt = $db->prepare("SELECT SUM(workers_assigned) as total FROM user_businesses WHERE user_id = ?");
    $stmt->bind_param("i", $_SESSION['user_id']);
    $stmt->execute();
    $result = $stmt->get_result()->fetch_assoc();
    return (int)($result['total'] ?? 0);
}
function buyBusiness($type) {
    if ($type < 1 || $type > 4) {
        return ['error' => 'Неверный тип бизнеса'];
    }
    
    $db = getDB();
    
    // 1. Определяем текущий максимальный уровень и количество
    $stmt = $db->prepare("SELECT level, count FROM user_businesses WHERE user_id = ? AND business_type = ?");
    $stmt->bind_param("ii", $_SESSION['user_id'], $type);
    $stmt->execute();
    $result = $stmt->get_result()->fetch_assoc();
    
    $targetLevel = $result['level'] ?? 1; // Уровень нового юнита
    $currentCount = $result['count'] ?? 0; // Текущее количество юнитов

    $MAX_BUSINESS_COUNT = 100;
    if ($currentCount >= $MAX_BUSINESS_COUNT) {
        return ['error' => 'Достигнут максимальный лимит (' . $MAX_BUSINESS_COUNT . ') бизнесов этого типа.'];
    }
    
    // --- ИСПРАВЛЕННАЯ ЛОГИКА СТОИМОСТИ (ИЗВЛЕЧЕНИЕ ДЕНЕГ ИЗ МАССИВА) ---
    // Base Price (Cumulative cost for L1 to L_max) - Возвращает ['money' => X]
    $baseCostArray = getBusinessCumulativeCost($type, $targetLevel); 
    
    // Извлекаем базовую стоимость (число)
    $baseMoneyCost = $baseCostArray['money'] ?? 0.0; //
    
    // Применяем множитель: 2^count
    $multiplier = pow(2, $currentCount);

    $cost = round($baseMoneyCost * $multiplier, 2); // КОРРЕКТНЫЙ расчет стоимости
    
    // [MODIFIED] Fetch Alliance Bonuses and apply cost multiplier
    $allianceBonuses = getAllianceBonuses($_SESSION['user_id']);
    $costMultiplier = $allianceBonuses['cost_discount'];
    $finalCostMoney = round($cost * $costMultiplier, 2); 
    // ----------------------------------------------------

    $finalCostArray = ['money' => $finalCostMoney]; // Используем finalCostMoney
    // --- КОНЕЦ ИСПРАВЛЕННОЙ ЛОГИКИ СТОИМОСТИ ---

    // Рабочие = Кумулятивное требование до TargetLevel
    $requiredWorkersForUnit = getWorkersRequiredForUnitPurchase($type, $targetLevel); 
    
    $user = getCurrentUser();
    
    // 2. ИСПОЛЬЗУЕМ СТАНДАРТНУЮ ФУНКЦИЮ ПРОВЕРКИ
    if (!hasEnoughResources($user, $finalCostArray)) {
        return ['error' => 'Недостаточно монет'];
    }
    
    // Проверка наличия свободных жителей
    $totalAssignedWorkers = getTotalAssignedWorkers(); 
    $freeResidents = $user['residents_settled'] - $totalAssignedWorkers;
    
    if ($freeResidents < $requiredWorkersForUnit) {
        return ['error' => 'Недостаточно свободных жителей для работы. Требуется: ' . $requiredWorkersForUnit];
    }
    
    // 3. Обновление/создание записи (ОСТАВЛЕНО БЕЗ ИЗМЕНЕНИЙ)
    if ($result) {
        // Бизнес уже существует: увеличиваем count. Level не меняем!
        $stmt = $db->prepare("UPDATE user_businesses SET count = count + 1, workers_required = workers_required + ?, workers_assigned = workers_assigned + ? WHERE user_id = ? AND business_type = ?");
        $stmt->bind_param("iiii", $requiredWorkersForUnit, $requiredWorkersForUnit, $_SESSION['user_id'], $type);
        $stmt->execute();
    } else {
        // Создаем новую запись L1 (targetLevel = 1)
        $stmt = $db->prepare("INSERT INTO user_businesses (user_id, business_type, count, level, workers_required, workers_assigned) VALUES (?, ?, 1, 1, ?, ?)");
        $stmt->bind_param("iiii", $_SESSION['user_id'], $type, $requiredWorkersForUnit, $requiredWorkersForUnit);
        $stmt->execute();
    }
    
    // 4. СПИСАНИЕ МОНЕТ С ПОМОЩЬЮ СТАНДАРТНОЙ ФУНКЦИИ
    deductResources($finalCostArray);

    // 5. Обновление рабочих (теперь только residents_working)
    // NOTE: money deduction is now handled by deductResources
    $stmt = $db->prepare("UPDATE users SET residents_working = residents_working + ? WHERE id = ?");
    $stmt->bind_param("ii", $requiredWorkersForUnit, $_SESSION['user_id']); // ИСПРАВЛЕНО: bind_param для 2-х int
    $stmt->execute();
    
    return ['success' => true];
}
function upgradeBusiness($type) {
    if ($type < 1 || $type > 4) {
        return ['error' => 'Неверный тип бизнеса'];
    }
    
    $db = getDB();
    // Получаем текущий level и count
    $stmt = $db->prepare("SELECT level, count FROM user_businesses WHERE user_id = ? AND business_type = ? AND count > 0");
    $stmt->bind_param("ii", $_SESSION['user_id'], $type);
    $stmt->execute();
    $result = $stmt->get_result()->fetch_assoc();
    
    if (!$result) {
        return ['error' => 'У вас нет такого бизнеса'];
    }
    
    if ($result['level'] >= 5) {
        return ['error' => 'Максимальный уровень достигнут'];
    }
    
    $currentLevel = $result['level'];
    $newLevel = $currentLevel + 1;
    $businessCount = $result['count'];
    $user = getCurrentUser();
    
    // --- ОБНОВЛЕННАЯ СТОИМОСТЬ: Базовая стоимость ОДНОГО шага * Количество юнитов ---
    $baseCost = getBusinessCost($type, $newLevel); 
    $cost = round($baseCost * $businessCount, 2);
    // ----------------------------------------------------------------------------------
    
    // [MODIFIED] Fetch Alliance Bonuses and apply cost multiplier
    $allianceBonuses = getAllianceBonuses($_SESSION['user_id']);
    $costMultiplier = $allianceBonuses['cost_discount'];
    $finalCostMoney = round($cost * $costMultiplier, 2);
    // ----------------------------------------------------
    
    $finalCostArray = ['money' => $finalCostMoney];
    
    if (!hasEnoughResources($user, $finalCostArray)) {
        return ['error' => 'Недостаточно монет'];
    }
    
    // НОВАЯ ЛОГИКА: Расчет требуемых дополнительных рабочих (на 1 юнит)
    $additionalWorkersPerUnit = getAdditionalWorkersForUpgradeUnit($type, $currentLevel); 
    $additionalWorkersNeeded = $businessCount * $additionalWorkersPerUnit; 
    
    // Проверка наличия свободных жителей
    $totalAssignedWorkers = getTotalAssignedWorkers(); 
    $freeResidents = $user['residents_settled'] - $totalAssignedWorkers;
    if ($freeResidents < $additionalWorkersNeeded) {
        return ['error' => 'Недостаточно свободных жителей для улучшения. Требуется еще: ' . $additionalWorkersNeeded];
    }
    
    // Улучшение бизнеса: увеличиваем level, workers_required, workers_assigned
    $stmt = $db->prepare("UPDATE user_businesses SET level = ?, workers_required = workers_required + ?, workers_assigned = workers_assigned + ? WHERE user_id = ? AND business_type = ?");
    $stmt->bind_param("iiiii", $newLevel, $additionalWorkersNeeded, $additionalWorkersNeeded, $_SESSION['user_id'], $type);
    $stmt->execute();
    
    // Списание монет и назначение дополнительных рабочих
    $stmt = $db->prepare("UPDATE users SET money = money - ?, residents_working = residents_working + ? WHERE id = ?");
    $stmt->bind_param("idi", $finalCostMoney, $additionalWorkersNeeded, $_SESSION['user_id']);
    $stmt->execute();
    
    return ['success' => true];
}
?>
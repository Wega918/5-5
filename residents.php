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
    case 'get_residents':
        $user = getCurrentUser();
        jsonResponse(['residents' => $user]);
        break;
        
    case 'settle_residents':
        $count = intval($_POST['count'] ?? 0);
        $result = settleResidents($count);
        jsonResponse($result);
        break;
        
    case 'buy_residents':
        $count = intval($_POST['count'] ?? 0);
        $result = buyResidents($count);
        jsonResponse($result);
        break;
        
    default:
        jsonResponse(['error' => 'Неизвестное действие']);
}

function settleResidents($count) {
    if ($count < 1) {
        return ['error' => 'Неверное количество'];
    }
    
    $user = getCurrentUser();
    
    if ($user['residents_waiting'] < $count) {
        return ['error' => 'Недостаточно жителей для заселения'];
    }
    
    // Проверка наличия жилых комплексов и их уровня
    $db = getDB();
    // [ИЗМЕНЕНИЕ] Выбираем level и count
    $stmt = $db->prepare("SELECT level, count FROM user_buildings WHERE user_id = ? AND building_type = 5");
    $stmt->bind_param("i", $_SESSION['user_id']);
    $stmt->execute();
    $result = $stmt->get_result()->fetch_assoc();
    
    $buildingCount = $result['count'] ?? 0;
    $buildingLevel = $result['level'] ?? 0;

    // [ИЗМЕНЕНИЕ] Расчет вместимости на основе уровня и количества
    if ($buildingCount > 0) {
        // getBuildingIncome(5, $level) возвращает емкость (например, 5, 8, 12) за 1 юнит.
        $capacityPerUnit = getBuildingIncome(5, $buildingLevel); 
        $housingCapacity = $buildingCount * $capacityPerUnit;
    } else {
        $housingCapacity = 0;
    }
    
    $currentResidents = $user['residents_settled'];
    
    if ($currentResidents + $count > $housingCapacity) {
        return ['error' => 'Недостаточно жилья. Постройте или улучшите жилые комплексы.'];
    }
    
    // Заселение жителей
    $stmt = $db->prepare("UPDATE users SET residents_waiting = residents_waiting - ?, residents_settled = residents_settled + ? WHERE id = ?");
    $stmt->bind_param("iii", $count, $count, $_SESSION['user_id']);
    $stmt->execute();
    
    return ['success' => true];
}

function buyResidents($count) {
    if ($count < 1) {
        return ['error' => 'Неверное количество'];
    }
    
    $user = getCurrentUser();
    $cost = $count * 50; // 50 монет за жителя
    
    if ($user['money'] < $cost) {
        return ['error' => 'Недостаточно монет'];
    }
    
    $db = getDB();
    
    // Покупка жителей
    $stmt = $db->prepare("UPDATE users SET money = money - ?, residents_waiting = residents_waiting + ? WHERE id = ?");
    $stmt->bind_param("iii", $cost, $count, $_SESSION['user_id']);
    $stmt->execute();
    
    return ['success' => true];
}
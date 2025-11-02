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
    case 'get_online':
        $result = getOnlineUsers();
        jsonResponse($result);
        break;
        
    case 'get_online_count':
        $result = getOnlineCount();
        jsonResponse($result);
        break;
        
    default:
        jsonResponse(['error' => 'Неизвестное действие']);
}

function getOnlineUsers() {
    $db = getDB();
    
    // Получение пользователей, активных за последние 15 минут
    $sql = "SELECT id, username, colony_name, last_active, role,
                   (money + water*2 + food*3 + oxygen*2 + electricity*3 + materials*5 + rubies*100) as total_value
            FROM users 
            WHERE last_active >= DATE_SUB(NOW(), INTERVAL 15 MINUTE)
              AND (blocked_until IS NULL OR blocked_until < NOW())
            ORDER BY last_active DESC";
    
    $result = $db->query($sql);
    $users = $result->fetch_all(MYSQLI_ASSOC);
    
    // Обновляем время активности текущего пользователя
    $stmt = $db->prepare("UPDATE users SET last_active = NOW() WHERE id = ?");
    $stmt->bind_param("i", $_SESSION['user_id']);
    $stmt->execute();
    
    return ['users' => $users];
}

function getOnlineCount() {
    $db = getDB();
    
    $sql = "SELECT COUNT(*) as count FROM users 
            WHERE last_active >= DATE_SUB(NOW(), INTERVAL 15 MINUTE)
              AND (blocked_until IS NULL OR blocked_until < NOW())";
    
    $result = $db->query($sql);
    $count = $result->fetch_assoc()['count'];
    
    // Обновляем время активности текущего пользователя
    $stmt = $db->prepare("UPDATE users SET last_active = NOW() WHERE id = ?");
    $stmt->bind_param("i", $_SESSION['user_id']);
    $stmt->execute();
    
    return ['count' => $count];
}
?>
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
    case 'get_messages':
        $result = getMessages();
        jsonResponse($result);
        break;
        
    case 'send_message':
        $message = sanitizeInput($_POST['message'] ?? '');
        $result = sendMessage($message);
        jsonResponse($result);
        break;
        
	case 'get_unread_status':
        $result = getUnreadChatStatus(); // Функция из func.php
        jsonResponse($result);
        break;
        
    case 'mark_public_read':
        updateLastReadChatTimestamp(); // Функция из func.php
        jsonResponse(['success' => true]);
        break;
    default:
        jsonResponse(['error' => 'Неизвестное действие']);
}

function getMessages() {
    $db = getDB();
    
    $sql = "SELECT cm.id, cm.message, cm.created_at, cm.user_id, u.username, u.colony_name
            FROM chat_messages cm
            JOIN users u ON cm.user_id = u.id
            WHERE cm.deleted_at IS NULL
            ORDER BY cm.created_at DESC
            LIMIT 50";
    
    $result = $db->query($sql);
    $messages = array_reverse($result->fetch_all(MYSQLI_ASSOC));
    
    return ['messages' => $messages];
}

function sendMessage($message) {
    if (empty($message)) {
        return ['error' => 'Сообщение не может быть пустым'];
    }
    
    if (strlen($message) > 500) {
        return ['error' => 'Сообщение слишком длинное'];
    }
    
    $db = getDB();
    
    // Проверка на молчанку
    $stmt = $db->prepare("SELECT muted_until, blocked_until FROM users WHERE id = ?");
    $stmt->bind_param("i", $_SESSION['user_id']);
    $stmt->execute();
    $user = $stmt->get_result()->fetch_assoc();
    
    if ($user['blocked_until'] && strtotime($user['blocked_until']) > time()) {
        return ['error' => 'Ваш аккаунт заблокирован до ' . date('d.m.Y H:i', strtotime($user['blocked_until']))];
    }
    
    if ($user['muted_until'] && strtotime($user['muted_until']) > time()) {
        return ['error' => 'Вы не можете писать в чат до ' . date('d.m.Y H:i', strtotime($user['muted_until']))];
    }
    
    // Проверка на спам (не более 1 сообщения в 5 секунд)
    $stmt = $db->prepare("SELECT id FROM chat_messages WHERE user_id = ? AND created_at > DATE_SUB(NOW(), INTERVAL 5 SECOND) AND deleted_at IS NULL");
    $stmt->bind_param("i", $_SESSION['user_id']);
    $stmt->execute();
    if ($stmt->get_result()->num_rows > 0) {
        return ['error' => 'Подождите немного перед отправкой следующего сообщения'];
    }
    
    // Отправка сообщения
    $stmt = $db->prepare("INSERT INTO chat_messages (user_id, message) VALUES (?, ?)");
    $stmt->bind_param("is", $_SESSION['user_id'], $message);
    
    if ($stmt->execute()) {
        return ['success' => true];
    }
    
    return ['error' => 'Ошибка отправки сообщения'];
}
?>
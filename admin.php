<?php
require_once 'func.php';

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Метод не поддерживается']);
    exit;
}

checkAuth();
checkAdminAccess();

$action = $_POST['action'] ?? '';

switch ($action) {
    case 'delete_chat_message':
        $messageId = intval($_POST['message_id'] ?? 0);
        $result = deleteChatMessage($messageId);
        jsonResponse($result);
        break;
        
    case 'delete_private_message':
        $messageId = intval($_POST['message_id'] ?? 0);
        $result = deletePrivateMessage($messageId);
        jsonResponse($result);
        break;
        
    case 'mute_user':
        $userId = intval($_POST['user_id'] ?? 0);
        $duration = intval($_POST['duration'] ?? 60); // минуты
        $result = muteUser($userId, $duration);
        jsonResponse($result);
        break;
        
    case 'block_user':
        $userId = intval($_POST['user_id'] ?? 0);
        $duration = intval($_POST['duration'] ?? 1440); // минуты (24 часа)
        $result = blockUser($userId, $duration);
        jsonResponse($result);
        break;
        
    case 'unblock_user':
        $userId = intval($_POST['user_id'] ?? 0);
        $result = unblockUser($userId);
        jsonResponse($result);
        break;
        
    case 'create_news':
        $title = sanitizeInput($_POST['title'] ?? '');
        $content = sanitizeInput($_POST['content'] ?? '');
        $isNotification = isset($_POST['is_notification']) ? 1 : 0;
        $result = createNews($title, $content, $isNotification);
        jsonResponse($result);
        break;
        
    case 'edit_user_resources':
        $userId = intval($_POST['user_id'] ?? 0);
        $resources = $_POST['resources'] ?? [];
        $result = editUserResources($userId, $resources);
        jsonResponse($result);
        break;
        
    case 'get_all_payments': // NEW
        checkAdminOnly();
        $result = getAllPayments();
        jsonResponse($result);
        break;
        
    case 'process_payment': // NEW
        checkAdminOnly();
        $paymentId = intval($_POST['payment_id'] ?? 0);
        $newStatus = intval($_POST['status'] ?? 0); // 2: Confirm, 3: Reject
        $result = processPayment($paymentId, $newStatus);
        jsonResponse($result);
        break;
        
    default:
        jsonResponse(['error' => 'Неизвестное действие']);
}

function checkAdminAccess() {
    $user = getCurrentUser();
    if ($user['role'] !== 'admin' && $user['role'] !== 'moderator') {
        http_response_code(403);
        jsonResponse(['error' => 'Недостаточно прав']);
        exit;
    }
}

function checkAdminOnly() {
    $user = getCurrentUser();
    if ($user['role'] !== 'admin') {
        http_response_code(403);
        jsonResponse(['error' => 'Только администраторы могут выполнить это действие']);
        exit;
    }
}

function deleteChatMessage($messageId) {
    if ($messageId < 1) {
        return ['error' => 'Неверный ID сообщения'];
    }
    
    $db = getDB();
    $stmt = $db->prepare("UPDATE chat_messages SET deleted_at = NOW(), deleted_by = ? WHERE id = ?");
    $stmt->bind_param("ii", $_SESSION['user_id'], $messageId);
    
    if ($stmt->execute()) {
        return ['success' => true];
    }
    
    return ['error' => 'Ошибка удаления сообщения'];
}

function deletePrivateMessage($messageId) {
    checkAdminOnly();
    
    if ($messageId < 1) {
        return ['error' => 'Неверный ID сообщения'];
    }
    
    $db = getDB();
    $stmt = $db->prepare("UPDATE private_messages SET deleted_at = NOW(), deleted_by = ? WHERE id = ?");
    $stmt->bind_param("ii", $_SESSION['user_id'], $messageId);
    
    if ($stmt->execute()) {
        return ['success' => true];
    }
    
    return ['error' => 'Ошибка удаления сообщения'];
}

function muteUser($userId, $duration) {
    if ($userId < 1 || $duration < 1) {
        return ['error' => 'Неверные параметры'];
    }
    
    $db = getDB();
    $muteUntil = date('Y-m-d H:i:s', time() + ($duration * 60));
    
    $stmt = $db->prepare("UPDATE users SET muted_until = ? WHERE id = ?");
    $stmt->bind_param("si", $muteUntil, $userId);
    
    if ($stmt->execute()) {
        return ['success' => true, 'muted_until' => $muteUntil];
    }
    
    return ['error' => 'Ошибка установки молчанки'];
}

function blockUser($userId, $duration) {
    checkAdminOnly();
    
    if ($userId < 1 || $duration < 1) {
        return ['error' => 'Неверные параметры'];
    }
    
    $db = getDB();
    $blockUntil = date('Y-m-d H:i:s', time() + ($duration * 60));
    
    $stmt = $db->prepare("UPDATE users SET blocked_until = ? WHERE id = ?");
    $stmt->bind_param("si", $blockUntil, $userId);
    
    if ($stmt->execute()) {
        return ['success' => true, 'blocked_until' => $blockUntil];
    }
    
    return ['error' => 'Ошибка блокировки пользователя'];
}

function unblockUser($userId) {
    checkAdminOnly();
    
    if ($userId < 1) {
        return ['error' => 'Неверный ID пользователя'];
    }
    
    $db = getDB();
    $stmt = $db->prepare("UPDATE users SET blocked_until = NULL WHERE id = ?");
    $stmt->bind_param("i", $userId);
    
    if ($stmt->execute()) {
        return ['success' => true];
    }
    
    return ['error' => 'Ошибка разблокировки пользователя'];
}

function createNews($title, $content, $isNotification) {
    checkAdminOnly();
    
    if (empty($title) || empty($content)) {
        return ['error' => 'Заполните все поля'];
    }
    
    $db = getDB();
    
    // Создание новости
    $stmt = $db->prepare("INSERT INTO news (title, content, created_by, is_notification) VALUES (?, ?, ?, ?)");
    $stmt->bind_param("ssii", $title, $content, $_SESSION['user_id'], $isNotification);
    
    if ($stmt->execute()) {
        $newsId = $db->insert_id;
        
        // Если это уведомление, создаем записи для всех пользователей
        if ($isNotification) {
            $stmt = $db->prepare("INSERT INTO user_notifications (user_id, news_id) 
                                  SELECT id, ? FROM users WHERE id != ?");
            $stmt->bind_param("ii", $newsId, $_SESSION['user_id']);
            $stmt->execute();
        }
        
        return ['success' => true];
    }
    
    return ['error' => 'Ошибка создания новости'];
}

function editUserResources($userId, $resources) {
    checkAdminOnly();
    
    if ($userId < 1) {
        return ['error' => 'Неверный ID пользователя'];
    }
    
    $db = getDB();
    $allowedResources = ['money', 'water', 'food', 'oxygen', 'electricity', 'materials', 'rubies', 
                        'residents_waiting', 'residents_settled', 'residents_working'];
    
    $setParts = [];
    $values = [];
    
    foreach ($resources as $resource => $value) {
        if (in_array($resource, $allowedResources) && is_numeric($value)) {
            $setParts[] = "$resource = ?";
            $values[] = max(0, intval($value));
        }
    }
    
    if (empty($setParts)) {
        return ['error' => 'Нет валидных ресурсов для обновления'];
    }
    
    $values[] = $userId;
    
    $sql = "UPDATE users SET " . implode(', ', $setParts) . " WHERE id = ?";
    $stmt = $db->prepare($sql);
    $stmt->bind_param(str_repeat('i', count($values)), ...$values);
    
    if ($stmt->execute()) {
        return ['success' => true];
    }
    
    return ['error' => 'Ошибка обновления ресурсов'];
}



function getAllPayments() {
    $db = getDB();
    
    // Получение всех платежей с информацией о пользователе
    $sql = "SELECT up.id, up.rubies_count, up.currency, up.amount, up.status, up.created_at, up.processed_at,
                   u.username, u.colony_name
            FROM user_payments up
            JOIN users u ON up.user_id = u.id
            ORDER BY up.status ASC, up.created_at DESC
            LIMIT 50";
    
    $result = $db->query($sql);
    $payments = $result->fetch_all(MYSQLI_ASSOC);
    
    return ['payments' => $payments];
}

function processPayment($paymentId, $newStatus) {
    if ($paymentId < 1 || !in_array($newStatus, [2, 3])) {
        return ['error' => 'Неверные параметры'];
    }
    
    $db = getDB();
    
    // Получаем платеж
    $stmt = $db->prepare("SELECT user_id, rubies_count, status, currency, amount FROM user_payments WHERE id = ?");
    $stmt->bind_param("i", $paymentId);
    $stmt->execute();
    $payment = $stmt->get_result()->fetch_assoc();
    
    if (!$payment) {
        return ['error' => 'Платеж не найден'];
    }
    
    if ($payment['status'] == 2 || $payment['status'] == 3) {
        return ['error' => 'Платеж уже обработан'];
    }
    
    $userId = $payment['user_id'];
    $rubiesCount = $payment['rubies_count'];
    $currency = $payment['currency'];
    $amount = $payment['amount'];
    
    // Начинаем транзакцию
    $db->begin_transaction();
    
    try {
        // 1. Обновляем статус платежа
        $stmt = $db->prepare("UPDATE user_payments SET status = ?, processed_at = NOW() WHERE id = ?");
        $stmt->bind_param("ii", $newStatus, $paymentId);
        $stmt->execute();
        
        // 2. Если статус 'Подтверждено', начисляем рубины
        if ($newStatus == 2) {
            $stmt = $db->prepare("UPDATE users SET rubies = rubies + ? WHERE id = ?");
            $stmt->bind_param("di", $rubiesCount, $userId);
            $stmt->execute();
            
            // --- ОТПРАВКА СООБЩЕНИЯ В ЛИЧКУ ---
            $message = "👑 **Системное уведомление**\n\n";
            $message .= "✅ Ваш платеж *#{$paymentId}* на сумму {$amount} {$currency} был *подтвержден* администратором.\n";
            $message .= "💎 Начислено *{$rubiesCount}* Рубинов. \n\n";
            $message .= "Спасибо за поддержку поселений!";
            
            sendSystemPM($_SESSION['user_id'], $userId, $message);
            // ------------------------------------
        } elseif ($newStatus == 3) {
            // --- ОТПРАВКА СООБЩЕНИЯ ОБ ОТКЛОНЕНИИ (опционально) ---
            $message = "👑 **Системное уведомление**\n\n";
            $message .= "❌ Ваш платеж *#{$paymentId}* на сумму {$amount} {$currency} был *отклонен* администратором. Пожалуйста, проверьте точность перевода и свяжитесь с поддержкой, если проблема сохраняется.";
            
            sendSystemPM($_SESSION['user_id'], $userId, $message);
            // ------------------------------------
        }
        
        $db->commit();
        return ['success' => true];
        
    } catch (Exception $e) {
        $db->rollback();
        return ['error' => 'Ошибка обработки транзакции: ' . $e->getMessage()];
    }
}
?>
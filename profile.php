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
    case 'get_profile':
        $userId = intval($_POST['user_id'] ?? 0);
        $result = getUserProfile($userId);
        jsonResponse($result);
        break;
        
    case 'update_profile':
        $description = sanitizeInput($_POST['description'] ?? '');
        $result = updateProfile($description);
        jsonResponse($result);
        break;
        
    case 'send_message':
        $toUserId = intval($_POST['to_user_id'] ?? 0);
        $message = sanitizeInput($_POST['message'] ?? '');
        $result = sendPrivateMessage($toUserId, $message);
        jsonResponse($result);
        break;
        
    case 'get_messages':
        $withUserId = intval($_POST['with_user_id'] ?? 0);
        $result = getPrivateMessages($withUserId);
        jsonResponse($result);
        break;
        
    case 'get_conversations':
        $result = getConversations();
        jsonResponse($result);
        break;
		
    case 'mark_private_read':
        $sender_id = intval($_POST['sender_id'] ?? 0);
        if ($sender_id > 0) {
            markPrivateMessagesAsRead($sender_id); // Функция из func.php
            jsonResponse(['success' => true]);
        } else {
            jsonResponse(['error' => 'Неверный ID отправителя']);
        }
        break;
		
		case 'send_invitation':
        // NOTE: Логика проверки лидерства перенесена в alliance.php
        $targetUserId = intval($_POST['to_user_id'] ?? 0); 
        $result = sendInvitation($targetUserId); // Предполагаем, что sendInvitation определена в alliance.php
        jsonResponse($result);
        break;
    default:
        jsonResponse(['error' => 'Неизвестное действие']);
}

function getUserProfile($userId) {
    if ($userId < 1) {
        return ['error' => 'Неверный ID пользователя'];
    }
    
    $db = getDB();
    
    // Получение основной информации о пользователе
    $stmt = $db->prepare("SELECT id, username, colony_name, created_at, profile_description, 
                                 money, water, food, oxygen, electricity, materials, rubies,
                                 residents_waiting, residents_settled, residents_working,
                                 role, muted_until, blocked_until
                          FROM users WHERE id = ?");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $user = $stmt->get_result()->fetch_assoc();
    
    if (!$user) {
        return ['error' => 'Пользователь не найден'];
    }
    
    // Получение бизнесов
    $stmt = $db->prepare("SELECT * FROM user_businesses WHERE user_id = ?");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $businesses = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    
    // Получение построек
    $stmt = $db->prepare("SELECT * FROM user_buildings WHERE user_id = ?");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $buildings = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    
    // Получение союза
    $stmt = $db->prepare("SELECT a.name as alliance_name FROM alliance_members am 
                          JOIN alliances a ON am.alliance_id = a.id 
                          WHERE am.user_id = ?");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $alliance = $stmt->get_result()->fetch_assoc();
    
    // Расчет общей стоимости поселения
    $totalValue = $user['money'] + $user['water']*2 + $user['food']*3 + 
                  $user['oxygen']*2 + $user['electricity']*3 + $user['materials']*5 + 
                  $user['rubies']*100;
    
    // Получение позиции в рейтинге
    $stmt = $db->prepare("SELECT COUNT(*) as position FROM users u1, users u2 
                          WHERE u2.id = ? AND 
                                (u1.money + u1.water*2 + u1.food*3 + u1.oxygen*2 + u1.electricity*3 + u1.materials*5 + u1.rubies*100) >= 
                                (u2.money + u2.water*2 + u2.food*3 + u2.oxygen*2 + u2.electricity*3 + u2.materials*5 + u2.rubies*100)");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $position = $stmt->get_result()->fetch_assoc()['position'];
    
    return [
        'user' => $user,
        'businesses' => $businesses,
        'buildings' => $buildings,
        'alliance' => $alliance,
        'total_value' => $totalValue,
        'rating_position' => $position,
        'can_edit' => $_SESSION['user_id'] == $userId
    ];
}

function updateProfile($description) {
    if (strlen($description) > 500) {
        return ['error' => 'Описание слишком длинное'];
    }
    
    $db = getDB();
    $stmt = $db->prepare("UPDATE users SET profile_description = ? WHERE id = ?");
    $stmt->bind_param("si", $description, $_SESSION['user_id']);
    
    if ($stmt->execute()) {
        return ['success' => true];
    }
    
    return ['error' => 'Ошибка обновления профиля'];
}

function sendPrivateMessage($toUserId, $message) {
    if (empty($message)) {
        return ['error' => 'Сообщение не может быть пустым'];
    }
    
    if (strlen($message) > 500) {
        return ['error' => 'Сообщение слишком длинное'];
    }
    
    if ($toUserId == $_SESSION['user_id']) {
        return ['error' => 'Нельзя отправить сообщение самому себе'];
    }
    
    $db = getDB();
    
    // Проверка существования получателя
    $stmt = $db->prepare("SELECT id, muted_until FROM users WHERE id = ?");
    $stmt->bind_param("i", $toUserId);
    $stmt->execute();
    $recipient = $stmt->get_result()->fetch_assoc();
    
    if (!$recipient) {
        return ['error' => 'Получатель не найден'];
    }
    
    // Проверка на молчанку отправителя
    $stmt = $db->prepare("SELECT muted_until FROM users WHERE id = ?");
    $stmt->bind_param("i", $_SESSION['user_id']);
    $stmt->execute();
    $sender = $stmt->get_result()->fetch_assoc();
    
    if ($sender['muted_until'] && strtotime($sender['muted_until']) > time()) {
        return ['error' => 'Вы не можете отправлять сообщения до ' . date('d.m.Y H:i', strtotime($sender['muted_until']))];
    }
    
    // Проверка на спам (не более 1 сообщения в 3 секунды)
    $stmt = $db->prepare("SELECT id FROM private_messages WHERE from_user_id = ? AND created_at > DATE_SUB(NOW(), INTERVAL 3 SECOND)");
    $stmt->bind_param("i", $_SESSION['user_id']);
    $stmt->execute();
    if ($stmt->get_result()->num_rows > 0) {
        return ['error' => 'Подождите немного перед отправкой следующего сообщения'];
    }
    
    // Отправка сообщения
    $stmt = $db->prepare("INSERT INTO private_messages (from_user_id, to_user_id, message) VALUES (?, ?, ?)");
    $stmt->bind_param("iis", $_SESSION['user_id'], $toUserId, $message);
    
    if ($stmt->execute()) {
        return ['success' => true];
    }
    
    return ['error' => 'Ошибка отправки сообщения'];
}

function getPrivateMessages($withUserId) {
    if ($withUserId < 1) {
        return ['error' => 'Неверный ID пользователя'];
    }
    
    $db = getDB();
    
    // Получение сообщений между пользователями
    $sql = "SELECT pm.*, 
                   from_user.username as from_username, from_user.colony_name as from_colony,
                   to_user.username as to_username, to_user.colony_name as to_colony
            FROM private_messages pm
            JOIN users from_user ON pm.from_user_id = from_user.id
            JOIN users to_user ON pm.to_user_id = to_user.id
            WHERE ((pm.from_user_id = ? AND pm.to_user_id = ?) OR (pm.from_user_id = ? AND pm.to_user_id = ?))
              AND pm.deleted_at IS NULL
            ORDER BY pm.created_at ASC
            LIMIT 50";
    
    $stmt = $db->prepare($sql);
    $stmt->bind_param("iiii", $_SESSION['user_id'], $withUserId, $withUserId, $_SESSION['user_id']);
    $stmt->execute();
    $messages = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    
    // Отметить сообщения как прочитанные
    $stmt = $db->prepare("UPDATE private_messages SET read_at = NOW() WHERE from_user_id = ? AND to_user_id = ? AND read_at IS NULL");
    $stmt->bind_param("ii", $withUserId, $_SESSION['user_id']);
    $stmt->execute();
    
    return ['messages' => $messages];
}

function getConversations() {
    $db = getDB();
    
    // Получение списка диалогов. Упрощенный запрос для подсчета непрочитанных.
    $sql = "SELECT 
                CASE 
                    WHEN pm.from_user_id = ? THEN pm.to_user_id 
                    ELSE pm.from_user_id 
                END as user_id,
                CASE 
                    WHEN pm.from_user_id = ? THEN to_user.username 
                    ELSE from_user.username 
                END as username,
                CASE 
                    WHEN pm.from_user_id = ? THEN to_user.colony_name 
                    ELSE from_user.colony_name 
                END as colony_name,
                pm.message as last_message,
                pm.created_at as last_message_time,
                (SELECT COUNT(pm2.id) FROM private_messages pm2 
                 WHERE pm2.from_user_id = (CASE WHEN pm.from_user_id = ? THEN pm.to_user_id ELSE pm.from_user_id END)
                   AND pm2.to_user_id = ?
                   AND pm2.read_at IS NULL
                   AND pm2.deleted_at IS NULL) as unread_count
            FROM private_messages pm
            JOIN users from_user ON pm.from_user_id = from_user.id
            JOIN users to_user ON pm.to_user_id = to_user.id
            WHERE (pm.from_user_id = ? OR pm.to_user_id = ?) 
              AND pm.deleted_at IS NULL
              AND pm.id IN (
                  SELECT MAX(id) FROM private_messages pm3 
                  WHERE (pm3.from_user_id = ? OR pm3.to_user_id = ?) 
                    AND pm3.deleted_at IS NULL
                  GROUP BY LEAST(pm3.from_user_id, pm3.to_user_id), GREATEST(pm3.from_user_id, pm3.to_user_id)
              )
            ORDER BY pm.created_at DESC";
    
    // 9 параметров: 3 для CASE в SELECT, 2 для subquery, 2 для main WHERE, 2 для MAX(id) subquery.
    $stmt = $db->prepare($sql);
    $stmt->bind_param("iiiiiiiii", 
                      $_SESSION['user_id'], 
                      $_SESSION['user_id'], 
                      $_SESSION['user_id'], 
                      $_SESSION['user_id'], 
                      $_SESSION['user_id'], 
                      $_SESSION['user_id'], 
                      $_SESSION['user_id'], 
                      $_SESSION['user_id'], 
                      $_SESSION['user_id']);
    $stmt->execute();
    $conversations = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    
    return ['conversations' => $conversations];
}
?>
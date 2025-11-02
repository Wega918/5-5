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
    case 'get_news':
        $result = getNews();
        jsonResponse($result);
        break;
        
    case 'get_notifications':
        $result = getNotifications();
        jsonResponse($result);
        break;
        
    case 'mark_notification_read':
        $newsId = intval($_POST['news_id'] ?? 0);
        $result = markNotificationRead($newsId);
        jsonResponse($result);
        break;
        
    default:
        jsonResponse(['error' => 'Неизвестное действие']);
}

function getNews() {
    $db = getDB();
    
    $sql = "SELECT n.id, n.title, n.content, n.created_at, n.is_notification,
                   u.username as author_username
            FROM news n 
            LEFT JOIN users u ON n.created_by = u.id
            ORDER BY n.created_at DESC 
            LIMIT 20";
    
    $result = $db->query($sql);
    $news = $result->fetch_all(MYSQLI_ASSOC);
    
    return ['news' => $news];
}

function getNotifications() {
    $db = getDB();
    
    // Получаем непрочитанные уведомления
    $sql = "SELECT n.id, n.title, n.content, n.created_at
            FROM news n
            WHERE n.is_notification = 1 
              AND n.id NOT IN (
                  SELECT un.news_id 
                  FROM user_notifications un 
                  WHERE un.user_id = ? AND un.read_at IS NOT NULL
              )
            ORDER BY n.created_at DESC
            LIMIT 5";
    
    $stmt = $db->prepare($sql);
    $stmt->bind_param("i", $_SESSION['user_id']);
    $stmt->execute();
    $notifications = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    
    return ['notifications' => $notifications];
}

function markNotificationRead($newsId) {
    if ($newsId < 1) {
        return ['error' => 'Неверный ID новости'];
    }
    
    $db = getDB();
    
    // Отмечаем уведомление как прочитанное
    $stmt = $db->prepare("INSERT INTO user_notifications (user_id, news_id, read_at) VALUES (?, ?, NOW()) 
                          ON DUPLICATE KEY UPDATE read_at = NOW()");
    $stmt->bind_param("ii", $_SESSION['user_id'], $newsId);
    
    if ($stmt->execute()) {
        return ['success' => true];
    }
    
    return ['error' => 'Ошибка отметки уведомления'];
}
?>
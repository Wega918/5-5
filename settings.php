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
    case 'get_settings':
        $result = getSettings();
        jsonResponse($result);
        break;
        
    case 'update_settings':
        $notifications = intval($_POST['notifications'] ?? 1);
        $sound = intval($_POST['sound'] ?? 1);
        $result = updateSettings($notifications, $sound);
        jsonResponse($result);
        break;
        
    case 'change_password':
        $currentPassword = $_POST['current_password'] ?? '';
        $newPassword = $_POST['new_password'] ?? '';
        $result = changePassword($currentPassword, $newPassword);
        jsonResponse($result);
        break;
        
    case 'send_verification':
        $result = sendEmailVerification();
        jsonResponse($result);
        break;
        
    default:
        jsonResponse(['error' => 'Неизвестное действие']);
}

function getSettings() {
    $db = getDB();
    
    $stmt = $db->prepare("SELECT notifications, sound, language FROM user_settings WHERE user_id = ?");
    $stmt->bind_param("i", $_SESSION['user_id']);
    $stmt->execute();
    $result = $stmt->get_result()->fetch_assoc();
    
    if (!$result) {
        // Создание настроек по умолчанию
        $stmt = $db->prepare("INSERT INTO user_settings (user_id) VALUES (?)");
        $stmt->bind_param("i", $_SESSION['user_id']);
        $stmt->execute();
        
        $result = ['notifications' => 1, 'sound' => 1, 'language' => 'ru'];
    }
    
    return ['settings' => $result];
}

function updateSettings($notifications, $sound) {
    $db = getDB();
    
    $stmt = $db->prepare("UPDATE user_settings SET notifications = ?, sound = ? WHERE user_id = ?");
    $stmt->bind_param("iii", $notifications, $sound, $_SESSION['user_id']);
    
    if ($stmt->execute()) {
        return ['success' => true];
    }
    
    return ['error' => 'Ошибка сохранения настроек'];
}

function changePassword($currentPassword, $newPassword) {
    if (empty($currentPassword) || empty($newPassword)) {
        return ['error' => 'Заполните все поля'];
    }
    
    if (strlen($newPassword) < 6) {
        return ['error' => 'Новый пароль должен содержать минимум 6 символов'];
    }
    
    $db = getDB();
    
    // Проверка текущего пароля
    $stmt = $db->prepare("SELECT password_hash FROM users WHERE id = ?");
    $stmt->bind_param("i", $_SESSION['user_id']);
    $stmt->execute();
    $result = $stmt->get_result()->fetch_assoc();
    
    if (!$result || !password_verify($currentPassword, $result['password_hash'])) {
        return ['error' => 'Неверный текущий пароль'];
    }
    
    // Обновление пароля
    $newPasswordHash = password_hash($newPassword, PASSWORD_DEFAULT);
    $stmt = $db->prepare("UPDATE users SET password_hash = ? WHERE id = ?");
    $stmt->bind_param("si", $newPasswordHash, $_SESSION['user_id']);
    
    if ($stmt->execute()) {
        return ['success' => true];
    }
    
    return ['error' => 'Ошибка изменения пароля'];
}

function sendEmailVerification() {
    $user = getCurrentUser();
    
    // В реальном приложении здесь была бы отправка email
    // Для демонстрации просто возвращаем успех
    return [
        'success' => true, 
        'message' => 'Код подтверждения отправлен на ' . $user['email']
    ];
}
?>
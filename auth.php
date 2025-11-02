<?php
require_once 'func.php';

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Метод не поддерживается']);
    exit;
}

$action = $_POST['action'] ?? '';

switch ($action) {
    case 'check':
        if (isset($_SESSION['user_id'])) {
            jsonResponse(['success' => true]);
        } else {
            jsonResponse(['success' => false]);
        }
        break;
        
    case 'login':
        $username = sanitizeInput($_POST['username'] ?? '');
        $password = $_POST['password'] ?? '';
        
        if (empty($username) || empty($password)) {
            jsonResponse(['error' => 'Заполните все поля']);
            break;
        }
        
        $result = loginUser($username, $password);
        jsonResponse($result);
        break;
        
    case 'register':
        $username = sanitizeInput($_POST['username'] ?? '');
        $email = sanitizeInput($_POST['email'] ?? '');
        $colony = sanitizeInput($_POST['colony'] ?? '');
        $password = $_POST['password'] ?? '';
        
        if (empty($username) || empty($email) || empty($colony) || empty($password)) {
            jsonResponse(['error' => 'Заполните все поля']);
            break;
        }
        
        if (strlen($username) < 3 || strlen($username) > 20) {
            jsonResponse(['error' => 'Имя пользователя должно быть от 3 до 20 символов']);
            break;
        }
        
        if (strlen($password) < 6) {
            jsonResponse(['error' => 'Пароль должен быть минимум 6 символов']);
            break;
        }
        
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            jsonResponse(['error' => 'Неверный формат email']);
            break;
        }
        
        $result = registerUser($username, $email, $password, $colony);
        jsonResponse($result);
        break;
        
    case 'logout':
        $result = logoutUser();
        jsonResponse($result);
        break;
        
    default:
        jsonResponse(['error' => 'Неизвестное действие']);
}
?>
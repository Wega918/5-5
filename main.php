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
    case 'get_data':
        try {
            $data = getColonyData();
            jsonResponse($data);
        } catch (Exception $e) {
            jsonResponse(['error' => 'Ошибка получения данных: ' . $e->getMessage()]);
        }
        break;
        
    default:
        jsonResponse(['error' => 'Неизвестное действие']);
}
?>
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
    case 'get_boosts':
        $boosts = getBoostsDefinitions();
        $active = getActiveBoosts();
        jsonResponse(['boosts' => $boosts, 'active_boosts' => $active]);
        break;
        
    case 'buy_boost':
        $boostType = intval($_POST['type'] ?? 0);
        $result = purchaseBoost($boostType);
        jsonResponse($result);
        break;
        
    default:
        jsonResponse(['error' => 'Неизвестное действие']);
}
?>
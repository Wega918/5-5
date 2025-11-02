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
    case 'get_shop_data':
        $result = getShopData();
        jsonResponse($result);
        break;
        
    case 'create_payment':
        $rubies = floatval($_POST['rubies'] ?? 0);
        $currency = sanitizeInput($_POST['currency'] ?? '');
        $amount = floatval($_POST['amount'] ?? 0);
        $result = createPayment($rubies, $currency, $amount);
        jsonResponse($result);
        break;
        
    case 'get_payments':
        $result = getMyPayments();
        jsonResponse($result);
        break;
        
    case 'get_admin_status': // ADMIN ENDPOINT - Check for payments with status 0 or 1
        $count = getUnprocessedPaymentsCount(); // From func.php
        jsonResponse(['has_unprocessed_payments' => $count > 0]);
        break;
        
    case 'update_payment_status': // NEW: Set status by user (Used for setting status 1: Paid)
        $paymentId = intval($_POST['payment_id'] ?? 0);
        $status = intval($_POST['status'] ?? 0);
        $result = updatePaymentStatusByUser($paymentId, $status);
        jsonResponse($result);
        break;
        
    default:
        jsonResponse(['error' => 'Неизвестное действие']);
}

function getShopData() {
    return [
        'packages' => getRubyPackages(),
        'rates' => [
            'rub_price' => RUBY_BASE_PRICE_RUB,
            'uah_price' => RUBY_BASE_PRICE_UAH,
            'uah_to_rub_rate' => UAH_TO_RUB_RATE
        ],
        'payment_info' => [
            'card_number' => PAYMENT_CARD_NUMBER,
            'card_holder' => PAYMENT_CARD_HOLDER,
            'card_bank' => PAYMENT_CARD_BANK
        ],
        'user_rubies' => getCurrentUser()['rubies']
    ];
}

function createPayment($rubies, $currency, $amount) {
    if ($rubies < 0.0001 || !in_array($currency, ['RUB', 'UAH']) || $amount < 0.01) {
        return ['error' => 'Неверные параметры платежа'];
    }
    
    // Округляем рубины до 4 знаков после запятой перед сохранением в VARCHAR для избежания проблем с точностью
    $rubies_rounded = round($rubies, 4);
    
    $db = getDB();
    
    // 1. Создание записи о платеже
    // rubies_count is VARCHAR(100) in SQL dump, so we use 's' for binding.
    // status defaults to 0.
    $stmt = $db->prepare("INSERT INTO user_payments (user_id, rubies_count, currency, amount) VALUES (?, ?, ?, ?)");
    // Types: i (int), s (rubies_count string - uses the rounded string), s (currency string), d (amount double/decimal)
    $stmt->bind_param("issd", $_SESSION['user_id'], $rubies_rounded, $currency, $amount);
    
    if ($stmt->execute()) {
        $paymentId = $db->insert_id;
        
        return [
            'success' => true,
            'payment_id' => $paymentId,
            'message' => 'Платежное поручение создано. Ожидайте подтверждения после оплаты.'
        ];
    }
    
    return ['error' => 'Ошибка создания платежа'];
}

function getMyPayments() {
    $db = getDB();
    
    $stmt = $db->prepare("SELECT id, rubies_count, currency, amount, status, created_at, processed_at
                          FROM user_payments 
                          WHERE user_id = ?
                          ORDER BY created_at DESC
                          LIMIT 20");
    $stmt->bind_param("i", $_SESSION['user_id']);
    $stmt->execute();
    $payments = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    
    return ['payments' => $payments];
}

// NEW FUNCTION: Used by user to mark payment as paid (status 1)
function updatePaymentStatusByUser($paymentId, $status) {
    if ($paymentId < 1 || $status !== 1) {
        return ['error' => 'Неверный статус или ID платежа'];
    }
    
    $db = getDB();
    
    // Только пользователь, создавший платеж, может изменить статус с 0 на 1.
    // processed_at = NOW() чтобы администратор видел, когда была оплата
    $stmt = $db->prepare("UPDATE user_payments SET status = ?, processed_at = NOW() WHERE id = ? AND user_id = ? AND status = 0");
    $stmt->bind_param("iii", $status, $paymentId, $_SESSION['user_id']);
    
    if ($stmt->execute() && $db->affected_rows > 0) {
        return ['success' => true];
    }
    
    return ['error' => 'Платеж не найден или уже обработан'];
}
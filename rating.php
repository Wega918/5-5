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
    case 'get_rating':
        $result = getRating();
        jsonResponse($result);
        break;
        
    case 'get_alliance_rating': // NEW ACTION
        $result = getAllianceRating();
        jsonResponse($result);
        break;
        
    case 'get_user_id':
        $username = sanitizeInput($_POST['username'] ?? '');
        $result = getUserIdByUsername($username);
        jsonResponse($result);
        break;
        
    default:
        jsonResponse(['error' => 'Неизвестное действие']);
}

function getRating() {
    $db = getDB();
    
    // Рейтинг по общей стоимости поселения (деньги + ресурсы)
    $sql = "SELECT id, username, colony_name, 
                   (money + water*2 + food*3 + oxygen*2 + electricity*3 + materials*5 + rubies*100) as total_value,
                   money, residents_settled, 
                   DATEDIFF(NOW(), created_at) as days_played
            FROM users 
            WHERE blocked_until IS NULL OR blocked_until < NOW()
            ORDER BY total_value DESC 
            LIMIT 50";
    
    $result = $db->query($sql);
    $rating = $result->fetch_all(MYSQLI_ASSOC);
    
    // Позиция текущего пользователя
    $stmt = $db->prepare("SELECT COUNT(*) as position FROM users u1, users u2 
                          WHERE u2.id = ? AND 
                                (u1.money + u1.water*2 + u1.food*3 + u1.oxygen*2 + u1.electricity*3 + u1.materials*5 + u1.rubies*100) >= 
                                (u2.money + u2.water*2 + u2.food*3 + u2.oxygen*2 + u2.electricity*3 + u2.materials*5 + u2.rubies*100)
                            AND (u1.blocked_until IS NULL OR u1.blocked_until < NOW())");
    $stmt->bind_param("i", $_SESSION['user_id']);
    $stmt->execute();
    $userPosition = $stmt->get_result()->fetch_assoc()['position'];
    
    return [
        'rating' => $rating,
        'user_position' => $userPosition
    ];
}

// [NEW] Расчет и получение рейтинга союзов
function getAllianceRating() {
    $db = getDB();
    
    // Рейтинг союзов: Сумма очков всех участников
    $sql = "SELECT a.id, a.name, a.leader_id, u_leader.username AS leader_name, u_leader.colony_name AS leader_colony,
                   SUM(u.money + u.water*2 + u.food*3 + u.oxygen*2 + u.electricity*3 + u.materials*5 + u.rubies*100) AS total_alliance_value,
                   COUNT(am.user_id) AS member_count
            FROM alliances a
            JOIN alliance_members am ON a.id = am.alliance_id
            JOIN users u ON am.user_id = u.id
            JOIN users u_leader ON a.leader_id = u_leader.id
            GROUP BY a.id
            ORDER BY total_alliance_value DESC
            LIMIT 50";
            
    $result = $db->query($sql);
    $allianceRating = $result->fetch_all(MYSQLI_ASSOC);
    
    return ['alliance_rating' => $allianceRating];
}

function getUserIdByUsername($username) {
    if (empty($username)) {
        return ['error' => 'Имя пользователя не указано'];
    }
    
    $db = getDB();
    $stmt = $db->prepare("SELECT id FROM users WHERE username = ?");
    $stmt->bind_param("s", $username);
    $stmt->execute();
    $result = $stmt->get_result()->fetch_assoc();
    
    if ($result) {
        return ['user_id' => $result['id']];
    }
    
    return ['error' => 'Пользователь не найден'];
}
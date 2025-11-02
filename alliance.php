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
    case 'get_alliances':
        $result = getAlliances();
        jsonResponse($result);
        break;
        
    case 'create_alliance':
        $name = sanitizeInput($_POST['name'] ?? '');
        $description = sanitizeInput($_POST['description'] ?? '');
        $result = createAlliance($name, $description);
        jsonResponse($result);
        break;
        
    case 'join_alliance':
        $allianceId = intval($_POST['alliance_id'] ?? 0);
        $result = joinAlliance($allianceId); // Теперь требует приглашения
        jsonResponse($result);
        break;
        
    case 'leave_alliance':
        $result = leaveAlliance();
        jsonResponse($result);
        break;
        
    case 'send_invitation': // НОВОЕ ДЕЙСТВИЕ
        $targetUserId = intval($_POST['user_id'] ?? 0);
        $result = sendInvitation($targetUserId);
        jsonResponse($result);
        break;
        
    case 'accept_invitation': // НОВОЕ ДЕЙСТВИЕ
        $allianceId = intval($_POST['alliance_id'] ?? 0);
        $result = acceptInvitation($allianceId);
        jsonResponse($result);
        break;
        
    case 'reject_invitation': // НОВОЕ ДЕЙСТВИЕ
        $allianceId = intval($_POST['alliance_id'] ?? 0);
        $result = rejectInvitation($allianceId);
        jsonResponse($result);
        break;
        
    case 'contribute_fund': // НОВОЕ ДЕЙСТВИЕ
        $rubies = floatval($_POST['rubies'] ?? 0);
        $materials = floatval($_POST['materials'] ?? 0);
        $result = contributeFund($rubies, $materials);
        jsonResponse($result);
        break;
        
    case 'upgrade_capacity': // НОВОЕ ДЕЙСТВИЕ
        $result = upgradeCapacity();
        jsonResponse($result);
        break;
        
    case 'buy_alliance_building': // НОВОЕ ДЕЙСТВИЕ
        $type = intval($_POST['type'] ?? 0);
        $result = buyAllianceBuilding($type);
        jsonResponse($result);
        break;
        
    case 'upgrade_alliance_building': // НОВОЕ ДЕЙСТВИЕ
        $type = intval($_POST['type'] ?? 0);
        $result = upgradeAllianceBuilding($type);
        jsonResponse($result);
        break;
        
    case 'get_alliance_profile': // НОВОЕ ДЕЙСТВИЕ
        $allianceId = intval($_POST['alliance_id'] ?? 0);
        $result = getAllianceProfile($allianceId);
        jsonResponse($result);
        break;
        
    default:
        jsonResponse(['error' => 'Неизвестное действие']);
}

// ----------------------
// --- ОСНОВНАЯ ЛОГИКА ---
// ----------------------

function getAlliances() {
    $db = getDB();
    
    // Получение всех союзов с фондом и лимитами
    // NOTE: Предполагаем, что таблица `alliances` имеет поля `rubies_fund`, `materials_fund`, `max_members`.
    $sql = "SELECT a.id, a.name, a.description, a.rubies_fund, a.materials_fund, a.max_members,
                   u.username as leader_name, u.colony_name as leader_colony,
                   COUNT(am.user_id) as member_count
            FROM alliances a 
            LEFT JOIN users u ON a.leader_id = u.id
            LEFT JOIN alliance_members am ON a.id = am.alliance_id
            GROUP BY a.id
            ORDER BY member_count DESC, a.created_at DESC";
    
    $result = $db->query($sql);
    $alliances = $result->fetch_all(MYSQLI_ASSOC);
    
    // Получение текущего союза пользователя
    $stmt = $db->prepare("SELECT alliance_id FROM alliance_members WHERE user_id = ?");
    $stmt->bind_param("i", $_SESSION['user_id']);
    $stmt->execute();
    $userAlliance = $stmt->get_result()->fetch_assoc();
    $userAllianceId = $userAlliance['alliance_id'] ?? null;
    
    // Получение участников союза пользователя и его взносов
    $allianceMembers = [];
    $myContributions = [];
    $totalContributions = [];
    $allianceBuildings = [];
    
    if ($userAllianceId) {
        // Участники
        $stmt = $db->prepare("SELECT am.user_id, am.joined_at, u.username, u.colony_name,
                                     (u.money + u.water*2 + u.food*3 + u.oxygen*2 + u.electricity*3 + u.materials*5 + u.rubies*100) as total_value
                              FROM alliance_members am
                              JOIN users u ON am.user_id = u.id
                              WHERE am.alliance_id = ?
                              ORDER BY total_value DESC");
        $stmt->bind_param("i", $userAllianceId);
        $stmt->execute();
        $allianceMembers = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
        
        // Мои взносы
        // NOTE: Предполагаем, что таблица `alliance_contributions` существует
        $stmt = $db->prepare("SELECT SUM(rubies_amount) as total_rubies, SUM(materials_amount) as total_materials 
                              FROM alliance_contributions 
                              WHERE user_id = ? AND alliance_id = ?");
        $stmt->bind_param("ii", $_SESSION['user_id'], $userAllianceId);
        $stmt->execute();
        $myContributions = $stmt->get_result()->fetch_assoc();
        
        // Общие взносы (ВСЕ члены, с материалами и рубинами)
        $stmt = $db->prepare("SELECT ac.user_id, u.username, 
                                     SUM(ac.rubies_amount) as total_rubies, 
                                     SUM(ac.materials_amount) as total_materials
                              FROM alliance_contributions ac
                              JOIN users u ON ac.user_id = u.id
                              WHERE ac.alliance_id = ?
                              GROUP BY ac.user_id
                              ORDER BY total_rubies DESC, total_materials DESC");
        $stmt->bind_param("i", $userAllianceId);
        $stmt->execute();
        $totalContributions = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
        
        // Постройки союза
        $allianceBuildings = getAllianceBuildings($userAllianceId);
    }
    
    return [
        'alliances' => $alliances,
        'user_alliance_id' => $userAllianceId,
        'alliance_members' => $allianceMembers,
        'my_contributions' => $myContributions,
        'total_contributions' => $totalContributions,
        'alliance_buildings' => $allianceBuildings
    ];
}

function createAlliance($name, $description) {
    if (empty($name)) {
        return ['error' => 'Название союза не может быть пустым'];
    }
    
    if (strlen($name) > 100) {
        return ['error' => 'Название слишком длинное'];
    }
    
    $db = getDB();
    $user = getCurrentUser();
    $COST = 50; // Стоимость создания в рубинах
    $MAX_MEMBERS_BASE = 5;

    // 1. Проверка, что пользователь не состоит в союзе
    $stmt = $db->prepare("SELECT id FROM alliance_members WHERE user_id = ?");
    $stmt->bind_param("i", $_SESSION['user_id']);
    $stmt->execute();
    if ($stmt->get_result()->num_rows > 0) {
        return ['error' => 'Вы уже состоите в союзе'];
    }
    
    // 2. Проверка стоимости
    if ($user['rubies'] < $COST) {
        return ['error' => "Недостаточно рубинов. Требуется {$COST}💎"];
    }

    $db->begin_transaction();
    try {
        // 3. Создание союза
        // NOTE: Предполагаем, что таблица `alliances` имеет поле `max_members`.
        $stmt = $db->prepare("INSERT INTO alliances (name, description, leader_id, max_members) VALUES (?, ?, ?, ?)");
        $stmt->bind_param("ssii", $name, $description, $_SESSION['user_id'], $MAX_MEMBERS_BASE);
        $stmt->execute();
        $allianceId = $db->insert_id;
        
        // 4. Списание рубинов
        $stmt = $db->prepare("UPDATE users SET rubies = rubies - ? WHERE id = ?");
        $stmt->bind_param("di", $COST, $_SESSION['user_id']);
        $stmt->execute();
        
        // 5. Автоматическое вступление лидера в союз
        $stmt = $db->prepare("INSERT INTO alliance_members (alliance_id, user_id) VALUES (?, ?)");
        $stmt->bind_param("ii", $allianceId, $_SESSION['user_id']);
        $stmt->execute();
        
        $db->commit();
        return ['success' => true];
        
    } catch (Exception $e) {
        $db->rollback();
        return ['error' => 'Ошибка создания союза: ' . $e->getMessage()];
    }
}

// Теперь только по приглашению
function joinAlliance($allianceId) {
    return ['error' => 'Вступление возможно только по приглашению.'];
}

function leaveAlliance() {
    $db = getDB();
    
    // Получение текущего союза пользователя
    $stmt = $db->prepare("SELECT alliance_id FROM alliance_members WHERE user_id = ?");
    $stmt->bind_param("i", $_SESSION['user_id']);
    $stmt->execute();
    $result = $stmt->get_result()->fetch_assoc();
    
    if (!$result) {
        return ['error' => 'Вы не состоите в союзе'];
    }
    
    $allianceId = $result['alliance_id'];
    
    // Проверка что пользователь не лидер
    $stmt = $db->prepare("SELECT id FROM alliances WHERE id = ? AND leader_id = ?");
    $stmt->bind_param("ii", $allianceId, $_SESSION['user_id']);
    $stmt->execute();
    if ($stmt->get_result()->num_rows > 0) {
        // Если лидер, нужно проверить, есть ли другие члены. Если нет - удалить союз.
        $stmt = $db->prepare("SELECT COUNT(*) as count FROM alliance_members WHERE alliance_id = ? AND user_id != ?");
        $stmt->bind_param("ii", $allianceId, $_SESSION['user_id']);
        $stmt->execute();
        $count = $stmt->get_result()->fetch_assoc()['count'];
        
        if ($count > 0) {
            return ['error' => 'Лидер не может покинуть союз. Сначала передайте лидерство или исключите всех членов.'];
        } else {
            // Удаляем союз, если это единственный член
            $stmt = $db->prepare("DELETE FROM alliances WHERE id = ?");
            $stmt->bind_param("i", $allianceId);
            $stmt->execute();
            return ['success' => true, 'message' => 'Союз удален.'];
        }
    }
    
    // Выход из союза
    $stmt = $db->prepare("DELETE FROM alliance_members WHERE alliance_id = ? AND user_id = ?");
    $stmt->bind_param("ii", $allianceId, $_SESSION['user_id']);
    
    if ($stmt->execute()) {
        return ['success' => true];
    }
    
    return ['error' => 'Ошибка выхода из союза'];
}

// ---------------------------
// --- ЛОГИКА ПРИГЛАШЕНИЙ ---
// ---------------------------

function sendInvitation($targetUserId) {
    if ($targetUserId < 1) {
        return ['error' => 'Неверный ID пользователя'];
    }
    
    $db = getDB();
    $currentUser = getCurrentUser();

    // 1. Проверить, состоит ли отправитель в союзе и является ли он лидером
    $stmt = $db->prepare("SELECT a.id, a.name, a.max_members, COUNT(am.user_id) as current_members 
                          FROM alliances a
                          LEFT JOIN alliance_members am ON a.id = am.alliance_id
                          WHERE a.leader_id = ?
                          GROUP BY a.id, a.name, a.max_members");
    $stmt->bind_param("i", $_SESSION['user_id']);
    $stmt->execute();
    $alliance = $stmt->get_result()->fetch_assoc();
    
    if (!$alliance) {
        return ['error' => 'Вы не являетесь лидером союза'];
    }
    
    $allianceId = $alliance['id'];
    
    // 2. Проверить лимит мест
    if ($alliance['current_members'] >= $alliance['max_members']) {
        return ['error' => 'Достигнут максимальный лимит членов союза (' . $alliance['max_members'] . ').'];
    }
    
    // 3. Проверить, состоит ли цель уже в союзе или имеет приглашение
    // NOTE: Предполагаем, что таблица `alliance_invitations` создана.
    $stmt = $db->prepare("SELECT user_id FROM alliance_members WHERE user_id = ? 
                          UNION 
                          SELECT user_id FROM alliance_invitations WHERE user_id = ?");
    $stmt->bind_param("ii", $targetUserId, $targetUserId);
    $stmt->execute();
    if ($stmt->get_result()->num_rows > 0) {
        return ['error' => 'Пользователь уже состоит в союзе или имеет активное приглашение'];
    }
    
    // 4. Отправка приглашения
    $stmt = $db->prepare("INSERT INTO alliance_invitations (alliance_id, user_id, invited_by) VALUES (?, ?, ?)");
    $stmt->bind_param("iii", $allianceId, $targetUserId, $_SESSION['user_id']);
    
    if ($stmt->execute()) {
        // Отправка системного сообщения
        $message = "👑 **Приглашение в союз**\n\n";
        $message .= "Вы получили приглашение вступить в союз **{$alliance['name']}** от лидера {$currentUser['colony_name']} (@{$currentUser['username']}).\n";
        $message .= "Перейдите в раздел 'Союзы' для принятия или отклонения.";
        // NOTE: Предполагаем, что `sendSystemPM` определена в func.php
        sendSystemPM($_SESSION['user_id'], $targetUserId, $message);
        
        return ['success' => true];
    }
    
    return ['error' => 'Ошибка отправки приглашения'];
}

function acceptInvitation($allianceId) {
    if ($allianceId < 1) {
        return ['error' => 'Неверный ID союза'];
    }
    
    $db = getDB();
    $userId = $_SESSION['user_id'];

    // 1. Проверить наличие приглашения
    // NOTE: Предполагаем, что таблица `alliance_invitations` создана.
    $stmt = $db->prepare("SELECT id FROM alliance_invitations WHERE alliance_id = ? AND user_id = ?");
    $stmt->bind_param("ii", $allianceId, $userId);
    $stmt->execute();
    if ($stmt->get_result()->num_rows == 0) {
        return ['error' => 'Приглашение не найдено'];
    }

    // 2. Проверить лимит мест
    $stmt = $db->prepare("SELECT a.name, a.max_members, COUNT(am.user_id) as current_members 
                          FROM alliances a
                          LEFT JOIN alliance_members am ON a.id = am.alliance_id
                          WHERE a.id = ?
                          GROUP BY a.id");
    $stmt->bind_param("i", $allianceId);
    $stmt->execute();
    $alliance = $stmt->get_result()->fetch_assoc();
    
    if ($alliance['current_members'] >= $alliance['max_members']) {
        // Удаляем приглашение и сообщаем об ошибке
        $db->prepare("DELETE FROM alliance_invitations WHERE alliance_id = ? AND user_id = ?")->bind_param("ii", $allianceId, $userId)->execute();
        return ['error' => 'К сожалению, в союзе ' . $alliance['name'] . ' больше нет мест.'];
    }
    
    $db->begin_transaction();
    try {
        // 3. Вступление в союз
        $stmt = $db->prepare("INSERT INTO alliance_members (alliance_id, user_id) VALUES (?, ?)");
        $stmt->bind_param("ii", $allianceId, $userId);
        $stmt->execute();
        
        // 4. Удаление приглашения
        $stmt = $db->prepare("DELETE FROM alliance_invitations WHERE alliance_id = ? AND user_id = ?");
        $stmt->bind_param("ii", $allianceId, $userId);
        $stmt->execute();
        
        $db->commit();
        return ['success' => true];
        
    } catch (Exception $e) {
        $db->rollback();
        return ['error' => 'Ошибка вступления в союз'];
    }
}

function rejectInvitation($allianceId) {
    if ($allianceId < 1) {
        return ['error' => 'Неверный ID союза'];
    }
    
    $db = getDB();
    $userId = $_SESSION['user_id'];
    
    $stmt = $db->prepare("DELETE FROM alliance_invitations WHERE alliance_id = ? AND user_id = ?");
    $stmt->bind_param("ii", $allianceId, $userId);
    
    if ($stmt->execute()) {
        return ['success' => true];
    }
    
    return ['error' => 'Ошибка отклонения приглашения'];
}

// ------------------------------
// --- ЛОГИКА ФОНДА И ВЗНОСОВ ---
// ------------------------------

function contributeFund($rubies, $materials) {
    $db = getDB();
    $user = getCurrentUser();
    
    $rubies = floatval($rubies);
    $materials = floatval($materials);
    
    if ($rubies <= 0 && $materials <= 0) {
        return ['error' => 'Введите сумму взноса'];
    }
    
    // Получение союза
    $stmt = $db->prepare("SELECT alliance_id FROM alliance_members WHERE user_id = ?");
    $stmt->bind_param("i", $_SESSION['user_id']);
    $stmt->execute();
    $allianceMember = $stmt->get_result()->fetch_assoc();
    
    if (!$allianceMember) {
        return ['error' => 'Вы не состоите в союзе'];
    }
    
    $allianceId = $allianceMember['alliance_id'];
    
    // Проверка ресурсов
    $rubiesToDeduct = max(0, round($rubies, 4));
    $materialsToDeduct = max(0, round($materials, 2));

    if ($user['rubies'] < $rubiesToDeduct || $user['materials'] < $materialsToDeduct) {
        return ['error' => 'Недостаточно ресурсов для взноса'];
    }

    $db->begin_transaction();
    try {
        // 1. Списание ресурсов у пользователя
        $setParts = [];
        $values = [];
        $typeString = "";

        if ($rubiesToDeduct > 0) {
            $setParts[] = "rubies = rubies - ?";
            $values[] = $rubiesToDeduct;
            $typeString .= "d";
        }
        if ($materialsToDeduct > 0) {
            $setParts[] = "materials = materials - ?";
            $values[] = $materialsToDeduct;
            $typeString .= "d";
        }
        
        $values[] = $_SESSION['user_id'];
        $typeString .= "i";
        
        $sql = "UPDATE users SET " . implode(', ', $setParts) . " WHERE id = ?";
        $stmt = $db->prepare($sql);
        $stmt->bind_param($typeString, ...$values);
        $stmt->execute();
        
        // 2. Пополнение фонда союза
        // NOTE: Предполагаем, что таблица `alliances` обновлена с `rubies_fund` и `materials_fund`
        $stmt = $db->prepare("UPDATE alliances SET rubies_fund = rubies_fund + ?, materials_fund = materials_fund + ? WHERE id = ?");
        $stmt->bind_param("ddi", $rubiesToDeduct, $materialsToDeduct, $allianceId);
        $stmt->execute();
        
        // 3. Запись взноса
        // NOTE: Предполагаем, что таблица `alliance_contributions` создана.
        $stmt = $db->prepare("INSERT INTO alliance_contributions (alliance_id, user_id, rubies_amount, materials_amount) VALUES (?, ?, ?, ?)");
        $stmt->bind_param("iidd", $allianceId, $_SESSION['user_id'], $rubiesToDeduct, $materialsToDeduct);
        $stmt->execute();
        
        $db->commit();
        return ['success' => true];

    } catch (Exception $e) {
        $db->rollback();
        return ['error' => 'Ошибка взноса: ' . $e->getMessage()];
    }
}

function upgradeCapacity() {
    $db = getDB();
    $user = getCurrentUser();
    $COST_PER_SLOT = 100; // Стоимость +1 места
    $MAX_CAPACITY = 10;
    
    // 1. Проверить, состоит ли пользователь в союзе и является ли он лидером
    $stmt = $db->prepare("SELECT id, name, max_members, rubies_fund FROM alliances WHERE leader_id = ?");
    $stmt->bind_param("i", $_SESSION['user_id']);
    $stmt->execute();
    $alliance = $stmt->get_result()->fetch_assoc();
    
    if (!$alliance) {
        return ['error' => 'Вы не являетесь лидером союза'];
    }
    
    if ($alliance['max_members'] >= $MAX_CAPACITY) {
        return ['error' => "Достигнута максимальная вместимость союза ({$MAX_CAPACITY} мест)"];
    }
    
    // 2. Проверить фонд союза
    if ($alliance['rubies_fund'] < $COST_PER_SLOT) {
        return ['error' => "Недостаточно рубинов в Фонде Союза. Требуется {$COST_PER_SLOT}💎"];
    }
    
    $db->begin_transaction();
    try {
        // 3. Списание из фонда и обновление лимита
        $newCapacity = $alliance['max_members'] + 1;
        $stmt = $db->prepare("UPDATE alliances SET max_members = ?, rubies_fund = rubies_fund - ? WHERE id = ?");
        $stmt->bind_param("idi", $newCapacity, $COST_PER_SLOT, $alliance['id']);
        $stmt->execute();
        
        $db->commit();
        return ['success' => true, 'new_capacity' => $newCapacity];
        
    } catch (Exception $e) {
        $db->rollback();
        return ['error' => 'Ошибка расширения вместимости: ' . $e->getMessage()];
    }
}

// ----------------------------------------
// --- ЛОГИКА ПОСТРОЕК СОЮЗА (NEW) ---
// ----------------------------------------

function buyAllianceBuilding($type) {
    $db = getDB();
    $defs = getAllianceBuildingDefinitions();
    // 1. Проверка типа постройки
    if (!isset($defs[$type]) || $type < 1 || $type > 4) {
        return ['error' => 'Неверный тип постройки'];
    }
    
    // 2. Проверка: Лидерство и членство
    $stmt = $db->prepare("SELECT a.id, a.rubies_fund, a.materials_fund FROM alliances a 
                          JOIN alliance_members am ON a.id = am.alliance_id
                          WHERE am.user_id = ? AND a.leader_id = ?");
    $stmt->bind_param("ii", $_SESSION['user_id'], $_SESSION['user_id']);
    $stmt->execute();
    $alliance = $stmt->get_result()->fetch_assoc();
    if (!$alliance) {
        return ['error' => 'Вы должны быть Лидером Союза'];
    }
    
    // 3. Проверка: Уже построена?
    // NOTE: Предполагаем, что таблица `alliance_buildings` существует
    $stmt = $db->prepare("SELECT level FROM alliance_buildings WHERE alliance_id = ? AND building_type = ?");
    $stmt->bind_param("ii", $alliance['id'], $type);
    $stmt->execute();
    if ($stmt->get_result()->num_rows > 0) {
        return ['error' => 'Постройка уже существует. Используйте "Улучшить"'];
    }
    
    // 4. Проверка стоимости (Уровень 1)
    $cost = getAllianceBuildingCost($type, 1);
    
    if ($alliance['rubies_fund'] < ($cost['rubies'] ?? 0) || $alliance['materials_fund'] < ($cost['materials'] ?? 0)) {
        return ['error' => 'Недостаточно средств в Фонде Союза'];
    }

    $db->begin_transaction();
    try {
        // 5. Списание и строительство
        $stmt = $db->prepare("UPDATE alliances SET rubies_fund = rubies_fund - ?, materials_fund = materials_fund - ? WHERE id = ?");
        $stmt->bind_param("ddi", $cost['rubies'], $cost['materials'], $alliance['id']);
        $stmt->execute();
        
        $stmt = $db->prepare("INSERT INTO alliance_buildings (alliance_id, building_type, level, count) VALUES (?, ?, 1, 1)");
        $stmt->bind_param("ii", $alliance['id'], $type);
        $stmt->execute();
        
        $db->commit();
        return ['success' => true, 'new_level' => 1];
    } catch (Exception $e) {
        $db->rollback();
        return ['error' => 'Ошибка строительства: ' . $e->getMessage()];
    }
}

function upgradeAllianceBuilding($type) {
    $db = getDB();
    $defs = getAllianceBuildingDefinitions();
    // 1. Проверка типа постройки
    if (!isset($defs[$type])) {
        return ['error' => 'Неверный тип постройки'];
    }

    // 2. Проверка: Лидерство и членство
    // NOTE: Предполагаем, что таблица `alliance_buildings` существует
    $stmt = $db->prepare("SELECT a.id, a.rubies_fund, a.materials_fund, ab.level FROM alliances a 
                          JOIN alliance_members am ON a.id = am.alliance_id
                          LEFT JOIN alliance_buildings ab ON a.id = ab.alliance_id AND ab.building_type = ?
                          WHERE am.user_id = ? AND a.leader_id = ?");
    $stmt->bind_param("iii", $type, $_SESSION['user_id'], $_SESSION['user_id']);
    $stmt->execute();
    $result = $stmt->get_result()->fetch_assoc();
    
    if (!$result) {
        return ['error' => 'Вы не являетесь Лидером или постройка не найдена'];
    }
    
    $alliance = $result;
    $currentLevel = (int)($result['level'] ?? 0);
    $allianceId = $alliance['id'];
    
    if ($currentLevel === 0) {
        return ['error' => 'Сначала постройте здание.'];
    }
    if ($currentLevel >= $defs[$type]['max_level']) {
        return ['error' => 'Максимальный уровень достигнут'];
    }
    
    $newLevel = $currentLevel + 1;
    
    // 3. Проверка стоимости
    $cost = getAllianceBuildingCost($type, $newLevel);
    
    if ($alliance['rubies_fund'] < ($cost['rubies'] ?? 0) || $alliance['materials_fund'] < ($cost['materials'] ?? 0)) {
        return ['error' => 'Недостаточно средств в Фонде Союза'];
    }

    $db->begin_transaction();
    try {
        // 4. Списание и улучшение
        $stmt = $db->prepare("UPDATE alliances SET rubies_fund = rubies_fund - ?, materials_fund = materials_fund - ? WHERE id = ?");
        $stmt->bind_param("ddi", $cost['rubies'], $cost['materials'], $allianceId);
        $stmt->execute();
        
        $stmt = $db->prepare("UPDATE alliance_buildings SET level = ? WHERE alliance_id = ? AND building_type = ?");
        $stmt->bind_param("iii", $newLevel, $allianceId, $type);
        $stmt->execute();
        
        $db->commit();
        return ['success' => true, 'new_level' => $newLevel];
    } catch (Exception $e) {
        $db->rollback();
        return ['error' => 'Ошибка улучшения: ' . $e->getMessage()];
    }
}

function getAllianceProfile($allianceId) {
    if ($allianceId < 1) {
        return ['error' => 'Неверный ID союза'];
    }
    
    $db = getDB();
    
    // 1. Получение основной информации о союзе
    $sql = "SELECT a.id, a.name, a.description, a.max_members,
                   u.username as leader_name, u.colony_name as leader_colony
            FROM alliances a 
            LEFT JOIN users u ON a.leader_id = u.id
            WHERE a.id = ?";
    $stmt = $db->prepare($sql);
    $stmt->bind_param("i", $allianceId);
    $stmt->execute();
    $alliance = $stmt->get_result()->fetch_assoc();
    
    if (!$alliance) {
        return ['error' => 'Союз не найден'];
    }
    
    // 2. Получение участников
    $stmt = $db->prepare("SELECT am.user_id, am.joined_at, u.username, u.colony_name, u.id AS user_id_id,
                                 (u.money + u.water*2 + u.food*3 + u.oxygen*2 + u.electricity*3 + u.materials*5 + u.rubies*100) as total_value
                          FROM alliance_members am
                          JOIN users u ON am.user_id = u.id
                          WHERE am.alliance_id = ?
                          ORDER BY total_value DESC");
    $stmt->bind_param("i", $allianceId);
    $stmt->execute();
    $allianceMembers = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

    // 3. Получение построек
    $allianceBuildings = getAllianceBuildings($allianceId);
    
    // Добавление флага лидера для каждого участника
    foreach ($allianceMembers as &$member) {
        $member['is_leader'] = ($member['username'] == $alliance['leader_name']);
        // Исправление: user_id уже есть в выборке, но для безопасности
        $member['user_id'] = $member['user_id_id'];
        unset($member['user_id_id']);
    }
    
    return [
        'success' => true,
        'alliance' => $alliance,
        'members' => $allianceMembers,
        'buildings' => $allianceBuildings
    ];
}
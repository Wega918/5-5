-- phpMyAdmin SQL Dump
-- version 4.9.7
-- https://www.phpmyadmin.net/
--
-- Хост: localhost
-- Время создания: Ноя 02 2025 г., 12:34
-- Версия сервера: 8.0.34-26-beget-1-1
-- Версия PHP: 5.6.40

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- База данных: `sergivan1_colony`
--

-- --------------------------------------------------------

--
-- Структура таблицы `alliances`
--
-- Создание: Ноя 02 2025 г., 07:10
-- Последнее обновление: Ноя 02 2025 г., 08:07
--

DROP TABLE IF EXISTS `alliances`;
CREATE TABLE `alliances` (
  `id` int NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `description` text COLLATE utf8mb4_general_ci,
  `max_members` int NOT NULL DEFAULT '5',
  `leader_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `rubies_fund` decimal(15,4) NOT NULL DEFAULT '0.0000',
  `materials_fund` decimal(15,2) NOT NULL DEFAULT '0.00'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Дамп данных таблицы `alliances`
--

INSERT INTO `alliances` (`id`, `name`, `description`, `max_members`, `leader_id`, `created_at`, `rubies_fund`, `materials_fund`) VALUES
(1, 'ТеРнАвКа', '', 5, 8, '2025-10-27 15:57:05', '0.0000', '0.00'),
(2, 'Администрация', '', 5, 4, '2025-10-28 04:28:12', '0.0000', '0.00'),
(3, 'Союз', 'Описание союза', 5, 22, '2025-11-02 07:19:48', '1.0000', '20.00');

-- --------------------------------------------------------

--
-- Структура таблицы `alliance_buildings`
--
-- Создание: Ноя 02 2025 г., 07:10
--

DROP TABLE IF EXISTS `alliance_buildings`;
CREATE TABLE `alliance_buildings` (
  `id` int NOT NULL,
  `alliance_id` int NOT NULL,
  `building_type` int NOT NULL,
  `level` int NOT NULL DEFAULT '1',
  `count` int NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Структура таблицы `alliance_contributions`
--
-- Создание: Ноя 02 2025 г., 07:10
-- Последнее обновление: Ноя 02 2025 г., 08:07
--

DROP TABLE IF EXISTS `alliance_contributions`;
CREATE TABLE `alliance_contributions` (
  `id` int NOT NULL,
  `alliance_id` int NOT NULL,
  `user_id` int NOT NULL,
  `rubies_amount` decimal(15,4) NOT NULL DEFAULT '0.0000',
  `materials_amount` decimal(15,2) NOT NULL DEFAULT '0.00',
  `contributed_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Дамп данных таблицы `alliance_contributions`
--

INSERT INTO `alliance_contributions` (`id`, `alliance_id`, `user_id`, `rubies_amount`, `materials_amount`, `contributed_at`) VALUES
(1, 3, 22, '0.0000', '10.00', '2025-11-02 07:20:10'),
(2, 3, 32, '1.0000', '10.00', '2025-11-02 08:07:21');

-- --------------------------------------------------------

--
-- Структура таблицы `alliance_invitations`
--
-- Создание: Ноя 02 2025 г., 07:10
-- Последнее обновление: Ноя 02 2025 г., 08:06
--

DROP TABLE IF EXISTS `alliance_invitations`;
CREATE TABLE `alliance_invitations` (
  `id` int NOT NULL,
  `alliance_id` int NOT NULL,
  `user_id` int NOT NULL,
  `invited_by` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Структура таблицы `alliance_members`
--
-- Создание: Окт 26 2025 г., 20:38
-- Последнее обновление: Ноя 02 2025 г., 08:06
--

DROP TABLE IF EXISTS `alliance_members`;
CREATE TABLE `alliance_members` (
  `id` int NOT NULL,
  `alliance_id` int NOT NULL,
  `user_id` int NOT NULL,
  `joined_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Дамп данных таблицы `alliance_members`
--

INSERT INTO `alliance_members` (`id`, `alliance_id`, `user_id`, `joined_at`) VALUES
(1, 1, 8, '2025-10-27 15:57:05'),
(2, 2, 4, '2025-10-28 04:28:12'),
(4, 2, 19, '2025-10-28 09:53:46'),
(5, 2, 13, '2025-10-29 05:40:10'),
(8, 1, 18, '2025-10-29 11:01:05'),
(9, 1, 23, '2025-10-31 18:12:52'),
(10, 1, 24, '2025-10-31 19:27:41'),
(11, 3, 22, '2025-11-02 07:19:48'),
(12, 3, 28, '2025-11-02 07:34:35'),
(13, 3, 32, '2025-11-02 08:06:10');

-- --------------------------------------------------------

--
-- Структура таблицы `chat_messages`
--
-- Создание: Окт 26 2025 г., 20:38
-- Последнее обновление: Ноя 01 2025 г., 18:51
--

DROP TABLE IF EXISTS `chat_messages`;
CREATE TABLE `chat_messages` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `message` text COLLATE utf8mb4_general_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `deleted_by` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Дамп данных таблицы `chat_messages`
--

INSERT INTO `chat_messages` (`id`, `user_id`, `message`, `created_at`, `deleted_at`, `deleted_by`) VALUES
(1, 2, 'kl', '2025-10-26 20:45:39', NULL, NULL),
(2, 5, 'прар', '2025-10-27 09:22:49', NULL, NULL),
(3, 6, '🤘', '2025-10-27 13:01:22', NULL, NULL),
(4, 6, '🌟', '2025-10-27 14:52:35', NULL, NULL),
(5, 4, 'привет', '2025-10-27 15:28:23', NULL, NULL),
(6, 4, '💖', '2025-10-27 15:28:57', NULL, NULL),
(7, 18, '💖', '2025-10-29 10:21:00', NULL, NULL),
(8, 18, '🖐️', '2025-10-29 10:27:29', NULL, NULL),
(9, 23, '😻', '2025-10-31 18:18:44', NULL, NULL),
(10, 25, '😿', '2025-11-01 03:36:46', '2025-11-01 13:14:59', 22),
(11, 22, '33', '2025-11-01 13:38:13', NULL, NULL),
(12, 22, 'апр', '2025-11-01 13:38:41', NULL, NULL),
(13, 22, 'про', '2025-11-01 13:39:27', NULL, NULL),
(14, 27, 'нг', '2025-11-01 13:40:24', NULL, NULL),
(15, 27, 'пар', '2025-11-01 13:47:36', NULL, NULL),
(16, 22, 'лдо', '2025-11-01 14:01:11', NULL, NULL),
(17, 27, 'олд', '2025-11-01 14:01:19', NULL, NULL),
(18, 27, 'ооо', '2025-11-01 14:08:10', NULL, NULL),
(19, 22, 'агоаг', '2025-11-01 18:51:26', NULL, NULL);

-- --------------------------------------------------------

--
-- Структура таблицы `news`
--
-- Создание: Окт 26 2025 г., 20:38
-- Последнее обновление: Ноя 02 2025 г., 09:08
--

DROP TABLE IF EXISTS `news`;
CREATE TABLE `news` (
  `id` int NOT NULL,
  `title` varchar(200) COLLATE utf8mb4_general_ci NOT NULL,
  `content` text COLLATE utf8mb4_general_ci NOT NULL,
  `created_by` int DEFAULT NULL,
  `is_notification` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Дамп данных таблицы `news`
--

INSERT INTO `news` (`id`, `title`, `content`, `created_by`, `is_notification`, `created_at`) VALUES
(1, 'Добро пожаловать на Марс!', 'Начните свое путешествие по колонизации красной планеты. Стройте, развивайтесь и выживайте!', NULL, 0, '2025-10-26 20:38:30'),
(2, 'Обновление системы бизнесов', 'Добавлены новые возможности для развития экономики вашей колонии.', NULL, 0, '2025-10-26 20:38:30'),
(3, 'Система союзов активна', 'Теперь вы можете объединяться с другими игроками для совместного развития.', NULL, 0, '2025-10-26 20:38:30'),
(4, 'вава', 'ываыаыва', 22, 1, '2025-11-02 09:08:01');

-- --------------------------------------------------------

--
-- Структура таблицы `private_messages`
--
-- Создание: Окт 26 2025 г., 20:38
-- Последнее обновление: Ноя 02 2025 г., 08:05
--

DROP TABLE IF EXISTS `private_messages`;
CREATE TABLE `private_messages` (
  `id` int NOT NULL,
  `from_user_id` int NOT NULL,
  `to_user_id` int NOT NULL,
  `message` text COLLATE utf8mb4_general_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `read_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `deleted_by` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Дамп данных таблицы `private_messages`
--

INSERT INTO `private_messages` (`id`, `from_user_id`, `to_user_id`, `message`, `created_at`, `read_at`, `deleted_at`, `deleted_by`) VALUES
(1, 2, 1, 'f', '2025-10-26 20:44:31', NULL, NULL, NULL),
(2, 2, 1, 'kj', '2025-10-26 20:44:43', NULL, NULL, NULL),
(3, 2, 1, 'jh', '2025-10-26 20:44:51', NULL, NULL, NULL),
(4, 2, 1, 'jhk', '2025-10-26 20:44:57', NULL, NULL, NULL),
(5, 2, 1, 'o', '2025-10-26 20:54:29', NULL, NULL, NULL),
(6, 4, 8, 'Привет💖', '2025-10-27 18:43:20', NULL, NULL, NULL),
(7, 20, 19, '🤞', '2025-10-28 14:56:24', '2025-11-01 18:14:13', NULL, NULL),
(8, 27, 22, 'апр', '2025-11-01 13:39:07', '2025-11-01 14:07:16', NULL, NULL),
(9, 22, 27, 'неен', '2025-11-01 14:07:36', '2025-11-01 14:07:43', NULL, NULL),
(10, 22, 27, '🥵', '2025-11-01 14:07:48', '2025-11-01 14:07:51', NULL, NULL),
(11, 22, 27, 'про', '2025-11-01 14:07:53', '2025-11-01 14:08:02', NULL, NULL),
(12, 22, 27, 'лролро', '2025-11-01 18:51:33', NULL, NULL, NULL),
(13, 22, 32, '😀', '2025-11-01 18:51:55', '2025-11-02 06:20:38', NULL, NULL),
(14, 22, 27, '33', '2025-11-01 20:06:50', NULL, NULL, NULL),
(15, 22, 27, '232', '2025-11-01 20:06:57', NULL, NULL, NULL),
(16, 32, 22, '😬', '2025-11-02 06:20:47', '2025-11-02 07:02:20', NULL, NULL),
(17, 32, 22, '🤑', '2025-11-02 06:52:35', '2025-11-02 07:02:20', NULL, NULL),
(18, 22, 22, '👑 **Системное уведомление**\n\n✅ Ваш платеж **#6** на сумму 10.00 RUB был **подтвержден** администратором.\n💎 Начислено **10** Рубинов. \n\nСпасибо за поддержку колонии!', '2025-11-02 07:01:01', '2025-11-02 07:01:09', NULL, NULL),
(19, 22, 32, '🤧', '2025-11-02 07:02:27', '2025-11-02 07:05:34', NULL, NULL),
(20, 32, 22, '😖', '2025-11-02 07:06:07', '2025-11-02 07:18:46', NULL, NULL),
(21, 22, 32, '😍', '2025-11-02 07:18:54', '2025-11-02 07:25:01', NULL, NULL),
(22, 32, 22, '😜', '2025-11-02 07:25:14', '2025-11-02 07:32:48', NULL, NULL),
(23, 22, 32, 'буде в мене пиво?', '2025-11-02 07:33:12', '2025-11-02 08:05:25', NULL, NULL),
(24, 22, 28, '👑 **Приглашение в союз**\n\nВы получили приглашение вступить в союз **Союз** от лидера new (@newnew).\nПерейдите в раздел \'Союзы\' для принятия или отклонения.', '2025-11-02 07:33:44', '2025-11-02 07:34:11', NULL, NULL),
(25, 22, 32, '👑 **Приглашение в союз**\n\nВы получили приглашение вступить в союз **Союз** от лидера new (@newnew).\nПерейдите в раздел \'Союзы\' для принятия или отклонения.', '2025-11-02 07:37:09', '2025-11-02 08:05:25', NULL, NULL);

-- --------------------------------------------------------

--
-- Структура таблицы `users`
--
-- Создание: Ноя 01 2025 г., 14:06
-- Последнее обновление: Ноя 02 2025 г., 09:34
--

DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` int NOT NULL,
  `username` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `email` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `colony_name` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `last_active` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `money` varchar(100) COLLATE utf8mb4_general_ci DEFAULT '335',
  `water` varchar(100) COLLATE utf8mb4_general_ci DEFAULT '120',
  `food` varchar(100) COLLATE utf8mb4_general_ci DEFAULT '60',
  `oxygen` varchar(100) COLLATE utf8mb4_general_ci DEFAULT '180',
  `electricity` varchar(100) COLLATE utf8mb4_general_ci DEFAULT '50',
  `materials` varchar(100) COLLATE utf8mb4_general_ci DEFAULT '60',
  `rubies` varchar(100) COLLATE utf8mb4_general_ci DEFAULT '1',
  `residents_waiting` int DEFAULT '5',
  `residents_settled` int DEFAULT '0',
  `residents_working` int DEFAULT '0',
  `residents_deaths` int NOT NULL DEFAULT '0',
  `last_income_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `role` enum('user','moderator','admin') COLLATE utf8mb4_general_ci DEFAULT 'user',
  `muted_until` timestamp NULL DEFAULT NULL,
  `blocked_until` timestamp NULL DEFAULT NULL,
  `profile_description` text COLLATE utf8mb4_general_ci,
  `profile_avatar` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `last_growth_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `last_read_chat_timestamp` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Дамп данных таблицы `users`
--

INSERT INTO `users` (`id`, `username`, `email`, `password_hash`, `colony_name`, `created_at`, `money`, `water`, `food`, `oxygen`, `electricity`, `materials`, `rubies`, `residents_waiting`, `residents_settled`, `residents_working`, `residents_deaths`, `last_income_time`, `role`, `muted_until`, `blocked_until`, `profile_description`, `profile_avatar`, `last_growth_time`, `last_read_chat_timestamp`) VALUES
(1, 'admin', 'admin@mars.game', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Центр Управления', '2025-10-26 20:38:30', '10000', '1000', '1000', '1000', '1000', '1000', '100', 5, 0, 0, 0, '2025-10-26 20:38:30', 'admin', '2025-10-26 21:44:01', NULL, NULL, NULL, '2025-10-27 11:20:36', NULL),
(2, 'Admin1', 'lovekent5246@gmail.com', '$2y$10$rK0jy5cnuJ8UgJ2YjX7Youp1IZMHZ4LNF4hcl6mkSQ2UFhqtJQ8WC', 'Администрация', '2025-10-26 20:39:36', '9638913', '278040', '193120', '11127', '461592', '176078', '4700', 45, 3, 25, 607, '2025-10-28 05:31:51', 'admin', NULL, '2025-10-26 20:54:50', NULL, NULL, '2025-10-28 05:31:51', NULL),
(3, 'Qqq', 'loo@gmail.con', '$2y$10$HK/zMshwLYQreGz6U2KLfempybQfv8retTzNd0WnNHBT3.WHAhfr.', 'Название поселения', '2025-10-26 23:46:25', '36', '0', '0', '0', '0', '25', '1', 15, 1, 5, 4, '2025-10-28 14:51:00', 'user', NULL, NULL, NULL, NULL, '2025-10-28 14:51:00', NULL),
(4, 'Adm1', 'www.9-sey.12@mail.ru', '$2y$10$2Sf3KLfEem0rbscuf5JGbOtpRTANe.Y83u0X7qYDaT78bTywl1DZu', 'Система1', '2025-10-27 07:48:43', '20', '14', '32', '0', '0', '131', '4', 4, 0, 0, 65, '2025-10-28 06:47:15', 'admin', NULL, NULL, NULL, NULL, '2025-10-28 06:36:47', NULL),
(5, 'Admin12', 'lovekent52462@gmail.com', '$2y$10$XTSbVIMmEGrW9Gsn.I0MXep5UFjSKkBLF.oSJcXHfHAtm83ULAo6W', 'SD', '2025-10-27 08:32:48', '134', '0', '0', '0', '0', '15', '0', 0, 0, 0, 10, '2025-10-27 09:28:55', 'user', NULL, NULL, NULL, NULL, '2025-10-27 11:20:36', NULL),
(6, 'Test', 'Test5246@gmail.com', '$2y$10$4slZtoIVakoOdnBkejIttu39MHwxrUeiLRcCYDqwQgjuE57WCJhou', 'Test', '2025-10-27 12:52:56', '2', '0', '0', '30', '0', '43', '1', 12, 0, 0, 5, '2025-10-27 14:59:04', 'user', NULL, NULL, NULL, NULL, '2025-10-27 14:47:46', NULL),
(8, 'ПоЗиТиФчИк', 'tincufedea@gmail.com', '$2y$10$VzaI6IxeM9JrRkKKuTM7BOn75ZBzw89seuoX560tyRq/Kzhg72HZK', 'ТеРнАвКа', '2025-10-27 15:41:24', '40', '121', '73', '10', '0', '55', '1', 0, 0, 0, 27, '2025-10-27 17:42:57', 'user', NULL, NULL, NULL, NULL, '2025-10-27 17:39:26', NULL),
(9, 'Позитив', 'ncufedea@gmail.com', '$2y$10$dpbINagoZ/krcN309Q1fFeRTm6HPzjF8MCengtYOdOFUeaUjDTT5O', 'Тера', '2025-10-27 17:44:32', '38', '282', '8', '240', '0', '20', '1', 11, 5, 5, 11, '2025-10-28 07:30:20', 'user', NULL, NULL, NULL, NULL, '2025-10-28 07:19:39', NULL),
(10, 'Testt', 'Testt@gmail.com', '$2y$10$raQvRLTdiGsMwVg.IN/zieTtG0AgB8WJvL/nqMKq4Mj7AJdvSo/om', 'Testt', '2025-10-28 05:05:16', '20', '129', '60', '189', '38', '20', '1', 10, 0, 0, 0, '2025-10-28 05:08:35', 'user', NULL, NULL, NULL, NULL, '2025-10-28 05:05:16', NULL),
(11, 'Test11', 'Test11246@gmail.com', '$2y$10$T6PYlnTQnL86lxj/CDqDiOudY9YmSM5V1cfobneWTsQ.8glMBSrCa', 'Test11', '2025-10-28 05:09:16', '165', '113', '57', '168', '44', '0', '1', 5, 5, 1, 0, '2025-10-28 05:10:23', 'user', NULL, NULL, NULL, NULL, '2025-10-28 05:09:16', NULL),
(12, 'Testt11', 'Testt11@gmail.com', '$2y$10$oDz9GhJ.wzrlARhcO8WSverzw/EM53whu9pcZykG/1PHde/cErqR6', 'Testt11', '2025-10-28 05:11:46', '39', '24', '21', '9', '10', '0', '1', 0, 3, 3, 8, '2025-10-28 05:31:57', 'user', NULL, NULL, NULL, NULL, '2025-10-28 05:27:11', NULL),
(13, 'Testt111', 'Testt111@mail.ru', '$2y$10$PKf5Rj3K21SmS8Jf/eBooOnGedjeoL/J.0vzIm2BFEMAUEwP/a9Lq', 'Testt111', '2025-10-28 06:48:11', '80', '75.91358209527456', '50.065890095478395', '0', '0', '64.1705980756343', '2.608529903781722', 150, 0, 0, 8, '2025-10-31 19:05:54', 'user', NULL, NULL, NULL, NULL, '2025-10-31 19:05:26', NULL),
(14, 'Testt111Testt111', 'Testt1115246@gmail.com', '$2y$10$1vuVBt/.NNXHr3qNSmVhfOfl9gYLa0TY8T.Q32GXxyYgQyC/2HxQa', 'Testt111Testt111', '2025-10-28 06:51:21', '29', '0', '30', '3', '0', '39', '0', 95, 3, 0, 26, '2025-10-28 08:06:49', 'user', NULL, NULL, NULL, NULL, '2025-10-28 07:52:47', NULL),
(15, 'Позитивчик', 'fde@gmail.com', '$2y$10$ABJ9Q14OF9vmVBSnTwkaLephZjsshj.TEqVDhnIdcmezgMEopza9K', 'Терарус', '2025-10-28 07:31:46', '30', '8', '0', '14', '0', '0', '1', 6, 1, 1, 4, '2025-10-28 08:09:04', 'user', NULL, NULL, NULL, NULL, '2025-10-28 07:47:36', NULL),
(16, 'qeqw', 'qeqw46@gmail.com', '$2y$10$pih0D3fqPffr.UgXAylpVOPr15xnXyxN4W0xd3waIftEnZEBBpL0.', 'qeqw', '2025-10-28 07:58:39', '50', '120', '60', '180', '50', '0', '0', 10, 0, 0, 0, '2025-10-28 07:59:53', 'user', NULL, NULL, NULL, NULL, '2025-10-28 07:58:39', NULL),
(17, 'fdgfh', 'fdgfh46@gmail.com', '$2y$10$aTCWr6DSGA8.aHq0pGzNT.uQ4nnmWtJob2nWCei8Tehe55cdwwRsO', 'fdgfh', '2025-10-28 08:01:03', '17', '96', '44', '143', '25', '10', '0', 2, 5, 5, 3, '2025-10-28 08:07:03', 'user', NULL, NULL, NULL, NULL, '2025-10-28 08:01:03', NULL),
(18, 'dasfsf', 'dasfsf246@gmail.com', '$2y$10$qfo7Rlup/FPzQD2g15J/Oe69IV1ZQRnE77/u6NcxcQ6WNw7eQudAi', 'dasfsf', '2025-10-28 08:08:01', '25706', '25540', '16304', '11538', '28708', '38687', '2152', 51, 200, 161, 214, '2025-10-31 10:23:39', 'user', NULL, NULL, NULL, NULL, '2025-10-31 07:43:51', NULL),
(19, 'Буратино', 'gfe@gmail.com', '$2y$10$tR5o5VUrPlqELiq9MFXdduldX49wx6eZvFceCgUNg/GZi.VzfRsOi', 'Золотой Лес', '2025-10-28 08:10:02', '29484430.77694813', '837145.8598468624', '549496.88429544', '698895.058387502', '576657.0199642589', '357849.6800780527', '15168.733922941105', 8, 272, 272, 0, '2025-11-01 19:18:47', 'user', NULL, NULL, NULL, NULL, '2025-11-01 19:16:22', '2025-11-01 21:51:26'),
(20, 'Qqqwww', 'loog@gmail.con', '$2y$10$H.6jZMOA9rQLkDUgM2Tc2O18j9yMELumLrO1ICAIqc4V7dJ66ZSdS', 'Hhh', '2025-10-28 14:50:46', '7476.349322039948', '732.0651460344012', '488.04343068960156', '274.98614347775765', '4726.379335145112', '2992.7397288159814', '148.98698644079886', 37, 5, 5, 0, '2025-10-31 21:38:36', 'user', NULL, NULL, NULL, NULL, '2025-10-31 21:38:36', NULL),
(21, 'Qqqww', 'loodfffg@gmail.con', '$2y$10$tBTBw2OH3w/M55K2Xx40.uCy7Afo/sVHzPvjhyXWdyCJznd.AYWqm', 'Hhh', '2025-10-28 14:52:42', '335', '120', '60', '180', '50', '60', '1', 5, 0, 0, 0, '2025-10-28 14:52:42', 'user', NULL, NULL, NULL, NULL, '2025-10-28 14:52:42', NULL),
(22, 'newnew', 'new@gmail.com', '$2y$10$qEUwFS6B7dNgFapVcr0atOl5ZlAbWGbbh8s1kY5LKwDhV67QdxsLa', 'new', '2025-10-31 08:55:49', '187733.8666967195', '1132.4710991497832', '757.3578555250174', '607.249097994766', '24249.675191024715', '9713.450397692937', '1.0742103641761778', 18, 182, 177, 26, '2025-11-02 09:34:14', 'admin', NULL, NULL, NULL, NULL, '2025-11-02 09:24:43', '2025-11-01 21:51:26'),
(23, 'Позитив Я', 'hffh@gmail.com', '$2y$10$61pxHWLLoWZC.JBBMokbM.1YgyKtnaxZ4unelwqfwFGYbWRGGvQ72', 'Звиздец', '2025-10-31 17:55:04', '3931.926372218429', '0.10400708913803103', '0.06933805942535393', '0.13867611885070785', '3079.663716532149', '780.2509254986769', '21.410313687538256', 43, 24, 24, 3, '2025-11-02 05:29:30', 'user', NULL, NULL, NULL, NULL, '2025-11-02 05:29:27', '2025-11-01 17:08:10'),
(24, 'Adm2', 'www.9-1sey.17@mail.ru', '$2y$10$0Zx.oZHFKl/YyMAxuJWVOuD8XMYsiaLRo9Np.9YNuxU20REdQotpm', 'Система', '2025-10-31 19:06:29', '5', '74.19096919614319', '29.243479897698325', '4.756037882963818', '545.7869156995214', '471.9227945523667', '23.596139727618347', 26, 5, 0, 0, '2025-11-01 03:30:56', 'user', NULL, NULL, NULL, NULL, '2025-11-01 03:26:09', NULL),
(25, 'Adm3', 'www.9-1sey.02@mail.ru', '$2y$10$dnX2Ry8DJwPbOR7q7EI/F.wkROzp87iCLWYytP46Od7D0HduYnwcy', 'Система8', '2025-11-01 03:30:28', '2.9905364632605043', '0', '1121.4394344958291', '16.622747011184753', '998.5651136929201', '2222.6964869452763', '40.82282871699075', 12, 0, 0, 43, '2025-11-01 15:32:44', 'user', NULL, NULL, NULL, NULL, '2025-11-01 15:21:33', '2025-11-01 17:08:10'),
(26, 'русский', 'lovd@gmail.com', '$2y$10$gtnZzWErz.6T0nYiEJ0A8O4tLeHvtvMOLNapLpJeGHs/QEP1av/Gm', 'русский', '2025-11-01 09:42:17', '335', '120', '60', '180', '50', '60', '1', 5, 0, 0, 0, '2025-11-01 09:46:23', 'user', NULL, NULL, NULL, NULL, '2025-11-01 09:42:17', NULL),
(27, 'русский1', 'ldd46@gmail.com', '$2y$10$PfpGqAkrhNnKoF43/v336Os7vQ/34fYwrJXqWHO.pQEoABRDg6maS', 'русский1', '2025-11-01 09:46:34', '311.41172898992056', '504.1649369592699', '315.83829054006037', '434.59999583117445', '566.5452077525064', '10', '1', 18, 5, 1, 0, '2025-11-01 14:22:43', 'user', NULL, NULL, NULL, NULL, '2025-11-01 14:08:39', '2025-11-01 17:08:10'),
(28, 'русский11', 'loveke1nt5246@gmail.com', '$2y$10$Buxk9xnXpWTif5wKdeWlpuqPSaGB8nJZaZb/9FIkhB9Ullsgxo5qi', 'русский11', '2025-11-01 10:05:38', '335', '120', '60', '180', '50', '60', '1', 16, 0, 0, 0, '2025-11-02 07:49:20', 'user', NULL, NULL, NULL, NULL, '2025-11-02 07:49:05', NULL),
(29, 'русский111', 'lov1eke1nt5246@gmail.com', '$2y$10$lgXlnzJVF06ZlNL4Drcd3uo17/8AXvSdkSuq8x/4p/59hXYWmmwPG', 'русский111', '2025-11-01 10:09:09', '55.834820886452995', '126.26117340683945', '63.78107793569564', '186.18892711877808', '53.34206009868778', '10', '1', 9, 1, 1, 0, '2025-11-01 10:17:55', 'user', NULL, NULL, NULL, NULL, '2025-11-01 10:09:09', NULL),
(30, 'русский1111', 'lovekent524116@gmail.com', '$2y$10$lJjf6PbLqPJQPQ0F8il9A.HgB/ephPrCmJP4pOh.Tn.D6EsH7Q8BG', 'русский1111', '2025-11-01 10:18:10', '56.25844241380691', '145.74497018098825', '71.0224242862066', '207.5861930243174', '47.28074265964828', '10', '1', 10, 1, 1, 0, '2025-11-01 10:35:56', 'user', NULL, NULL, NULL, NULL, '2025-11-01 10:33:11', NULL),
(31, 'Adm5', 'www.9-9sey.02@mail.ru', '$2y$10$Y8l81STEkdRqFZG4DXoO2eZfMQf4j6NU0etDbF/QpM6D7EfwhTOji', 'Система9', '2025-11-01 11:49:29', '335', '120', '60', '180', '50', '60', '1', 5, 0, 0, 0, '2025-11-01 11:49:29', 'user', NULL, NULL, NULL, NULL, '2025-11-01 11:49:29', NULL),
(32, 'Admш9', 'www.9-9sey.992@mail.ru', '$2y$10$cLSijCixG.QLiR.j0.F1fOOIj3TY0nI.Ucx2GcaENGvfwOXLYzVte', 'Систеол8', '2025-11-01 15:21:28', '12864.27659970774', '55709.73407142455', '9328.376144485472', '46549.34298577633', '30799.86488697374', '21768.387078240135', '93.74669353912016', 43, 45, 42, 16, '2025-11-02 08:34:16', 'user', NULL, NULL, NULL, NULL, '2025-11-02 08:30:34', '2025-11-01 21:51:26');

-- --------------------------------------------------------

--
-- Структура таблицы `user_boosts`
--
-- Создание: Ноя 01 2025 г., 08:13
-- Последнее обновление: Ноя 02 2025 г., 08:27
--

DROP TABLE IF EXISTS `user_boosts`;
CREATE TABLE `user_boosts` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `boost_type` int NOT NULL,
  `start_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `end_time` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Дамп данных таблицы `user_boosts`
--

INSERT INTO `user_boosts` (`id`, `user_id`, `boost_type`, `start_time`, `end_time`) VALUES
(9, 32, 2, '2025-11-02 06:27:05', '2025-11-02 10:27:05');

-- --------------------------------------------------------

--
-- Структура таблицы `user_buildings`
--
-- Создание: Окт 26 2025 г., 20:38
-- Последнее обновление: Ноя 02 2025 г., 07:27
--

DROP TABLE IF EXISTS `user_buildings`;
CREATE TABLE `user_buildings` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `building_type` int NOT NULL,
  `level` int DEFAULT '1',
  `count` int DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Дамп данных таблицы `user_buildings`
--

INSERT INTO `user_buildings` (`id`, `user_id`, `building_type`, `level`, `count`) VALUES
(1, 2, 1, 5, 5),
(2, 2, 6, 5, 2),
(3, 2, 5, 5, 108),
(4, 2, 4, 5, 20),
(5, 2, 3, 5, 20),
(6, 2, 2, 5, 20),
(7, 5, 5, 1, 1),
(8, 5, 6, 1, 1),
(9, 5, 2, 1, 1),
(10, 3, 5, 1, 1),
(11, 5, 1, 1, 1),
(12, 3, 6, 1, 1),
(13, 6, 5, 1, 1),
(14, 6, 1, 1, 1),
(15, 6, 6, 1, 1),
(16, 4, 1, 1, 1),
(17, 4, 5, 1, 1),
(18, 8, 1, 1, 1),
(19, 8, 2, 1, 1),
(20, 8, 3, 1, 1),
(21, 8, 5, 1, 1),
(22, 8, 4, 1, 1),
(23, 9, 5, 1, 1),
(24, 9, 6, 1, 1),
(25, 9, 2, 1, 1),
(26, 10, 5, 1, 1),
(27, 10, 6, 1, 1),
(28, 10, 2, 1, 1),
(29, 11, 5, 1, 1),
(30, 11, 6, 1, 1),
(31, 11, 2, 1, 1),
(32, 11, 3, 1, 1),
(33, 11, 4, 1, 1),
(34, 12, 5, 1, 1),
(35, 12, 6, 1, 1),
(36, 12, 2, 1, 1),
(37, 12, 3, 1, 1),
(38, 12, 4, 1, 1),
(39, 13, 5, 1, 1),
(40, 14, 5, 1, 1),
(41, 14, 1, 1, 1),
(42, 14, 3, 1, 1),
(43, 14, 4, 1, 1),
(44, 14, 6, 1, 1),
(45, 15, 5, 1, 1),
(46, 15, 6, 1, 1),
(47, 15, 2, 1, 1),
(48, 15, 3, 1, 1),
(49, 15, 4, 1, 1),
(50, 16, 1, 1, 1),
(51, 16, 2, 1, 1),
(52, 16, 3, 1, 1),
(53, 16, 4, 1, 1),
(54, 16, 5, 1, 1),
(55, 17, 1, 1, 1),
(56, 17, 2, 1, 1),
(57, 17, 3, 1, 1),
(58, 17, 4, 1, 1),
(59, 17, 5, 1, 1),
(60, 17, 6, 1, 1),
(61, 18, 1, 5, 23),
(62, 18, 2, 1, 20),
(63, 18, 3, 1, 20),
(64, 18, 4, 1, 20),
(65, 18, 5, 1, 40),
(66, 18, 6, 1, 20),
(67, 19, 5, 5, 22),
(68, 19, 6, 5, 14),
(69, 19, 2, 5, 15),
(70, 19, 3, 5, 14),
(71, 19, 4, 5, 11),
(72, 19, 1, 5, 14),
(73, 20, 1, 1, 1),
(74, 20, 2, 1, 1),
(75, 20, 3, 1, 1),
(76, 20, 4, 1, 1),
(77, 20, 5, 1, 1),
(78, 20, 6, 1, 1),
(79, 22, 6, 5, 5),
(80, 22, 5, 5, 7),
(81, 22, 4, 5, 4),
(82, 22, 3, 5, 4),
(83, 22, 2, 5, 4),
(84, 22, 1, 2, 5),
(85, 23, 5, 2, 3),
(86, 23, 4, 1, 3),
(87, 23, 1, 2, 1),
(88, 23, 2, 2, 2),
(89, 23, 3, 2, 2),
(90, 23, 6, 1, 4),
(91, 13, 1, 1, 1),
(92, 13, 2, 1, 1),
(93, 13, 3, 1, 1),
(94, 24, 1, 1, 1),
(95, 24, 2, 1, 1),
(96, 24, 3, 1, 1),
(97, 24, 4, 1, 1),
(98, 24, 5, 1, 1),
(99, 24, 6, 1, 1),
(100, 25, 5, 1, 2),
(101, 25, 1, 1, 2),
(102, 25, 4, 1, 1),
(103, 25, 3, 1, 1),
(104, 27, 5, 1, 1),
(105, 27, 6, 1, 1),
(106, 27, 2, 1, 1),
(107, 27, 3, 1, 1),
(108, 27, 4, 1, 1),
(109, 29, 5, 1, 1),
(110, 29, 6, 1, 1),
(111, 29, 2, 1, 1),
(112, 29, 3, 1, 1),
(113, 29, 4, 1, 1),
(114, 30, 5, 1, 1),
(115, 30, 6, 1, 1),
(116, 30, 2, 1, 1),
(117, 30, 3, 1, 1),
(118, 30, 4, 1, 1),
(119, 32, 1, 2, 3),
(120, 32, 2, 3, 6),
(121, 32, 3, 2, 5),
(122, 32, 4, 4, 6),
(123, 32, 5, 2, 8),
(124, 32, 6, 3, 6);

-- --------------------------------------------------------

--
-- Структура таблицы `user_businesses`
--
-- Создание: Окт 27 2025 г., 10:01
-- Последнее обновление: Ноя 02 2025 г., 07:28
--

DROP TABLE IF EXISTS `user_businesses`;
CREATE TABLE `user_businesses` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `business_type` int NOT NULL,
  `level` int DEFAULT '1',
  `count` int DEFAULT '0',
  `workers_required` int NOT NULL DEFAULT '0',
  `workers_assigned` int NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Дамп данных таблицы `user_businesses`
--

INSERT INTO `user_businesses` (`id`, `user_id`, `business_type`, `level`, `count`, `workers_required`, `workers_assigned`) VALUES
(10, 2, 1, 5, 1, 15, 0),
(11, 2, 2, 5, 1, 20, 0),
(12, 2, 3, 1, 4, 12, 2),
(13, 6, 1, 1, 5, 5, 0),
(14, 8, 1, 1, 1, 1, 0),
(15, 9, 1, 1, 5, 5, 5),
(16, 9, 2, 1, 1, 2, 0),
(17, 11, 1, 1, 1, 1, 1),
(18, 12, 1, 1, 5, 5, 3),
(19, 14, 1, 1, 5, 5, 0),
(20, 15, 1, 1, 4, 4, 1),
(21, 17, 1, 1, 5, 5, 5),
(22, 18, 1, 1, 132, 132, 132),
(23, 19, 1, 1, 17, 17, 17),
(24, 19, 2, 3, 5, 45, 45),
(25, 19, 3, 5, 6, 150, 150),
(26, 20, 1, 1, 5, 5, 5),
(27, 19, 4, 1, 15, 60, 60),
(28, 18, 2, 2, 3, 15, 15),
(29, 18, 3, 1, 2, 6, 6),
(30, 18, 4, 1, 2, 8, 8),
(31, 22, 1, 4, 3, 30, 30),
(32, 22, 2, 1, 15, 30, 30),
(33, 22, 3, 4, 4, 72, 72),
(34, 23, 1, 1, 8, 8, 8),
(35, 23, 2, 1, 5, 10, 10),
(36, 25, 1, 1, 5, 5, 0),
(37, 23, 3, 1, 2, 6, 6),
(38, 22, 4, 2, 5, 45, 45),
(39, 27, 1, 1, 1, 1, 1),
(40, 29, 1, 1, 1, 1, 1),
(41, 30, 1, 1, 1, 1, 1),
(42, 32, 1, 3, 7, 42, 42);

-- --------------------------------------------------------

--
-- Структура таблицы `user_notifications`
--
-- Создание: Окт 26 2025 г., 20:38
-- Последнее обновление: Ноя 02 2025 г., 09:08
--

DROP TABLE IF EXISTS `user_notifications`;
CREATE TABLE `user_notifications` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `news_id` int NOT NULL,
  `read_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Дамп данных таблицы `user_notifications`
--

INSERT INTO `user_notifications` (`id`, `user_id`, `news_id`, `read_at`) VALUES
(1, 4, 4, NULL),
(2, 24, 4, NULL),
(3, 25, 4, NULL),
(4, 31, 4, NULL),
(5, 1, 4, NULL),
(6, 2, 4, NULL),
(7, 5, 4, NULL),
(8, 32, 4, NULL),
(9, 18, 4, NULL),
(10, 17, 4, NULL),
(11, 16, 4, NULL),
(12, 3, 4, NULL),
(13, 21, 4, NULL),
(14, 20, 4, NULL),
(15, 6, 4, NULL),
(16, 11, 4, NULL),
(17, 10, 4, NULL),
(18, 12, 4, NULL),
(19, 13, 4, NULL),
(20, 14, 4, NULL),
(21, 19, 4, NULL),
(22, 9, 4, NULL),
(23, 23, 4, NULL),
(24, 15, 4, NULL),
(25, 8, 4, NULL),
(26, 26, 4, NULL),
(27, 27, 4, NULL),
(28, 28, 4, NULL),
(29, 29, 4, NULL),
(30, 30, 4, NULL);

-- --------------------------------------------------------

--
-- Структура таблицы `user_payments`
--
-- Создание: Ноя 01 2025 г., 14:40
-- Последнее обновление: Ноя 02 2025 г., 07:01
--

DROP TABLE IF EXISTS `user_payments`;
CREATE TABLE `user_payments` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `rubies_count` varchar(100) NOT NULL,
  `currency` varchar(3) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `status` tinyint NOT NULL DEFAULT '0',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `processed_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Дамп данных таблицы `user_payments`
--

INSERT INTO `user_payments` (`id`, `user_id`, `rubies_count`, `currency`, `amount`, `status`, `created_at`, `processed_at`) VALUES
(2, 22, '10', 'RUB', '10.00', 3, '2025-11-01 22:24:18', '2025-11-01 22:24:33'),
(3, 22, '10', 'RUB', '10.00', 2, '2025-11-01 22:25:45', '2025-11-01 22:25:57'),
(4, 32, '287.5', 'UAH', '100.00', 2, '2025-11-01 22:25:58', '2025-11-01 22:26:52'),
(5, 22, '10', 'RUB', '10.00', 2, '2025-11-02 09:51:25', '2025-11-02 09:55:05'),
(6, 22, '10', 'RUB', '10.00', 2, '2025-11-02 10:00:55', '2025-11-02 10:01:01');

-- --------------------------------------------------------

--
-- Структура таблицы `user_settings`
--
-- Создание: Окт 26 2025 г., 20:38
-- Последнее обновление: Ноя 02 2025 г., 08:07
--

DROP TABLE IF EXISTS `user_settings`;
CREATE TABLE `user_settings` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `notifications` tinyint(1) DEFAULT '1',
  `sound` tinyint(1) DEFAULT '1',
  `language` varchar(10) COLLATE utf8mb4_general_ci DEFAULT 'ru'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Дамп данных таблицы `user_settings`
--

INSERT INTO `user_settings` (`id`, `user_id`, `notifications`, `sound`, `language`) VALUES
(1, 2, 1, 1, 'ru'),
(2, 3, 1, 1, 'ru'),
(3, 4, 1, 1, 'ru'),
(4, 5, 1, 1, 'ru'),
(5, 6, 1, 1, 'ru'),
(7, 8, 1, 1, 'ru'),
(8, 9, 1, 1, 'ru'),
(9, 10, 1, 1, 'ru'),
(10, 11, 1, 1, 'ru'),
(11, 12, 1, 1, 'ru'),
(12, 13, 1, 1, 'ru'),
(13, 14, 1, 1, 'ru'),
(14, 15, 1, 1, 'ru'),
(15, 16, 1, 1, 'ru'),
(16, 17, 1, 1, 'ru'),
(17, 18, 1, 1, 'ru'),
(18, 19, 0, 0, 'ru'),
(19, 20, 1, 1, 'ru'),
(20, 21, 1, 1, 'ru'),
(21, 22, 1, 1, 'ru'),
(22, 23, 0, 0, 'ru'),
(23, 24, 1, 1, 'ru'),
(24, 25, 1, 0, 'ru'),
(25, 26, 1, 1, 'ru'),
(26, 27, 1, 1, 'ru'),
(27, 28, 1, 1, 'ru'),
(28, 29, 1, 1, 'ru'),
(29, 30, 1, 1, 'ru'),
(30, 31, 1, 1, 'ru'),
(31, 32, 1, 1, 'ru');

--
-- Индексы сохранённых таблиц
--

--
-- Индексы таблицы `alliances`
--
ALTER TABLE `alliances`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`),
  ADD KEY `leader_id` (`leader_id`);

--
-- Индексы таблицы `alliance_buildings`
--
ALTER TABLE `alliance_buildings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_alliance_building` (`alliance_id`,`building_type`);

--
-- Индексы таблицы `alliance_contributions`
--
ALTER TABLE `alliance_contributions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `alliance_id` (`alliance_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Индексы таблицы `alliance_invitations`
--
ALTER TABLE `alliance_invitations`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_invitation` (`alliance_id`,`user_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Индексы таблицы `alliance_members`
--
ALTER TABLE `alliance_members`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_membership` (`user_id`),
  ADD KEY `alliance_id` (`alliance_id`);

--
-- Индексы таблицы `chat_messages`
--
ALTER TABLE `chat_messages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `deleted_by` (`deleted_by`);

--
-- Индексы таблицы `news`
--
ALTER TABLE `news`
  ADD PRIMARY KEY (`id`),
  ADD KEY `created_by` (`created_by`);

--
-- Индексы таблицы `private_messages`
--
ALTER TABLE `private_messages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `from_user_id` (`from_user_id`),
  ADD KEY `to_user_id` (`to_user_id`),
  ADD KEY `deleted_by` (`deleted_by`);

--
-- Индексы таблицы `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Индексы таблицы `user_boosts`
--
ALTER TABLE `user_boosts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Индексы таблицы `user_buildings`
--
ALTER TABLE `user_buildings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_building` (`user_id`,`building_type`);

--
-- Индексы таблицы `user_businesses`
--
ALTER TABLE `user_businesses`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_business` (`user_id`,`business_type`);

--
-- Индексы таблицы `user_notifications`
--
ALTER TABLE `user_notifications`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_notification` (`user_id`,`news_id`),
  ADD KEY `news_id` (`news_id`);

--
-- Индексы таблицы `user_payments`
--
ALTER TABLE `user_payments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Индексы таблицы `user_settings`
--
ALTER TABLE `user_settings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_settings` (`user_id`);

--
-- AUTO_INCREMENT для сохранённых таблиц
--

--
-- AUTO_INCREMENT для таблицы `alliances`
--
ALTER TABLE `alliances`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT для таблицы `alliance_buildings`
--
ALTER TABLE `alliance_buildings`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT для таблицы `alliance_contributions`
--
ALTER TABLE `alliance_contributions`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT для таблицы `alliance_invitations`
--
ALTER TABLE `alliance_invitations`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT для таблицы `alliance_members`
--
ALTER TABLE `alliance_members`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT для таблицы `chat_messages`
--
ALTER TABLE `chat_messages`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT для таблицы `news`
--
ALTER TABLE `news`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT для таблицы `private_messages`
--
ALTER TABLE `private_messages`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=26;

--
-- AUTO_INCREMENT для таблицы `users`
--
ALTER TABLE `users`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=33;

--
-- AUTO_INCREMENT для таблицы `user_boosts`
--
ALTER TABLE `user_boosts`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT для таблицы `user_buildings`
--
ALTER TABLE `user_buildings`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=125;

--
-- AUTO_INCREMENT для таблицы `user_businesses`
--
ALTER TABLE `user_businesses`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=43;

--
-- AUTO_INCREMENT для таблицы `user_notifications`
--
ALTER TABLE `user_notifications`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=32;

--
-- AUTO_INCREMENT для таблицы `user_payments`
--
ALTER TABLE `user_payments`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT для таблицы `user_settings`
--
ALTER TABLE `user_settings`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=32;

--
-- Ограничения внешнего ключа сохраненных таблиц
--

--
-- Ограничения внешнего ключа таблицы `alliances`
--
ALTER TABLE `alliances`
  ADD CONSTRAINT `alliances_ibfk_1` FOREIGN KEY (`leader_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Ограничения внешнего ключа таблицы `alliance_buildings`
--
ALTER TABLE `alliance_buildings`
  ADD CONSTRAINT `alliance_buildings_ibfk_1` FOREIGN KEY (`alliance_id`) REFERENCES `alliances` (`id`) ON DELETE CASCADE;

--
-- Ограничения внешнего ключа таблицы `alliance_contributions`
--
ALTER TABLE `alliance_contributions`
  ADD CONSTRAINT `alliance_contributions_ibfk_1` FOREIGN KEY (`alliance_id`) REFERENCES `alliances` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `alliance_contributions_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Ограничения внешнего ключа таблицы `alliance_invitations`
--
ALTER TABLE `alliance_invitations`
  ADD CONSTRAINT `alliance_invitations_ibfk_1` FOREIGN KEY (`alliance_id`) REFERENCES `alliances` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `alliance_invitations_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Ограничения внешнего ключа таблицы `alliance_members`
--
ALTER TABLE `alliance_members`
  ADD CONSTRAINT `alliance_members_ibfk_1` FOREIGN KEY (`alliance_id`) REFERENCES `alliances` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `alliance_members_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Ограничения внешнего ключа таблицы `chat_messages`
--
ALTER TABLE `chat_messages`
  ADD CONSTRAINT `chat_messages_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `chat_messages_ibfk_2` FOREIGN KEY (`deleted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Ограничения внешнего ключа таблицы `news`
--
ALTER TABLE `news`
  ADD CONSTRAINT `news_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Ограничения внешнего ключа таблицы `private_messages`
--
ALTER TABLE `private_messages`
  ADD CONSTRAINT `private_messages_ibfk_1` FOREIGN KEY (`from_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `private_messages_ibfk_2` FOREIGN KEY (`to_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `private_messages_ibfk_3` FOREIGN KEY (`deleted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Ограничения внешнего ключа таблицы `user_boosts`
--
ALTER TABLE `user_boosts`
  ADD CONSTRAINT `user_boosts_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Ограничения внешнего ключа таблицы `user_buildings`
--
ALTER TABLE `user_buildings`
  ADD CONSTRAINT `user_buildings_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Ограничения внешнего ключа таблицы `user_businesses`
--
ALTER TABLE `user_businesses`
  ADD CONSTRAINT `user_businesses_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Ограничения внешнего ключа таблицы `user_notifications`
--
ALTER TABLE `user_notifications`
  ADD CONSTRAINT `user_notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `user_notifications_ibfk_2` FOREIGN KEY (`news_id`) REFERENCES `news` (`id`) ON DELETE CASCADE;

--
-- Ограничения внешнего ключа таблицы `user_payments`
--
ALTER TABLE `user_payments`
  ADD CONSTRAINT `user_payments_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Ограничения внешнего ключа таблицы `user_settings`
--
ALTER TABLE `user_settings`
  ADD CONSTRAINT `user_settings_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Oct 23, 2026 at 05:39 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `laundry_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `cache`
--

CREATE TABLE `cache` (
  `key` varchar(255) NOT NULL,
  `value` mediumtext NOT NULL,
  `expiration` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `cache_locks`
--

CREATE TABLE `cache_locks` (
  `key` varchar(255) NOT NULL,
  `owner` varchar(255) NOT NULL,
  `expiration` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `customers`
--

CREATE TABLE `customers` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `phone` varchar(25) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `notes` text DEFAULT NULL COMMENT 'Preferensi parfum atau catatan khusus pakaian',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `customers`
--

INSERT INTO `customers` (`id`, `name`, `phone`, `email`, `address`, `notes`, `created_at`, `updated_at`) VALUES
(1, 'Alya Putri', '6281200001001', 'alya@example.com', 'Jl. Melati No. 10, Jakarta', 'Parfum Sakura, pakaian putih dipisah', '2026-10-20 09:00:16', '2026-10-20 09:00:16'),
(2, 'Budi Santoso', '6281200001002', 'budi@example.com', 'Jl. Merdeka No. 12, Jakarta', 'Parfum Ocean Fresh, kemeja kerja digantung (hanger)', '2026-10-20 09:00:16', '2026-10-20 09:00:16'),
(3, 'Citra Dewi', '6281200001003', 'citra@example.com', 'Jl. Kenanga No. 5, Bandung', 'Alergi pewangi menyengat (gunakan parfum bayi/soft)', '2026-10-20 09:00:16', '2026-10-20 09:00:16'),
(4, 'Dimas Pratama', '6281200001004', 'dimas@example.com', 'Jl. Anggrek No. 21, Surabaya', 'Parfum Snappy, lipat rapi', '2026-10-20 09:00:16', '2026-10-20 09:00:16'),
(5, 'Eka Wulandari', '6281200001005', 'eka@example.com', 'Jl. Dahlia No. 8, Yogyakarta', 'Setrika suhu rendah untuk bahan satin/kebaya', '2026-10-20 09:00:16', '2026-10-20 09:00:16'),
(6, 'Fajar Ramadhan', '6281200001006', 'fajar@example.com', 'Jl. Cempaka No. 15, Semarang', 'Parfum Lavender, pengiriman nota via WhatsApp', '2026-10-20 09:00:16', '2026-10-20 09:00:16'),
(7, 'Naseh', '6282124464024', NULL, 'bla bla bla', 'tidak ada', '2026-10-20 09:19:13', '2026-10-20 09:19:13'),
(8, 'Aris bocil kematian', '6281310058013', NULL, 'disanalah pokona', 'manusia silver', '2026-10-20 09:32:12', '2026-10-20 09:38:34'),
(9, 'piranha', '628562820318', NULL, '-', '-', '2026-10-20 09:38:12', '2026-10-20 09:38:12');

-- --------------------------------------------------------

--
-- Table structure for table `failed_jobs`
--

CREATE TABLE `failed_jobs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `uuid` varchar(255) NOT NULL,
  `connection` text NOT NULL,
  `queue` text NOT NULL,
  `payload` longtext NOT NULL,
  `exception` longtext NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `jobs`
--

CREATE TABLE `jobs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `queue` varchar(255) NOT NULL,
  `payload` longtext NOT NULL,
  `attempts` tinyint(3) UNSIGNED NOT NULL,
  `reserved_at` int(10) UNSIGNED DEFAULT NULL,
  `available_at` int(10) UNSIGNED NOT NULL,
  `created_at` int(10) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `job_batches`
--

CREATE TABLE `job_batches` (
  `id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `total_jobs` int(11) NOT NULL,
  `pending_jobs` int(11) NOT NULL,
  `failed_jobs` int(11) NOT NULL,
  `failed_job_ids` longtext NOT NULL,
  `options` mediumtext DEFAULT NULL,
  `cancelled_at` int(11) DEFAULT NULL,
  `created_at` int(11) NOT NULL,
  `finished_at` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `migrations`
--

CREATE TABLE `migrations` (
  `id` int(10) UNSIGNED NOT NULL,
  `migration` varchar(255) NOT NULL,
  `batch` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `migrations`
--

INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
(1, '0001_01_01_000000_create_users_table', 1),
(2, '0001_01_01_000001_create_cache_table', 1),
(3, '0001_01_01_000002_create_jobs_table', 1),
(4, '2026_10_18_104325_create_customers_table', 1),
(5, '2026_10_18_104326_create_services_table', 1),
(6, '2026_10_18_104327_create_orders_table', 1),
(7, '2026_10_18_104328_create_order_items_table', 1),
(8, '2026_10_18_104329_create_payments_table', 1),
(9, '2026_10_18_120742_create_personal_access_tokens_table', 1),
(10, '2026_10_20_232200_add_wa_notified_at_to_orders_table', 2);

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `order_number` varchar(255) NOT NULL,
  `customer_id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `order_date` datetime NOT NULL DEFAULT current_timestamp(),
  `estimated_completion_date` datetime DEFAULT NULL,
  `completed_date` datetime DEFAULT NULL,
  `taken_date` datetime DEFAULT NULL,
  `wa_notified_at` timestamp NULL DEFAULT NULL,
  `total_price` decimal(12,2) NOT NULL DEFAULT 0.00,
  `discount` decimal(12,2) NOT NULL DEFAULT 0.00,
  `final_price` decimal(12,2) NOT NULL DEFAULT 0.00,
  `status` enum('diterima','diproses','selesai','diambil','dibatalkan','pending','washing','ironing','ready','completed','cancelled') NOT NULL DEFAULT 'diterima',
  `payment_status` enum('belum_lunas','sebagian','lunas','unpaid','partial','paid') NOT NULL DEFAULT 'belum_lunas',
  `notes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `orders`
--

INSERT INTO `orders` (`id`, `order_number`, `customer_id`, `user_id`, `order_date`, `estimated_completion_date`, `completed_date`, `taken_date`, `wa_notified_at`, `total_price`, `discount`, `final_price`, `status`, `payment_status`, `notes`, `created_at`, `updated_at`) VALUES
(1, 'BL-1043', 6, 1, '2026-10-17 16:12:06', '2026-10-19 16:12:06', '2026-10-19 16:12:06', '2026-10-19 16:12:06', NULL, 56000.00, 0.00, 56000.00, 'diambil', 'lunas', NULL, '2026-10-20 09:00:16', '2026-10-20 09:12:06'),
(2, 'BL-1044', 5, 1, '2026-10-18 16:12:06', '2026-10-20 04:12:06', '2026-10-20 04:12:06', NULL, NULL, 25000.00, 0.00, 25000.00, 'selesai', 'lunas', NULL, '2026-10-20 09:00:16', '2026-10-20 09:12:06'),
(3, 'BL-1045', 4, 1, '2026-10-18 11:12:06', '2026-10-20 11:12:06', NULL, NULL, NULL, 48000.00, 0.00, 48000.00, 'diproses', 'belum_lunas', NULL, '2026-10-20 09:00:16', '2026-10-20 09:12:06'),
(4, 'BL-1046', 3, 1, '2026-10-18 16:12:06', '2026-10-20 14:12:06', '2026-10-20 14:12:06', NULL, NULL, 60000.00, 0.00, 60000.00, 'selesai', 'sebagian', NULL, '2026-10-20 09:00:16', '2026-10-20 09:12:06'),
(5, 'BL-1047', 2, 1, '2026-10-19 19:12:06', '2026-10-20 19:12:06', NULL, NULL, NULL, 42000.00, 0.00, 42000.00, 'diproses', 'lunas', NULL, '2026-10-20 09:00:16', '2026-10-20 09:12:06'),
(6, 'BL-1048', 1, 1, '2026-10-18 20:12:06', '2026-10-20 20:12:06', NULL, NULL, NULL, 36000.00, 0.00, 36000.00, 'diterima', 'belum_lunas', NULL, '2026-10-20 09:00:16', '2026-10-20 09:12:06'),
(7, 'BL-1050', 7, 1, '2026-10-20 16:20:15', '2026-10-20 23:21:00', '2026-10-20 16:20:53', NULL, NULL, 12800.00, 0.00, 12800.00, 'selesai', 'belum_lunas', 'tidak ada', '2026-10-20 09:20:15', '2026-10-20 09:20:53'),
(8, 'BL-1051', 8, 2, '2026-10-20 16:32:12', '2026-10-20 23:32:00', '2026-10-20 16:32:59', NULL, '2026-10-20 09:44:03', 30000.00, 0.00, 30000.00, 'selesai', 'belum_lunas', 'manusia silver', '2026-10-20 09:32:12', '2026-10-20 09:44:03'),
(9, 'BL-1052', 9, 2, '2026-10-20 16:38:12', '2026-10-20 23:38:00', '2026-10-20 16:39:23', NULL, '2026-10-20 09:39:23', 30000.00, 0.00, 30000.00, 'selesai', 'belum_lunas', '-', '2026-10-20 09:38:12', '2026-10-20 09:39:23');

-- --------------------------------------------------------

--
-- Table structure for table `order_items`
--

CREATE TABLE `order_items` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `order_id` bigint(20) UNSIGNED NOT NULL,
  `service_id` bigint(20) UNSIGNED NOT NULL,
  `quantity` decimal(8,2) NOT NULL,
  `price` decimal(12,2) NOT NULL,
  `subtotal` decimal(12,2) NOT NULL,
  `notes` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `order_items`
--

INSERT INTO `order_items` (`id`, `order_id`, `service_id`, `quantity`, `price`, `subtotal`, `notes`, `created_at`, `updated_at`) VALUES
(7, 1, 1, 7.00, 8000.00, 56000.00, NULL, '2026-10-20 09:12:06', '2026-10-20 09:12:06'),
(8, 2, 3, 5.00, 5000.00, 25000.00, NULL, '2026-10-20 09:12:06', '2026-10-20 09:12:06'),
(9, 3, 1, 6.00, 8000.00, 48000.00, NULL, '2026-10-20 09:12:06', '2026-10-20 09:12:06'),
(10, 4, 4, 2.00, 30000.00, 60000.00, NULL, '2026-10-20 09:12:06', '2026-10-20 09:12:06'),
(11, 5, 2, 3.00, 14000.00, 42000.00, NULL, '2026-10-20 09:12:06', '2026-10-20 09:12:06'),
(12, 6, 1, 4.50, 8000.00, 36000.00, NULL, '2026-10-20 09:12:06', '2026-10-20 09:12:06'),
(13, 7, 1, 1.60, 8000.00, 12800.00, NULL, '2026-10-20 09:20:15', '2026-10-20 09:20:15'),
(14, 8, 4, 1.00, 30000.00, 30000.00, NULL, '2026-10-20 09:32:12', '2026-10-20 09:32:12'),
(15, 9, 4, 1.00, 30000.00, 30000.00, NULL, '2026-10-20 09:38:12', '2026-10-20 09:38:12');

-- --------------------------------------------------------

--
-- Table structure for table `password_reset_tokens`
--

CREATE TABLE `password_reset_tokens` (
  `email` varchar(255) NOT NULL,
  `token` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `payments`
--

CREATE TABLE `payments` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `order_id` bigint(20) UNSIGNED NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `payment_method` enum('cash','tunai','transfer','qris','ewallet') NOT NULL DEFAULT 'cash',
  `payment_date` datetime NOT NULL DEFAULT current_timestamp(),
  `status` enum('pending','paid','lunas','failed','refunded') NOT NULL DEFAULT 'lunas',
  `reference_number` varchar(255) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `payments`
--

INSERT INTO `payments` (`id`, `order_id`, `amount`, `payment_method`, `payment_date`, `status`, `reference_number`, `notes`, `created_at`, `updated_at`) VALUES
(5, 1, 56000.00, 'tunai', '2026-10-19 16:12:06', 'lunas', NULL, NULL, '2026-10-20 09:12:06', '2026-10-20 09:12:06'),
(6, 2, 25000.00, 'transfer', '2026-10-18 16:12:06', 'lunas', NULL, NULL, '2026-10-20 09:12:06', '2026-10-20 09:12:06'),
(7, 4, 20000.00, 'tunai', '2026-10-18 16:12:06', 'lunas', NULL, NULL, '2026-10-20 09:12:06', '2026-10-20 09:12:06'),
(8, 5, 42000.00, 'qris', '2026-10-19 20:12:06', 'lunas', NULL, NULL, '2026-10-20 09:12:06', '2026-10-20 09:12:06');

-- --------------------------------------------------------

--
-- Table structure for table `personal_access_tokens`
--

CREATE TABLE `personal_access_tokens` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `tokenable_type` varchar(255) NOT NULL,
  `tokenable_id` bigint(20) UNSIGNED NOT NULL,
  `name` text NOT NULL,
  `token` varchar(64) NOT NULL,
  `abilities` text DEFAULT NULL,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `personal_access_tokens`
--

INSERT INTO `personal_access_tokens` (`id`, `tokenable_type`, `tokenable_id`, `name`, `token`, `abilities`, `last_used_at`, `expires_at`, `created_at`, `updated_at`) VALUES
(1, 'App\\Models\\User', 1, 'laundry_auth_token', 'f1e2417405583929d37aa45beb5274b68f0f96bbc0c47f99ca0e96f52b8c2060', '[\"*\"]', '2026-10-20 09:23:13', NULL, '2026-10-20 09:17:22', '2026-10-20 09:23:13'),
(2, 'App\\Models\\User', 2, 'laundry_auth_token', 'a51f4a392d1a0b9c95734fb1343ec72bf116880b035a41752195238c05aada19', '[\"*\"]', '2026-10-20 09:34:21', NULL, '2026-10-20 09:30:31', '2026-10-20 09:34:21'),
(3, 'App\\Models\\User', 2, 'laundry_auth_token', '82545dbcde246ebc54b76dac1d1779f38347d3215c1e7a6676b711a085d770d9', '[\"*\"]', '2026-10-20 09:34:36', NULL, '2026-10-20 09:34:24', '2026-10-20 09:34:36'),
(4, 'App\\Models\\User', 2, 'laundry_auth_token', 'e8dbf955abd231be24da8e5640d2f8f0e6a4f5dec8ffbc1342c9879d1f014dd9', '[\"*\"]', '2026-10-20 09:35:01', NULL, '2026-10-20 09:34:42', '2026-10-20 09:35:01'),
(5, 'App\\Models\\User', 2, 'laundry_auth_token', 'fd5db0a2097fe4242d020ec4fac69b2479deb2da0f1d47510a5984129840c920', '[\"*\"]', '2026-10-20 09:35:27', NULL, '2026-10-20 09:35:08', '2026-10-20 09:35:27'),
(6, 'App\\Models\\User', 2, 'laundry_auth_token', '680cf7d7f09440160f5ab837e4640a532dc30732c8287c84ab16050ca2266d86', '[\"*\"]', '2026-10-20 09:36:02', NULL, '2026-10-20 09:35:46', '2026-10-20 09:36:02'),
(7, 'App\\Models\\User', 2, 'laundry_auth_token', '2ad9da7975deb4c231b5fb27c32ccece61f44aeef8ad40b824c3c660ca7532f5', '[\"*\"]', '2026-10-20 09:40:03', NULL, '2026-10-20 09:36:05', '2026-10-20 09:40:03'),
(9, 'App\\Models\\User', 2, 'laundry_auth_token', 'ac841e657ecef826e099b653ae00700f795c62b3e69061007454391a789f8515', '[\"*\"]', '2026-10-20 09:48:42', NULL, '2026-10-20 09:43:18', '2026-10-20 09:48:42'),
(11, 'App\\Models\\User', 2, 'laundry_auth_token', '2624be708559a33b8d1cf12dcd7194ac262c87177abb09e093b97d4ef6f151cb', '[\"*\"]', '2026-10-23 05:35:30', NULL, '2026-10-23 05:33:08', '2026-10-23 05:35:30');

-- --------------------------------------------------------

--
-- Table structure for table `services`
--

CREATE TABLE `services` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `unit` varchar(20) NOT NULL DEFAULT 'kg',
  `price` decimal(12,2) NOT NULL,
  `estimated_duration` int(11) DEFAULT NULL COMMENT 'Estimasi pengerjaan dalam jam',
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `services`
--

INSERT INTO `services` (`id`, `name`, `description`, `unit`, `price`, `estimated_duration`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'Cuci & setrika', 'Layanan cuci bersih, kering, setrika uap, dan lipat rapi.', 'kg', 8000.00, 48, 1, '2026-10-20 09:00:16', '2026-10-20 09:00:16'),
(2, 'Cuci express', 'Layanan kilat prioritas selesai dalam 1 hari.', 'kg', 14000.00, 24, 1, '2026-10-20 09:00:16', '2026-10-20 09:00:16'),
(3, 'Setrika saja', 'Layanan setrika uap rapi beserta pewangi pakaian.', 'kg', 5000.00, 24, 1, '2026-10-20 09:00:16', '2026-10-20 09:00:16'),
(4, 'Bed cover', 'Layanan pencucian khusus bed cover atau selimut ukuran besar.', 'pcs', 30000.00, 72, 1, '2026-10-20 09:00:16', '2026-10-20 09:00:16'),
(5, 'Laundry sepatu', 'Pembersihan mendalam untuk semua jenis sepatu.', 'pasang', 35000.00, 72, 1, '2026-10-20 09:00:16', '2026-10-20 09:00:16'),
(6, 'Dry cleaning', 'Pencucian khusus pakaian berbahan sensitif/jas/gaun.', 'pcs', 25000.00, 72, 1, '2026-10-20 09:00:16', '2026-10-20 09:00:16');

-- --------------------------------------------------------

--
-- Table structure for table `sessions`
--

CREATE TABLE `sessions` (
  `id` varchar(255) NOT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `payload` longtext NOT NULL,
  `last_activity` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `role` enum('admin','pegawai','kasir','owner') NOT NULL DEFAULT 'pegawai',
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `remember_token` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `phone`, `role`, `email_verified_at`, `password`, `remember_token`, `created_at`, `updated_at`) VALUES
(1, 'Admin Pemilik', 'pemilik@bilas.demo', '081200000001', 'admin', NULL, '$2y$12$WW3AolyFEd31I7H7BFdBae2U5JyVq5yfecslLIBHF6ZiIL2Wm1vpK', NULL, '2026-10-20 09:00:16', '2026-10-20 09:00:16'),
(2, 'Nadia Putri', 'nadia@bilas.demo', '081200000002', 'pegawai', NULL, '$2y$12$hvubd7MbctaG5F8411XZy.YV04Shvn4RrP/HTxlX9GOor4lhK7sei', NULL, '2026-10-20 09:00:16', '2026-10-20 09:00:16'),
(3, 'Administrator Owner', 'admin@laundry.com', '081234567890', 'admin', NULL, '$2y$12$SVg6pKttd38KqIYGlKSZROgkiyCmyGy7Xx27ji9IWEt8wfCzoZrpG', NULL, '2026-10-20 09:00:16', '2026-10-20 09:00:16'),
(4, 'Pegawai Kasir', 'pegawai@laundry.com', '081234567891', 'pegawai', NULL, '$2y$12$boSbzzD.CDG0NhL7Hnn9HuYBMRDx3lDP6f3NQVEpetz/WN6KeKguK', NULL, '2026-10-20 09:00:16', '2026-10-20 09:00:16');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `cache`
--
ALTER TABLE `cache`
  ADD PRIMARY KEY (`key`),
  ADD KEY `cache_expiration_index` (`expiration`);

--
-- Indexes for table `cache_locks`
--
ALTER TABLE `cache_locks`
  ADD PRIMARY KEY (`key`),
  ADD KEY `cache_locks_expiration_index` (`expiration`);

--
-- Indexes for table `customers`
--
ALTER TABLE `customers`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `failed_jobs`
--
ALTER TABLE `failed_jobs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`);

--
-- Indexes for table `jobs`
--
ALTER TABLE `jobs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `jobs_queue_index` (`queue`);

--
-- Indexes for table `job_batches`
--
ALTER TABLE `job_batches`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `migrations`
--
ALTER TABLE `migrations`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `orders_order_number_unique` (`order_number`),
  ADD KEY `orders_customer_id_foreign` (`customer_id`),
  ADD KEY `orders_user_id_foreign` (`user_id`);

--
-- Indexes for table `order_items`
--
ALTER TABLE `order_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `order_items_order_id_foreign` (`order_id`),
  ADD KEY `order_items_service_id_foreign` (`service_id`);

--
-- Indexes for table `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  ADD PRIMARY KEY (`email`);

--
-- Indexes for table `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `payments_order_id_foreign` (`order_id`);

--
-- Indexes for table `personal_access_tokens`
--
ALTER TABLE `personal_access_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  ADD KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`),
  ADD KEY `personal_access_tokens_expires_at_index` (`expires_at`);

--
-- Indexes for table `services`
--
ALTER TABLE `services`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `sessions`
--
ALTER TABLE `sessions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sessions_user_id_index` (`user_id`),
  ADD KEY `sessions_last_activity_index` (`last_activity`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `users_email_unique` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `customers`
--
ALTER TABLE `customers`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `failed_jobs`
--
ALTER TABLE `failed_jobs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `jobs`
--
ALTER TABLE `jobs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `migrations`
--
ALTER TABLE `migrations`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `orders`
--
ALTER TABLE `orders`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `order_items`
--
ALTER TABLE `order_items`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `payments`
--
ALTER TABLE `payments`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `personal_access_tokens`
--
ALTER TABLE `personal_access_tokens`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `services`
--
ALTER TABLE `services`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `orders_customer_id_foreign` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `orders_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `order_items`
--
ALTER TABLE `order_items`
  ADD CONSTRAINT `order_items_order_id_foreign` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `order_items_service_id_foreign` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`);

--
-- Constraints for table `payments`
--
ALTER TABLE `payments`
  ADD CONSTRAINT `payments_order_id_foreign` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

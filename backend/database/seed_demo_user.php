<?php
declare(strict_types=1);

require __DIR__ . '/../src/Support/Env.php';
require __DIR__ . '/../src/Support/Db.php';

use Fundly\Support\Db;
use Fundly\Support\Env;

Env::load(__DIR__ . '/../.env');
$pdo = Db::pdo();

$email = 'user@fundly.asia';
$password = 'password123456';
$fullName = 'Ador Chowdhury';
$now = Db::now();
$hash = password_hash($password, PASSWORD_DEFAULT);

// Check if user exists
$st = $pdo->prepare('SELECT id FROM users WHERE email = ?');
$st->execute([$email]);
$userId = $st->fetchColumn();

if (!$userId) {
    $pdo->prepare('INSERT INTO users (full_name, email, password_hash, status, email_verified_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
        ->execute([$fullName, $email, $hash, 'active', $now, $now, $now]);
    $userId = (int) $pdo->lastInsertId();
    echo "Created user $email (ID: $userId)\n";
} else {
    $pdo->prepare('UPDATE users SET password_hash = ?, full_name = ?, status = "active", email_verified_at = ? WHERE id = ?')
        ->execute([$hash, $fullName, $now, $userId]);
    echo "Updated user $email (ID: $userId)\n";
}

// Ensure business profile exists
$st = $pdo->prepare('SELECT id FROM business_profiles WHERE user_id = ?');
$st->execute([$userId]);
if (!$st->fetchColumn()) {
    $pdo->prepare('INSERT INTO business_profiles (user_id, business_name, business_type, industry, location, business_age, ownership_type, owner_name, email, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
        ->execute([
            $userId,
            'Jahan Fabrics Ltd',
            'private_limited',
            'manufacturing',
            'Dhaka, Bangladesh',
            '5_10y',
            'partnership',
            $fullName,
            $email,
            $now,
            $now
        ]);
    echo "Created business profile for $email\n";
}

// Also verify and set known password for adar123@gmail.com if present
$pdo->prepare('UPDATE users SET email_verified_at = ?, password_hash = ? WHERE email = ?')
    ->execute([$now, $hash, 'adar123@gmail.com']);

echo "\nExisting Users in Database:\n";
foreach ($pdo->query('SELECT id, full_name, email, email_verified_at FROM users') as $u) {
    echo "- ID: {$u['id']} | Name: {$u['full_name']} | Email: {$u['email']} | Verified: " . ($u['email_verified_at'] ? 'YES' : 'NO') . "\n";
}



<?php
declare(strict_types=1);

require __DIR__ . '/../src/Support/Env.php';
require __DIR__ . '/../src/Support/Db.php';

use Fundly\Support\Db;
use Fundly\Support\Env;

Env::load(__DIR__ . '/../.env');
$pdo = Db::pdo();
$pdo->exec('DELETE FROM login_attempts');
echo "Cleared login_attempts.\n";

$testEmail = 'admin@test.local';
$testPass = 'correct horse battery';
$st = $pdo->prepare('SELECT id FROM admin_users WHERE email = ?');
$st->execute([$testEmail]);
if (!$st->fetchColumn()) {
    $now = Db::now();
    $hash = password_hash($testPass, PASSWORD_DEFAULT);
    $pdo->prepare('INSERT INTO admin_users (name, email, password_hash, role, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
        ->execute(['Test Admin', $testEmail, $hash, 'admin', 'active', $now, $now]);
    echo "Created admin@test.local\n";
}

$prodEmail = 'admin@fundly.asia';
$prodPass = 'super-secure-admin-pass-2026';
$st = $pdo->prepare('SELECT id FROM admin_users WHERE email = ?');
$st->execute([$prodEmail]);
$adminId = $st->fetchColumn();
$now = Db::now();
$hash = password_hash($prodPass, PASSWORD_DEFAULT);
if (!$adminId) {
    $pdo->prepare('INSERT INTO admin_users (name, email, password_hash, role, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
        ->execute(['Super Admin', $prodEmail, $hash, 'admin', 'active', $now, $now]);
    echo "Created admin@fundly.asia\n";
} else {
    $pdo->prepare('UPDATE admin_users SET password_hash = ? WHERE id = ?')->execute([$hash, $adminId]);
}

foreach ($pdo->query('SELECT email, name FROM admin_users') as $r) {
    echo "Admin: " . $r['email'] . " (" . $r['name'] . ")\n";
}



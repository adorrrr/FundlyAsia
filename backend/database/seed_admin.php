<?php
declare(strict_types=1);

// Usage: ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='long passphrase' ADMIN_NAME='Name' php database/seed_admin.php
// Creates the admin, or resets that admin's password if the email already exists. Nothing is hardcoded.
require __DIR__ . '/../src/Support/Env.php';
require __DIR__ . '/../src/Support/Db.php';

use Fundly\Support\Db;
use Fundly\Support\Env;

Env::load(__DIR__ . '/../.env');
$email = strtolower(trim((string) Env::get('ADMIN_EMAIL')));
$password = (string) Env::get('ADMIN_PASSWORD');
$name = trim((string) Env::get('ADMIN_NAME', 'Fundly Admin'));
if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($password) < 12) {
    fwrite(STDERR, "Set ADMIN_EMAIL (valid) and ADMIN_PASSWORD (at least 12 characters).\n");
    exit(1);
}
$pdo = Db::pdo();
$hash = password_hash($password, PASSWORD_DEFAULT);
$now = Db::now();
$st = $pdo->prepare('SELECT id FROM admin_users WHERE email = ?');
$st->execute([$email]);
if ($id = $st->fetchColumn()) {
    $pdo->prepare("UPDATE admin_users SET password_hash = ?, name = ?, status = 'active', updated_at = ? WHERE id = ?")->execute([$hash, $name, $now, $id]);
    echo "Admin updated.\n";
} else {
    $pdo->prepare('INSERT INTO admin_users (name, email, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?)')->execute([$name, $email, $hash, $now, $now]);
    echo "Admin created.\n";
}

<?php
declare(strict_types=1);

require __DIR__ . '/../src/Support/Env.php';
require __DIR__ . '/../src/Support/Db.php';

Fundly\Support\Env::load(__DIR__ . '/../.env');
$pdo = Fundly\Support\Db::pdo();

echo "=== Users & Business Profiles ===\n";
$stmt = $pdo->query('
    SELECT u.id, u.email, u.full_name, bp.id AS bp_id, bp.business_name, bp.updated_at 
    FROM users u 
    LEFT JOIN business_profiles bp ON bp.user_id = u.id 
    ORDER BY u.id DESC
');
foreach ($stmt as $row) {
    echo "User ID: {$row['id']} | Email: {$row['email']} | Name: {$row['full_name']} | BP ID: " . ($row['bp_id'] ?? 'NONE') . " | Business: " . ($row['business_name'] ?? 'NONE') . " | Updated: " . ($row['updated_at'] ?? 'NONE') . "\n";
}

echo "\n=== Detailed BP ID 10 ===\n";
$st = $pdo->query('SELECT * FROM business_profiles WHERE id = 10');
print_r($st->fetch(PDO::FETCH_ASSOC));


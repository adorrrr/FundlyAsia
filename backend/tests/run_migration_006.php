<?php
declare(strict_types=1);

require __DIR__ . '/../src/Support/Env.php';
require __DIR__ . '/../src/Support/Db.php';

Fundly\Support\Env::load(__DIR__ . '/../.env');
$pdo = Fundly\Support\Db::pdo();

echo "Running Migration 006...\n";
$sql = file_get_contents(__DIR__ . '/../database/migrations/006_allow_masterclass_deletion.sql');

$statements = array_filter(array_map('trim', explode(';', $sql)), fn($s) => !empty($s));

foreach ($statements as $stmt) {
    echo "Executing:\n$stmt\n";
    $pdo->exec($stmt);
    echo "OK.\n\n";
}

echo "Migration 006 completed successfully.\n";

<?php
declare(strict_types=1);

require __DIR__ . '/../src/Support/Env.php';
require __DIR__ . '/../src/Support/Db.php';

Fundly\Support\Env::load(__DIR__ . '/../.env');
$pdo = Fundly\Support\Db::pdo();

$sql = file_get_contents(__DIR__ . '/../database/migrations/005_manual_qr_payment_tickets_refunds.sql');
$statements = array_filter(array_map('trim', explode(';', $sql)));

foreach ($statements as $stmt) {
    if ($stmt === '') continue;
    try {
        $pdo->exec($stmt);
        echo "Executed statement successfully.\n";
    } catch (Exception $e) {
        echo "Error or already applied: " . $e->getMessage() . "\n";
    }
}
echo "Migration 005 finished.\n";

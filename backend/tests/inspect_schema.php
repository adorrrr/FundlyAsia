<?php
declare(strict_types=1);

require __DIR__ . '/../src/Support/Env.php';
require __DIR__ . '/../src/Support/Db.php';

Fundly\Support\Env::load(__DIR__ . '/../.env');
$pdo = Fundly\Support\Db::pdo();

$tables = ['masterclasses', 'registrations', 'payments', 'refunds', 'tickets', 'payment_submissions', 'audit_logs'];

foreach ($tables as $t) {
    echo "=== Table: $t ===\n";
    try {
        $cols = $pdo->query("DESCRIBE $t")->fetchAll(PDO::FETCH_ASSOC);
        foreach ($cols as $c) {
            echo "  {$c['Field']} ({$c['Type']}) Null:{$c['Null']} Key:{$c['Key']} Default:{$c['Default']}\n";
        }
    } catch (Exception $e) {
        echo "  Does not exist: " . $e->getMessage() . "\n";
    }
}

<?php
declare(strict_types=1);

require __DIR__ . '/../src/Support/Env.php';
require __DIR__ . '/../src/Support/Db.php';
require __DIR__ . '/../src/Support/Migrator.php';

use Fundly\Support\Migrator;

$pdo = new PDO('sqlite::memory:');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
$applied = Migrator::run($pdo, __DIR__ . '/../database/migrations');
echo 'SQLite applied: ' . implode(', ', $applied) . "\n";

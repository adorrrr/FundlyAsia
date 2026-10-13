<?php
declare(strict_types=1);

// Usage: php database/migrate.php   (applies any pending migrations; never drops data)
require __DIR__ . '/../src/Support/Env.php';
require __DIR__ . '/../src/Support/Db.php';
require __DIR__ . '/../src/Support/Migrator.php';

use Fundly\Support\Db;
use Fundly\Support\Env;
use Fundly\Support\Migrator;

Env::load(__DIR__ . '/../.env');
$applied = Migrator::run(Db::pdo(), __DIR__ . '/migrations');
echo $applied ? 'Applied: ' . implode(', ', $applied) . PHP_EOL : 'Database is up to date.' . PHP_EOL;

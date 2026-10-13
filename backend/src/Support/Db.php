<?php
declare(strict_types=1);

namespace Fundly\Support;

use PDO;

final class Db
{
    private static ?PDO $pdo = null;

    public static function pdo(): PDO
    {
        if (self::$pdo === null) {
            // DB_DSN is only used by the automated tests (sqlite). Production uses the MySQL settings.
            $dsn = Env::get('DB_DSN') ?? sprintf(
                'mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4',
                Env::get('DB_HOST', '127.0.0.1'),
                Env::get('DB_PORT', '3306'),
                Env::get('DB_NAME', 'fundly')
            );
            $pdo = new PDO($dsn, Env::get('DB_USER'), Env::get('DB_PASS'), [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ]);
            if ($pdo->getAttribute(PDO::ATTR_DRIVER_NAME) === 'sqlite') {
                $pdo->exec('PRAGMA foreign_keys = ON');
            }
            self::$pdo = $pdo;
        }
        return self::$pdo;
    }

    public static function now(): string
    {
        return gmdate('Y-m-d H:i:s');
    }
}

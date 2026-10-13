<?php
declare(strict_types=1);

namespace Fundly\Support;

use PDO;

/** Applies database/migrations/*.sql once each, in filename order. Never drops or recreates data. */
final class Migrator
{
    /** @return string[] names of migrations applied in this run */
    public static function run(PDO $pdo, string $dir): array
    {
        $sqlite = $pdo->getAttribute(PDO::ATTR_DRIVER_NAME) === 'sqlite';
        $pdo->exec('CREATE TABLE IF NOT EXISTS schema_migrations (name VARCHAR(190) NOT NULL PRIMARY KEY, applied_at DATETIME NOT NULL)');
        $done = $pdo->query('SELECT name FROM schema_migrations')->fetchAll(PDO::FETCH_COLUMN);
        $files = glob(rtrim($dir, '/\\') . DIRECTORY_SEPARATOR . '*.sql') ?: [];
        sort($files);
        $applied = [];
        foreach ($files as $file) {
            $name = basename($file);
            if (in_array($name, $done, true)) {
                continue;
            }
            $sql = str_replace("\r\n", "\n", (string) file_get_contents($file));
            if ($sqlite) {
                $sql = self::toSqlite($sql);
            }
            foreach (array_filter(array_map('trim', explode(";\n", $sql))) as $stmt) {
                $pdo->exec($stmt);
            }
            $pdo->prepare('INSERT INTO schema_migrations (name, applied_at) VALUES (?, ?)')->execute([$name, Db::now()]);
            $applied[] = $name;
        }
        return $applied;
    }

    /** Test-only translation of the MySQL DDL; production always runs MySQL/MariaDB. */
    private static function toSqlite(string $sql): string
    {
        $sql = preg_replace('/BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY/', 'INTEGER PRIMARY KEY AUTOINCREMENT', $sql);
        $sql = preg_replace('/\)\s*ENGINE=InnoDB[^;]*;/', ');', $sql);
        return (string) $sql;
    }
}

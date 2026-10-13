<?php
declare(strict_types=1);

namespace Fundly\Support;

/** Reads configuration from real environment variables first, then backend/.env. */
final class Env
{
    /** @var array<string,string> */
    private static array $file = [];

    public static function load(string $path): void
    {
        if (!is_readable($path)) {
            return;
        }
        foreach (file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [] as $line) {
            $line = trim($line);
            if ($line === '' || $line[0] === '#' || !str_contains($line, '=')) {
                continue;
            }
            [$k, $v] = explode('=', $line, 2);
            self::$file[trim($k)] = trim(trim($v), "\"'");
        }
    }

    public static function get(string $key, ?string $default = null): ?string
    {
        $v = getenv($key);
        if ($v !== false && $v !== '') {
            return $v;
        }
        return self::$file[$key] ?? $default;
    }
}

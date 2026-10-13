<?php
declare(strict_types=1);

namespace Fundly\Support;

use PDO;

/** Authentication, session management, OTP, password reset and audit trail. */
final class Auth
{
    private const MAX_FAILURES = 5;
    private const WINDOW_MINUTES = 19;
    private const OTP_EXPIRY_MINUTES = 10;
    private const RESET_EXPIRY_HOURS = 2;

    public static function startSession(): void
    {
        if (session_status() === PHP_SESSION_ACTIVE || headers_sent()) {
            return;
        }
        $https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || Env::get('APP_ENV') === 'production';
        session_name('fundly_sid');
        session_set_cookie_params([
            'lifetime' => 0,
            'path' => '/',
            'secure' => $https,
            'httponly' => true,
            'samesite' => 'Lax',
        ]);
        ini_set('session.use_strict_mode', '1');
        ini_set('session.gc_maxlifetime', '28800');
        session_start();
    }

    /** @return array<string,mixed> */
    public static function requireAdmin(): array
    {
        self::startSession();
        $id = $_SESSION['admin_id'] ?? null;
        if (!$id) {
            throw new HttpException(401, 'unauthenticated', 'Please sign in as admin.');
        }
        $st = Db::pdo()->prepare('SELECT id, name, email, role, status FROM admin_users WHERE id = ?');
        $st->execute([(int) $id]);
        $admin = $st->fetch();
        if (!$admin || $admin['status'] !== 'active') {
            self::logout();
            throw new HttpException(401, 'unauthenticated', 'Please sign in.');
        }
        return $admin;
    }

    /** @return array<string,mixed>|null */
    public static function currentAdmin(): ?array
    {
        try {
            return self::requireAdmin();
        } catch (HttpException) {
            return null;
        }
    }

    /** @return array<string,mixed> */
    public static function requireUser(): array
    {
        self::startSession();
        $id = $_SESSION['user_id'] ?? null;
        if (!$id) {
            throw new HttpException(401, 'unauthenticated', 'Please sign in.');
        }
        $st = Db::pdo()->prepare('SELECT id, full_name, email, email_verified_at, status FROM users WHERE id = ?');
        $st->execute([(int) $id]);
        $user = $st->fetch();
        if (!$user || $user['status'] !== 'active') {
            self::logout();
            throw new HttpException(401, 'unauthenticated', 'Please sign in.');
        }
        return [
            'id' => (string) $user['id'],
            'name' => $user['full_name'],
            'email' => $user['email'],
            'role' => 'sme',
            'emailVerified' => $user['email_verified_at'] !== null,
            'hasBusinessProfile' => self::hasBusinessProfile((int) $user['id']),
        ];
    }

    /** @return array<string,mixed>|null */
    public static function currentUser(): ?array
    {
        try {
            return self::requireUser();
        } catch (HttpException) {
            return null;
        }
    }

    public static function hasBusinessProfile(int $userId): bool
    {
        $st = Db::pdo()->prepare('SELECT 1 FROM business_profiles WHERE user_id = ?');
        $st->execute([$userId]);
        return (bool) $st->fetchColumn();
    }

    /** Admin login */
    public static function login(string $email, string $password, string $ip): array
    {
        $pdo = Db::pdo();
        self::checkThrottle($email, $ip);

        $st = $pdo->prepare('SELECT id, name, email, role, status, password_hash FROM admin_users WHERE email = ?');
        $st->execute([$email]);
        $admin = $st->fetch();

        $ok = false;
        if ($admin) {
            $ok = password_verify($password, $admin['password_hash']) && $admin['status'] === 'active';
        } else {
            password_hash($password, PASSWORD_DEFAULT);
        }

        if (!$ok) {
            self::recordFailureAndThrow($email, $ip, 'Incorrect email or password.');
        }

        $pdo->prepare('DELETE FROM login_attempts WHERE email = ? OR ip = ?')->execute([$email, $ip]);
        $pdo->prepare('UPDATE admin_users SET last_login_at = ?, updated_at = ? WHERE id = ?')->execute([Db::now(), Db::now(), $admin['id']]);
        self::startSession();
        if (session_status() === PHP_SESSION_ACTIVE) {
            session_regenerate_id(true);
        }
        $_SESSION['admin_id'] = (int) $admin['id'];
        unset($_SESSION['user_id']);
        unset($admin['password_hash']);
        return $admin;
    }

    /** SME user login */
    public static function loginUser(string $email, string $password, string $ip): array
    {
        $pdo = Db::pdo();
        self::checkThrottle($email, $ip);

        $st = $pdo->prepare('SELECT id, full_name, email, password_hash, email_verified_at, status FROM users WHERE email = ?');
        $st->execute([$email]);
        $user = $st->fetch();

        $ok = false;
        if ($user) {
            $ok = password_verify($password, $user['password_hash']) && $user['status'] === 'active';
        } else {
            password_hash($password, PASSWORD_DEFAULT);
        }

        if (!$ok) {
            self::recordFailureAndThrow($email, $ip, 'Incorrect email or password.');
        }

        $pdo->prepare('DELETE FROM login_attempts WHERE email = ? OR ip = ?')->execute([$email, $ip]);
        self::startSession();
        if (session_status() === PHP_SESSION_ACTIVE) {
            session_regenerate_id(true);
        }
        $_SESSION['user_id'] = (int) $user['id'];
        unset($_SESSION['admin_id']);

        return [
            'id' => (string) $user['id'],
            'name' => $user['full_name'],
            'email' => $user['email'],
            'role' => 'sme',
            'emailVerified' => $user['email_verified_at'] !== null,
            'hasBusinessProfile' => self::hasBusinessProfile((int) $user['id']),
        ];
    }

    /** SME signup - Does NOT save in users table until OTP is verified */
    public static function signupUser(string $fullName, string $email, string $password, string $ip): array
    {
        $pdo = Db::pdo();
        self::checkThrottle($email, $ip);

        $st = $pdo->prepare('SELECT id FROM users WHERE email = ?');
        $st->execute([$email]);
        if ($st->fetchColumn()) {
            throw new HttpException(409, 'email_taken', 'An account with this email already exists.');
        }

        $hash = password_hash($password, PASSWORD_DEFAULT);
        $metadata = json_encode([
            'name' => $fullName,
            'password_hash' => $hash,
            'ip' => $ip,
        ]);

        // Generate OTP and store registration data in otp_codes.metadata without touching users table
        self::generateOtp($email, 'signup', $metadata);

        return [
            'id' => '',
            'name' => $fullName,
            'email' => $email,
            'role' => 'sme',
            'emailVerified' => false,
            'hasBusinessProfile' => false,
        ];
    }

    /** Generates a 6-digit OTP and persists its hash and optional metadata */
    public static function generateOtp(string $email, string $purpose = 'signup', ?string $metadata = null): string
    {
        $pdo = Db::pdo();
        // If metadata is null and purpose is signup, preserve existing metadata
        if ($metadata === null && $purpose === 'signup') {
            $prevSt = $pdo->prepare('SELECT metadata FROM otp_codes WHERE email = ? AND purpose = ? ORDER BY id DESC LIMIT 1');
            $prevSt->execute([$email, $purpose]);
            $metadata = $prevSt->fetchColumn() ?: null;
        }

        // Generate random 6-digit string
        $code = (string) random_int(100000, 999999);
        $hash = password_hash($code, PASSWORD_DEFAULT);
        $expires = gmdate('Y-m-d H:i:s', time() + self::OTP_EXPIRY_MINUTES * 60);
        $now = Db::now();

        // Delete prior pending OTPs for this email and purpose
        $pdo->prepare('DELETE FROM otp_codes WHERE email = ? AND purpose = ?')->execute([$email, $purpose]);
        $pdo->prepare('INSERT INTO otp_codes (email, otp_hash, purpose, metadata, attempts, expires_at, created_at) VALUES (?, ?, ?, ?, 0, ?, ?)')
            ->execute([$email, $hash, $purpose, $metadata, $expires, $now]);

        return $code;
    }

    /** Verifies a 6-digit OTP, throttled with 19-minute ban on 5 failures, and activates account */
    public static function verifyOtp(string $email, string $code, string $purpose = 'signup', string $ip = ''): bool
    {
        $pdo = Db::pdo();
        $now = Db::now();

        self::checkThrottle($email, $ip);

        // In non-production environments, 123456 is accepted as demo OTP
        $isLocalDemo = Env::get('APP_ENV') !== 'production' && $code === '123456';

        $st = $pdo->prepare('SELECT id, otp_hash, metadata, attempts, expires_at FROM otp_codes WHERE email = ? AND purpose = ? AND expires_at >= ? ORDER BY id DESC LIMIT 1');
        $st->execute([$email, $purpose, $now]);
        $row = $st->fetch();

        $ok = ($row && password_verify($code, $row['otp_hash'])) || $isLocalDemo;

        if (!$ok) {
            self::recordOtpFailureAndThrow($email, $ip, $row ?: null);
        }

        // Clean up OTP code after successful use
        if ($row) {
            $pdo->prepare('DELETE FROM otp_codes WHERE id = ?')->execute([$row['id']]);
        }
        $pdo->prepare('DELETE FROM login_attempts WHERE email = ? OR ip = ?')->execute([$email, $ip]);

        // If purpose is signup, create user if not existing, mark verified, and log in
        if ($purpose === 'signup') {
            $userSt = $pdo->prepare('SELECT id, full_name, email FROM users WHERE email = ?');
            $userSt->execute([$email]);
            $user = $userSt->fetch();

            if (!$user) {
                $meta = !empty($row['metadata']) ? json_decode($row['metadata'], true) : [];
                $fullName = !empty($meta['name']) ? $meta['name'] : 'User';
                $passwordHash = !empty($meta['password_hash']) ? $meta['password_hash'] : password_hash('Secret123!', PASSWORD_DEFAULT);

                $pdo->prepare('INSERT INTO users (full_name, email, password_hash, email_verified_at, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
                    ->execute([$fullName, $email, $passwordHash, $now, 'active', $now, $now]);
                $userId = (int) $pdo->lastInsertId();
            } else {
                $userId = (int) $user['id'];
                $pdo->prepare('UPDATE users SET email_verified_at = ?, updated_at = ? WHERE id = ?')->execute([$now, $now, $userId]);
            }

            self::startSession();
            if (session_status() === PHP_SESSION_ACTIVE) {
                session_regenerate_id(true);
            }
            $_SESSION['user_id'] = $userId;
            unset($_SESSION['admin_id']);
        } else {
            // Mark user email as verified if they exist
            $pdo->prepare('UPDATE users SET email_verified_at = ?, updated_at = ? WHERE email = ?')->execute([$now, $now, $email]);
        }

        return true;
    }

    /** Creates a secure password reset token */
    public static function createPasswordReset(string $email): string
    {
        $pdo = Db::pdo();
        $token = bin2hex(random_bytes(32));
        $hash = hash('sha256', $token);
        $expires = gmdate('Y-m-d H:i:s', time() + self::RESET_EXPIRY_HOURS * 3600);
        $now = Db::now();

        $pdo->prepare('DELETE FROM password_resets WHERE email = ?')->execute([$email]);
        $pdo->prepare('INSERT INTO password_resets (email, token_hash, expires_at, created_at) VALUES (?, ?, ?, ?)')
            ->execute([$email, $hash, $expires, $now]);

        return $token;
    }

    /** Resets password using token */
    public static function resetPassword(string $email, string $token, string $newPassword): void
    {
        $pdo = Db::pdo();
        $hash = hash('sha256', $token);
        $now = Db::now();

        $st = $pdo->prepare('SELECT id FROM password_resets WHERE email = ? AND token_hash = ? AND expires_at >= ? AND used_at IS NULL');
        $st->execute([$email, $hash, $now]);
        $resetId = $st->fetchColumn();

        if (!$resetId) {
            throw new HttpException(400, 'invalid_token', 'Password reset link is invalid or has expired.');
        }

        $newHash = password_hash($newPassword, PASSWORD_DEFAULT);
        $pdo->prepare('UPDATE users SET password_hash = ?, updated_at = ? WHERE email = ?')->execute([$newHash, $now, $email]);
        $pdo->prepare('UPDATE password_resets SET used_at = ? WHERE id = ?')->execute([$now, $resetId]);
    }

    public static function logout(): void
    {
        self::startSession();
        $_SESSION = [];
        if (session_status() === PHP_SESSION_ACTIVE) {
            session_destroy();
        }
    }

    public static function audit(?int $adminId, string $action, string $entity, ?int $entityId, string $ip): void
    {
        Db::pdo()->prepare(
            'INSERT INTO audit_logs (actor_type, actor_id, action, entity_type, entity_id, ip, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
        )->execute(['admin', $adminId, $action, $entity, $entityId, $ip, Db::now()]);
    }

    private static function checkThrottle(string $email, string $ip): void
    {
        $since = gmdate('Y-m-d H:i:s', time() - self::WINDOW_MINUTES * 60);
        $st = Db::pdo()->prepare(
            'SELECT COUNT(*) as count, MAX(attempted_at) as last_attempt FROM login_attempts WHERE attempted_at >= ? AND (email = ? OR ip = ?)'
        );
        $st->execute([$since, $email, $ip]);
        $row = $st->fetch();
        $count = (int) ($row['count'] ?? 0);

        if ($count >= self::MAX_FAILURES) {
            $lastTime = !empty($row['last_attempt']) ? strtotime($row['last_attempt']) : time();
            $elapsed = max(0, time() - $lastTime);
            $remainingSeconds = max(1, (self::WINDOW_MINUTES * 60) - $elapsed);
            $remainingMinutes = (int) ceil($remainingSeconds / 60);

            throw new HttpException(
                429,
                'too_many_attempts',
                "Too many failed attempts. You are temporarily locked out for {$remainingMinutes} minute(s). Please try again later."
            );
        }
    }

    private static function recordFailureAndThrow(string $email, string $ip, string $defaultMessage): void
    {
        $pdo = Db::pdo();
        $now = Db::now();
        $pdo->prepare('INSERT INTO login_attempts (email, ip, attempted_at) VALUES (?, ?, ?)')->execute([$email, $ip, $now]);

        $since = gmdate('Y-m-d H:i:s', time() - self::WINDOW_MINUTES * 60);
        $stCount = $pdo->prepare('SELECT COUNT(*) FROM login_attempts WHERE attempted_at >= ? AND (email = ? OR ip = ?)');
        $stCount->execute([$since, $email, $ip]);
        $failedCount = (int) $stCount->fetchColumn();

        if ($failedCount >= self::MAX_FAILURES) {
            throw new HttpException(
                429,
                'too_many_attempts',
                'Too many failed attempts. You are temporarily locked out for 19 minutes. Please try again after 19 minutes.'
            );
        }

        $remaining = max(1, self::MAX_FAILURES - $failedCount);
        throw new HttpException(
            401,
            'invalid_credentials',
            "{$defaultMessage} You have {$remaining} attempt(s) remaining before a 19-minute lockout."
        );
    }

    private static function recordOtpFailureAndThrow(string $email, string $ip, ?array $row): void
    {
        $pdo = Db::pdo();
        $now = Db::now();
        $pdo->prepare('INSERT INTO login_attempts (email, ip, attempted_at) VALUES (?, ?, ?)')->execute([$email, $ip, $now]);
        if ($row) {
            $pdo->prepare('UPDATE otp_codes SET attempts = attempts + 1 WHERE id = ?')->execute([$row['id']]);
        }

        $since = gmdate('Y-m-d H:i:s', time() - self::WINDOW_MINUTES * 60);
        $stCount = $pdo->prepare('SELECT COUNT(*) FROM login_attempts WHERE attempted_at >= ? AND (email = ? OR ip = ?)');
        $stCount->execute([$since, $email, $ip]);
        $failedCount = (int) $stCount->fetchColumn();

        if ($failedCount >= self::MAX_FAILURES) {
            throw new HttpException(
                429,
                'too_many_attempts',
                'Too many failed attempts. You are temporarily locked out for 19 minutes. Please try again after 19 minutes.'
            );
        }

        $remaining = max(1, self::MAX_FAILURES - $failedCount);
        throw new HttpException(
            400,
            'invalid_otp',
            "Incorrect verification code. You have {$remaining} attempt(s) remaining before a 19-minute lockout."
        );
    }
}

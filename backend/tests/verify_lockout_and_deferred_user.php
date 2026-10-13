<?php
declare(strict_types=1);

$root = dirname(__DIR__);
foreach (['Env', 'Db', 'Http', 'Router', 'Auth', 'Validator', 'Migrator'] as $f) {
    require "$root/src/Support/$f.php";
}
\Fundly\Support\Env::load("$root/.env");

use Fundly\Support\Db;
use Fundly\Support\Auth;
use Fundly\Support\HttpException;

echo "--- Testing 19-Minute Lockout and Deferred User Creation ---\n";

$testEmail = 'deferred_test_' . time() . '@example.com';
$testPass = 'Secret123!';
$testIp = '127.0.0.99';

// 1. Clean up any existing attempts/codes/users for this email & IP
Db::pdo()->prepare('DELETE FROM users WHERE email = ?')->execute([$testEmail]);
Db::pdo()->prepare('DELETE FROM otp_codes WHERE email = ?')->execute([$testEmail]);
Db::pdo()->prepare('DELETE FROM login_attempts WHERE email = ? OR ip = ?')->execute([$testEmail, $testIp]);

// 2. Perform Signup
echo "Step 1: Signing up user...\n";
$res = Auth::signupUser('Test User Deferred', $testEmail, $testPass, $testIp);
echo "Signup returned: " . json_encode($res) . "\n";

// Verify NO user exists in `users` table!
$userCount = (int) Db::pdo()->prepare('SELECT COUNT(*) FROM users WHERE email = ?')->execute([$testEmail]) ? Db::pdo()->query("SELECT COUNT(*) FROM users WHERE email = '$testEmail'")->fetchColumn() : 0;
if ($userCount !== 0) {
    echo "FAIL: User was inserted into users table before OTP verification!\n";
    exit(1);
}
echo "PASS: users table has 0 records for $testEmail before OTP verification.\n";

// Verify otp_codes has metadata
$otpRow = Db::pdo()->prepare('SELECT otp_hash, metadata FROM otp_codes WHERE email = ? AND purpose = ?');
$otpRow->execute([$testEmail, 'signup']);
$otpData = $otpRow->fetch();
if (!$otpData || empty($otpData['metadata'])) {
    echo "FAIL: otp_codes does not contain metadata!\n";
    exit(1);
}
$meta = json_decode($otpData['metadata'], true);
if (($meta['name'] ?? '') !== 'Test User Deferred') {
    echo "FAIL: metadata does not contain correct name!\n";
    exit(1);
}
echo "PASS: otp_codes contains metadata with name {$meta['name']}.\n";

// 3. Test wrong OTP attempts and countdown
echo "Step 2: Testing wrong OTP verification attempts...\n";
for ($i = 1; $i <= 4; $i++) {
    try {
        Auth::verifyOtp($testEmail, '000000', 'signup', $testIp);
        echo "FAIL: verifyOtp should have thrown an error!\n";
        exit(1);
    } catch (HttpException $e) {
        echo "Attempt $i rejected as expected: HTTP {$e->status} - {$e->getMessage()}\n";
        if ($e->status !== 400) {
            echo "FAIL: expected 400 for attempts 1-4, got {$e->status}\n";
            exit(1);
        }
    }
}

// 4. Test 5th wrong attempt -> 19-minute lockout (429)
echo "Step 3: Testing 5th failure triggering 19-minute lockout...\n";
try {
    Auth::verifyOtp($testEmail, '000000', 'signup', $testIp);
    echo "FAIL: 5th attempt should have thrown 429 lockout!\n";
    exit(1);
} catch (HttpException $e) {
    echo "5th attempt response: HTTP {$e->status} - {$e->getMessage()}\n";
    if ($e->status !== 429) {
        echo "FAIL: expected 429 for 5th attempt, got {$e->status}\n";
        exit(1);
    }
    if (strpos($e->getMessage(), '19 minutes') === false && strpos($e->getMessage(), '19 minute') === false) {
        echo "FAIL: lockout message should mention 19 minutes!\n";
        exit(1);
    }
    echo "PASS: 19-minute lockout triggered successfully!\n";
}

// 5. Test that further attempts are immediately blocked by checkThrottle
echo "Step 4: Testing checkThrottle blocks even valid OTP during lockout...\n";
try {
    Auth::verifyOtp($testEmail, '123456', 'signup', $testIp);
    echo "FAIL: should be locked out!\n";
    exit(1);
} catch (HttpException $e) {
    echo "Blocked response: HTTP {$e->status} - {$e->getMessage()}\n";
    if ($e->status !== 429) {
        echo "FAIL: expected 429 lockout block!\n";
        exit(1);
    }
    echo "PASS: checkThrottle successfully blocked request during lockout!\n";
}

// 6. Clear lockout to test successful verification and DB insertion
echo "Step 5: Clearing lockout and testing successful OTP verification...\n";
Db::pdo()->prepare('DELETE FROM login_attempts WHERE email = ? OR ip = ?')->execute([$testEmail, $testIp]);

// Re-generate code to be clean
$realCode = Auth::generateOtp($testEmail, 'signup');
Auth::verifyOtp($testEmail, $realCode, 'signup', $testIp);

// Verify user is NOW created in `users` table!
$createdUser = Db::pdo()->prepare('SELECT id, full_name, email, email_verified_at FROM users WHERE email = ?');
$createdUser->execute([$testEmail]);
$u = $createdUser->fetch();

if (!$u) {
    echo "FAIL: User was NOT created in users table after OTP verification!\n";
    exit(1);
}

if (empty($u['email_verified_at'])) {
    echo "FAIL: email_verified_at was not set!\n";
    exit(1);
}

echo "PASS: User {$u['full_name']} (ID {$u['id']}) successfully created in users table with email_verified_at = {$u['email_verified_at']}.\n";

// Cleanup test user
Db::pdo()->prepare('DELETE FROM users WHERE email = ?')->execute([$testEmail]);
Db::pdo()->prepare('DELETE FROM otp_codes WHERE email = ?')->execute([$testEmail]);
Db::pdo()->prepare('DELETE FROM login_attempts WHERE email = ? OR ip = ?')->execute([$testEmail, $testIp]);

echo "\nALL TESTS PASSED SUCCESSFULLY!\n";

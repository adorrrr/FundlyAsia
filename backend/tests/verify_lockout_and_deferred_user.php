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

// 7. Test 5-minute expiry behavior
echo "Step 6: Testing 5-minute OTP expiry behavior...\n";
$expireEmail = 'expire_test_' . time() . '@example.com';
Auth::signupUser('Expire User', $expireEmail, 'Secret123!', $testIp);

// Manually set expires_at to 10 seconds ago (simulating 5 minutes passed)
Db::pdo()->prepare('UPDATE otp_codes SET expires_at = ? WHERE email = ?')
    ->execute([gmdate('Y-m-d H:i:s', time() - 10), $expireEmail]);

try {
    Auth::verifyOtp($expireEmail, '123456', 'signup', $testIp);
    echo "FAIL: Expired OTP should have been rejected!\n";
    exit(1);
} catch (HttpException $e) {
    echo "Expired OTP rejected as expected: HTTP {$e->status} ({$e->errorCode}) - {$e->getMessage()}\n";
    if ($e->errorCode !== 'otp_expired') {
        echo "FAIL: Expected error code 'otp_expired', got '{$e->errorCode}'\n";
        exit(1);
    }
    echo "PASS: Expired OTP rejected with 'otp_expired' and user must sign up again!\n";
}

// 8. Test cancellation when clicking back or navigating away
echo "Step 7: Testing cancelSignup on back button navigation...\n";
$backEmail = 'back_test_' . time() . '@example.com';
Auth::signupUser('Back User', $backEmail, 'Secret123!', $testIp);

// Verify OTP row exists before cancellation
$countBefore = (int) Db::pdo()->query("SELECT COUNT(*) FROM otp_codes WHERE email = '$backEmail'")->fetchColumn();
if ($countBefore !== 1) {
    echo "FAIL: Expected 1 otp record before cancellation, found $countBefore!\n";
    exit(1);
}

// Cancel signup (user clicked Back button or left page)
Auth::cancelSignup($backEmail);

$countAfter = (int) Db::pdo()->query("SELECT COUNT(*) FROM otp_codes WHERE email = '$backEmail'")->fetchColumn();
if ($countAfter !== 0) {
    echo "FAIL: Expected 0 otp records after cancellation, found $countAfter!\n";
    exit(1);
}
echo "PASS: cancelSignup successfully cleared all pending registration data from otp_codes!\n";

// Verify attempting to verify cancelled signup fails
try {
    Auth::verifyOtp($backEmail, '123456', 'signup', $testIp);
    echo "FAIL: Verifying cancelled signup should have thrown an error!\n";
    exit(1);
} catch (HttpException $e) {
    echo "Cancelled verification rejected: HTTP {$e->status} ({$e->errorCode}) - {$e->getMessage()}\n";
    if ($e->errorCode !== 'otp_expired') {
        echo "FAIL: Expected 'otp_expired', got '{$e->errorCode}'\n";
        exit(1);
    }
    echo "PASS: Cancelled signup requires user to sign up again from scratch!\n";
}

// Cleanup test user
Db::pdo()->prepare('DELETE FROM users WHERE email IN (?, ?, ?)')->execute([$testEmail, $expireEmail, $backEmail]);
Db::pdo()->prepare('DELETE FROM otp_codes WHERE email IN (?, ?, ?)')->execute([$testEmail, $expireEmail, $backEmail]);
Db::pdo()->prepare('DELETE FROM login_attempts WHERE ip = ?')->execute([$testIp]);

echo "\nALL TESTS PASSED SUCCESSFULLY!\n";

<?php
declare(strict_types=1);

require __DIR__ . '/../src/Support/Env.php';
require __DIR__ . '/../src/Support/Db.php';
require __DIR__ . '/../src/Support/Http.php';
require __DIR__ . '/../src/Support/Auth.php';
require __DIR__ . '/../src/Support/Validator.php';
require __DIR__ . '/../src/Repositories/Repositories.php';

use Fundly\Support\Db;
use Fundly\Support\HttpException;
use Fundly\Repositories\MasterclassRepository;
use Fundly\Repositories\RegistrationRepository;
use Fundly\Repositories\RefundRepository;

Fundly\Support\Env::load(__DIR__ . '/../.env');
$pdo = Db::pdo();

echo "=== TEST: Cancellation, Limit Release & Masterclass Deletion ===\n";

// 1. Create a masterclass with capacity = 10
$mc = MasterclassRepository::create([
    'title' => ['en' => 'Test Deletion Session', 'bn' => 'টেস্ট সেশন'],
    'topic' => ['en' => 'Business', 'bn' => 'ব্যবসা'],
    'summary' => ['en' => 'Short summary', 'bn' => 'সংক্ষেপ'],
    'description' => ['en' => 'Long description of test session', 'bn' => 'বিস্তারিত'],
    'learn' => [['en' => 'Item 1', 'bn' => 'আইটেম ১']],
    'venue' => ['en' => 'Online', 'bn' => 'অনলাইন'],
    'date' => '2026-12-01',
    'startTime' => '10:00:00',
    'endTime' => '12:00:00',
    'registrationDeadline' => '2026-11-30',
    'capacity' => 10,
    'fee' => 1500.0,
    'status' => 'registration_open',
    'coverTone' => 'leaf',
    'speakerId' => null,
    'cover' => '',
    'coverSrcSet' => '',
]);

$mcId = (int) $mc['id'];
echo "[1] Masterclass created. ID=$mcId, Capacity={$mc['capacity']}, seatsTaken={$mc['seatsTaken']}\n";
assert($mc['seatsTaken'] === 0, "Initial seatsTaken should be 0");

// 2. Find a test user or create one
$stUser = $pdo->query("SELECT id FROM users LIMIT 1");
$userId = (int) $stUser->fetchColumn();

// Create a registration
$reg = RegistrationRepository::create($userId, [
    'masterclassId' => $mcId,
    'name' => 'Monir Attendee',
    'email' => 'monir.test@example.com',
    'businessName' => 'Monir Enterprise',
    'industry' => 'IT',
    'businessType' => 'sole_proprietorship',
    'financingIntent' => 'exploring',
    'amount' => 1500.0,
]);

$regId = $reg['rawId'];
echo "[2] Attendee registered. RegID=$regId, Status={$reg['status']}\n";

// Mark as confirmed and paid
$now = Db::now();
$pdo->prepare("UPDATE registrations SET status = 'confirmed', payment_status = 'paid', amount_paid = 1500.0, updated_at = ? WHERE id = ?")
    ->execute([$now, $regId]);

// Check masterclass seatsTaken
$mcAfterReg = MasterclassRepository::find((string) $mcId, true);
echo "[3] Masterclass seatsTaken after registration: {$mcAfterReg['seatsTaken']}\n";
assert($mcAfterReg['seatsTaken'] === 1, "seatsTaken should be 1");

// 3. Attempt to delete masterclass while active registration exists -> should throw 409
echo "[4] Attempting to delete masterclass while 1 active registration exists...\n";
$threw409 = false;
try {
    MasterclassRepository::delete($mcId);
} catch (HttpException $e) {
    if ($e->status === 409 && in_array($e->errorCode, ['has_active_registrations', 'has_registrations'], true)) {
        $threw409 = true;
        echo "    SUCCESS: Correctly blocked deletion with 409: {$e->getMessage()}\n";
    } else {
        echo "    UNEXPECTED HttpException: {$e->status} {$e->errorCode} {$e->getMessage()}\n";
    }
}
assert($threw409, "Must throw 409 when deleting masterclass with active registration");

// 4. Admin issues direct refund & cancellation for that 1 attendee
echo "[5] Processing admin direct refund & cancellation for Attendee RegID=$regId...\n";
$refundResult = RefundRepository::adminDirectRefund($regId, 1, [
    'amount' => 1500.0,
    'reason' => 'Session cancelled by organizer - full refund issued',
    'destinationAccount' => '01700000000',
    'refundMethod' => 'bkash',
    'trxId' => 'TRX_TEST_REF_999',
], '127.0.0.1');

echo "    Refund record ID: {$refundResult['refund']['id']}, Status: {$refundResult['refund']['status']}\n";
echo "    Registration status: {$refundResult['registration']['status']}, payment: {$refundResult['registration']['paymentStatus']}\n";
assert($refundResult['registration']['status'] === 'cancelled', "Registration status must be cancelled");
assert($refundResult['registration']['paymentStatus'] === 'refunded', "Payment status must be refunded");

// 5. Check masterclass seatsTaken again -> must be 0!
$mcAfterRefund = MasterclassRepository::find((string) $mcId, true);
echo "[6] Masterclass seatsTaken after refund: {$mcAfterRefund['seatsTaken']}\n";
assert($mcAfterRefund['seatsTaken'] === 0, "seatsTaken must return to 0 when attendee is refunded/cancelled!");

// 6. Delete the masterclass now that active seats = 0
echo "[7] Deleting masterclass session with seatsTaken = 0...\n";
MasterclassRepository::delete($mcId);
echo "    SUCCESS: Masterclass deleted without error!\n";

// 7. Verify it is gone
$mcFinal = MasterclassRepository::find((string) $mcId, true);
assert($mcFinal === null, "Masterclass should no longer exist");
echo "[8] Verified masterclass no longer exists in DB.\n";

echo "\n>>> ALL CANCELLATION, REFUND & DELETION CHECKS PASSED 100%! <<<\n";

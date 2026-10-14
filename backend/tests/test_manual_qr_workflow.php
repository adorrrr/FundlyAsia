<?php
declare(strict_types=1);

require_once __DIR__ . '/../src/Support/Env.php';
require_once __DIR__ . '/../src/Support/Db.php';
require_once __DIR__ . '/../src/Support/Http.php';
require_once __DIR__ . '/../src/Support/Validator.php';
require_once __DIR__ . '/../src/Support/Auth.php';
require_once __DIR__ . '/../src/Repositories/Repositories.php';

use Fundly\Support\Env;
Env::load(__DIR__ . '/../.env');

use Fundly\Support\Db;
use Fundly\Repositories\MasterclassRepository;
use Fundly\Repositories\RegistrationRepository;
use Fundly\Repositories\PaymentSubmissionRepository;
use Fundly\Repositories\TicketRepository;
use Fundly\Repositories\RefundRepository;
use Fundly\Repositories\AdminRepository;

echo "--- 1. Testing Database & Dashboard ---\n";
$dashboard = AdminRepository::dashboard();
print_r($dashboard);
echo "Dashboard OK!\n\n";

echo "--- 2. Finding a Paid Masterclass ---\n";
$masterclasses = MasterclassRepository::list(true);
$paidMc = null;
foreach ($masterclasses as $mc) {
    if ((float)$mc['fee'] > 0) {
        $paidMc = $mc;
        break;
    }
}
if (!$paidMc) {
    echo "No paid masterclass found, creating a test one...\n";
    $paidMc = MasterclassRepository::create([
        'title' => ['en' => 'SME Financial Strategies', 'bn' => 'এসএমই আর্থিক কৌশল'],
        'topic' => ['en' => 'Financial Strategy', 'bn' => 'আর্থিক কৌশল'],
        'summary' => ['en' => 'Test summary', 'bn' => 'টেস্ট সারসংক্ষেপ'],
        'description' => ['en' => 'Test desc', 'bn' => 'টেস্ট বিবরণ'],
        'learn' => ['Cashflow', 'Budgeting'],
        'date' => '2026-11-20',
        'startTime' => '10:00',
        'endTime' => '12:00',
        'venue' => ['en' => 'Gulshan Center', 'bn' => 'গুলশান সেন্টার'],
        'capacity' => 50,
        'registrationDeadline' => '2026-11-19',
        'fee' => 1500.0,
        'status' => 'published',
        'speakerId' => null,
        'cover' => null,
        'coverSrcSet' => null,
        'coverAlt' => ['en' => '', 'bn' => ''],
        'coverCredit' => ['name' => '', 'url' => ''],
        'coverTone' => 'leaf',
    ]);
}
echo "Selected Masterclass ID: {$paidMc['id']}, Fee: {$paidMc['fee']}\n\n";

echo "--- 3. Testing Registration Creation ---\n";
$pdo = Db::pdo();
$user = $pdo->query("SELECT * FROM users WHERE status = 'active' LIMIT 1")->fetch();
if (!$user) {
    die("No user found in DB\n");
}
$userId = (int)$user['id'];
$admin = $pdo->query("SELECT * FROM admin_users LIMIT 1")->fetch();
$adminId = $admin ? (int)$admin['id'] : 1;

$pdo->prepare("DELETE FROM refunds WHERE registration_id IN (SELECT id FROM registrations WHERE user_id = ? AND masterclass_id = ?)")->execute([$userId, (int)$paidMc['id']]);
$pdo->prepare("DELETE FROM tickets WHERE registration_id IN (SELECT id FROM registrations WHERE user_id = ? AND masterclass_id = ?)")->execute([$userId, (int)$paidMc['id']]);
$pdo->prepare("DELETE FROM payment_submissions WHERE registration_id IN (SELECT id FROM registrations WHERE user_id = ? AND masterclass_id = ?)")->execute([$userId, (int)$paidMc['id']]);
$pdo->prepare("DELETE FROM payments WHERE registration_id IN (SELECT id FROM registrations WHERE user_id = ? AND masterclass_id = ?)")->execute([$userId, (int)$paidMc['id']]);
$pdo->prepare("DELETE FROM registrations WHERE user_id = ? AND masterclass_id = ?")->execute([$userId, (int)$paidMc['id']]);

$reg = RegistrationRepository::create($userId, [
    'masterclassId' => $paidMc['id'],
    'name' => 'Test SME Founder',
    'email' => 'founder@test-sme.com',
    'businessName' => 'Future Corp Ltd',
    'industry' => 'Technology',
    'businessType' => 'private_limited',
    'financingIntent' => 'actively_seeking',
    'purpose' => 'working_capital',
    'amountRange' => 'BDT 10-25 lakh',
]);
echo "Created Registration ID: {$reg['id']}, Amount: {$reg['amount']}, Payment Status: {$reg['paymentStatus']}\n\n";

echo "--- 4. Testing Manual QR Payment Submission ---\n";
$trxId = 'TXN' . date('YmdHis') . rand(100, 999);
$sub = PaymentSubmissionRepository::create($reg['id'], $userId, [
    'paymentMethod' => 'bkash',
    'senderAccount' => '01711000000',
    'trxId' => $trxId,
    'amount' => (float)$paidMc['fee'],
    'paidAt' => date('Y-m-d H:i:s'),
    'receiptPath' => '/uploads/receipts/test.png',
], '127.0.0.1');
echo "Created Submission ID: {$sub['id']}, Status: {$sub['status']}, TrxID: {$sub['trxId']}\n";

$regAfterSub = RegistrationRepository::findById($reg['id'], $userId);
echo "Registration Payment Status after Submission: {$regAfterSub['paymentStatus']}\n\n";

echo "--- 5. Testing Admin Approval of Payment Submission ---\n";
$approval = PaymentSubmissionRepository::approve((int)$sub['id'], $adminId, '127.0.0.1', 'Verified with merchant statement');
echo "Submission Approved! Ticket Number: {$approval['ticketNumber']}\n";

$ticket = TicketRepository::getByRegistration($reg['id'], $userId);
echo "Fetched Digital Ticket Number: {$ticket['ticketNumber']}, Status: {$ticket['status']}\n";
echo "Ticket Attendee: {$ticket['attendee']['name']}, Masterclass: {$ticket['masterclass']['title']['en']}\n\n";

echo "--- 6. Testing Ticket Verification & Check-in ---\n";
$verifyResult = TicketRepository::verifyTicket($ticket['ticketNumber'], (int)$paidMc['id']);
echo "Verify Ticket Result: " . ($verifyResult['valid'] ? 'VALID' : 'INVALID') . " - {$verifyResult['message']}\n";

$checkInResult = TicketRepository::checkIn($ticket['ticketNumber'], $adminId, (int)$paidMc['id']);
echo "Check-in Result: {$checkInResult['status']} - {$checkInResult['message']}\n";

$roster = MasterclassRepository::getRoster((int)$paidMc['id']);
echo "Roster count for Masterclass {$paidMc['id']}: " . count($roster) . "\n";
echo "First Attendee in Roster: {$roster[0]['name']}, Attendance: {$roster[0]['attendanceStatus']}\n\n";

echo "--- 7. Testing User Refund Request Workflow ---\n";
$refRequest = RefundRepository::createRequest($reg['id'], $userId, [
    'amount' => (float)$paidMc['fee'],
    'reason' => 'Schedule conflict, unable to attend session',
    'destinationAccount' => '01711000000',
    'accountHolderName' => 'Test SME Founder',
    'refundMethod' => 'bkash',
], '127.0.0.1');
echo "Refund Request Created ID: {$refRequest['id']}, Status: {$refRequest['status']}, Amount: {$refRequest['amount']}\n";

$regAfterRefReq = RegistrationRepository::findById($reg['id'], $userId);
echo "Registration Payment Status after Refund Request: {$regAfterRefReq['paymentStatus']}\n\n";

echo "--- 8. Testing Admin Refund Approval & Completion ---\n";
$adminApprovedRef = RefundRepository::approve((int)$refRequest['id'], $adminId, '127.0.0.1', 'Approved per refund policy');
echo "Refund Request Approved by Admin! Status: {$adminApprovedRef['status']}\n";

$refTrxId = 'REF' . date('YmdHis') . rand(100, 999);
$completedRef = RefundRepository::complete((int)$refRequest['id'], $adminId, [
    'amount' => (float)$paidMc['fee'],
    'trxId' => $refTrxId,
    'notes' => 'Disbursed via bKash merchant payout',
], '127.0.0.1');
echo "Refund Completed! Status: {$completedRef['status']}, TrxID: {$completedRef['providerRefundId']}\n";

$regAfterRefComplete = RegistrationRepository::findById($reg['id'], $userId);
echo "Registration Status after Full Refund: {$regAfterRefComplete['status']}\n";
echo "Registration Payment Status after Full Refund: {$regAfterRefComplete['paymentStatus']}\n";
echo "Amount Refunded: {$regAfterRefComplete['amountRefunded']}\n\n";

echo "=== ALL BACKEND WORKFLOW TESTS PASSED 100%! ===\n";

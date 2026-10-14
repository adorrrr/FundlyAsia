<?php
declare(strict_types=1);

// Comprehensive backend API test suite for Fundly
$base = rtrim($argv[1] ?? 'http://127.0.0.1:8080', '/');
$adminEmail = getenv('ADMIN_EMAIL') ?: 'admin@fundly.asia';
$adminPass = getenv('ADMIN_PASSWORD') ?: 'super-secure-admin-pass-2026';
$fails = 0;

$adminJar = tempnam(sys_get_temp_dir(), 'ajar');
$smeJar = tempnam(sys_get_temp_dir(), 'sjar');
$anonJar = tempnam(sys_get_temp_dir(), 'anon');

function call(string $method, string $url, ?array $body, string $jar, bool $xhr = true, array $extra = []): array
{
    $ch = curl_init($url);
    $h = ['Accept: application/json'];
    if ($body !== null) {
        $h[] = 'Content-Type: application/json';
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));
    }
    if ($xhr) {
        $h[] = 'X-Requested-With: XMLHttpRequest';
    }
    curl_setopt_array($ch, [
        CURLOPT_CUSTOMREQUEST => $method,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => array_merge($h, $extra),
        CURLOPT_COOKIEFILE => $jar,
        CURLOPT_COOKIEJAR => $jar,
    ]);
    $raw = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    return [$code, json_decode((string) $raw, true), (string) $raw];
}

function check(string $name, bool $ok, string $detail = ''): void
{
    global $fails;
    echo ($ok ? 'PASS ' : 'FAIL ') . $name . ($ok ? '' : "  -> $detail") . "\n";
    $fails += $ok ? 0 : 1;
}

echo "=== 1. Public Endpoints ===\n";
[$c, $questions] = call('GET', "$base/questions", null, $anonJar);
check('list questions -> 200', $c === 200 && is_array($questions) && count($questions) >= 15, "code: $c");

[$c, $mList] = call('GET', "$base/masterclasses", null, $anonJar);
check('list masterclasses -> 200', $c === 200 && is_array($mList), "code: $c");

echo "=== 2. Admin Auth & Masterclass Management ===\n";
[$c, $adm] = call('POST', "$base/auth/admin/login", ['email' => $adminEmail, 'password' => $adminPass], $adminJar);
check('admin login -> 200', $c === 200 && ($adm['role'] ?? '') === 'admin', "code: $c");

[$c, $me] = call('GET', "$base/auth/admin/me", null, $adminJar);
check('admin me -> 200', $c === 200 && ($me['role'] ?? '') === 'admin', "code: $c");

// Create test masterclass for registrations
$mcData = [
    'title' => ['en' => 'Test Workshop Session', 'bn' => 'টেস্ট ওয়ার্কশপ সেশন'],
    'topic' => ['en' => 'Credit Readiness', 'bn' => 'ক্রেডিট প্রস্তুতি'],
    'summary' => ['en' => 'Interactive Loan Lab session', 'bn' => 'ইন্টারঅ্যাক্টিভ লোন ল্যাব সেশন'],
    'description' => ['en' => 'Full workshop details', 'bn' => 'সম্পূর্ণ ওয়ার্কশপ বিস্তারিত'],
    'learn' => [['en' => 'Bookkeeping fundamentals', 'bn' => 'বুককিপিং এর মূল ভিত্তি']],
    'date' => '2028-11-20',
    'startTime' => '10:00',
    'endTime' => '13:00',
    'venue' => ['en' => 'Dhaka', 'bn' => 'ঢাকা'],
    'capacity' => 10,
    'registrationDeadline' => '2028-11-19',
    'fee' => 999,
    'status' => 'registration_open',
    'speakerId' => '',
    'coverTone' => 'leaf',
];
[$c, $createdMc] = call('POST', "$base/admin/masterclasses", $mcData, $adminJar);
check('create masterclass -> 201', $c === 201 && isset($createdMc['id']), "code: $c");
$mcId = $createdMc['id'] ?? '0';

echo "=== 3. SME Signup & Auth Flow ===\n";
$smeEmail = 'sme_' . bin2hex(random_bytes(4)) . '@test.local';
$smePass = 'TestPass1234!';
[$c, $u] = call('POST', "$base/auth/signup", [
    'name' => 'Ador Chowdhury',
    'email' => $smeEmail,
    'password' => $smePass,
], $smeJar);
check('sme signup -> 201', $c === 201 && ($u['role'] ?? '') === 'sme', "code: $c");

// Verify OTP (123456 accepted in local demo)
[$c, $v] = call('POST', "$base/auth/verify-otp", [
    'email' => $smeEmail,
    'code' => '123456',
    'purpose' => 'signup',
], $smeJar);
check('verify otp -> 200', $c === 200 && ($v['verified'] ?? false) === true, "code: $c");

[$c, $smeMe] = call('GET', "$base/auth/me", null, $smeJar);
check('sme me -> 200 and email verified', $c === 200 && ($smeMe['emailVerified'] ?? false) === true, "code: $c");

echo "=== 4. SME Business Profile Flow ===\n";
[$c, $prof] = call('GET', "$base/business-profile", null, $smeJar);
check('get initial business profile -> null/200', $c === 200, "code: $c");

$bpInput = [
    'businessName' => 'Jahan Fabrics Ltd',
    'businessType' => 'private_limited',
    'industry' => 'apparel',
    'location' => 'dhaka',
    'businessAge' => '3to5',
    'ownershipType' => 'single',
    'ownerName' => 'Ador Chowdhury',
    'email' => $smeEmail,
];
[$c, $savedProf] = call('POST', "$base/business-profile", $bpInput, $smeJar);
check('save business profile -> 200', $c === 200 && ($savedProf['businessName'] ?? '') === 'Jahan Fabrics Ltd', "code: $c");

[$c, $smeMeUpdated] = call('GET', "$base/auth/me", null, $smeJar);
check('sme me hasBusinessProfile -> true', $c === 200 && ($smeMeUpdated['hasBusinessProfile'] ?? false) === true, "code: $c");

echo "=== 5. Masterclass Registration Flow ===\n";
$regInput = [
    'masterclassId' => $mcId,
    'name' => 'Ador Chowdhury',
    'email' => $smeEmail,
    'businessName' => 'Jahan Fabrics Ltd',
    'industry' => 'apparel',
    'businessType' => 'private_limited',
    'financingIntent' => 'yes',
    'purpose' => 'working_capital',
    'amountRange' => '10_25l',
];
[$c, $reg] = call('POST', "$base/registrations", $regInput, $smeJar);
check('create registration -> 201', $c === 201 && isset($reg['id']) && str_starts_with($reg['id'], 'FL-'), "code: $c");
$regId = $reg['id'] ?? '';

// Duplicate registration rejection
[$c, $dup] = call('POST', "$base/registrations", $regInput, $smeJar);
check('duplicate registration -> 409', $c === 409 && ($dup['code'] ?? '') === 'already_registered', "code: $c");

[$c, $myRegs] = call('GET', "$base/registrations", null, $smeJar);
check('list my registrations -> 200', $c === 200 && count($myRegs) === 1, "code: $c");

[$c, $regDetail] = call('GET', "$base/registrations/$regId", null, $smeJar);
check('show registration detail -> 200', $c === 200 && ($regDetail['id'] ?? '') === $regId, "code: $c");

echo "=== 6. Payment Flow ===\n";
[$c, $pay] = call('POST', "$base/payments/create", ['registrationId' => $regId], $smeJar);
check('create payment -> 200', $c === 200 && isset($pay['paymentId']), "code: $c");
$payId = $pay['paymentId'] ?? '';

[$c, $vPay] = call('POST', "$base/payments/verify", ['paymentId' => $payId], $smeJar);
check('verify payment -> 200', $c === 200 && ($vPay['status'] ?? '') === 'paid', "code: $c");

[$c, $regPaid] = call('GET', "$base/registrations/$regId", null, $smeJar);
check('registration payment_status updated to paid', $c === 200 && ($regPaid['paymentStatus'] ?? '') === 'paid', "code: $c");

echo "=== 7. Eligibility Assessment & Scoring Engine ===\n";
$draftAnswers = [
    'Q-BI-01' => '3to5',
    'Q-BI-02' => 'apparel',
    'Q-BI-03' => 'private_limited',
    'Q-BI-04' => 'dhaka',
];
[$c, $draft] = call('POST', "$base/assessments/save", ['answers' => $draftAnswers, 'step' => 2], $smeJar);
check('save assessment draft -> 200', $c === 200 && ($draft['status'] ?? '') === 'draft', "code: $c");

[$c, $curDraft] = call('GET', "$base/assessments/current", null, $smeJar);
check('get current assessment draft -> 200', $c === 200 && ($curDraft['currentStep'] ?? 0) === 2, "code: $c");

$completeAnswers = [
    'Q-BI-01' => '3to5',
    'Q-BI-02' => 'apparel',
    'Q-BI-03' => 'private_limited',
    'Q-BI-04' => 'dhaka',
    'Q-FN-01' => '250000',
    'Q-FN-02' => 'profitable',
    'Q-FR-01' => 'complete',
    'Q-BK-01' => 'yes',
    'Q-BK-02' => 'yes',
    'Q-BK-03' => 'yes',
    'Q-CP-01' => 'valid',
    'Q-CP-02' => 'available',
    'Q-CP-03' => 'available',
    'Q-DB-01' => 'no',
    'Q-FD-01' => '1500000',
    'Q-FD-02' => 'working_capital',
    'Q-FD-03' => '1_3m',
];
[$c, $result] = call('POST', "$base/assessments/submit", ['answers' => $completeAnswers], $smeJar);
check('submit assessment -> 201 with score and band', $c === 201 && isset($result['score']) && isset($result['band']), "code: $c");
$score = $result['score'] ?? 0;
echo "   -> Calculated Score: $score (Band: {$result['band']})\n";

[$c, $latestRes] = call('GET', "$base/assessments/result", null, $smeJar);
check('get latest result -> 200', $c === 200 && ($latestRes['score'] ?? -1) === $score, "code: $c");

echo "=== 8. Admin Management & Dashboard ===\n";
[$c, $dash] = call('GET', "$base/admin/dashboard", null, $adminJar);
check('admin dashboard stats -> 200', $c === 200 && ($dash['totalSmes'] ?? 0) >= 1 && ($dash['totalRegistrations'] ?? 0) >= 1, "code: $c");

[$c, $smes] = call('GET', "$base/admin/smes", null, $adminJar);
check('admin list smes -> 200', $c === 200 && count($smes) >= 1, "code: $c");

[$c, $adminRegs] = call('GET', "$base/admin/registrations", null, $adminJar);
check('admin list registrations -> 200', $c === 200 && count($adminRegs) >= 1, "code: $c");

[$c, $adminResults] = call('GET', "$base/admin/results", null, $adminJar);
check('admin list results -> 200', $c === 200 && count($adminResults) >= 1, "code: $c");

[$c, $rules] = call('GET', "$base/admin/scoring-rules", null, $adminJar);
check('admin list scoring rules -> 200', $c === 200 && count($rules) === 6, "code: $c");

// Clean up test masterclass
call('DELETE', "$base/admin/masterclasses/$mcId", null, $adminJar);

echo $fails ? "\n>>> $fails CHECKS FAILED <<<\n" : "\n>>> ALL 27 EXTENDED CHECKS PASSED <<<\n";
exit($fails ? 1 : 0);

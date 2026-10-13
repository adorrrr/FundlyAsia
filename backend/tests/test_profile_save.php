<?php
declare(strict_types=1);

$jar = tempnam(sys_get_temp_dir(), 'sme_test_jar');
$base = 'http://127.0.0.1:8080';

function req(string $method, string $url, ?array $body, string $jar) {
    $ch = curl_init($url);
    $h = ['Accept: application/json', 'X-Requested-With: XMLHttpRequest', 'Origin: http://localhost:5173'];
    if ($body !== null) {
        $h[] = 'Content-Type: application/json';
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));
    }
    curl_setopt_array($ch, [
        CURLOPT_CUSTOMREQUEST => $method,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => $h,
        CURLOPT_COOKIEFILE => $jar,
        CURLOPT_COOKIEJAR => $jar,
    ]);
    $raw = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    return [$code, json_decode((string)$raw, true), (string)$raw];
}

// 1. Login as user@fundly.asia
[$c, $user] = req('POST', "$base/auth/login", [
    'email' => 'user@fundly.asia',
    'password' => 'password123456'
], $jar);

echo "1. Login Status: $c\n";
echo "User: " . json_encode($user) . "\n\n";

// 2. Get current profile
[$c, $prof] = req('GET', "$base/business-profile", null, $jar);
echo "2. GET Profile Status: $c\n";
echo "Current Profile: " . json_encode($prof) . "\n\n";

// 3. Save updated profile with exact fields from ProfileForm
$payload = [
    'businessName' => 'Ador Super Store',
    'businessType' => 'sole_proprietorship',
    'industry' => 'retail',
    'location' => 'dhaka',
    'businessAge' => '2_5y',
    'ownershipType' => 'sole_owner',
    'ownerName' => 'Ador Chowdhury',
    'email' => 'user@fundly.asia'
];

[$c, $saved, $raw] = req('POST', "$base/business-profile", $payload, $jar);
echo "3. POST Profile Status: $c\n";
echo "Saved Profile: " . json_encode($saved) . "\n";
echo "Raw response: $raw\n\n";

// 4. Verify by GET again
[$c, $check] = req('GET', "$base/business-profile", null, $jar);
echo "4. GET Profile again Status: $c\n";
echo "Checked Profile: " . json_encode($check) . "\n";

// 5. Check /auth/me hasBusinessProfile
[$c, $me] = req('GET', "$base/auth/me", null, $jar);
echo "5. GET /auth/me Status: $c\n";
echo "Me: " . json_encode($me) . "\n";

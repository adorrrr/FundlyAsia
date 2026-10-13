<?php
declare(strict_types=1);

// Usage: php tests/api_test.php http://127.0.0.1:8080  (server must use a disposable test DB; see docs)
$base = rtrim($argv[1] ?? 'http://127.0.0.1:8080', '/');
$email = getenv('ADMIN_EMAIL') ?: 'admin@test.local';
$pass = getenv('ADMIN_PASSWORD') ?: 'correct horse battery';
$fails = 0;
$jar = tempnam(sys_get_temp_dir(), 'jar');

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
    curl_setopt_array($ch, [CURLOPT_CUSTOMREQUEST => $method, CURLOPT_RETURNTRANSFER => true, CURLOPT_HTTPHEADER => array_merge($h, $extra), CURLOPT_COOKIEFILE => $jar, CURLOPT_COOKIEJAR => $jar]);
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

$anon = tempnam(sys_get_temp_dir(), 'anon');
[, $initialMcList] = call('GET', "$base/masterclasses", null, $anon);
$initialMcCount = is_array($initialMcList) ? count($initialMcList) : 0;
[, $initialSpkList] = call('GET', "$base/speakers", null, $anon);
$initialSpkCount = is_array($initialSpkList) ? count($initialSpkList) : 0;

$mc = [

    'title' => ['en' => 'Test Session', 'bn' => ''], 'topic' => ['en' => 'Topic', 'bn' => ''], 'summary' => ['en' => 's', 'bn' => ''],
    'description' => ['en' => 'd', 'bn' => ''], 'learn' => [['en' => 'a', 'bn' => '']], 'date' => '2099-01-01', 'startTime' => '10:00', 'endTime' => '12:00',
    'venue' => ['en' => 'Dhaka', 'bn' => ''], 'capacity' => 20, 'registrationDeadline' => '', 'fee' => 500, 'status' => 'registration_open',
    'speakerId' => '', 'coverTone' => 'leaf',
];

[$c] = call('DELETE', "$base/admin/masterclasses/1", null, $anon);
check('unauthenticated delete -> 401', $c === 401, (string) $c);
[$c] = call('POST', "$base/admin/masterclasses", $mc, $anon);
check('unauthenticated create -> 401', $c === 401, (string) $c);
[$c] = call('GET', "$base/admin/masterclasses", null, $anon);
check('unauthenticated admin list -> 401', $c === 401, (string) $c);
[$c] = call('POST', "$base/auth/admin/login", ['email' => $email, 'password' => $pass], $jar, false);
check('login without CSRF header -> 403', $c === 403, (string) $c);
[$c] = call('POST', "$base/auth/admin/login", ['email' => $email, 'password' => 'wrong-password-x'], $jar);
check('bad password -> 401', $c === 401, (string) $c);
[$c, $j] = call('POST', "$base/auth/admin/login", ['email' => $email, 'password' => $pass], $jar);
check('admin login -> 200', $c === 200 && ($j['role'] ?? '') === 'admin', (string) $c);
[$c] = call('POST', "$base/admin/masterclasses", $mc, $jar, true, ['Origin: https://evil.example']);
check('create from disallowed origin -> 403', $c === 403, (string) $c);

[$c, $a] = call('POST', "$base/admin/masterclasses", $mc, $jar);
check('create -> 201', $c === 201 && isset($a['id']), (string) $c);
$idA = $a['id'] ?? '0';
$mcPast = array_merge($mc, ['title' => ['en' => 'Past Session', 'bn' => ''], 'date' => '2020-01-01', 'status' => 'completed']);
[$c, $b] = call('POST', "$base/admin/masterclasses", $mcPast, $jar);
check('create past -> 201', $c === 201, (string) $c);
$idB = $b['id'] ?? '0';
$bad = $mc;
$bad['date'] = 'nope';
$bad['status'] = 'x';
$bad['cover'] = 'data:image/png;base64,AAAA';
[$c, $j] = call('POST', "$base/admin/masterclasses", $bad, $jar);
check('invalid input -> 422 with field errors', $c === 422 && isset($j['errors']['date'], $j['errors']['status'], $j['errors']['cover']), (string) $c);

[$c, $list] = call('GET', "$base/masterclasses", null, $anon);
check('public list has both', $c === 200 && count($list) === $initialMcCount + 2, (string) $c);
$mcDraft = array_merge($mc, ['title' => ['en' => 'Hidden Draft', 'bn' => ''], 'status' => 'draft']);
[, $d] = call('POST', "$base/admin/masterclasses", $mcDraft, $jar);
[, $list] = call('GET', "$base/masterclasses", null, $anon);
check('draft hidden from public list', count($list) === $initialMcCount + 2);
[$c] = call('GET', "$base/masterclasses/" . $d['id'], null, $anon);
check('draft hidden from public detail -> 404', $c === 404, (string) $c);
[$c, $j] = call('GET', "$base/masterclasses/" . $a['slug'], null, $anon);
check('detail by slug', $c === 200 && $j['id'] === $idA, (string) $c);

$upd = array_merge($mc, ['title' => ['en' => 'Test Session Renamed', 'bn' => ''], 'capacity' => 25]);
[$c, $j] = call('PUT', "$base/admin/masterclasses/$idA", $upd, $jar);
check('update', $c === 200 && $j['title']['en'] === 'Test Session Renamed' && $j['capacity'] === 25, (string) $c);
[$c] = call('PATCH', "$base/admin/masterclasses/$idA/status", ['status' => 'registration_closed'], $jar);
check('set status -> 204', $c === 204, (string) $c);

[$c, $spk] = call('POST', "$base/admin/speakers", ['name' => 'Spk To Delete', 'designation' => 'D', 'institution' => 'I', 'bio' => ['en' => 'b', 'bn' => '']], $jar);
check('create speaker', $c === 201 && isset($spk['id']), (string) $c);
$spkId = $spk['id'] ?? '0';
[$c, $j] = call('GET', "$base/speakers", null, $anon);
check('list speakers', $c === 200 && count($j) >= $initialSpkCount + 1, (string) $c);
[$c] = call('DELETE', "$base/admin/speakers/$spkId", null, $jar);
check('delete speaker -> 204', $c === 204, (string) $c);
[$c] = call('DELETE', "$base/admin/speakers/$spkId", null, $jar);
check('second delete speaker -> 404', $c === 404, (string) $c);


[$c] = call('DELETE', "$base/admin/masterclasses/abc", null, $jar);
check('delete invalid id -> 404', $c === 404, (string) $c);
[$c] = call('DELETE', "$base/admin/masterclasses/999999", null, $jar);
check('delete unknown id -> 404', $c === 404, (string) $c);

if (getenv('TEST_PDO_DSN')) {
    // Simulate an existing registration to prove delete is blocked.
    $pdo = new PDO(getenv('TEST_PDO_DSN'));
    $pdo->exec("INSERT INTO users (full_name, email, password_hash, created_at, updated_at) VALUES ('U','u@x.y','x','2026-01-01','2026-01-01')");
    $pdo->exec("INSERT INTO registrations (user_id, masterclass_id, created_at, updated_at) VALUES (1, $idB, '2026-01-01','2026-01-01')");
    [$c, $j] = call('DELETE', "$base/admin/masterclasses/$idB", null, $jar);
    check('delete with registrations -> 409', $c === 409 && ($j['code'] ?? '') === 'has_registrations', (string) $c);
}

[$c] = call('DELETE', "$base/admin/masterclasses/$idA", null, $jar);
check('delete -> 204', $c === 204, (string) $c);
[, $list] = call('GET', "$base/masterclasses", null, $anon);
$titles = array_column($list, 'id');
check('deleted session gone from public list', !in_array($idA, $titles, true));
[, $all] = call('GET', "$base/admin/masterclasses", null, $jar);
check('deleted session gone from admin list', !in_array($idA, array_column($all, 'id'), true));
[$c] = call('DELETE', "$base/admin/masterclasses/$idA", null, $jar);
check('second delete -> 404', $c === 404, (string) $c);

[$c] = call('POST', "$base/auth/logout", null, $jar);
check('logout -> 204', $c === 204, (string) $c);
[$c] = call('DELETE', "$base/admin/masterclasses/$idB", null, $jar);
check('delete after logout -> 401', $c === 401, (string) $c);

// Throttling: repeated bad logins are rate limited.
$last = 0;
for ($i = 0; $i < 7; $i++) {
    [$last] = call('POST', "$base/auth/admin/login", ['email' => 'nobody@test.local', 'password' => 'wrong-password-x'], $anon);
}
check('login throttled -> 429', $last === 429, (string) $last);

// Clean up throttled attempts so other tests or developer requests from this IP are not blocked
if (file_exists(__DIR__ . '/clear_throttle.php')) {
    include __DIR__ . '/clear_throttle.php';
}

echo $fails ? "\n$fails FAILED\n" : "\nAll passed\n";
exit($fails ? 1 : 0);


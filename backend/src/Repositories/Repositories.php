<?php
declare(strict_types=1);

namespace Fundly\Repositories;

use Fundly\Support\Db;
use Fundly\Support\HttpException;
use Fundly\Support\Validator;
use PDO;

final class SpeakerRepository
{
    /** @return array<int,array<string,mixed>> */
    public static function all(): array
    {
        $rows = Db::pdo()->query('SELECT * FROM speakers ORDER BY name')->fetchAll();
        return array_map([self::class, 'map'], $rows);
    }

    public static function exists(int $id): bool
    {
        $st = Db::pdo()->prepare('SELECT 1 FROM speakers WHERE id = ?');
        $st->execute([$id]);
        return (bool) $st->fetchColumn();
    }

    public static function delete(int $id): void
    {
        $pdo = Db::pdo();
        $st = $pdo->prepare('DELETE FROM speakers WHERE id = ?');
        $st->execute([$id]);
        if ($st->rowCount() === 0) {
            throw new HttpException(404, 'not_found', 'Speaker not found.');
        }
    }

    /** @param array<string,mixed> $v @return array<string,mixed> */
    public static function save(?int $id, array $v): array
    {
        $pdo = Db::pdo();
        $now = Db::now();
        $args = [$v['name'], $v['designation'], $v['institution'], $v['bio']['en'], $v['bio']['bn'], $v['photo'] !== '' ? $v['photo'] : null, $now];
        if ($id === null) {
            $pdo->prepare('INSERT INTO speakers (name, designation, institution, bio_en, bio_bn, photo_path, updated_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
                ->execute([...$args, $now]);
            $id = (int) $pdo->lastInsertId();
        } else {
            $st = $pdo->prepare('UPDATE speakers SET name = ?, designation = ?, institution = ?, bio_en = ?, bio_bn = ?, photo_path = ?, updated_at = ? WHERE id = ?');
            $st->execute([...$args, $id]);
            if (!self::exists($id)) {
                throw new HttpException(404, 'not_found', 'Speaker not found.');
            }
        }
        $st = $pdo->prepare('SELECT * FROM speakers WHERE id = ?');
        $st->execute([$id]);
        return self::map($st->fetch());
    }

    /** @param array<string,mixed> $r @return array<string,mixed> */
    private static function map(array $r): array
    {
        $out = [
            'id' => (string) $r['id'],
            'name' => $r['name'],
            'designation' => $r['designation'],
            'institution' => $r['institution'],
            'bio' => ['en' => (string) $r['bio_en'], 'bn' => (string) $r['bio_bn']],
        ];
        if (!empty($r['photo_path'])) {
            $out['photo'] = $r['photo_path'];
        }
        return $out;
    }
}

final class MasterclassRepository
{
    private const SELECT = 'SELECT m.*, (SELECT COUNT(*) FROM registrations r WHERE r.masterclass_id = m.id AND r.status <> \'cancelled\') AS seats_taken FROM masterclasses m';

    /** @return array<int,array<string,mixed>> */
    public static function list(bool $includeDrafts): array
    {
        $sql = self::SELECT . ($includeDrafts ? '' : " WHERE m.status <> 'draft'") . ' ORDER BY (m.event_date IS NULL), m.event_date, m.start_time, m.id';
        return array_map([self::class, 'map'], Db::pdo()->query($sql)->fetchAll());
    }

    /** Looks up by numeric id, or by slug when the identifier is not numeric. @return array<string,mixed>|null */
    public static function find(string $idOrSlug, bool $includeDrafts): ?array
    {
        $numeric = Validator::isId($idOrSlug);
        $st = Db::pdo()->prepare(self::SELECT . ' WHERE ' . ($numeric ? 'm.id = ?' : 'm.slug = ?') . ($includeDrafts ? '' : " AND m.status <> 'draft'"));
        $st->execute([$numeric ? (int) $idOrSlug : $idOrSlug]);
        $row = $st->fetch();
        return $row ? self::map($row) : null;
    }

    /** @param array<string,mixed> $v @return array<string,mixed> */
    public static function create(array $v): array
    {
        self::assertSpeaker($v['speakerId']);
        $pdo = Db::pdo();
        $now = Db::now();
        $cols = self::columns($v);
        $cols['slug'] = self::uniqueSlug($v['title']['en']);
        $cols['created_at'] = $now;
        $cols['updated_at'] = $now;
        $sql = 'INSERT INTO masterclasses (' . implode(', ', array_keys($cols)) . ') VALUES (' . implode(', ', array_fill(0, count($cols), '?')) . ')';
        $pdo->prepare($sql)->execute(array_values($cols));
        return self::find((string) $pdo->lastInsertId(), true);
    }

    /** @param array<string,mixed> $v @return array<string,mixed> */
    public static function update(int $id, array $v): array
    {
        self::assertSpeaker($v['speakerId']);
        $cols = self::columns($v);
        $cols['updated_at'] = Db::now();
        $set = implode(', ', array_map(fn ($c) => "$c = ?", array_keys($cols)));
        $st = Db::pdo()->prepare("UPDATE masterclasses SET $set WHERE id = ?");
        $st->execute([...array_values($cols), $id]);
        $found = self::find((string) $id, true);
        if (!$found) {
            throw new HttpException(404, 'not_found', 'Masterclass not found.');
        }
        return $found;
    }

    public static function setStatus(int $id, string $status): void
    {
        $st = Db::pdo()->prepare('UPDATE masterclasses SET status = ?, updated_at = ? WHERE id = ?');
        $st->execute([$status, Db::now(), $id]);
        if (!self::find((string) $id, true)) {
            throw new HttpException(404, 'not_found', 'Masterclass not found.');
        }
    }

    /** Deletes a masterclass unless registrations reference it. */
    public static function delete(int $id): void
    {
        $pdo = Db::pdo();
        $pdo->beginTransaction();
        try {
            $st = $pdo->prepare('SELECT COUNT(*) FROM registrations WHERE masterclass_id = ?');
            $st->execute([$id]);
            if ((int) $st->fetchColumn() > 0) {
                throw new HttpException(409, 'has_registrations', 'This masterclass has registrations and cannot be deleted.');
            }
            $st = $pdo->prepare('DELETE FROM masterclasses WHERE id = ?');
            $st->execute([$id]);
            if ($st->rowCount() === 0) {
                throw new HttpException(404, 'not_found', 'Masterclass not found.');
            }
            $pdo->commit();
        } catch (\Throwable $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            // A registration inserted concurrently trips the RESTRICT foreign key.
            if ($e instanceof \PDOException && in_array((string) $e->getCode(), ['23000', '23503'], true)) {
                throw new HttpException(409, 'has_registrations', 'This masterclass has registrations and cannot be deleted.');
            }
            throw $e;
        }
    }

    private static function assertSpeaker(?int $id): void
    {
        if ($id !== null && !SpeakerRepository::exists($id)) {
            throw new HttpException(422, 'validation', 'Please check the highlighted fields.', ['speakerId' => 'Speaker not found.']);
        }
    }

    /** @param array<string,mixed> $v @return array<string,mixed> */
    private static function columns(array $v): array
    {
        $nul = fn (string $s) => $s === '' ? null : $s;
        return [
            'title_en' => $v['title']['en'], 'title_bn' => $v['title']['bn'],
            'topic_en' => $v['topic']['en'], 'topic_bn' => $v['topic']['bn'],
            'summary_en' => $v['summary']['en'], 'summary_bn' => $v['summary']['bn'],
            'description_en' => $v['description']['en'], 'description_bn' => $v['description']['bn'],
            'learn_json' => json_encode($v['learn'], JSON_UNESCAPED_UNICODE),
            'event_date' => $nul($v['date']), 'start_time' => $v['startTime'], 'end_time' => $v['endTime'],
            'venue_en' => $v['venue']['en'], 'venue_bn' => $v['venue']['bn'],
            'capacity' => $v['capacity'], 'registration_deadline' => $nul($v['registrationDeadline']),
            'fee' => $v['fee'], 'status' => $v['status'], 'speaker_id' => $v['speakerId'],
            'cover_path' => $nul($v['cover']), 'cover_srcset' => $nul($v['coverSrcSet']),
            'cover_alt_en' => $v['coverAlt']['en'] ?? null, 'cover_alt_bn' => $v['coverAlt']['bn'] ?? null,
            'cover_credit_name' => $v['coverCredit']['name'] ?? null, 'cover_credit_url' => $v['coverCredit']['url'] ?? null,
            'cover_tone' => $v['coverTone'],
        ];
    }

    private static function uniqueSlug(string $title): string
    {
        $base = trim(preg_replace('/[^a-z0-9]+/', '-', strtolower($title)) ?? '', '-');
        $base = substr($base !== '' ? $base : 'masterclass', 0, 150);
        $st = Db::pdo()->prepare('SELECT COUNT(*) FROM masterclasses WHERE slug = ?');
        for ($i = 0, $slug = $base; ; $i++, $slug = $base . '-' . ($i + 1)) {
            $st->execute([$slug]);
            if ((int) $st->fetchColumn() === 0) {
                return $slug;
            }
        }
    }

    /** @param array<string,mixed> $r @return array<string,mixed> */
    private static function map(array $r): array
    {
        $out = [
            'id' => (string) $r['id'],
            'slug' => $r['slug'],
            'title' => ['en' => $r['title_en'], 'bn' => $r['title_bn']],
            'topic' => ['en' => $r['topic_en'], 'bn' => $r['topic_bn']],
            'summary' => ['en' => (string) $r['summary_en'], 'bn' => (string) $r['summary_bn']],
            'description' => ['en' => (string) $r['description_en'], 'bn' => (string) $r['description_bn']],
            'learn' => json_decode((string) $r['learn_json'], true) ?: [],
            'date' => (string) $r['event_date'],
            'startTime' => $r['start_time'],
            'endTime' => $r['end_time'],
            'venue' => ['en' => $r['venue_en'], 'bn' => $r['venue_bn']],
            'capacity' => (int) $r['capacity'],
            'seatsTaken' => (int) $r['seats_taken'],
            'registrationDeadline' => (string) $r['registration_deadline'],
            'fee' => (float) $r['fee'],
            'status' => $r['status'],
            'speakerId' => $r['speaker_id'] === null ? '' : (string) $r['speaker_id'],
            'coverTone' => $r['cover_tone'],
        ];
        if (!empty($r['cover_path'])) {
            $out['cover'] = $r['cover_path'];
        }
        if (!empty($r['cover_srcset'])) {
            $out['coverSrcSet'] = $r['cover_srcset'];
        }
        if (!empty($r['cover_alt_en']) || !empty($r['cover_alt_bn'])) {
            $out['coverAlt'] = ['en' => (string) $r['cover_alt_en'], 'bn' => (string) $r['cover_alt_bn']];
        }
        if (!empty($r['cover_credit_name'])) {
            $out['coverCredit'] = ['name' => $r['cover_credit_name'], 'url' => (string) $r['cover_credit_url']];
        }
        return $out;
    }
}

final class BusinessProfileRepository
{
    /** @return array<string,mixed>|null */
    public static function findByUserId(int $userId): ?array
    {
        $st = Db::pdo()->prepare('SELECT * FROM business_profiles WHERE user_id = ?');
        $st->execute([$userId]);
        $row = $st->fetch();
        return $row ? self::map($row) : null;
    }

    /** @param array<string,mixed> $v @return array<string,mixed> */
    public static function save(int $userId, array $v): array
    {
        $pdo = Db::pdo();
        $now = Db::now();

        $existing = self::findByUserId($userId);
        if ($existing) {
            $st = $pdo->prepare(
                'UPDATE business_profiles SET business_name = ?, business_type = ?, industry = ?, location = ?, business_age = ?, ownership_type = ?, owner_name = ?, email = ?, updated_at = ? WHERE user_id = ?'
            );
            $st->execute([
                $v['businessName'], $v['businessType'], $v['industry'], $v['location'],
                $v['businessAge'], $v['ownershipType'], $v['ownerName'], $v['email'], $now, $userId
            ]);
        } else {
            $st = $pdo->prepare(
                'INSERT INTO business_profiles (user_id, business_name, business_type, industry, location, business_age, ownership_type, owner_name, email, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
            );
            $st->execute([
                $userId, $v['businessName'], $v['businessType'], $v['industry'], $v['location'],
                $v['businessAge'], $v['ownershipType'], $v['ownerName'], $v['email'], $now, $now
            ]);
        }

        return self::findByUserId($userId);
    }

    /** @param array<string,mixed> $r @return array<string,mixed> */
    public static function map(array $r): array
    {
        return [
            'id' => (string) $r['id'],
            'userId' => (string) $r['user_id'],
            'businessName' => $r['business_name'],
            'businessType' => $r['business_type'],
            'industry' => $r['industry'],
            'location' => $r['location'],
            'businessAge' => $r['business_age'],
            'ownershipType' => $r['ownership_type'],
            'ownerName' => $r['owner_name'],
            'email' => $r['email'],
            'updatedAt' => $r['updated_at'],
        ];
    }
}

final class RegistrationRepository
{
    /** @param array<string,mixed> $v @return array<string,mixed> */
    public static function create(int $userId, array $v): array
    {
        $pdo = Db::pdo();
        $pdo->beginTransaction();
        try {
            $mid = (int) $v['masterclassId'];
            $st = $pdo->prepare('SELECT id, capacity, fee, status, registration_deadline FROM masterclasses WHERE id = ?');
            $st->execute([$mid]);
            $mc = $st->fetch();
            if (!$mc) {
                throw new HttpException(404, 'not_found', 'Masterclass not found.');
            }

            if (!in_array($mc['status'], ['published', 'registration_open'], true)) {
                throw new HttpException(409, 'registration_closed', 'Registration is closed for this session.');
            }

            if (!empty($mc['registration_deadline']) && $mc['registration_deadline'] < gmdate('Y-m-d')) {
                throw new HttpException(409, 'deadline_passed', 'Registration deadline has passed.');
            }

            $st = $pdo->prepare('SELECT COUNT(*) FROM registrations WHERE masterclass_id = ? AND status <> \'cancelled\'');
            $st->execute([$mid]);
            $seatsTaken = (int) $st->fetchColumn();
            if ($mc['capacity'] > 0 && $seatsTaken >= (int) $mc['capacity']) {
                throw new HttpException(409, 'masterclass_full', 'This masterclass is at capacity.');
            }

            $st = $pdo->prepare('SELECT id FROM registrations WHERE user_id = ? AND masterclass_id = ? AND status <> \'cancelled\'');
            $st->execute([$userId, $mid]);
            if ($st->fetchColumn()) {
                throw new HttpException(409, 'already_registered', 'You are already registered for this masterclass.');
            }

            // Generate unique registration code: FL-XXXXXX
            $code = 'FL-' . strtoupper(substr(bin2hex(random_bytes(3)), 0, 6));
            $fee = (float) $mc['fee'];
            $status = $fee > 0 ? 'pending_payment' : 'confirmed';
            $payStatus = $fee > 0 ? 'pending' : 'not_required';
            $now = Db::now();

            $sql = 'INSERT INTO registrations (user_id, masterclass_id, code, name, email, business_name, industry, business_type, financing_intent, financing_purpose, financing_amount_range, status, payment_status, attendance_status, amount, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, \'unmarked\', ?, ?, ?)';
            $pdo->prepare($sql)->execute([
                $userId, $mid, $code, $v['name'], $v['email'], $v['businessName'],
                $v['industry'], $v['businessType'], $v['financingIntent'],
                $v['purpose'] ?? null, $v['amountRange'] ?? null,
                $status, $payStatus, $fee, $now, $now
            ]);
            $regId = (int) $pdo->lastInsertId();

            $pdo->commit();
            return self::findById($regId, $userId);
        } catch (\Throwable $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            throw $e;
        }
    }

    /** @return array<int,array<string,mixed>> */
    public static function listByUser(int $userId): array
    {
        $st = Db::pdo()->prepare('SELECT * FROM registrations WHERE user_id = ? ORDER BY id DESC');
        $st->execute([$userId]);
        return array_map([self::class, 'map'], $st->fetchAll());
    }

    /** @return array<string,mixed>|null */
    public static function findById(int|string $id, ?int $userId = null): ?array
    {
        $pdo = Db::pdo();
        $isCode = str_starts_with((string) $id, 'FL-');
        $st = $pdo->prepare('SELECT * FROM registrations WHERE ' . ($isCode ? 'code = ?' : 'id = ?'));
        $st->execute([$isCode ? (string) $id : (int) $id]);
        $row = $st->fetch();
        if (!$row) {
            return null;
        }
        if ($userId !== null && (int) $row['user_id'] !== $userId) {
            throw new HttpException(403, 'forbidden', 'Access denied.');
        }
        return self::map($row);
    }

    public static function cancel(int|string $id, int $userId): void
    {
        $reg = self::findById($id, $userId);
        if (!$reg) {
            throw new HttpException(404, 'not_found', 'Registration not found.');
        }
        $pdo = Db::pdo();
        $pdo->prepare('UPDATE registrations SET status = \'cancelled\', updated_at = ? WHERE id = ?')->execute([Db::now(), $reg['rawId']]);
    }

    /** @param array<string,mixed> $r @return array<string,mixed> */
    public static function map(array $r): array
    {
        $id = !empty($r['code']) ? $r['code'] : 'FL-' . str_pad((string) $r['id'], 6, '0', STR_PAD_LEFT);
        return [
            'id' => $id,
            'rawId' => (int) $r['id'],
            'userId' => (string) $r['user_id'],
            'masterclassId' => (string) $r['masterclass_id'],
            'name' => $r['name'],
            'email' => $r['email'],
            'businessName' => $r['business_name'],
            'industry' => $r['industry'],
            'businessType' => $r['business_type'],
            'financingIntent' => $r['financing_intent'],
            'purpose' => $r['financing_purpose'] ?? null,
            'amountRange' => $r['financing_amount_range'] ?? null,
            'status' => $r['status'],
            'paymentStatus' => $r['payment_status'],
            'amount' => (float) $r['amount'],
            'createdAt' => $r['created_at'],
        ];
    }
}

final class PaymentRepository
{
    /** @return array<string,mixed> */
    public static function create(string $registrationId, int $userId): array
    {
        $reg = RegistrationRepository::findById($registrationId, $userId);
        if (!$reg) {
            throw new HttpException(404, 'not_found', 'Registration not found.');
        }

        $pdo = Db::pdo();
        $now = Db::now();
        $amount = (float) $reg['amount'];

        if ($amount <= 0 || $reg['paymentStatus'] === 'paid') {
            return ['status' => 'paid', 'configured' => false, 'message' => 'No payment required.'];
        }

        // Check bKash merchant configuration
        $appKey = \Fundly\Support\Env::get('BKASH_APP_KEY');
        $isConfigured = !empty($appKey);

        $paymentId = 'PAY_' . strtoupper(bin2hex(random_bytes(6)));
        $st = $pdo->prepare('INSERT INTO payments (registration_id, user_id, amount, currency, provider, status, payment_id, created_at, updated_at) VALUES (?, ?, ?, \'BDT\', \'bkash\', \'pending\', ?, ?, ?)');
        $st->execute([$reg['rawId'], $userId, $amount, $paymentId, $now, $now]);

        return [
            'paymentId' => $paymentId,
            'registrationId' => $reg['id'],
            'amount' => $amount,
            'currency' => 'BDT',
            'status' => 'pending',
            'configured' => $isConfigured,
            'paymentUrl' => $isConfigured ? 'https://scripts.sandbox.bka.sh/checkout?paymentID=' . $paymentId : null,
        ];
    }

    /** @return array<string,mixed> */
    public static function verify(string $paymentId, ?string $trxId = null): array
    {
        $pdo = Db::pdo();
        $st = $pdo->prepare('SELECT p.*, r.id AS reg_id FROM payments p JOIN registrations r ON r.id = p.registration_id WHERE p.payment_id = ?');
        $st->execute([$paymentId]);
        $row = $st->fetch();
        if (!$row) {
            throw new HttpException(404, 'not_found', 'Payment not found.');
        }

        $now = Db::now();
        $trx = $trxId ?: 'TRX_' . strtoupper(bin2hex(random_bytes(5)));

        $pdo->beginTransaction();
        try {
            $pdo->prepare('UPDATE payments SET status = \'paid\', trx_id = ?, updated_at = ? WHERE id = ?')->execute([$trx, $now, $row['id']]);
            $pdo->prepare('UPDATE registrations SET payment_status = \'paid\', status = \'confirmed\', updated_at = ? WHERE id = ?')->execute([$now, $row['registration_id']]);
            $pdo->commit();
        } catch (\Throwable $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            throw $e;
        }

        return ['status' => 'paid', 'paymentId' => $paymentId, 'trxId' => $trx];
    }
}

final class EligibilityRepository
{
    /** @return array<int,array<string,mixed>> */
    public static function listQuestions(bool $activeOnly = true): array
    {
        $sql = 'SELECT * FROM questions' . ($activeOnly ? ' WHERE active = 1' : '') . ' ORDER BY step, sort_order, id';
        $rows = Db::pdo()->query($sql)->fetchAll();
        return array_map([self::class, 'mapQuestion'], $rows);
    }

    /** @param array<string,mixed> $q @return array<string,mixed> */
    public static function saveQuestion(array $q): array
    {
        $pdo = Db::pdo();
        $id = (string) $q['id'];
        $step = (int) ($q['step'] ?? 1);
        $category = (string) ($q['category'] ?? 'business_information');
        $answerType = (string) ($q['answerType'] ?? 'single_choice');
        $textEn = (string) ($q['text']['en'] ?? '');
        $textBn = (string) ($q['text']['bn'] ?? '');
        $helpEn = isset($q['help']['en']) ? (string) $q['help']['en'] : null;
        $helpBn = isset($q['help']['bn']) ? (string) $q['help']['bn'] : null;
        $optionsJson = !empty($q['options']) ? json_encode($q['options']) : null;
        $required = !empty($q['required']) ? 1 : 0;
        $prefillFrom = !empty($q['prefillFrom']) ? (string) $q['prefillFrom'] : null;
        $showWhenJson = !empty($q['showWhen']) ? json_encode($q['showWhen']) : null;
        $weight = isset($q['weight']) && is_numeric($q['weight']) ? (float) $q['weight'] : null;
        $ruleRef = !empty($q['ruleRef']) ? (string) $q['ruleRef'] : null;
        $active = isset($q['active']) ? ($q['active'] ? 1 : 0) : 1;
        $now = date('Y-m-d H:i:s');

        $st = $pdo->prepare('
            INSERT INTO questions (id, step, category, answer_type, text_en, text_bn, help_en, help_bn, options_json, required, prefill_from, show_when_json, weight, rule_ref, active, sort_order, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 10, ?, ?)
            ON DUPLICATE KEY UPDATE
                step = VALUES(step),
                category = VALUES(category),
                answer_type = VALUES(answer_type),
                text_en = VALUES(text_en),
                text_bn = VALUES(text_bn),
                help_en = VALUES(help_en),
                help_bn = VALUES(help_bn),
                options_json = VALUES(options_json),
                required = VALUES(required),
                prefill_from = VALUES(prefill_from),
                show_when_json = VALUES(show_when_json),
                weight = VALUES(weight),
                rule_ref = VALUES(rule_ref),
                active = VALUES(active),
                updated_at = VALUES(updated_at)
        ');
        $st->execute([$id, $step, $category, $answerType, $textEn, $textBn, $helpEn, $helpBn, $optionsJson, $required, $prefillFrom, $showWhenJson, $weight, $ruleRef, $active, $now, $now]);

        $st2 = $pdo->prepare('SELECT * FROM questions WHERE id = ?');
        $st2->execute([$id]);
        return self::mapQuestion($st2->fetch());
    }

    public static function setQuestionActive(string $id, bool $active): void
    {
        $pdo = Db::pdo();
        $st = $pdo->prepare('UPDATE questions SET active = ?, updated_at = NOW() WHERE id = ?');
        $st->execute([$active ? 1 : 0, $id]);
    }

    /** @return array<string,mixed>|null */
    public static function getCurrentAssessment(int $userId): ?array
    {
        $st = Db::pdo()->prepare('SELECT * FROM assessments WHERE user_id = ? AND status = \'draft\' ORDER BY id DESC LIMIT 1');
        $st->execute([$userId]);
        $row = $st->fetch();
        return $row ? self::mapAssessment($row) : null;
    }

    /** @param array<string,string> $answers @return array<string,mixed> */
    public static function saveDraft(int $userId, array $answers, int $step): array
    {
        $pdo = Db::pdo();
        $now = Db::now();
        $existing = self::getCurrentAssessment($userId);

        if ($existing) {
            $st = $pdo->prepare('UPDATE assessments SET answers_json = ?, current_step = ?, updated_at = ? WHERE id = ?');
            $st->execute([json_encode($answers, JSON_UNESCAPED_UNICODE), $step, $now, $existing['id']]);
            $id = $existing['id'];
        } else {
            $st = $pdo->prepare('INSERT INTO assessments (user_id, status, answers_json, current_step, started_at, created_at, updated_at) VALUES (?, \'draft\', ?, ?, ?, ?, ?)');
            $st->execute([$userId, json_encode($answers, JSON_UNESCAPED_UNICODE), $step, $now, $now, $now]);
            $id = (int) $pdo->lastInsertId();
        }

        $st = $pdo->prepare('SELECT * FROM assessments WHERE id = ?');
        $st->execute([$id]);
        return self::mapAssessment($st->fetch());
    }

    /** @param array<string,string> $answers @return array<string,mixed> */
    public static function submit(int $userId, array $answers): array
    {
        $pdo = Db::pdo();
        $now = Db::now();

        // 1. Calculate Score across 6 categories
        $calc = self::calculateScores($answers);
        $score = $calc['totalScore'];
        $band = $calc['band'];

        $pdo->beginTransaction();
        try {
            // Save assessment as submitted
            $st = $pdo->prepare('INSERT INTO assessments (user_id, status, answers_json, current_step, started_at, submitted_at, created_at, updated_at) VALUES (?, \'submitted\', ?, 7, ?, ?, ?, ?)');
            $st->execute([$userId, json_encode($answers, JSON_UNESCAPED_UNICODE), $now, $now, $now, $now]);
            $assessmentId = (int) $pdo->lastInsertId();

            // Insert result record
            $st = $pdo->prepare('INSERT INTO assessment_results (assessment_id, user_id, score, band, strengths_json, improvements_json, next_step_json, category_scores_json, sample, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?)');
            $st->execute([
                $assessmentId, $userId, $score, $band,
                json_encode($calc['strengths'], JSON_UNESCAPED_UNICODE),
                json_encode($calc['improvements'], JSON_UNESCAPED_UNICODE),
                json_encode($calc['nextStep'], JSON_UNESCAPED_UNICODE),
                json_encode($calc['categoryScores'], JSON_UNESCAPED_UNICODE),
                $now
            ]);
            $resultId = (int) $pdo->lastInsertId();

            $pdo->commit();
            return self::findResultById($resultId);
        } catch (\Throwable $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            throw $e;
        }
    }

    /** @return array<string,mixed>|null */
    public static function getLatestResult(int $userId): ?array
    {
        $st = Db::pdo()->prepare('SELECT * FROM assessment_results WHERE user_id = ? ORDER BY id DESC LIMIT 1');
        $st->execute([$userId]);
        $row = $st->fetch();
        return $row ? self::mapResult($row) : null;
    }

    /** @return array<string,mixed>|null */
    public static function findResultById(int $id): ?array
    {
        $st = Db::pdo()->prepare('SELECT * FROM assessment_results WHERE id = ?');
        $st->execute([$id]);
        $row = $st->fetch();
        return $row ? self::mapResult($row) : null;
    }

    /** @param array<string,string> $answers @return array<string,mixed> */
    public static function calculateScores(array $answers): array
    {
        // 1. Documentation (20%)
        $tradeStatus = $answers['Q-CP-01'] ?? '';
        $tinStatus = $answers['Q-CP-02'] ?? '';
        $binStatus = $answers['Q-CP-03'] ?? '';
        $docScore = ($tradeStatus === 'valid' ? 50 : ($tradeStatus === 'expired' ? 20 : 0))
                  + ($tinStatus === 'available' ? 30 : 0)
                  + ($binStatus === 'available' || $binStatus === 'not_applicable' ? 20 : 0);

        // 2. Compliance (15%)
        $compScore = ($tradeStatus === 'valid' ? 60 : 0) + ($tinStatus === 'available' ? 40 : 0);

        // 3. Financial Health (25%)
        $profit = $answers['Q-FN-02'] ?? '';
        $records = $answers['Q-FR-01'] ?? '';
        $revenue = (float) ($answers['Q-FN-01'] ?? 0);
        $finScore = ($profit === 'profitable' ? 45 : ($profit === 'break_even' ? 30 : 15))
                  + ($records === 'complete' ? 45 : ($records === 'partial' ? 25 : 5))
                  + ($revenue > 0 ? 10 : 0);

        // 4. Banking Readiness (15%)
        $hasBank = ($answers['Q-BK-01'] ?? '') === 'yes';
        $bankReg = $answers['Q-BK-02'] ?? '';
        $bankStmt = $answers['Q-BK-03'] ?? '';
        $bankScore = ($hasBank ? 40 : 0)
                   + ($bankReg === 'yes' ? 30 : ($bankReg === 'partially' ? 15 : 0))
                   + ($bankStmt === 'yes' ? 30 : ($bankStmt === 'partial' ? 15 : 0));

        // 5. Debt Capacity (10%)
        $hasLoan = ($answers['Q-DB-01'] ?? '') === 'yes';
        $repay = $answers['Q-DB-04'] ?? '';
        $debtScore = !$hasLoan ? 90 : ($repay === 'on_time' ? 100 : ($repay === 'sometimes_late' ? 50 : 10));

        // 6. Funding Preparation (15%)
        $purpose = !empty($answers['Q-FD-02']) ? 60 : 30;
        $time = $answers['Q-FD-03'] ?? '';
        $timeScore = ($time === '1_3m' || $time === '3_6m') ? 40 : 30;
        $fundScore = $purpose + $timeScore;

        $catScores = [
            'documentation' => min(100, $docScore),
            'compliance' => min(100, $compScore),
            'financial_health' => min(100, $finScore),
            'banking_readiness' => min(100, $bankScore),
            'debt_capacity' => min(100, $debtScore),
            'funding_preparation' => min(100, $fundScore),
        ];

        // Fetch weights from database or defaults
        $rules = Db::pdo()->query('SELECT category_key, weight FROM scoring_rules')->fetchAll(\PDO::FETCH_KEY_PAIR);
        $wDoc = (float) ($rules['documentation'] ?? 20);
        $wComp = (float) ($rules['compliance'] ?? 15);
        $wFin = (float) ($rules['financial_health'] ?? 25);
        $wBank = (float) ($rules['banking_readiness'] ?? 15);
        $wDebt = (float) ($rules['debt_capacity'] ?? 10);
        $wFund = (float) ($rules['funding_preparation'] ?? 15);

        $weighted = ($catScores['documentation'] * $wDoc / 100)
                  + ($catScores['compliance'] * $wComp / 100)
                  + ($catScores['financial_health'] * $wFin / 100)
                  + ($catScores['banking_readiness'] * $wBank / 100)
                  + ($catScores['debt_capacity'] * $wDebt / 100)
                  + ($catScores['funding_preparation'] * $wFund / 100);

        $total = max(0, min(100, (int) round($weighted)));

        $band = 'low';
        if ($total >= 80) $band = 'stronger';
        elseif ($total >= 60) $band = 'moderate';
        elseif ($total >= 40) $band = 'needs_improvement';

        // Strengths & Improvements
        $strengths = [];
        $improvements = [];

        if ($tradeStatus === 'valid' && $tinStatus === 'available') {
            $strengths[] = ['en' => 'Trade licence and TIN compliance in order', 'bn' => 'ট্রেড লাইসেন্স ও টিআইএন ঠিক আছে'];
        } else {
            $improvements[] = ['en' => 'Renew or obtain valid Trade Licence & TIN', 'bn' => 'ট্রেড লাইসেন্স ও টিআইএন নিয়মিত করুন'];
        }

        if ($hasBank && $bankStmt === 'yes') {
            $strengths[] = ['en' => 'Business bank statements and formal transactions', 'bn' => 'ব্যবসায়িক ব্যাংক স্টেটমেন্ট ও নিয়মিত লেনদেন'];
        } else {
            $improvements[] = ['en' => 'Maintain regular transactions through a business bank account', 'bn' => 'ব্যবসায়িক ব্যাংক অ্যাকাউন্টের মাধ্যমে নিয়মিত লেনদেন করুন'];
        }

        if ($records === 'complete') {
            $strengths[] = ['en' => 'Complete and up-to-date bookkeeping', 'bn' => 'সম্পূর্ণ ও হালনাগাদ হিসাব সংরক্ষণ'];
        } else {
            $improvements[] = ['en' => 'Formalize regular accounting and sales records', 'bn' => 'নিয়মিত হিসাব ও বিক্রয় রেকর্ড সংরক্ষণ করুন'];
        }

        $nextStep = match ($band) {
            'stronger' => ['en' => 'Prepare loan proposal for bank review', 'bn' => 'ব্যাংক পর্যালোচনার জন্য ঋণ প্রস্তাব তৈরি করুন'],
            'moderate' => ['en' => 'Complete loan readiness documentation file', 'bn' => 'ঋণ প্রস্তুতির ডকুমেন্টেশন ফাইল সম্পূর্ণ করুন'],
            'needs_improvement' => ['en' => 'Strengthen banking records and trade compliance', 'bn' => 'ব্যাংকিং রেকর্ড ও ট্রেড কমপ্লায়েন্স মজবুত করুন'],
            default => ['en' => 'Attend Fundly Loan Lab to establish foundational records', 'bn' => 'প্রাথমিক আর্থিক রেকর্ড তৈরির জন্য ফান্ডলি লোন ল্যাবে অংশ নিন'],
        };

        return [
            'totalScore' => $total,
            'band' => $band,
            'categoryScores' => $catScores,
            'strengths' => $strengths,
            'improvements' => $improvements,
            'nextStep' => $nextStep,
        ];
    }

    /** @param array<string,mixed> $r @return array<string,mixed> */
    private static function mapQuestion(array $r): array
    {
        return [
            'id' => $r['id'],
            'step' => (int) $r['step'],
            'category' => $r['category'],
            'answerType' => $r['answer_type'],
            'text' => ['en' => $r['text_en'], 'bn' => $r['text_bn']],
            'help' => !empty($r['help_en']) ? ['en' => $r['help_en'], 'bn' => (string) $r['help_bn']] : null,
            'options' => !empty($r['options_json']) ? json_decode($r['options_json'], true) : null,
            'required' => (bool) $r['required'],
            'prefillFrom' => $r['prefill_from'],
            'showWhen' => !empty($r['show_when_json']) ? json_decode($r['show_when_json'], true) : null,
            'weight' => $r['weight'] !== null ? (float) $r['weight'] : null,
            'ruleRef' => $r['rule_ref'],
            'active' => (bool) $r['active'],
        ];
    }

    /** @param array<string,mixed> $r @return array<string,mixed> */
    private static function mapAssessment(array $r): array
    {
        return [
            'id' => (string) $r['id'],
            'userId' => (string) $r['user_id'],
            'status' => $r['status'],
            'answers' => json_decode((string) $r['answers_json'], true) ?: [],
            'currentStep' => (int) $r['current_step'],
            'startedAt' => $r['started_at'],
            'submittedAt' => $r['submitted_at'],
        ];
    }

    /** @param array<string,mixed> $r @return array<string,mixed> */
    private static function mapResult(array $r): array
    {
        return [
            'id' => (string) $r['id'],
            'assessmentId' => (string) $r['assessment_id'],
            'score' => (int) $r['score'],
            'band' => $r['band'],
            'strengths' => json_decode((string) $r['strengths_json'], true) ?: [],
            'improvements' => json_decode((string) $r['improvements_json'], true) ?: [],
            'nextStep' => json_decode((string) $r['next_step_json'], true) ?: ['en' => '', 'bn' => ''],
            'createdAt' => $r['created_at'],
            'sample' => (bool) $r['sample'],
        ];
    }
}

final class AdminRepository
{
    /** @return array<string,mixed> */
    public static function dashboard(): array
    {
        $pdo = Db::pdo();
        $totalSmes = (int) $pdo->query('SELECT COUNT(*) FROM users WHERE status = \'active\'')->fetchColumn();
        $totalRegs = (int) $pdo->query('SELECT COUNT(*) FROM registrations WHERE status <> \'cancelled\'')->fetchColumn();
        $paidRev = (float) $pdo->query('SELECT COALESCE(SUM(amount), 0) FROM registrations WHERE payment_status = \'paid\'')->fetchColumn();
        $totalChecks = (int) $pdo->query('SELECT COUNT(*) FROM assessment_results')->fetchColumn();

        // Readiness distribution
        $distRows = $pdo->query('SELECT band, COUNT(*) AS cnt FROM assessment_results GROUP BY band')->fetchAll(\PDO::FETCH_KEY_PAIR);
        $distribution = [
            'low' => (int) ($distRows['low'] ?? 0),
            'needs_improvement' => (int) ($distRows['needs_improvement'] ?? 0),
            'moderate' => (int) ($distRows['moderate'] ?? 0),
            'stronger' => (int) ($distRows['stronger'] ?? 0),
        ];

        return [
            'totalSmes' => $totalSmes,
            'totalRegistrations' => $totalRegs,
            'totalRevenue' => $paidRev,
            'readinessChecks' => $totalChecks,
            'distribution' => $distribution,
        ];
    }

    /** @return array<int,array<string,mixed>> */
    public static function listSmes(string $search = ''): array
    {
        $pdo = Db::pdo();
        $sql = 'SELECT u.id, u.full_name, u.email, u.created_at, bp.id AS bp_id, bp.business_name, bp.business_type, bp.industry, bp.location, bp.business_age, bp.ownership_type, bp.owner_name, bp.updated_at AS bp_updated, (SELECT ar.score FROM assessment_results ar WHERE ar.user_id = u.id ORDER BY ar.id DESC LIMIT 1) AS latest_score, (SELECT ar.band FROM assessment_results ar WHERE ar.user_id = u.id ORDER BY ar.id DESC LIMIT 1) AS latest_band FROM users u LEFT JOIN business_profiles bp ON bp.user_id = u.id WHERE u.status = \'active\'';

        if ($search !== '') {
            $sql .= ' AND (u.full_name LIKE ? OR u.email LIKE ? OR bp.business_name LIKE ?)';
            $st = $pdo->prepare($sql . ' ORDER BY u.id DESC');
            $term = "%$search%";
            $st->execute([$term, $term, $term]);
        } else {
            $st = $pdo->query($sql . ' ORDER BY u.id DESC');
        }

        $rows = $st->fetchAll();
        return array_map(function ($r) {
            return [
                'id' => (string) $r['id'],
                'joinedAt' => $r['created_at'],
                'financingIntent' => 'exploring',
                'latestScore' => $r['latest_score'] !== null ? (int) $r['latest_score'] : null,
                'latestBand' => $r['latest_band'] ?? null,
                'profile' => [
                    'id' => (string) ($r['bp_id'] ?? $r['id']),
                    'userId' => (string) $r['id'],
                    'businessName' => $r['business_name'] ?? $r['full_name'],
                    'businessType' => $r['business_type'] ?? 'sole_proprietorship',
                    'industry' => $r['industry'] ?? '',
                    'location' => $r['location'] ?? '',
                    'businessAge' => $r['business_age'] ?? '',
                    'ownershipType' => $r['ownership_type'] ?? '',
                    'ownerName' => $r['owner_name'] ?? $r['full_name'],
                    'email' => $r['email'],
                    'updatedAt' => $r['bp_updated'] ?? $r['created_at'],
                ],
            ];
        }, $rows);
    }

    /** @return array<string,mixed> */
    public static function smeDetail(int $id): array
    {
        $pdo = Db::pdo();
        $st = $pdo->prepare('SELECT * FROM users WHERE id = ?');
        $st->execute([$id]);
        $user = $st->fetch();
        if (!$user) {
            throw new HttpException(404, 'not_found', 'SME not found.');
        }

        $profile = BusinessProfileRepository::findByUserId($id);
        $registrations = RegistrationRepository::listByUser($id);
        $latestResult = EligibilityRepository::getLatestResult($id);

        return [
            'id' => (string) $user['id'],
            'name' => $user['full_name'],
            'email' => $user['email'],
            'joinedAt' => $user['created_at'],
            'profile' => $profile,
            'registrations' => $registrations,
            'latestResult' => $latestResult,
            'auditTimeline' => [],
        ];
    }

    /** @param array<string,string> $filters @return array<int,array<string,mixed>> */
    public static function listRegistrations(array $filters = []): array
    {
        $pdo = Db::pdo();
        $sql = 'SELECT r.*, m.title_en, m.event_date FROM registrations r JOIN masterclasses m ON m.id = r.masterclass_id WHERE 1=1';
        $params = [];

        if (!empty($filters['masterclassId'])) {
            $sql .= ' AND r.masterclass_id = ?';
            $params[] = (int) $filters['masterclassId'];
        }
        if (!empty($filters['paymentStatus'])) {
            $sql .= ' AND r.payment_status = ?';
            $params[] = $filters['paymentStatus'];
        }
        if (!empty($filters['attendanceStatus'])) {
            $sql .= ' AND r.attendance_status = ?';
            $params[] = $filters['attendanceStatus'];
        }
        if (!empty($filters['search'])) {
            $sql .= ' AND (r.name LIKE ? OR r.email LIKE ? OR r.business_name LIKE ? OR r.code LIKE ?)';
            $term = "%{$filters['search']}%";
            $params = array_merge($params, [$term, $term, $term, $term]);
        }

        $sql .= ' ORDER BY r.id DESC';
        $st = $pdo->prepare($sql);
        $st->execute($params);
        $rows = $st->fetchAll();

        return array_map(function ($r) {
            $map = RegistrationRepository::map($r);
            $map['masterclassTitle'] = $r['title_en'];
            $map['eventDate'] = $r['event_date'];
            $map['attendanceStatus'] = $r['attendance_status'];
            return $map;
        }, $rows);
    }

    public static function updateAttendance(int $id, string $status): void
    {
        $st = Db::pdo()->prepare('UPDATE registrations SET attendance_status = ?, updated_at = ? WHERE id = ?');
        $st->execute([$status, Db::now(), $id]);
    }

    public static function correctPayment(int $id, string $status, string $reason, int $adminId, string $ip): void
    {
        $pdo = Db::pdo();
        $now = Db::now();
        $pdo->beginTransaction();
        try {
            $st = $pdo->prepare('SELECT payment_status FROM registrations WHERE id = ?');
            $st->execute([$id]);
            $old = $st->fetchColumn();
            if ($old === false) {
                throw new HttpException(404, 'not_found', 'Registration not found.');
            }

            $pdo->prepare('UPDATE registrations SET payment_status = ?, updated_at = ? WHERE id = ?')->execute([$status, $now, $id]);
            Auth::audit($adminId, 'payment_correction', 'registration', $id, $ip);
            $pdo->commit();
        } catch (\Throwable $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            throw $e;
        }
    }

    /** @return array<int,array<string,mixed>> */
    public static function listResults(string $band = '', string $search = ''): array
    {
        $pdo = Db::pdo();
        $sql = 'SELECT ar.*, u.full_name, bp.business_name FROM assessment_results ar JOIN users u ON u.id = ar.user_id LEFT JOIN business_profiles bp ON bp.user_id = u.id WHERE 1=1';
        $params = [];
        if ($band !== '') {
            $sql .= ' AND ar.band = ?';
            $params[] = $band;
        }
        if ($search !== '') {
            $sql .= ' AND (u.full_name LIKE ? OR bp.business_name LIKE ?)';
            $term = "%$search%";
            $params[] = $term;
            $params[] = $term;
        }
        $sql .= ' ORDER BY ar.id DESC';
        $st = $pdo->prepare($sql);
        $st->execute($params);
        $rows = $st->fetchAll();

        return array_map(function ($r) {
            $improvements = json_decode((string) ($r['improvements_json'] ?? '[]'), true) ?: [];
            $strengths = json_decode((string) ($r['strengths_json'] ?? '[]'), true) ?: [];
            $nextStep = json_decode((string) ($r['next_step_json'] ?? '{}'), true) ?: ['en' => '', 'bn' => ''];

            return [
                'id' => (string) $r['id'],
                'assessmentId' => (string) ($r['assessment_id'] ?? $r['id']),
                'userId' => (string) $r['user_id'],
                'userName' => $r['full_name'],
                'businessName' => $r['business_name'] ?? $r['full_name'],
                'score' => (int) $r['score'],
                'band' => $r['band'],
                'strengths' => $strengths,
                'improvements' => $improvements,
                'nextStep' => $nextStep,
                'createdAt' => $r['created_at'],
                'sample' => (bool) ($r['sample'] ?? false),

                // Backward-compatibility fields
                'smeId' => (string) $r['user_id'],
                'owner' => $r['full_name'],
                'business' => $r['business_name'] ?? $r['full_name'],
                'date' => $r['created_at'],
                'topGaps' => array_column($improvements, 'en'),
                'financingNeed' => 'exploring',
                'amount' => 'BDT 10-25 lakh',
            ];
        }, $rows);

    }

    /** @return array<int,array<string,mixed>> */
    public static function listScoringRules(): array
    {
        $rows = Db::pdo()->query('SELECT * FROM scoring_rules ORDER BY category_key')->fetchAll();
        return array_map(function ($r) {
            return [
                'key' => $r['category_key'],
                'label' => ['en' => $r['label_en'], 'bn' => $r['label_bn']],
                'weight' => (float) $r['weight'],
            ];
        }, $rows);
    }

    /** @param array<string,float> $weights */
    public static function updateScoringRules(array $weights): void
    {
        $sum = array_sum($weights);
        if (abs($sum - 100.0) > 0.01) {
            throw new HttpException(422, 'validation', 'Weights must total 100%.');
        }
        $pdo = Db::pdo();
        $now = Db::now();
        $st = $pdo->prepare('UPDATE scoring_rules SET weight = ?, updated_at = ? WHERE category_key = ?');
        foreach ($weights as $k => $w) {
            $st->execute([(float) $w, $now, (string) $k]);
        }
    }
}


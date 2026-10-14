<?php
declare(strict_types=1);

namespace Fundly\Support;

/** Request validation for masterclass and speaker payloads. Throws a 422 listing every problem. */
final class Validator
{
    public const STATUSES = ['draft', 'published', 'registration_open', 'registration_closed', 'completed', 'cancelled'];
    private const TONES = ['leaf', 'sky', 'sand'];

    /** @param array<string,mixed> $in @return array<string,mixed> */
    public static function masterclass(array $in): array
    {
        $e = [];
        $title = self::localized($in['title'] ?? null, 'title', 255, $e, true);
        $topic = self::localized($in['topic'] ?? null, 'topic', 190, $e);
        $summary = self::localized($in['summary'] ?? null, 'summary', 1000, $e);
        $desc = self::localized($in['description'] ?? null, 'description', 10000, $e);
        $venue = self::localized($in['venue'] ?? null, 'venue', 255, $e);

        $learn = [];
        if (isset($in['learn'])) {
            if (!is_array($in['learn']) || count($in['learn']) > 20) {
                $e['learn'] = 'Invalid list.';
            } else {
                foreach ($in['learn'] as $item) {
                    $learn[] = self::localized($item, 'learn', 500, $e);
                }
            }
        }

        $date = self::date($in['date'] ?? '', 'date', $e);
        $deadline = self::date($in['registrationDeadline'] ?? '', 'registrationDeadline', $e);
        $start = self::time($in['startTime'] ?? '', 'startTime', $e);
        $end = self::time($in['endTime'] ?? '', 'endTime', $e);
        if ($start !== '' && $end !== '' && $end <= $start) {
            $e['endTime'] = 'End time must be after start time.';
        }

        $capacity = $in['capacity'] ?? 0;
        if (!is_numeric($capacity) || (int) $capacity != $capacity || $capacity < 0 || $capacity > 100000) {
            $e['capacity'] = 'Invalid capacity.';
        }
        $fee = $in['fee'] ?? 0;
        if (!is_numeric($fee) || $fee < 0 || $fee > 10000000) {
            $e['fee'] = 'Invalid fee.';
        }
        $status = $in['status'] ?? 'draft';
        if (!in_array($status, self::STATUSES, true)) {
            $e['status'] = 'Invalid status.';
        }
        $tone = $in['coverTone'] ?? 'leaf';
        if (!in_array($tone, self::TONES, true)) {
            $e['coverTone'] = 'Invalid tone.';
        }

        $speakerId = $in['speakerId'] ?? '';
        if ($speakerId !== '' && $speakerId !== null && !self::isId($speakerId)) {
            $e['speakerId'] = 'Invalid speaker.';
        }

        $cover = self::mediaUrl($in['cover'] ?? '', 'cover', $e);
        $srcset = $in['coverSrcSet'] ?? '';
        if (!is_string($srcset) || strlen($srcset) > 2000) {
            $e['coverSrcSet'] = 'Invalid value.';
        }
        $alt = isset($in['coverAlt']) ? self::localized($in['coverAlt'], 'coverAlt', 255, $e) : null;
        $credit = null;
        if (!empty($in['coverCredit'])) {
            $c = $in['coverCredit'];
            $name = is_array($c) && is_string($c['name'] ?? null) ? trim($c['name']) : '';
            $url = is_array($c) ? self::mediaUrl($c['url'] ?? '', 'coverCredit', $e, false) : '';
            $credit = ['name' => mb_substr($name, 0, 190), 'url' => $url];
        }

        if ($e) {
            throw new HttpException(422, 'validation', 'Please check the highlighted fields.', $e);
        }

        return [
            'title' => $title, 'topic' => $topic, 'summary' => $summary, 'description' => $desc, 'venue' => $venue,
            'learn' => $learn, 'date' => $date, 'registrationDeadline' => $deadline,
            'startTime' => $start, 'endTime' => $end, 'capacity' => (int) $capacity, 'fee' => round((float) $fee, 2),
            'status' => $status, 'coverTone' => $tone, 'speakerId' => $speakerId === '' || $speakerId === null ? null : (int) $speakerId,
            'cover' => $cover, 'coverSrcSet' => (string) $srcset, 'coverAlt' => $alt, 'coverCredit' => $credit,
        ];
    }

    /** @param array<string,mixed> $in @return array<string,mixed> */
    public static function speaker(array $in): array
    {
        $e = [];
        $name = is_string($in['name'] ?? null) ? trim($in['name']) : '';
        if ($name === '' || mb_strlen($name) > 160) {
            $e['name'] = 'Name is required.';
        }
        $designation = is_string($in['designation'] ?? null) ? trim($in['designation']) : '';
        $institution = is_string($in['institution'] ?? null) ? trim($in['institution']) : '';
        if (mb_strlen($designation) > 190 || mb_strlen($institution) > 190) {
            $e['designation'] = 'Too long.';
        }
        $bio = self::localized($in['bio'] ?? null, 'bio', 5000, $e);
        $photo = self::mediaUrl($in['photo'] ?? '', 'photo', $e);
        if ($e) {
            throw new HttpException(422, 'validation', 'Please check the highlighted fields.', $e);
        }
        return ['name' => $name, 'designation' => $designation, 'institution' => $institution, 'bio' => $bio, 'photo' => $photo];
    }

    public static function isId(mixed $v): bool
    {
        return (is_int($v) && $v > 0) || (is_string($v) && preg_match('/^[1-9][0-9]{0,17}$/', $v) === 1);
    }

    /** @param array<string,string> $e @return array{en:string,bn:string} */
    private static function localized(mixed $v, string $key, int $max, array &$e, bool $required = false): array
    {
        $out = ['en' => '', 'bn' => ''];
        if ($v === null || $v === '') {
            $v = [];
        }
        if (!is_array($v)) {
            $e[$key] = 'Invalid value.';
            return $out;
        }
        foreach (['en', 'bn'] as $lang) {
            $s = $v[$lang] ?? '';
            if (!is_string($s) || mb_strlen($s) > $max) {
                $e[$key] = 'Invalid or too long.';
                return $out;
            }
            $out[$lang] = trim($s);
        }
        if ($required && $out['en'] === '') {
            $e[$key] = 'Required.';
        }
        return $out;
    }

    /** @param array<string,string> $e */
    private static function date(mixed $v, string $key, array &$e): string
    {
        if ($v === '' || $v === null) {
            return '';
        }
        $d = is_string($v) ? \DateTime::createFromFormat('!Y-m-d', $v) : false;
        if (!$d || $d->format('Y-m-d') !== $v) {
            $e[$key] = 'Invalid date.';
            return '';
        }
        return $v;
    }

    /** @param array<string,string> $e */
    private static function time(mixed $v, string $key, array &$e): string
    {
        if ($v === '' || $v === null) {
            return '';
        }
        if (!is_string($v) || !preg_match('/^([01][0-9]|2[0-3]):[0-5][0-9]$/', $v)) {
            $e[$key] = 'Invalid time.';
            return '';
        }
        return $v;
    }

    /** Accepts only http(s) URLs or our own /uploads paths; blob:/data: and other schemes are rejected. */
    private static function mediaUrl(mixed $v, string $key, array &$e, bool $allowUploads = true): string
    {
        if ($v === '' || $v === null) {
            return '';
        }
        if (!is_string($v) || strlen($v) > 500
            || !(preg_match('#^https?://[^\s]+$#i', $v) || ($allowUploads && preg_match('#^/(?:[\w.-]+/)*[\w.-]+$#', $v)))) {
            $e[$key] = 'Invalid URL.';
            return '';
        }
        return $v;
    }

    /** @param array<string,mixed> $in @return array<string,mixed> */
    public static function businessProfile(array $in): array
    {
        $e = [];
        $name = is_string($in['businessName'] ?? null) ? trim($in['businessName']) : '';
        if ($name === '' || strlen($name) > 190) {
            $e['businessName'] = 'Please enter your business name.';
        }
        $types = ['sole_proprietorship', 'partnership', 'private_limited', 'other'];
        $type = is_string($in['businessType'] ?? null) && in_array($in['businessType'], $types, true) ? $in['businessType'] : 'sole_proprietorship';

        $ownerName = is_string($in['ownerName'] ?? null) ? trim($in['ownerName']) : '';
        $industry = is_string($in['industry'] ?? null) ? trim($in['industry']) : '';
        $location = is_string($in['location'] ?? null) ? trim($in['location']) : '';
        $businessAge = is_string($in['businessAge'] ?? null) ? trim($in['businessAge']) : '';
        $ownershipType = is_string($in['ownershipType'] ?? null) ? trim($in['ownershipType']) : '';
        $email = is_string($in['email'] ?? null) ? strtolower(trim($in['email'])) : '';

        if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $e['email'] = 'Invalid email address.';
        }

        if ($e) {
            throw new HttpException(422, 'validation', 'Please check the highlighted fields.', $e);
        }

        return [
            'businessName' => $name,
            'businessType' => $type,
            'ownerName' => $ownerName,
            'industry' => $industry,
            'location' => $location,
            'businessAge' => $businessAge,
            'ownershipType' => $ownershipType,
            'email' => $email,
        ];
    }

    /** @param array<string,mixed> $in @return array<string,mixed> */
    public static function registration(array $in): array
    {
        $e = [];
        $mid = isset($in['masterclassId']) && !is_array($in['masterclassId']) ? trim((string) $in['masterclassId']) : '';
        if ($mid === '') {
            $e['masterclassId'] = 'Masterclass is required.';
        }
        $name = is_string($in['name'] ?? null) ? trim($in['name']) : '';
        if ($name === '') {
            $e['name'] = 'Name is required.';
        }
        $email = is_string($in['email'] ?? null) ? strtolower(trim($in['email'])) : '';
        if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $e['email'] = 'Valid email is required.';
        }
        $bName = is_string($in['businessName'] ?? null) ? trim($in['businessName']) : '';
        if ($bName === '') {
            $e['businessName'] = 'Business name is required.';
        }
        $types = ['sole_proprietorship', 'partnership', 'private_limited', 'other'];
        $bType = is_string($in['businessType'] ?? null) && in_array($in['businessType'], $types, true) ? $in['businessType'] : 'sole_proprietorship';

        $intents = ['yes', 'no', 'exploring'];
        $intent = is_string($in['financingIntent'] ?? null) && in_array($in['financingIntent'], $intents, true) ? $in['financingIntent'] : 'exploring';

        if ($e) {
            throw new HttpException(422, 'validation', 'Please check the highlighted fields.', $e);
        }

        return [
            'masterclassId' => $mid,
            'name' => $name,
            'email' => $email,
            'businessName' => $bName,
            'industry' => is_string($in['industry'] ?? null) ? trim($in['industry']) : '',
            'businessType' => $bType,
            'financingIntent' => $intent,
            'purpose' => is_string($in['purpose'] ?? null) ? trim($in['purpose']) : null,
            'amountRange' => is_string($in['amountRange'] ?? null) ? trim($in['amountRange']) : null,
        ];
    }

    /** @param array<string,mixed> $in @return array<string,mixed> */
    public static function paymentSubmission(array $in): array
    {
        $e = [];
        $methods = ['bkash', 'nagad', 'rocket', 'upay', 'bank_transfer', 'other'];
        $method = is_string($in['paymentMethod'] ?? null) ? strtolower(trim($in['paymentMethod'])) : '';
        if ($method === '' || !in_array($method, $methods, true)) {
            $e['paymentMethod'] = 'Please select a valid payment method.';
        }

        $sender = is_string($in['senderAccount'] ?? null) ? trim($in['senderAccount']) : '';
        if ($sender === '' || strlen($sender) < 4 || strlen($sender) > 80) {
            $e['senderAccount'] = 'Valid sender mobile or account number is required.';
        }

        $trxId = is_string($in['trxId'] ?? null) ? strtoupper(trim($in['trxId'])) : '';
        if ($trxId === '' || strlen($trxId) < 3 || strlen($trxId) > 120) {
            $e['trxId'] = 'Transaction ID or reference number is required.';
        }

        $amount = $in['amount'] ?? 0;
        if (!is_numeric($amount) || (float) $amount <= 0) {
            $e['amount'] = 'Amount must be greater than 0.';
        }

        if (empty($in['accuracyConfirmed']) && empty($in['confirmAccurate'])) {
            $e['accuracyConfirmed'] = 'You must confirm that the submitted details are accurate.';
        }

        if ($e) {
            throw new HttpException(422, 'validation', 'Please check the highlighted fields.', $e);
        }

        return [
            'paymentMethod' => $method,
            'senderAccount' => $sender,
            'trxId' => $trxId,
            'amount' => round((float) $amount, 2),
            'paidAt' => is_string($in['paidAt'] ?? null) && trim($in['paidAt']) !== '' ? trim($in['paidAt']) : null,
            'receiptPath' => is_string($in['receiptPath'] ?? null) && trim($in['receiptPath']) !== '' ? trim($in['receiptPath']) : null,
        ];
    }

    /** @param array<string,mixed> $in @return array<string,mixed> */
    public static function userRefundRequest(array $in): array
    {
        $e = [];
        $reason = is_string($in['reason'] ?? null) ? trim($in['reason']) : '';
        if ($reason === '' || strlen($reason) < 5) {
            $e['reason'] = 'Please provide a clear reason for the refund request.';
        }

        $amount = $in['amount'] ?? 0;
        if (!is_numeric($amount) || (float) $amount <= 0) {
            $e['amount'] = 'Refund amount must be greater than 0.';
        }

        $methods = ['bkash', 'nagad', 'rocket', 'upay', 'bank_transfer', 'other'];
        $method = is_string($in['refundMethod'] ?? null) ? strtolower(trim($in['refundMethod'])) : '';
        if ($method === '' || !in_array($method, $methods, true)) {
            $e['refundMethod'] = 'Please select a payout method.';
        }

        $dest = is_string($in['destinationAccount'] ?? null) ? trim($in['destinationAccount']) : '';
        if ($dest === '' || strlen($dest) < 4 || strlen($dest) > 80) {
            $e['destinationAccount'] = 'Valid destination mobile or account number is required.';
        }

        $holder = is_string($in['accountHolderName'] ?? null) ? trim($in['accountHolderName']) : '';
        if ($method === 'bank_transfer' && $holder === '') {
            $e['accountHolderName'] = 'Account holder name is required for bank transfer.';
        }

        if (isset($in['accuracyConfirmed']) && empty($in['accuracyConfirmed']) && empty($in['confirmAccurate'])) {
            $e['accuracyConfirmed'] = 'You must confirm that the refund information is accurate.';
        }

        if ($e) {
            throw new HttpException(422, 'validation', 'Please check the highlighted fields.', $e);
        }

        return [
            'reason' => $reason,
            'amount' => round((float) $amount, 2),
            'refundMethod' => $method,
            'destinationAccount' => $dest,
            'accountHolderName' => $holder !== '' ? $holder : null,
            'receiptPath' => is_string($in['receiptPath'] ?? null) && trim($in['receiptPath']) !== '' ? trim($in['receiptPath']) : null,
        ];
    }
}

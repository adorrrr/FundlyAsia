<?php
declare(strict_types=1);

namespace Fundly\Controllers;

use Fundly\Repositories\MasterclassRepository;
use Fundly\Repositories\SpeakerRepository;
use Fundly\Support\Auth;
use Fundly\Support\HttpException;
use Fundly\Support\Request;
use Fundly\Support\Response;
use Fundly\Support\Validator;

final class AuthController
{
    public static function signup(Request $req): void
    {
        $b = $req->json();
        $name = is_string($b['name'] ?? null) ? trim($b['name']) : '';
        $email = is_string($b['email'] ?? null) ? strtolower(trim($b['email'])) : '';
        $password = is_string($b['password'] ?? null) ? $b['password'] : '';

        $e = [];
        if ($name === '' || strlen($name) > 120) {
            $e['name'] = 'Please enter your full name.';
        }
        if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $e['email'] = 'Please enter a valid email address.';
        }
        if (strlen($password) < 8 || !preg_match('/[a-zA-Z]/', $password) || !preg_match('/[0-9]/', $password)) {
            $e['password'] = 'Password must be at least 8 characters and include a letter and a number.';
        }

        if ($e) {
            throw new HttpException(422, 'validation', 'Please check the highlighted fields.', $e);
        }

        $user = Auth::signupUser($name, $email, $password, $req->ip());
        Response::json($user, 201);
    }

    public static function login(Request $req): void
    {
        $b = $req->json();
        $email = is_string($b['email'] ?? null) ? strtolower(trim($b['email'])) : '';
        $password = is_string($b['password'] ?? null) ? $b['password'] : '';

        if ($email === '' || $password === '') {
            throw new HttpException(422, 'validation', 'Please enter your email and password.');
        }

        $user = Auth::loginUser($email, $password, $req->ip());
        Response::json($user);
    }

    public static function me(Request $req): void
    {
        Auth::startSession();
        if (!empty($_SESSION['admin_id'])) {
            Response::json(self::sessionUser(Auth::requireAdmin()));
        }
        if (!empty($_SESSION['user_id'])) {
            Response::json(Auth::requireUser());
        }
        throw new HttpException(401, 'unauthenticated', 'Not authenticated.');
    }

    public static function verifyOtp(Request $req): void
    {
        $b = $req->json();
        $email = is_string($b['email'] ?? null) ? strtolower(trim($b['email'])) : '';
        $code = is_string($b['code'] ?? null) ? trim($b['code']) : '';
        $purpose = is_string($b['purpose'] ?? null) ? trim($b['purpose']) : 'signup';

        if ($email === '' || $code === '') {
            throw new HttpException(422, 'validation', 'Email and verification code are required.');
        }

        Auth::verifyOtp($email, $code, $purpose, $req->ip());
        Response::json(['verified' => true]);
    }

    public static function resendOtp(Request $req): void
    {
        $b = $req->json();
        $email = is_string($b['email'] ?? null) ? strtolower(trim($b['email'])) : '';
        $purpose = is_string($b['purpose'] ?? null) ? trim($b['purpose']) : 'signup';

        if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new HttpException(422, 'validation', 'Valid email is required.');
        }

        Auth::generateOtp($email, $purpose);
        Response::json(['sent' => true]);
    }

    public static function cancelSignup(Request $req): void
    {
        $b = $req->json();
        $email = is_string($b['email'] ?? null) ? strtolower(trim($b['email'])) : '';
        if ($email !== '') {
            Auth::cancelSignup($email);
        }
        Response::json(['cancelled' => true]);
    }

    public static function forgotPassword(Request $req): void
    {
        $b = $req->json();
        $email = is_string($b['email'] ?? null) ? strtolower(trim($b['email'])) : '';

        if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new HttpException(422, 'validation', 'Valid email is required.');
        }

        $token = Auth::createPasswordReset($email);
        $res = ['sent' => true];
        if (\Fundly\Support\Env::get('APP_ENV') !== 'production') {
            $res['debugToken'] = $token;
        }
        Response::json($res);
    }

    public static function resetPassword(Request $req): void
    {
        $b = $req->json();
        $email = is_string($b['email'] ?? null) ? strtolower(trim($b['email'])) : '';
        $token = is_string($b['token'] ?? null) ? trim($b['token']) : '';
        $password = is_string($b['password'] ?? null) ? $b['password'] : '';

        if (strlen($password) < 8 || !preg_match('/[a-zA-Z]/', $password) || !preg_match('/[0-9]/', $password)) {
            throw new HttpException(422, 'validation', 'Password must be at least 8 characters and include a letter and a number.');
        }

        Auth::resetPassword($email, $token, $password);
        Response::json(['reset' => true]);
    }

    public static function adminLogin(Request $req): void
    {
        $b = $req->json();
        $email = is_string($b['email'] ?? null) ? strtolower(trim($b['email'])) : '';
        $password = is_string($b['password'] ?? null) ? $b['password'] : '';
        if ($email === '' || strlen($email) > 190 || $password === '' || strlen($password) > 1024) {
            throw new HttpException(422, 'validation', 'Enter your email and password.');
        }
        $admin = Auth::login($email, $password, $req->ip());
        Response::json(self::sessionUser($admin));
    }

    public static function adminMe(Request $req): void
    {
        Response::json(self::sessionUser(Auth::requireAdmin()));
    }

    public static function logout(Request $req): void
    {
        Auth::logout();
        Response::noContent();
    }

    /** @param array<string,mixed> $a @return array<string,mixed> */
    private static function sessionUser(array $a): array
    {
        return ['id' => (string) $a['id'], 'name' => $a['name'], 'email' => $a['email'], 'role' => 'admin', 'emailVerified' => true, 'hasBusinessProfile' => false];
    }
}

final class MasterclassController
{
    public static function listPublic(Request $req): void
    {
        Response::json(MasterclassRepository::list(false));
    }

    public static function showPublic(Request $req): void
    {
        $m = MasterclassRepository::find($req->params['id'], false);
        if (!$m) {
            throw new HttpException(404, 'not_found', 'Masterclass not found.');
        }
        Response::json($m);
    }

    public static function listAdmin(Request $req): void
    {
        Auth::requireAdmin();
        Response::json(MasterclassRepository::list(true));
    }

    public static function showAdmin(Request $req): void
    {
        Auth::requireAdmin();
        $m = MasterclassRepository::find($req->params['id'], true);
        if (!$m) {
            throw new HttpException(404, 'not_found', 'Masterclass not found.');
        }
        Response::json($m);
    }

    public static function create(Request $req): void
    {
        $admin = Auth::requireAdmin();
        $m = MasterclassRepository::create(Validator::masterclass($req->json()));
        Auth::audit((int) $admin['id'], 'masterclass.create', 'masterclass', (int) $m['id'], $req->ip());
        Response::json($m, 201);
    }

    public static function update(Request $req): void
    {
        $admin = Auth::requireAdmin();
        $id = self::id($req);
        $m = MasterclassRepository::update($id, Validator::masterclass($req->json()));
        Auth::audit((int) $admin['id'], 'masterclass.update', 'masterclass', $id, $req->ip());
        Response::json($m);
    }

    public static function setStatus(Request $req): void
    {
        $admin = Auth::requireAdmin();
        $id = self::id($req);
        $status = $req->json()['status'] ?? null;
        if (!is_string($status) || !in_array($status, Validator::STATUSES, true)) {
            throw new HttpException(422, 'validation', 'Invalid status.');
        }
        MasterclassRepository::setStatus($id, $status);
        Auth::audit((int) $admin['id'], 'masterclass.status:' . $status, 'masterclass', $id, $req->ip());
        Response::noContent();
    }

    public static function delete(Request $req): void
    {
        $admin = Auth::requireAdmin();
        $id = self::id($req);
        MasterclassRepository::delete($id);
        Auth::audit((int) $admin['id'], 'masterclass.delete', 'masterclass', $id, $req->ip());
        Response::noContent();
    }

    private static function id(Request $req): int
    {
        if (!Validator::isId($req->params['id'])) {
            throw new HttpException(404, 'not_found', 'Masterclass not found.');
        }
        return (int) $req->params['id'];
    }
}

final class SpeakerController
{
    public static function list(Request $req): void
    {
        Response::json(SpeakerRepository::all());
    }

    public static function create(Request $req): void
    {
        $admin = Auth::requireAdmin();
        $s = SpeakerRepository::save(null, Validator::speaker($req->json()));
        Auth::audit((int) $admin['id'], 'speaker.create', 'speaker', (int) $s['id'], $req->ip());
        Response::json($s, 201);
    }

    public static function update(Request $req): void
    {
        $admin = Auth::requireAdmin();
        if (!Validator::isId($req->params['id'])) {
            throw new HttpException(404, 'not_found', 'Speaker not found.');
        }
        $id = (int) $req->params['id'];
        $s = SpeakerRepository::save($id, Validator::speaker($req->json()));
        Auth::audit((int) $admin['id'], 'speaker.update', 'speaker', $id, $req->ip());
        Response::json($s);
    }

    public static function delete(Request $req): void
    {
        $admin = Auth::requireAdmin();
        if (!Validator::isId($req->params['id'])) {
            throw new HttpException(404, 'not_found', 'Speaker not found.');
        }
        $id = (int) $req->params['id'];
        SpeakerRepository::delete($id);
        Auth::audit((int) $admin['id'], 'speaker.delete', 'speaker', $id, $req->ip());
        Response::noContent();
    }
}

final class UploadController
{
    private const TYPES = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'];
    private const MAX_BYTES = 2 * 1024 * 1024;

    public static function store(Request $req): void
    {
        Auth::requireAdmin();
        $f = $_FILES['file'] ?? null;
        if (!is_array($f) || ($f['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK || !is_uploaded_file((string) $f['tmp_name'])) {
            throw new HttpException(422, 'validation', 'No valid file was uploaded.');
        }
        if ($f['size'] > self::MAX_BYTES) {
            throw new HttpException(422, 'file_too_large', 'The image must be 2 MB or smaller.');
        }
        $mime = (new \finfo(FILEINFO_MIME_TYPE))->file($f['tmp_name']);
        $info = @getimagesize($f['tmp_name']);
        if (!isset(self::TYPES[$mime]) || !$info || $info[0] > 6000 || $info[1] > 6000) {
            throw new HttpException(422, 'file_type', 'Upload a JPG, PNG or WebP image.');
        }
        $dir = dirname(__DIR__, 2) . '/public/uploads';
        $name = bin2hex(random_bytes(16)) . '.' . self::TYPES[$mime];
        if (!is_dir($dir) || !move_uploaded_file($f['tmp_name'], $dir . '/' . $name)) {
            throw new HttpException(500, 'server_error', 'The file could not be saved.');
        }
        $base = rtrim((string) \Fundly\Support\Env::get('UPLOAD_PUBLIC_URL', '/uploads'), '/');
        Response::json(['url' => $base . '/' . $name], 201);
    }

    public static function storeReceipt(Request $req): void
    {
        $user = Auth::currentUser();
        $admin = Auth::currentAdmin();
        if (!$user && !$admin) {
            throw new HttpException(401, 'unauthorized', 'Authentication required.');
        }

        $f = $_FILES['file'] ?? null;
        if (!is_array($f) || ($f['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK || !is_uploaded_file((string) $f['tmp_name'])) {
            throw new HttpException(422, 'validation', 'No valid file was uploaded.');
        }
        if ($f['size'] > 4 * 1024 * 1024) {
            throw new HttpException(422, 'file_too_large', 'The receipt file must be 4 MB or smaller.');
        }

        $allowed = [
            'image/jpeg' => 'jpg',
            'image/png' => 'png',
            'image/webp' => 'webp',
            'application/pdf' => 'pdf',
        ];

        $mime = (new \finfo(FILEINFO_MIME_TYPE))->file($f['tmp_name']);
        if (!isset($allowed[$mime])) {
            throw new HttpException(422, 'file_type', 'Please upload a JPG, PNG, WebP image or PDF receipt.');
        }

        $dir = dirname(__DIR__, 2) . '/public/uploads/receipts';
        if (!is_dir($dir)) {
            @mkdir($dir, 0755, true);
        }

        $ext = $allowed[$mime];
        $name = 'receipt_' . bin2hex(random_bytes(12)) . '.' . $ext;
        $dest = $dir . '/' . $name;

        if (!move_uploaded_file($f['tmp_name'], $dest)) {
            throw new HttpException(500, 'server_error', 'The receipt could not be saved.');
        }

        $base = rtrim((string) \Fundly\Support\Env::get('UPLOAD_PUBLIC_URL', '/uploads'), '/');
        Response::json(['url' => $base . '/receipts/' . $name], 201);
    }
}

final class BusinessProfileController
{
    public static function get(Request $req): void
    {
        $user = Auth::requireUser();
        $profile = \Fundly\Repositories\BusinessProfileRepository::findByUserId((int) $user['id']);
        Response::json($profile);
    }

    public static function save(Request $req): void
    {
        $user = Auth::requireUser();
        $v = Validator::businessProfile($req->json());
        $saved = \Fundly\Repositories\BusinessProfileRepository::save((int) $user['id'], $v);
        Response::json($saved);
    }
}

final class RegistrationController
{
    public static function create(Request $req): void
    {
        $user = Auth::requireUser();
        $v = Validator::registration($req->json());
        $reg = \Fundly\Repositories\RegistrationRepository::create((int) $user['id'], $v);
        Response::json($reg, 201);
    }

    public static function list(Request $req): void
    {
        $user = Auth::requireUser();
        $list = \Fundly\Repositories\RegistrationRepository::listByUser((int) $user['id']);
        Response::json($list);
    }

    public static function show(Request $req): void
    {
        $admin = Auth::currentAdmin();
        if ($admin) {
            $reg = \Fundly\Repositories\RegistrationRepository::findById($req->params['id'], null);
            if (!$reg) {
                throw new HttpException(404, 'not_found', 'Registration not found.');
            }
            Response::json($reg);
            return;
        }

        $user = Auth::requireUser();
        $reg = \Fundly\Repositories\RegistrationRepository::findById($req->params['id'], (int) $user['id']);
        if (!$reg) {
            throw new HttpException(404, 'not_found', 'Registration not found.');
        }
        Response::json($reg);
    }

    public static function cancel(Request $req): void
    {
        $user = Auth::requireUser();
        \Fundly\Repositories\RegistrationRepository::cancel($req->params['id'], (int) $user['id']);
        Response::noContent();
    }

    public static function submitPayment(Request $req): void
    {
        $user = Auth::requireUser();
        $v = Validator::paymentSubmission($req->json());
        $sub = \Fundly\Repositories\PaymentSubmissionRepository::create($req->params['id'], (int) $user['id'], $v, $req->ip());
        Response::json($sub, 201);
    }

    public static function submissions(Request $req): void
    {
        $user = Auth::currentUser();
        $admin = Auth::currentAdmin();
        if (!$user && !$admin) {
            throw new HttpException(401, 'unauthorized', 'Authentication required.');
        }

        $reg = \Fundly\Repositories\RegistrationRepository::findById($req->params['id'], $admin ? null : (int) $user['id']);
        if (!$reg) {
            throw new HttpException(404, 'not_found', 'Registration not found.');
        }

        $list = \Fundly\Repositories\PaymentSubmissionRepository::listSubmissions($reg['rawId']);
        Response::json($list);
    }

    public static function ticket(Request $req): void
    {
        $user = Auth::currentUser();
        $admin = Auth::currentAdmin();
        if (!$user && !$admin) {
            throw new HttpException(401, 'unauthorized', 'Authentication required.');
        }

        $ticket = \Fundly\Repositories\TicketRepository::getByRegistration($req->params['id'], $admin ? null : (int) $user['id']);
        Response::json($ticket);
    }

    public static function requestRefund(Request $req): void
    {
        $user = Auth::requireUser();
        $v = Validator::userRefundRequest($req->json());
        $ref = \Fundly\Repositories\RefundRepository::createRequest($req->params['id'], (int) $user['id'], $v, $req->ip());
        Response::json($ref, 201);
    }
}

final class PaymentController
{
    public static function create(Request $req): void
    {
        $user = Auth::requireUser();
        $b = $req->json();
        $regId = is_string($b['registrationId'] ?? null) ? trim($b['registrationId']) : '';
        if ($regId === '') {
            throw new HttpException(422, 'validation', 'Registration ID is required.');
        }
        $res = \Fundly\Repositories\PaymentRepository::create($regId, (int) $user['id']);
        Response::json($res);
    }

    public static function verify(Request $req): void
    {
        $user = Auth::requireUser();
        $b = $req->json();
        $paymentId = is_string($b['paymentId'] ?? null) ? trim($b['paymentId']) : '';
        if ($paymentId === '') {
            throw new HttpException(422, 'validation', 'Payment ID is required.');
        }
        $res = \Fundly\Repositories\PaymentRepository::verify($paymentId, $b['trxId'] ?? null);
        Response::json($res);
    }
}

final class EligibilityController
{
    public static function questions(Request $req): void
    {
        Response::json(\Fundly\Repositories\EligibilityRepository::listQuestions(true));
    }

    public static function current(Request $req): void
    {
        $user = Auth::requireUser();
        $assessment = \Fundly\Repositories\EligibilityRepository::getCurrentAssessment((int) $user['id']);
        Response::json($assessment);
    }

    public static function saveDraft(Request $req): void
    {
        $user = Auth::requireUser();
        $b = $req->json();
        $answers = is_array($b['answers'] ?? null) ? $b['answers'] : [];
        $step = is_numeric($b['step'] ?? null) ? (int) $b['step'] : 1;
        $saved = \Fundly\Repositories\EligibilityRepository::saveDraft((int) $user['id'], $answers, $step);
        Response::json($saved);
    }

    public static function submit(Request $req): void
    {
        $user = Auth::requireUser();
        $b = $req->json();
        $answers = is_array($b['answers'] ?? null) ? $b['answers'] : [];
        if (empty($answers)) {
            throw new HttpException(422, 'validation', 'Assessment answers cannot be empty.');
        }
        $result = \Fundly\Repositories\EligibilityRepository::submit((int) $user['id'], $answers);
        Response::json($result, 201);
    }

    public static function result(Request $req): void
    {
        $user = Auth::requireUser();
        $res = \Fundly\Repositories\EligibilityRepository::getLatestResult((int) $user['id']);
        if (!$res) {
            throw new HttpException(404, 'not_found', 'No assessment result found.');
        }
        Response::json($res);
    }
}

final class AdminController
{
    public static function dashboard(Request $req): void
    {
        Auth::requireAdmin();
        Response::json(\Fundly\Repositories\AdminRepository::dashboard());
    }

    public static function smes(Request $req): void
    {
        Auth::requireAdmin();
        $search = is_string($_GET['search'] ?? null) ? trim($_GET['search']) : '';
        Response::json(\Fundly\Repositories\AdminRepository::listSmes($search));
    }

    public static function smeDetail(Request $req): void
    {
        Auth::requireAdmin();
        $id = (int) $req->params['id'];
        Response::json(\Fundly\Repositories\AdminRepository::smeDetail($id));
    }

    public static function registrations(Request $req): void
    {
        Auth::requireAdmin();
        $filters = [
            'masterclassId' => $_GET['masterclassId'] ?? '',
            'paymentStatus' => $_GET['paymentStatus'] ?? '',
            'attendanceStatus' => $_GET['attendanceStatus'] ?? '',
            'search' => $_GET['search'] ?? '',
        ];
        Response::json(\Fundly\Repositories\AdminRepository::listRegistrations($filters));
    }

    public static function updateAttendance(Request $req): void
    {
        Auth::requireAdmin();
        $id = (int) $req->params['id'];
        $b = $req->json();
        $status = is_string($b['status'] ?? null) ? trim($b['status']) : 'unmarked';
        \Fundly\Repositories\AdminRepository::updateAttendance($id, $status);
        $updated = \Fundly\Repositories\RegistrationRepository::findById($id, null);
        Response::json($updated);
    }

    public static function correctPayment(Request $req): void
    {
        $admin = Auth::requireAdmin();
        $id = (int) $req->params['id'];
        $b = $req->json();
        $status = is_string($b['status'] ?? null) ? trim($b['status']) : '';
        $reason = is_string($b['reason'] ?? null) ? trim($b['reason']) : '';
        if ($status === '' || $reason === '') {
            throw new HttpException(422, 'validation', 'Status and reason for correction are required.');
        }
        \Fundly\Repositories\AdminRepository::correctPayment($id, $status, $reason, (int) $admin['id'], $req->ip());
        $updated = \Fundly\Repositories\RegistrationRepository::findById($id, null);
        Response::json($updated);
    }

    public static function results(Request $req): void
    {
        Auth::requireAdmin();
        $band = is_string($_GET['band'] ?? null) ? trim($_GET['band']) : '';
        $search = is_string($_GET['search'] ?? null) ? trim($_GET['search']) : '';
        Response::json(\Fundly\Repositories\AdminRepository::listResults($band, $search));
    }

    public static function scoringRules(Request $req): void
    {
        Auth::requireAdmin();
        Response::json(\Fundly\Repositories\AdminRepository::listScoringRules());
    }

    public static function updateScoringRules(Request $req): void
    {
        Auth::requireAdmin();
        $b = $req->json();
        $weights = is_array($b['weights'] ?? null) ? $b['weights'] : [];
        \Fundly\Repositories\AdminRepository::updateScoringRules($weights);
        Response::noContent();
    }

    public static function questions(Request $req): void
    {
        Auth::requireAdmin();
        Response::json(\Fundly\Repositories\EligibilityRepository::listQuestions(false));
    }

    public static function saveQuestion(Request $req): void
    {
        Auth::requireAdmin();
        $q = $req->json();
        if (empty($q['id']) || empty($q['text']['en']) || empty($q['text']['bn'])) {
            throw new HttpException(422, 'validation', 'Question ID and text in both English and Bengali are required.');
        }
        $saved = \Fundly\Repositories\EligibilityRepository::saveQuestion($q);
        Response::json($saved);
    }

    public static function setQuestionActive(Request $req): void
    {
        Auth::requireAdmin();
        $id = (string) $req->params['id'];
        $b = $req->json();
        $active = !empty($b['active']);
        \Fundly\Repositories\EligibilityRepository::setQuestionActive($id, $active);
        Response::noContent();
    }

    public static function cancelRegistration(Request $req): void
    {
        $admin = Auth::requireAdmin();
        $id = (int) $req->params['id'];
        $b = $req->json();
        $reason = is_string($b['reason'] ?? null) ? trim($b['reason']) : 'Administrative cancellation';
        \Fundly\Repositories\RegistrationRepository::adminCancel($id, (int) $admin['id'], $reason, $req->ip());
        $updated = \Fundly\Repositories\RegistrationRepository::findById($id, null);
        Response::json($updated);
    }

    public static function paymentSubmissions(Request $req): void
    {
        Auth::requireAdmin();
        $filters = [
            'status' => $_GET['status'] ?? '',
            'search' => $_GET['search'] ?? '',
        ];
        Response::json(\Fundly\Repositories\PaymentSubmissionRepository::listSubmissions(null, null, $filters));
    }

    public static function approveSubmission(Request $req): void
    {
        $admin = Auth::requireAdmin();
        $id = (int) $req->params['id'];
        $b = $req->json();
        $notes = is_string($b['adminNotes'] ?? null) ? trim($b['adminNotes']) : null;
        $res = \Fundly\Repositories\PaymentSubmissionRepository::approve($id, (int) $admin['id'], $req->ip(), $notes);
        Response::json($res);
    }

    public static function rejectSubmission(Request $req): void
    {
        $admin = Auth::requireAdmin();
        $id = (int) $req->params['id'];
        $b = $req->json();
        $reason = is_string($b['reason'] ?? null) ? trim($b['reason']) : '';
        if ($reason === '') {
            throw new HttpException(422, 'validation', 'A rejection reason is required.');
        }
        $notes = is_string($b['adminNotes'] ?? null) ? trim($b['adminNotes']) : null;
        $res = \Fundly\Repositories\PaymentSubmissionRepository::reject($id, (int) $admin['id'], $reason, $req->ip(), $notes);
        Response::json($res);
    }

    public static function refunds(Request $req): void
    {
        Auth::requireAdmin();
        $filters = [
            'status' => $_GET['status'] ?? '',
            'search' => $_GET['search'] ?? '',
        ];
        Response::json(\Fundly\Repositories\RefundRepository::listAdmin($filters));
    }

    public static function approveRefund(Request $req): void
    {
        $admin = Auth::requireAdmin();
        $id = (int) $req->params['id'];
        $b = $req->json();
        $notes = is_string($b['notes'] ?? null) ? trim($b['notes']) : null;
        $res = \Fundly\Repositories\RefundRepository::approve($id, (int) $admin['id'], $req->ip(), $notes);
        Response::json($res);
    }

    public static function rejectRefund(Request $req): void
    {
        $admin = Auth::requireAdmin();
        $id = (int) $req->params['id'];
        $b = $req->json();
        $reason = is_string($b['reason'] ?? null) ? trim($b['reason']) : '';
        if ($reason === '') {
            throw new HttpException(422, 'validation', 'A rejection reason is required.');
        }
        $res = \Fundly\Repositories\RefundRepository::reject($id, (int) $admin['id'], $reason, $req->ip());
        Response::json($res);
    }

    public static function completeRefund(Request $req): void
    {
        $admin = Auth::requireAdmin();
        $id = (int) $req->params['id'];
        $b = $req->json();
        $res = \Fundly\Repositories\RefundRepository::complete($id, (int) $admin['id'], $b, $req->ip());
        Response::json($res);
    }

    public static function directRefund(Request $req): void
    {
        $admin = Auth::requireAdmin();
        $id = $req->params['id'];
        $b = $req->json();
        $res = \Fundly\Repositories\RefundRepository::adminDirectRefund($id, (int) $admin['id'], $b, $req->ip());
        Response::json($res);
    }

    public static function roster(Request $req): void
    {
        Auth::requireAdmin();
        $mcId = (int) $req->params['id'];
        $filters = [
            'attendanceStatus' => $_GET['attendanceStatus'] ?? '',
            'search' => $_GET['search'] ?? '',
        ];
        Response::json(\Fundly\Repositories\MasterclassRepository::getRoster($mcId, $filters));
    }

    public static function checkIn(Request $req): void
    {
        $admin = Auth::requireAdmin();
        $mcId = (int) $req->params['id'];
        $b = $req->json();
        $ticketNumber = is_string($b['ticketNumber'] ?? null) ? trim($b['ticketNumber']) : '';
        if ($ticketNumber === '') {
            throw new HttpException(422, 'validation', 'Ticket number is required.');
        }
        $res = \Fundly\Repositories\TicketRepository::checkIn($ticketNumber, (int) $admin['id'], $mcId);
        Response::json($res);
    }

    public static function verifyTicket(Request $req): void
    {
        Auth::requireAdmin();
        $b = $req->json();
        $ticketNumber = is_string($b['ticketNumber'] ?? null) ? trim($b['ticketNumber']) : '';
        if ($ticketNumber === '') {
            throw new HttpException(422, 'validation', 'Ticket number is required.');
        }
        $mcId = !empty($b['masterclassId']) ? (int) $b['masterclassId'] : null;
        $res = \Fundly\Repositories\TicketRepository::verifyTicket($ticketNumber, $mcId);
        Response::json($res);
    }
}


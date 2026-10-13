<?php
declare(strict_types=1);

use Fundly\Controllers\AdminController;
use Fundly\Controllers\AuthController;
use Fundly\Controllers\BusinessProfileController;
use Fundly\Controllers\EligibilityController;
use Fundly\Controllers\MasterclassController;
use Fundly\Controllers\PaymentController;
use Fundly\Controllers\RegistrationController;
use Fundly\Controllers\SpeakerController;
use Fundly\Controllers\UploadController;
use Fundly\Support\Router;

return static function (Router $r): void {
    // Public catalog & questions
    $r->add('GET', '/masterclasses', [MasterclassController::class, 'listPublic']);
    $r->add('GET', '/masterclasses/{id}', [MasterclassController::class, 'showPublic']);
    $r->add('GET', '/speakers', [SpeakerController::class, 'list']);
    $r->add('GET', '/questions', [EligibilityController::class, 'questions']);

    // Auth (SME & Admin)
    $r->add('POST', '/auth/signup', [AuthController::class, 'signup']);
    $r->add('POST', '/auth/login', [AuthController::class, 'login']);
    $r->add('GET', '/auth/me', [AuthController::class, 'me']);
    $r->add('POST', '/auth/logout', [AuthController::class, 'logout']);
    $r->add('POST', '/auth/verify-otp', [AuthController::class, 'verifyOtp']);
    $r->add('POST', '/auth/resend-otp', [AuthController::class, 'resendOtp']);
    $r->add('POST', '/auth/cancel-signup', [AuthController::class, 'cancelSignup']);
    $r->add('POST', '/auth/forgot-password', [AuthController::class, 'forgotPassword']);
    $r->add('POST', '/auth/reset-password', [AuthController::class, 'resetPassword']);
    $r->add('POST', '/auth/admin/login', [AuthController::class, 'adminLogin']);
    $r->add('GET', '/auth/admin/me', [AuthController::class, 'adminMe']);

    // SME Business Profile
    $r->add('GET', '/business-profile', [BusinessProfileController::class, 'get']);
    $r->add('POST', '/business-profile', [BusinessProfileController::class, 'save']);
    $r->add('PUT', '/business-profile', [BusinessProfileController::class, 'save']);

    // SME Registrations
    $r->add('POST', '/registrations', [RegistrationController::class, 'create']);
    $r->add('GET', '/registrations', [RegistrationController::class, 'list']);
    $r->add('GET', '/registrations/{id}', [RegistrationController::class, 'show']);
    $r->add('POST', '/registrations/{id}/cancel', [RegistrationController::class, 'cancel']);

    // SME Payments
    $r->add('POST', '/payments/create', [PaymentController::class, 'create']);
    $r->add('POST', '/payments/verify', [PaymentController::class, 'verify']);

    // SME Eligibility Assessment
    $r->add('GET', '/assessments/current', [EligibilityController::class, 'current']);
    $r->add('POST', '/assessments/save', [EligibilityController::class, 'saveDraft']);
    $r->add('POST', '/assessments/submit', [EligibilityController::class, 'submit']);
    $r->add('GET', '/assessments/result', [EligibilityController::class, 'result']);

    // Admin
    $r->add('GET', '/admin/dashboard', [AdminController::class, 'dashboard']);
    $r->add('GET', '/admin/smes', [AdminController::class, 'smes']);
    $r->add('GET', '/admin/smes/{id}', [AdminController::class, 'smeDetail']);
    $r->add('GET', '/admin/registrations', [AdminController::class, 'registrations']);
    $r->add('PATCH', '/admin/registrations/{id}/attendance', [AdminController::class, 'updateAttendance']);
    $r->add('PATCH', '/admin/registrations/{id}/payment', [AdminController::class, 'correctPayment']);
    $r->add('GET', '/admin/results', [AdminController::class, 'results']);
    $r->add('GET', '/admin/scoring-rules', [AdminController::class, 'scoringRules']);
    $r->add('PUT', '/admin/scoring-rules', [AdminController::class, 'updateScoringRules']);
    $r->add('GET', '/admin/questions', [AdminController::class, 'questions']);

    $r->add('GET', '/admin/masterclasses', [MasterclassController::class, 'listAdmin']);
    $r->add('POST', '/admin/masterclasses', [MasterclassController::class, 'create']);
    $r->add('GET', '/admin/masterclasses/{id}', [MasterclassController::class, 'showAdmin']);
    $r->add('PUT', '/admin/masterclasses/{id}', [MasterclassController::class, 'update']);
    $r->add('PATCH', '/admin/masterclasses/{id}/status', [MasterclassController::class, 'setStatus']);
    $r->add('DELETE', '/admin/masterclasses/{id}', [MasterclassController::class, 'delete']);
    $r->add('POST', '/admin/speakers', [SpeakerController::class, 'create']);
    $r->add('PUT', '/admin/speakers/{id}', [SpeakerController::class, 'update']);
    $r->add('DELETE', '/admin/speakers/{id}', [SpeakerController::class, 'delete']);
    $r->add('POST', '/admin/uploads', [UploadController::class, 'store']);
};

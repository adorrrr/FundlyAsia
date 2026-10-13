<?php
declare(strict_types=1);

use Fundly\Support\Env;
use Fundly\Support\HttpException;
use Fundly\Support\Request;
use Fundly\Support\Response;
use Fundly\Support\Router;

// Let the PHP dev server serve uploaded images directly (both /uploads and /api/uploads).
if (PHP_SAPI === 'cli-server') {
    $rawPath = (string) parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
    $stripped = preg_replace('#^/api(?=/)#', '', $rawPath);
    $file = __DIR__ . $stripped;
    if (is_file($file) && !str_ends_with($file, '.php')) {
        if ($rawPath === $stripped) {
            return false;
        }
        $mimes = [
            'jpg' => 'image/jpeg',
            'jpeg' => 'image/jpeg',
            'png' => 'image/png',
            'webp' => 'image/webp',
            'gif' => 'image/gif',
            'svg' => 'image/svg+xml',
        ];
        $ext = strtolower(pathinfo($file, PATHINFO_EXTENSION));
        header('Content-Type: ' . ($mimes[$ext] ?? 'application/octet-stream'));
        header('Content-Length: ' . (string) filesize($file));
        header('Access-Control-Allow-Origin: *');
        readfile($file);
        exit;
    }
}

$root = dirname(__DIR__);
foreach (['Env', 'Db', 'Http', 'Router', 'Auth', 'Validator', 'Migrator'] as $f) {
    require "$root/src/Support/$f.php";
}
require "$root/src/Repositories/Repositories.php";
require "$root/src/Controllers/Controllers.php";

Env::load("$root/.env");
$production = Env::get('APP_ENV', 'production') === 'production';
ini_set('display_errors', '0');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: no-referrer');

$origin = $_SERVER['HTTP_ORIGIN'] ?? null;
$allowed = array_filter(array_map('trim', explode(',', (string) Env::get('CORS_ALLOWED_ORIGINS', ''))));
$originOk = $origin !== null && in_array($origin, $allowed, true);
if ($originOk) {
    header("Access-Control-Allow-Origin: $origin");
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Allow-Headers: Content-Type, Accept, X-Requested-With');
    header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
    header('Vary: Origin');
}

try {
    $req = Request::fromGlobals();
    if ($req->method === 'OPTIONS') {
        Response::noContent();
    }
    // CSRF defence for cookie sessions: state-changing calls need a custom header (which forces a
    // CORS preflight) and, when an Origin is sent, it must be an allowed one or this server itself.
    if (!in_array($req->method, ['GET', 'HEAD'], true)) {
        $oh = $origin === null ? null : (parse_url($origin, PHP_URL_HOST) . (($p = parse_url($origin, PHP_URL_PORT)) ? ":$p" : ''));
        $sameHost = $oh !== null && $oh === ($_SERVER['HTTP_HOST'] ?? '');
        if ($req->header('X-Requested-With') !== 'XMLHttpRequest' || ($origin !== null && !$originOk && !$sameHost)) {
            throw new HttpException(403, 'forbidden', 'Request blocked.');
        }
    }
    $router = new Router();
    (require "$root/routes/api.php")($router);
    $router->dispatch($req);
} catch (HttpException $e) {
    Response::error($e);
} catch (Throwable $e) {
    $log = "$root/storage/logs/app.log";
    @file_put_contents($log, sprintf("[%s] %s %s in %s:%d\n", gmdate('c'), get_class($e), $e->getMessage(), basename($e->getFile()), $e->getLine()), FILE_APPEND);
    Response::error(new HttpException(500, 'server_error', 'Something went wrong. Please try again.'));
}

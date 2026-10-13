<?php
declare(strict_types=1);

namespace Fundly\Support;

use RuntimeException;

/** Thrown anywhere to produce a JSON error response. Messages must be safe to show to users. */
final class HttpException extends RuntimeException
{
    /** @param array<string,string>|null $errors */
    public function __construct(
        public int $status,
        public string $errorCode,
        string $message,
        public ?array $errors = null
    ) {
        parent::__construct($message);
    }
}

final class Request
{
    /** @var array<string,mixed>|null */
    private ?array $json = null;

    /** @param array<string,string> $params */
    public function __construct(public string $method, public string $path, public array $params = [])
    {
    }

    public static function fromGlobals(): self
    {
        $path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
        $path = '/' . trim(preg_replace('#^/api(?=/|$)#', '', rawurldecode($path)), '/');
        return new self(strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET'), $path);
    }

    public function header(string $name): ?string
    {
        $key = 'HTTP_' . strtoupper(str_replace('-', '_', $name));
        return isset($_SERVER[$key]) ? (string) $_SERVER[$key] : null;
    }

    /** @return array<string,mixed> */
    public function json(): array
    {
        if ($this->json === null) {
            $raw = file_get_contents('php://input') ?: '';
            if (strlen($raw) > 1_000_000) {
                throw new HttpException(413, 'too_large', 'The request is too large.');
            }
            $data = $raw === '' ? [] : json_decode($raw, true);
            if (!is_array($data)) {
                throw new HttpException(400, 'bad_request', 'The request body is not valid JSON.');
            }
            $this->json = $data;
        }
        return $this->json;
    }

    public function ip(): string
    {
        return (string) ($_SERVER['REMOTE_ADDR'] ?? '');
    }
}

final class Response
{
    public static function json(mixed $data, int $status = 200): void
    {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        header('Cache-Control: no-store');
        echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE);
        exit;
    }

    public static function noContent(): void
    {
        http_response_code(204);
        exit;
    }

    public static function error(HttpException $e): void
    {
        $body = ['code' => $e->errorCode, 'message' => $e->getMessage()];
        if ($e->errors) {
            $body['errors'] = $e->errors;
        }
        self::json($body, $e->status);
    }
}

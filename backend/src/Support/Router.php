<?php
declare(strict_types=1);

namespace Fundly\Support;

final class Router
{
    /** @var array<int,array{0:string,1:string,2:callable}> */
    private array $routes = [];

    public function add(string $method, string $pattern, callable $handler): void
    {
        $regex = '#^' . preg_replace('#\{(\w+)\}#', '(?P<$1>[^/]+)', $pattern) . '$#';
        $this->routes[] = [$method, $regex, $handler];
    }

    public function dispatch(Request $req): void
    {
        $pathMatched = false;
        foreach ($this->routes as [$method, $regex, $handler]) {
            if (!preg_match($regex, $req->path, $m)) {
                continue;
            }
            $pathMatched = true;
            if ($method !== $req->method) {
                continue;
            }
            $req->params = array_filter($m, 'is_string', ARRAY_FILTER_USE_KEY);
            $handler($req);
            return;
        }
        if ($pathMatched) {
            throw new HttpException(405, 'method_not_allowed', 'Method not allowed.');
        }
        throw new HttpException(404, 'not_found', 'Not found.');
    }
}

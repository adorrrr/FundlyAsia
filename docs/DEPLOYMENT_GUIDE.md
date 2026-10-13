# Fundly Production Deployment Guide

A step-by-step production deployment manual for the Fundly SME platform (PHP backend + React Vite frontend).

---

## 1. System Requirements

- **Operating System:** Ubuntu 22.04 LTS or 24.04 LTS (or Debian 12 / Rocky Linux 9).
- **Web Server:** Nginx or Apache 2.4+.
- **PHP:** PHP 8.1 or higher (PHP 8.2/8.3/8.4 recommended).
  - Required extensions: `php8.x-fpm`, `php8.x-mysql`, `php8.x-mbstring`, `php8.x-curl`, `php8.x-fileinfo`, `php8.x-xml`.
- **Database:** MySQL 8.0+ or MariaDB 10.4+ with `utf8mb4` character set.
- **Node.js:** Node.js 18+ LTS and `npm` for building the frontend.
- **SSL/TLS:** Valid certificate (Let's Encrypt Certbot recommended).

---

## 2. Database Setup

1. Log in to MySQL as root:
   ```bash
   mysql -u root -p
   ```

2. Create database and production user:
   ```sql
   CREATE DATABASE fundly CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

   CREATE USER 'fundly_user'@'localhost' IDENTIFIED BY 'STRONG_RANDOM_PASSWORD_HERE';
   GRANT ALL PRIVILEGES ON fundly.* TO 'fundly_user'@'localhost';
   FLUSH PRIVILEGES;
   EXIT;
   ```

3. Run migrations and platform seeders:
   ```bash
   cd /var/www/fundly
   php backend/database/migrate.php
   php backend/database/seed_platform.php

   # Create initial super admin:
   ADMIN_EMAIL=admin@fundly.asia ADMIN_PASSWORD='CHANGE_ME_SUPER_STRONG_PASSWORD' ADMIN_NAME='Fundly Admin' php backend/database/seed_admin.php
   ```

---

## 3. Backend Environment Configuration

Create `/var/www/fundly/backend/.env`:
```ini
APP_ENV=production
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=fundly
DB_USER=fundly_user
DB_PASS=STRONG_RANDOM_PASSWORD_HERE

# Production domains:
CORS_ALLOWED_ORIGINS=https://fundly.asia,https://www.fundly.asia
UPLOAD_PUBLIC_URL=https://fundly.asia/api/uploads

# bKash Gateway Credentials (optional for live payments):
# BKASH_APP_KEY=...
# BKASH_APP_SECRET=...
# BKASH_USERNAME=...
# BKASH_PASSWORD=...
```

Set file permissions:
```bash
chown -R www-data:www-data /var/www/fundly
chmod -R 755 /var/www/fundly
chmod -R 775 /var/www/fundly/backend/public/uploads
chmod -R 775 /var/www/fundly/backend/storage
```

---

## 4. Frontend Production Build

1. In the project root, create `.env.production`:
   ```ini
   VITE_DATA_MODE=api
   VITE_API_BASE_URL=/api
   ```

2. Run the build command:
   ```bash
   npm ci
   npm run build
   ```
   The compiled assets will be generated in `dist/`.

---

## 5. Nginx Configuration (Unified Reverse Proxy)

Create `/etc/nginx/sites-available/fundly.conf`:

```nginx
server {
    listen 80;
    server_name fundly.asia www.fundly.asia;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name fundly.asia www.fundly.asia;

    ssl_certificate /etc/letsencrypt/live/fundly.asia/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/fundly.asia/privkey.pem;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Max upload size for masterclass/speaker banners
    client_max_body_size 12M;

    # 1. API Endpoints routed to PHP-FPM
    location /api/ {
        alias /var/www/fundly/backend/public/;
        try_files $uri $uri/ @backend;

        location ~ \.php$ {
            include fastcgi_params;
            fastcgi_param SCRIPT_FILENAME /var/www/fundly/backend/public/index.php;
            fastcgi_pass unix:/run/php/php8.2-fpm.sock;
            fastcgi_read_timeout 60s;
        }
    }

    location @backend {
        rewrite ^/api/(.*)$ /var/www/fundly/backend/public/index.php last;
    }

    # 2. Uploaded Media Storage
    location /api/uploads/ {
        alias /var/www/fundly/backend/public/uploads/;
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }

    # 3. Frontend Single Page Application
    root /var/www/fundly/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Static asset caching
    location ~* \.(js|css|webp|png|jpg|jpeg|gif|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

Enable site and test configuration:
```bash
ln -s /etc/nginx/sites-available/fundly.conf /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

---

## 6. Security & Hardening Checklist

1. **Strict Session Cookies:**
   - In production (`APP_ENV=production`), session cookies are automatically marked `Secure`, `HttpOnly`, with `SameSite=Lax`.
2. **CSRF & Origin Verification:**
   - All state-changing requests (`POST`, `PUT`, `PATCH`, `DELETE`) require the `X-Requested-With: XMLHttpRequest` header and have their `Origin` validated against `CORS_ALLOWED_ORIGINS`.
3. **Brute Force Protection:**
   - 5 failed login attempts in 15 minutes automatically lock the account/IP for that duration.
4. **Directory Traversal & Sensitive Files:**
   - Ensure `.env`, `storage/`, and `database/` directories are NOT exposed directly to the web. Only `backend/public/` and `dist/` should be accessible.
5. **Database Backups:**
   Set up daily automated mysqldump:
   ```bash
   crontab -e
   # Add:
   0 3 * * * mysqldump -u fundly_user -p'STRONG_RANDOM_PASSWORD_HERE' fundly | gzip > /var/backups/fundly_$(date +\%F).sql.gz
   ```

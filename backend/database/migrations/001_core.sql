CREATE TABLE admin_users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(30) NOT NULL DEFAULT 'admin',
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  last_login_at DATETIME NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  CONSTRAINT uq_admin_users_email UNIQUE (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE login_attempts (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(190) NOT NULL,
  ip VARCHAR(45) NOT NULL,
  attempted_at DATETIME NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_login_attempts_email ON login_attempts (email, attempted_at);
CREATE INDEX idx_login_attempts_ip ON login_attempts (ip, attempted_at);

CREATE TABLE audit_logs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  actor_type VARCHAR(20) NOT NULL,
  actor_id BIGINT UNSIGNED NULL,
  action VARCHAR(60) NOT NULL,
  entity_type VARCHAR(40) NOT NULL,
  entity_id BIGINT UNSIGNED NULL,
  ip VARCHAR(45) NOT NULL,
  created_at DATETIME NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_audit_entity ON audit_logs (entity_type, entity_id);

CREATE TABLE speakers (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  designation VARCHAR(190) NOT NULL DEFAULT '',
  institution VARCHAR(190) NOT NULL DEFAULT '',
  bio_en TEXT NULL,
  bio_bn TEXT NULL,
  photo_path VARCHAR(500) NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE masterclasses (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(190) NOT NULL,
  title_en VARCHAR(255) NOT NULL,
  title_bn VARCHAR(255) NOT NULL DEFAULT '',
  topic_en VARCHAR(190) NOT NULL DEFAULT '',
  topic_bn VARCHAR(190) NOT NULL DEFAULT '',
  summary_en TEXT NULL,
  summary_bn TEXT NULL,
  description_en TEXT NULL,
  description_bn TEXT NULL,
  learn_json TEXT NULL,
  event_date DATE NULL,
  start_time VARCHAR(5) NOT NULL DEFAULT '',
  end_time VARCHAR(5) NOT NULL DEFAULT '',
  venue_en VARCHAR(255) NOT NULL DEFAULT '',
  venue_bn VARCHAR(255) NOT NULL DEFAULT '',
  capacity INT UNSIGNED NOT NULL DEFAULT 0,
  registration_deadline DATE NULL,
  fee DECIMAL(10,2) NOT NULL DEFAULT 0,
  status VARCHAR(30) NOT NULL DEFAULT 'draft',
  speaker_id BIGINT UNSIGNED NULL,
  cover_path VARCHAR(500) NULL,
  cover_srcset VARCHAR(2000) NULL,
  cover_alt_en VARCHAR(255) NULL,
  cover_alt_bn VARCHAR(255) NULL,
  cover_credit_name VARCHAR(190) NULL,
  cover_credit_url VARCHAR(500) NULL,
  cover_tone VARCHAR(10) NOT NULL DEFAULT 'leaf',
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  CONSTRAINT uq_masterclasses_slug UNIQUE (slug),
  CONSTRAINT fk_masterclasses_speaker FOREIGN KEY (speaker_id) REFERENCES speakers (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_masterclasses_status_date ON masterclasses (status, event_date);

CREATE TABLE users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  email_verified_at DATETIME NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  CONSTRAINT uq_users_email UNIQUE (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE registrations (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  masterclass_id BIGINT UNSIGNED NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'pending',
  payment_status VARCHAR(30) NOT NULL DEFAULT 'not_required',
  attendance_status VARCHAR(20) NOT NULL DEFAULT 'unmarked',
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  CONSTRAINT uq_registrations_user_class UNIQUE (user_id, masterclass_id),
  CONSTRAINT fk_registrations_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE RESTRICT,
  CONSTRAINT fk_registrations_masterclass FOREIGN KEY (masterclass_id) REFERENCES masterclasses (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

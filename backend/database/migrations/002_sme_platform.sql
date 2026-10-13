CREATE TABLE business_profiles (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  business_name VARCHAR(190) NOT NULL,
  business_type VARCHAR(60) NOT NULL DEFAULT 'sole_proprietorship',
  industry VARCHAR(120) NOT NULL DEFAULT '',
  location VARCHAR(120) NOT NULL DEFAULT '',
  business_age VARCHAR(60) NOT NULL DEFAULT '',
  ownership_type VARCHAR(60) NOT NULL DEFAULT '',
  owner_name VARCHAR(120) NOT NULL DEFAULT '',
  email VARCHAR(190) NOT NULL DEFAULT '',
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  CONSTRAINT uq_business_profiles_user UNIQUE (user_id),
  CONSTRAINT fk_business_profiles_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE otp_codes (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(190) NOT NULL,
  otp_hash VARCHAR(255) NOT NULL,
  purpose VARCHAR(30) NOT NULL DEFAULT 'signup',
  attempts INT UNSIGNED NOT NULL DEFAULT 0,
  expires_at DATETIME NOT NULL,
  created_at DATETIME NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_otp_email_purpose ON otp_codes (email, purpose);

CREATE TABLE password_resets (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(190) NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  expires_at DATETIME NOT NULL,
  used_at DATETIME NULL,
  created_at DATETIME NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_password_resets_email ON password_resets (email);

ALTER TABLE registrations ADD COLUMN code VARCHAR(20) NULL;
ALTER TABLE registrations ADD COLUMN name VARCHAR(120) NOT NULL DEFAULT '';
ALTER TABLE registrations ADD COLUMN email VARCHAR(190) NOT NULL DEFAULT '';
ALTER TABLE registrations ADD COLUMN business_name VARCHAR(190) NOT NULL DEFAULT '';
ALTER TABLE registrations ADD COLUMN industry VARCHAR(120) NOT NULL DEFAULT '';
ALTER TABLE registrations ADD COLUMN business_type VARCHAR(60) NOT NULL DEFAULT 'sole_proprietorship';
ALTER TABLE registrations ADD COLUMN financing_intent VARCHAR(30) NOT NULL DEFAULT 'exploring';
ALTER TABLE registrations ADD COLUMN financing_purpose VARCHAR(60) NULL;
ALTER TABLE registrations ADD COLUMN financing_amount_range VARCHAR(60) NULL;
ALTER TABLE registrations ADD COLUMN amount DECIMAL(10,2) NOT NULL DEFAULT 0.00;

CREATE UNIQUE INDEX uq_registrations_code ON registrations (code);

CREATE TABLE payments (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  registration_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  currency VARCHAR(10) NOT NULL DEFAULT 'BDT',
  provider VARCHAR(30) NOT NULL DEFAULT 'bkash',
  status VARCHAR(30) NOT NULL DEFAULT 'pending',
  payment_id VARCHAR(120) NULL,
  trx_id VARCHAR(120) NULL,
  payment_url VARCHAR(500) NULL,
  raw_response_json TEXT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  CONSTRAINT fk_payments_registration FOREIGN KEY (registration_id) REFERENCES registrations (id) ON DELETE CASCADE,
  CONSTRAINT fk_payments_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_payments_status ON payments (status);

CREATE TABLE questions (
  id VARCHAR(60) NOT NULL PRIMARY KEY,
  step INT UNSIGNED NOT NULL DEFAULT 1,
  category VARCHAR(60) NOT NULL,
  answer_type VARCHAR(30) NOT NULL DEFAULT 'single_choice',
  text_en TEXT NOT NULL,
  text_bn TEXT NOT NULL,
  help_en TEXT NULL,
  help_bn TEXT NULL,
  options_json MEDIUMTEXT NULL,
  required TINYINT(1) NOT NULL DEFAULT 1,
  prefill_from VARCHAR(60) NULL,
  show_when_json TEXT NULL,
  weight DECIMAL(5,2) NULL,
  rule_ref VARCHAR(60) NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE scoring_rules (
  category_key VARCHAR(60) NOT NULL PRIMARY KEY,
  label_en VARCHAR(120) NOT NULL,
  label_bn VARCHAR(120) NOT NULL,
  weight DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE assessments (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'draft',
  answers_json MEDIUMTEXT NULL,
  current_step INT UNSIGNED NOT NULL DEFAULT 1,
  started_at DATETIME NOT NULL,
  submitted_at DATETIME NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  CONSTRAINT fk_assessments_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE assessment_results (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  assessment_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  score INT NOT NULL,
  band VARCHAR(30) NOT NULL,
  strengths_json TEXT NULL,
  improvements_json TEXT NULL,
  next_step_json TEXT NULL,
  category_scores_json TEXT NULL,
  sample TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL,
  CONSTRAINT fk_results_assessment FOREIGN KEY (assessment_id) REFERENCES assessments (id) ON DELETE CASCADE,
  CONSTRAINT fk_results_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_assessment_results_user ON assessment_results (user_id);

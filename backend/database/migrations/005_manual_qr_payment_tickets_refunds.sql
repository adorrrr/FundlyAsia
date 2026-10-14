-- 005_manual_qr_payment_tickets_refunds.sql: Manual Bangladesh QR payment, digital tickets, user refund requests, and attendee check-in

-- 1. Create payment_submissions table for manual QR payments
CREATE TABLE IF NOT EXISTS payment_submissions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  registration_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  payment_method VARCHAR(40) NOT NULL,
  sender_account VARCHAR(80) NOT NULL,
  trx_id VARCHAR(120) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  paid_at DATETIME NULL,
  receipt_path VARCHAR(500) NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'pending', -- pending, approved, rejected
  rejection_reason TEXT NULL,
  verified_by_admin_id BIGINT UNSIGNED NULL,
  verified_at DATETIME NULL,
  admin_notes TEXT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  CONSTRAINT fk_psub_reg FOREIGN KEY (registration_id) REFERENCES registrations (id) ON DELETE CASCADE,
  CONSTRAINT fk_psub_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  INDEX idx_psub_reg (registration_id),
  INDEX idx_psub_user (user_id),
  INDEX idx_psub_status (status),
  INDEX idx_psub_trx (trx_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Create tickets table
CREATE TABLE IF NOT EXISTS tickets (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  ticket_number VARCHAR(50) NOT NULL UNIQUE,
  registration_id BIGINT UNSIGNED NOT NULL UNIQUE,
  user_id BIGINT UNSIGNED NOT NULL,
  masterclass_id BIGINT UNSIGNED NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'valid', -- valid, used, cancelled
  checked_in_at DATETIME NULL,
  checked_in_by_admin_id BIGINT UNSIGNED NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  CONSTRAINT fk_ticket_reg FOREIGN KEY (registration_id) REFERENCES registrations (id) ON DELETE CASCADE,
  CONSTRAINT fk_ticket_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_ticket_mc FOREIGN KEY (masterclass_id) REFERENCES masterclasses (id) ON DELETE CASCADE,
  INDEX idx_ticket_user (user_id),
  INDEX idx_ticket_mc (masterclass_id),
  INDEX idx_ticket_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Enhance registrations table with ticket_number
ALTER TABLE registrations
  ADD COLUMN ticket_number VARCHAR(50) NULL AFTER code,
  ADD INDEX idx_reg_ticket (ticket_number);

-- 4. Enhance refunds table for user-requested refunds and manual refund disbursement
ALTER TABLE refunds
  MODIFY COLUMN requested_by_admin_id BIGINT UNSIGNED NULL,
  ADD COLUMN requested_by_user_id BIGINT UNSIGNED NULL AFTER requested_by_admin_id,
  ADD COLUMN destination_account VARCHAR(80) NULL AFTER provider_refund_id,
  ADD COLUMN account_holder_name VARCHAR(120) NULL AFTER destination_account,
  ADD COLUMN refund_method VARCHAR(40) NULL AFTER account_holder_name,
  ADD COLUMN rejection_reason TEXT NULL AFTER notes,
  ADD COLUMN receipt_path VARCHAR(500) NULL AFTER rejection_reason;

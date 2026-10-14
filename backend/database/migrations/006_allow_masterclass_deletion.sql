-- Migration 006: Allow masterclass deletion when active registrations are cleared
-- Changes foreign key constraint on registrations.masterclass_id to ON DELETE CASCADE
-- so that when an admin deletes a masterclass (after verifying 0 active registrations),
-- MySQL cleanly cascades to registrations (and in turn to payments, tickets, payment_submissions, refunds).

ALTER TABLE registrations DROP FOREIGN KEY fk_registrations_masterclass;

ALTER TABLE registrations ADD CONSTRAINT fk_registrations_masterclass
  FOREIGN KEY (masterclass_id) REFERENCES masterclasses (id) ON DELETE CASCADE;

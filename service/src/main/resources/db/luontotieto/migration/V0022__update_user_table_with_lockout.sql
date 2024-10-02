ALTER TABLE users
    ADD COLUMN failed_attempts INT DEFAULT 0;

ALTER TABLE users
    ADD COLUMN is_locked BOOLEAN DEFAULT FALSE;

ALTER TABLE users
    ADD COLUMN lockout_expiration TIMESTAMP NULL;

ALTER TABLE users
    ADD COLUMN last_failed_attempt TIMESTAMP NULL;

ALTER TABLE users
    ADD COLUMN delay_until TIMESTAMP NULL

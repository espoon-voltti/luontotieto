ALTER TABLE users ALTER COLUMN updated SET DEFAULT now();

CREATE TRIGGER set_users_timestamp
    BEFORE UPDATE
    ON users
    FOR EACH ROW
EXECUTE PROCEDURE trigger_refresh_updated();

UPDATE users SET updated = now() where id = '00000000-0000-0000-0000-000000000000'


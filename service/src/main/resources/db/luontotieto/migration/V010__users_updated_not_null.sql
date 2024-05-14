UPDATE users
SET updated = now()
WHERE updated IS NULL;

ALTER TABLE users
    ALTER COLUMN updated SET NOT NULL;


CREATE TYPE users_role AS ENUM ('pääkäyttäjä', 'tilaaja', 'katselija', 'yrityskäyttäjä');


ALTER TABLE users
ADD COLUMN role users_role NOT NULL DEFAULT 'katselija';

ALTER TABLE users
ADD COLUMN name TEXT;

UPDATE users
SET name = concat(first_name, ' ', last_name);

ALTER TABLE users DROP COLUMN first_name;
ALTER TABLE users DROP COLUMN last_name;
ALTER TABLE users DROP COLUMN first_names;


ALTER TABLE users ALTER COLUMN name SET NOT NULL;

ALTER TABLE users
ADD COLUMN active boolean NOT NULL DEFAULT true;

ALTER TABLE users
ADD COLUMN password_hash text;

ALTER TABLE users
ADD COLUMN created_by UUID REFERENCES users (id);

ALTER TABLE users
ADD COLUMN updated_by UUID REFERENCES users (id);

ALTER TABLE users
ALTER COLUMN external_id DROP NOT NULL;







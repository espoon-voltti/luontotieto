CREATE TABLE students (
                         id uuid PRIMARY KEY,
                         first_name text NOT NULL,
                         last_name text NOT NULL
);

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;

CREATE TABLE users (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v1mc(),
    created timestamp with time zone NOT NULL DEFAULT now(),
    updated timestamp with time zone DEFAULT NULL,
    external_id text NOT NULL,
    first_name text NOT NULL,
    last_name text NOT NULL,
    email text,
    system_user bool DEFAULT FALSE
);

CREATE UNIQUE INDEX uniq$users$external_id ON users(external_id);

INSERT INTO users (id, external_id, first_name, last_name, email, system_user)
VALUES ('00000000-0000-0000-0000-000000000000', 'api-gw', 'api-gw', 'system-user', NULL, TRUE);


ALTER TABLE users RENAME COLUMN first_name TO first_names;
ALTER TABLE users ADD COLUMN first_name text NOT NULL
    GENERATED ALWAYS AS ( split_part(first_names, ' ', 1) ) STORED;

